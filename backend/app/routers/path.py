"""Learning path route: returns the full Unit -> Skill tree annotated with user progress."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.deps import get_current_user
from app.models import Course, Unit, Skill, User, UserOnboarding, UserSkillProgress
from app.schemas import (
    LessonInfo,
    PathResponse,
    SkillInfo,
    SkillProgressInfo,
    UnitInfo,
)

# Map onboarding chosen_language to course.language_code
_LANG_MAP = {
    "spanish": "es",
    "french": "fr",
    "japanese": "ja",
}

router = APIRouter(prefix="/api", tags=["path"])


@router.get("/path", response_model=PathResponse)
async def get_learning_path(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return the full Unit → Skill tree for the user's chosen language,
    annotated with their UserSkillProgress (status/crowns).

    Logic:
      - First skill of first unit defaults to "available" if no progress rows exist.
      - Everything else defaults to "locked" until the prior skill is completed.
    """
    # Get onboarding
    result = await db.execute(
        select(UserOnboarding).where(UserOnboarding.user_id == current_user.id)
    )
    onboarding = result.scalar_one_or_none()
    if onboarding is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Complete onboarding first to select a language",
        )

    lang_code = _LANG_MAP.get(onboarding.chosen_language)
    if lang_code is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported language: {onboarding.chosen_language}",
        )

    # Fetch course with eager-loaded hierarchy
    result = await db.execute(
        select(Course)
        .options(
            selectinload(Course.units)
            .selectinload(Unit.skills)
            .selectinload(Skill.lessons)
        )
        .where(Course.language_code == lang_code)
    )
    course = result.scalar_one_or_none()
    if course is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No course found for language code '{lang_code}'",
        )

    # Fetch all progress rows for this user
    result = await db.execute(
        select(UserSkillProgress).where(UserSkillProgress.user_id == current_user.id)
    )
    progress_rows = result.scalars().all()
    progress_map: dict[int, UserSkillProgress] = {p.skill_id: p for p in progress_rows}

    # Flatten skills in order to determine unlock logic
    all_skills_ordered: list[Skill] = []
    for unit in sorted(course.units, key=lambda u: u.order_index):
        for skill in sorted(unit.skills, key=lambda s: s.order_index):
            all_skills_ordered.append(skill)

    # Build annotated progress: first skill available if no progress, rest locked until prior completed
    computed_status: dict[int, SkillProgressInfo] = {}
    for idx, skill in enumerate(all_skills_ordered):
        if skill.id in progress_map:
            p = progress_map[skill.id]
            computed_status[skill.id] = SkillProgressInfo(
                status=p.status, crowns=p.crowns, times_completed=p.times_completed
            )
        else:
            if idx == 0:
                # First skill defaults to available
                computed_status[skill.id] = SkillProgressInfo(status="available")
            else:
                prev_skill = all_skills_ordered[idx - 1]
                prev_status = computed_status.get(prev_skill.id)
                if prev_status and prev_status.status == "completed":
                    computed_status[skill.id] = SkillProgressInfo(status="available")
                else:
                    computed_status[skill.id] = SkillProgressInfo(status="locked")

    # Build response (dedupe units by title in case of bad seed data)
    units_out = []
    seen_titles: set[str] = set()
    for unit in sorted(course.units, key=lambda u: u.order_index):
        if unit.title in seen_titles:
            continue
        seen_titles.add(unit.title)
        skills_out = []
        for skill in sorted(unit.skills, key=lambda s: s.order_index):
            lessons_out = [
                LessonInfo(id=lesson.id, order_index=lesson.order_index)
                for lesson in sorted(skill.lessons, key=lambda l: l.order_index)
            ]
            skills_out.append(
                SkillInfo(
                    id=skill.id,
                    order_index=skill.order_index,
                    title=skill.title,
                    icon_key=skill.icon_key,
                    lessons=lessons_out,
                    progress=computed_status.get(
                        skill.id, SkillProgressInfo(status="locked")
                    ),
                )
            )
        units_out.append(
            UnitInfo(
                id=unit.id,
                order_index=unit.order_index,
                title=unit.title,
                description=unit.description,
                skills=skills_out,
            )
        )

    return PathResponse(
        course_id=course.id,
        course_name=course.name,
        language_code=course.language_code,
        units=units_out,
    )
