"""
Lesson loop routes — the core game mechanic.

Design decisions:
  - Correct answers are NEVER sent to the client on lesson start (answer-stripping).
  - XP and heart changes are computed server-side only (server-authoritative).
  - This prevents client-side cheating and ensures game integrity.
"""

from datetime import date, datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.deps import get_current_user
from app.models import (
    Exercise,
    Lesson,
    LessonAnswer,
    LessonSession,
    Skill,
    Unit,
    User,
    UserSkillProgress,
    UserStats,
)
from app.schemas import (
    AnswerRequest,
    AnswerResponse,
    ExerciseOut,
    LessonCompleteResponse,
    LessonStartResponse,
)

router = APIRouter(prefix="/api", tags=["lessons"])

XP_PER_CORRECT = 10
XP_PERFECT_BONUS = 20


@router.post("/lesson/{lesson_id}/start", response_model=LessonStartResponse)
async def start_lesson(
    lesson_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Start a new lesson session. Returns exercises with correct_answer STRIPPED.
    This is a deliberate design choice — the client never receives answers.
    """
    result = await db.execute(
        select(Lesson)
        .options(selectinload(Lesson.exercises))
        .where(Lesson.id == lesson_id)
    )
    lesson = result.scalar_one_or_none()
    if lesson is None:
        raise HTTPException(status_code=404, detail="Lesson not found")

    session = LessonSession(
        user_id=current_user.id,
        lesson_id=lesson_id,
        status="in_progress",
    )
    db.add(session)
    await db.flush()

    exercises_out = [
        ExerciseOut(
            id=ex.id,
            order_index=ex.order_index,
            type=ex.type,
            prompt=ex.prompt,
            options=ex.options,
            audio_text=ex.audio_text,
            metadata=ex.ext_metadata,
        )
        for ex in sorted(lesson.exercises, key=lambda e: e.order_index)
    ]

    return LessonStartResponse(session_id=session.id, exercises=exercises_out)


def _normalize(val):
    """Normalize answer values for comparison (case-insensitive, stripped)."""
    if isinstance(val, str):
        return val.strip().lower()
    if isinstance(val, list):
        return [_normalize(v) for v in val]
    if isinstance(val, dict):
        return {k: _normalize(v) for k, v in val.items()}
    return val


@router.post("/session/{session_id}/answer", response_model=AnswerResponse)
async def submit_answer(
    session_id: int,
    body: AnswerRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Submit an answer for an exercise within an active session.

    Server-side grading:
      - Compares user response against stored correct_answer
      - Incorrect answers deduct a heart and set hearts_last_lost_at
      - If hearts reach 0, session is marked "failed"
    """
    # Fetch session
    result = await db.execute(
        select(LessonSession).where(
            LessonSession.id == session_id,
            LessonSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status == "failed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session has failed — no more hearts. Start a new session.",
        )
    if session.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Session is already completed",
        )

    # Fetch exercise
    result = await db.execute(
        select(Exercise).where(Exercise.id == body.exercise_id)
    )
    exercise = result.scalar_one_or_none()
    if exercise is None:
        raise HTTPException(status_code=404, detail="Exercise not found")

    # Check for duplicate answer
    result = await db.execute(
        select(LessonAnswer).where(
            LessonAnswer.session_id == session_id,
            LessonAnswer.exercise_id == body.exercise_id,
        )
    )
    if result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already answered this exercise in this session",
        )

    # Grade the answer server-side
    is_correct = _normalize(body.response) == _normalize(exercise.correct_answer)

    # Record the answer
    answer = LessonAnswer(
        session_id=session_id,
        exercise_id=body.exercise_id,
        is_correct=is_correct,
        user_response=body.response,
    )
    db.add(answer)

    # Fetch user stats
    result = await db.execute(
        select(UserStats).where(UserStats.user_id == current_user.id)
    )
    stats = result.scalar_one_or_none()
    if stats is None:
        raise HTTPException(status_code=500, detail="User stats missing")

    session_status = session.status

    if not is_correct:
        session.mistake_count += 1
        stats.hearts_current = max(0, stats.hearts_current - 1)
        stats.hearts_last_lost_at = datetime.now(timezone.utc)

        if stats.hearts_current <= 0:
            session.status = "failed"
            session_status = "failed"

    await db.flush()

    return AnswerResponse(
        is_correct=is_correct,
        correct_answer=exercise.correct_answer,
        hearts_remaining=stats.hearts_current,
        session_status=session_status,
    )


@router.post("/session/{session_id}/complete", response_model=LessonCompleteResponse)
async def complete_session(
    session_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Complete a lesson session. Server-authoritative XP calculation:
      - 10 XP per correct answer
      - +20 bonus for zero mistakes
      - Updates streak, crowns, and unlocks next skill
    """
    # Fetch session with answers
    result = await db.execute(
        select(LessonSession)
        .options(selectinload(LessonSession.answers))
        .where(
            LessonSession.id == session_id,
            LessonSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if session is None:
        raise HTTPException(status_code=404, detail="Session not found")

    if session.status != "in_progress":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Session is '{session.status}', can only complete 'in_progress' sessions",
        )

    # Compute XP
    correct_count = sum(1 for a in session.answers if a.is_correct)
    xp = correct_count * XP_PER_CORRECT
    if session.mistake_count == 0:
        xp += XP_PERFECT_BONUS

    session.xp_earned = xp
    session.status = "completed"
    session.completed_at = datetime.now(timezone.utc)

    # Update user stats
    result = await db.execute(
        select(UserStats).where(UserStats.user_id == current_user.id)
    )
    stats = result.scalar_one()
    stats.xp_total += xp

    # Daily XP tracking
    today = date.today()
    if stats.daily_xp_date != today:
        stats.daily_xp_today = 0
        stats.daily_xp_date = today
    stats.daily_xp_today += xp

    # Streak logic
    if stats.last_activity_date == today:
        pass  # Already active today, no streak change
    elif stats.last_activity_date == today - timedelta(days=1):
        stats.streak_count += 1
    else:
        stats.streak_count = 1
    stats.last_activity_date = today

    # Update skill progress
    result = await db.execute(
        select(Lesson).where(Lesson.id == session.lesson_id)
    )
    lesson = result.scalar_one()
    skill_id = lesson.skill_id

    result = await db.execute(
        select(UserSkillProgress).where(
            UserSkillProgress.user_id == current_user.id,
            UserSkillProgress.skill_id == skill_id,
        )
    )
    skill_progress = result.scalar_one_or_none()

    old_crowns = 0
    if skill_progress is None:
        skill_progress = UserSkillProgress(
            user_id=current_user.id,
            skill_id=skill_id,
            status="completed",
            crowns=1,
            times_completed=1,
        )
        db.add(skill_progress)
    else:
        old_crowns = skill_progress.crowns
        skill_progress.times_completed += 1
        skill_progress.crowns = min(5, skill_progress.times_completed)
        skill_progress.status = "completed"

    leveled_up = skill_progress.crowns > old_crowns

    # Unlock next skill
    result = await db.execute(
        select(Skill).where(Skill.id == skill_id)
    )
    current_skill = result.scalar_one()

    # Find next skill: first try same unit, then next unit
    result = await db.execute(
        select(Skill).where(
            Skill.unit_id == current_skill.unit_id,
            Skill.order_index > current_skill.order_index,
        ).order_by(Skill.order_index).limit(1)
    )
    next_skill = result.scalar_one_or_none()

    if next_skill is None:
        # Try first skill of next unit in same course
        result = await db.execute(
            select(Unit).where(Unit.id == current_skill.unit_id)
        )
        current_unit = result.scalar_one()

        result = await db.execute(
            select(Unit).where(
                Unit.course_id == current_unit.course_id,
                Unit.order_index > current_unit.order_index,
            ).order_by(Unit.order_index).limit(1)
        )
        next_unit = result.scalar_one_or_none()

        if next_unit:
            result = await db.execute(
                select(Skill).where(Skill.unit_id == next_unit.id)
                .order_by(Skill.order_index).limit(1)
            )
            next_skill = result.scalar_one_or_none()

    if next_skill:
        result = await db.execute(
            select(UserSkillProgress).where(
                UserSkillProgress.user_id == current_user.id,
                UserSkillProgress.skill_id == next_skill.id,
            )
        )
        next_progress = result.scalar_one_or_none()

        if next_progress is None:
            db.add(UserSkillProgress(
                user_id=current_user.id,
                skill_id=next_skill.id,
                status="available",
            ))
        elif next_progress.status == "locked":
            next_progress.status = "available"

    await db.flush()

    return LessonCompleteResponse(
        xp_earned=xp,
        new_streak=stats.streak_count,
        crowns=skill_progress.crowns,
        skill_status=skill_progress.status,
        leveled_up=leveled_up,
    )
