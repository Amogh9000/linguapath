"""User stats, hearts, day-advance, and course management routes."""

from datetime import date, datetime, timedelta, timezone
from math import floor

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps import get_current_user
from app.models import (
    Course, Skill, Unit,
    User, UserOnboarding, UserSkillProgress, UserStats,
    LessonAnswer, LessonSession,
)
from app.schemas import (
    CourseInfo, DayAdvanceResponse, HeartsRefillResponse,
    MessageResponse, UserCoursesResponse, UserStatsResponse,
    CoinPurchaseResponse, COIN_PACKS, FREE_COIN_OFFER_AMOUNT,
)

HEARTS_REGEN_INTERVAL_MINUTES = 30
HEARTS_REFILL_GEM_COST = 350

router = APIRouter(prefix="/api/user", tags=["user"])


async def _get_stats(user_id: int, db: AsyncSession) -> UserStats:
    """Fetch UserStats or raise 404."""
    result = await db.execute(select(UserStats).where(UserStats.user_id == user_id))
    stats = result.scalar_one_or_none()
    if stats is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stats not found — user may not be fully initialized",
        )
    return stats


def _regen_hearts(stats: UserStats) -> None:
    """
    Lazily compute heart regeneration on read.
    Hearts regen 1 per 30 minutes since last lost, up to hearts_max.
    """
    if stats.hearts_current >= stats.hearts_max:
        return
    if stats.hearts_last_lost_at is None:
        return

    now = datetime.now(timezone.utc)
    last_lost = stats.hearts_last_lost_at
    # Ensure timezone-aware comparison
    if last_lost.tzinfo is None:
        last_lost = last_lost.replace(tzinfo=timezone.utc)

    elapsed_minutes = (now - last_lost).total_seconds() / 60
    regen_count = floor(elapsed_minutes / HEARTS_REGEN_INTERVAL_MINUTES)

    if regen_count > 0:
        stats.hearts_current = min(stats.hearts_max, stats.hearts_current + regen_count)
        if stats.hearts_current >= stats.hearts_max:
            stats.hearts_last_lost_at = None  # fully healed


def _reset_daily_xp_if_needed(stats: UserStats) -> None:
    """Reset daily_xp_today to 0 if daily_xp_date is not today."""
    today = date.today()
    if stats.daily_xp_date != today:
        stats.daily_xp_today = 0
        stats.daily_xp_date = today


@router.get("/stats", response_model=UserStatsResponse)
async def get_user_stats(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Return user stats with lazy heart regeneration and daily XP reset.
    Hearts regen: min(hearts_max, hearts_current + floor(elapsed_min / 30)).
    """
    stats = await _get_stats(current_user.id, db)
    _regen_hearts(stats)
    _reset_daily_xp_if_needed(stats)
    await db.flush()
    return stats


@router.post("/hearts/refill", response_model=HeartsRefillResponse)
async def refill_hearts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mock heart refill: set hearts to max, deduct 350 gems. Returns 400 if insufficient gems."""
    stats = await _get_stats(current_user.id, db)

    if stats.gems < HEARTS_REFILL_GEM_COST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Insufficient gems. Need {HEARTS_REFILL_GEM_COST}, have {stats.gems}",
        )

    stats.gems -= HEARTS_REFILL_GEM_COST
    stats.hearts_current = stats.hearts_max
    stats.hearts_last_lost_at = None
    await db.flush()

    return HeartsRefillResponse(
        hearts_current=stats.hearts_current,
        gems_remaining=stats.gems,
    )


@router.post("/coins/free-offer", response_model=CoinPurchaseResponse)
async def claim_free_coin_offer(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    One-time welcome offer: +1000 coins per account.
    Returns 400 if already claimed.
    """
    stats = await _get_stats(current_user.id, db)
    already = bool(getattr(stats, "free_coin_offer_claimed", 0))
    if already:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Free coin offer already claimed on this account",
        )

    stats.gems += FREE_COIN_OFFER_AMOUNT
    stats.free_coin_offer_claimed = True
    await db.flush()

    return CoinPurchaseResponse(
        gems=stats.gems,
        coins_added=FREE_COIN_OFFER_AMOUNT,
        free_coin_offer_claimed=True,
        message=f"Claimed {FREE_COIN_OFFER_AMOUNT} free coins!",
    )


@router.post("/coins/purchase/{pack_id}", response_model=CoinPurchaseResponse)
async def purchase_coin_pack(
    pack_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Mock coin pack purchase — instantly credits coins (no real payment)."""
    pack = COIN_PACKS.get(pack_id)
    if pack is None:
        raise HTTPException(status_code=404, detail=f"Unknown pack: {pack_id}")

    stats = await _get_stats(current_user.id, db)
    stats.gems += pack["coins"]
    await db.flush()

    return CoinPurchaseResponse(
        gems=stats.gems,
        coins_added=pack["coins"],
        free_coin_offer_claimed=bool(getattr(stats, "free_coin_offer_claimed", 0)),
        message=f"Added {pack['coins']} coins from {pack['title']}!",
    )


@router.post("/day/advance", response_model=DayAdvanceResponse)
async def advance_day(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    DEV/DEMO-ONLY ENDPOINT — should be removed or auth-gated before real production use.

    Subtracts 1 day from last_activity_date and hearts_last_lost_at so you can
    test streak logic and heart regen without waiting real time.
    """
    stats = await _get_stats(current_user.id, db)

    if stats.last_activity_date:
        stats.last_activity_date = stats.last_activity_date - timedelta(days=1)

    if stats.hearts_last_lost_at:
        stats.hearts_last_lost_at = stats.hearts_last_lost_at - timedelta(days=1)

    await db.flush()

    return DayAdvanceResponse(
        message="Advanced 1 day backward for testing",
        last_activity_date=stats.last_activity_date,
        hearts_last_lost_at=stats.hearts_last_lost_at,
    )


# ---------------------------------------------------------------------------
# Language / course map (mirrors path.py)
# ---------------------------------------------------------------------------

_LANG_MAP = {
    "spanish": ("es", "Spanish"),
    "french":  ("fr", "French"),
    "japanese": ("ja", "Japanese"),
}


@router.get("/courses", response_model=UserCoursesResponse)
async def get_user_courses(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Return info about the user's active course(s) including progress counts."""
    result = await db.execute(
        select(UserOnboarding).where(UserOnboarding.user_id == current_user.id)
    )
    onboarding = result.scalar_one_or_none()
    if onboarding is None:
        return UserCoursesResponse(courses=[])

    lang_key = onboarding.chosen_language
    lang_entry = _LANG_MAP.get(lang_key)
    if lang_entry is None:
        return UserCoursesResponse(courses=[])

    lang_code, course_name = lang_entry

    # Fetch course
    course_result = await db.execute(
        select(Course).where(Course.language_code == lang_code)
    )
    course = course_result.scalar_one_or_none()
    if course is None:
        return UserCoursesResponse(courses=[])

    # Count total skills in this course
    total_result = await db.execute(
        select(func.count(Skill.id))
        .join(Unit, Skill.unit_id == Unit.id)
        .where(Unit.course_id == course.id)
    )
    total_skills = total_result.scalar() or 0

    # Count completed skills for this user in this course
    skill_ids_result = await db.execute(
        select(Skill.id)
        .join(Unit, Skill.unit_id == Unit.id)
        .where(Unit.course_id == course.id)
    )
    skill_ids = [row[0] for row in skill_ids_result.all()]

    completed = 0
    if skill_ids:
        completed_result = await db.execute(
            select(func.count())
            .select_from(UserSkillProgress)
            .where(
                UserSkillProgress.user_id == current_user.id,
                UserSkillProgress.skill_id.in_(skill_ids),
                UserSkillProgress.status == "completed",
            )
        )
        completed = completed_result.scalar() or 0

    return UserCoursesResponse(
        courses=[
            CourseInfo(
                language=lang_key,
                language_code=lang_code,
                course_name=course_name,
                completed_skills=completed,
                total_skills=total_skills,
            )
        ]
    )


@router.post("/courses/{language}/reset", response_model=MessageResponse)
async def reset_course_progress(
    language: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Reset all UserSkillProgress for the user's chosen course back to the
    default state (first skill available, all others locked) and set XP to 0.
    """
    lang_entry = _LANG_MAP.get(language.lower())
    if lang_entry is None:
        raise HTTPException(status_code=404, detail=f"Unknown language: {language}")

    lang_code, _ = lang_entry

    # Verify user is enrolled in this language
    onboarding_result = await db.execute(
        select(UserOnboarding).where(UserOnboarding.user_id == current_user.id)
    )
    onboarding = onboarding_result.scalar_one_or_none()
    if onboarding is None or onboarding.chosen_language.lower() != language.lower():
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # Find course skill IDs
    course_result = await db.execute(select(Course).where(Course.language_code == lang_code))
    course = course_result.scalar_one_or_none()
    if course is None:
        raise HTTPException(status_code=404, detail="Course not found")

    skill_ids_result = await db.execute(
        select(Skill.id)
        .join(Unit, Skill.unit_id == Unit.id)
        .where(Unit.course_id == course.id)
    )
    skill_ids = [row[0] for row in skill_ids_result.all()]

    if skill_ids:
        # Delete all progress rows for this user/course
        await db.execute(
            delete(UserSkillProgress).where(
                UserSkillProgress.user_id == current_user.id,
                UserSkillProgress.skill_id.in_(skill_ids),
            )
        )

    await db.flush()
    return MessageResponse(message=f"{language.capitalize()} course progress reset successfully")


@router.delete("/courses/{language}", response_model=MessageResponse)
async def remove_course(
    language: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Remove the user's enrollment in a course: deletes skill progress
    and the onboarding row so they must re-onboard to add a course.
    """
    lang_entry = _LANG_MAP.get(language.lower())
    if lang_entry is None:
        raise HTTPException(status_code=404, detail=f"Unknown language: {language}")

    lang_code, _ = lang_entry

    # Verify enrollment
    onboarding_result = await db.execute(
        select(UserOnboarding).where(UserOnboarding.user_id == current_user.id)
    )
    onboarding = onboarding_result.scalar_one_or_none()
    if onboarding is None or onboarding.chosen_language.lower() != language.lower():
        raise HTTPException(status_code=403, detail="Not enrolled in this course")

    # Find course skill IDs
    course_result = await db.execute(select(Course).where(Course.language_code == lang_code))
    course = course_result.scalar_one_or_none()
    if course is not None:
        skill_ids_result = await db.execute(
            select(Skill.id)
            .join(Unit, Skill.unit_id == Unit.id)
            .where(Unit.course_id == course.id)
        )
        skill_ids = [row[0] for row in skill_ids_result.all()]
        if skill_ids:
            # Also delete lesson answers for sessions in this course
            session_ids_result = await db.execute(
                select(LessonSession.id).where(LessonSession.user_id == current_user.id)
            )
            session_ids = [row[0] for row in session_ids_result.all()]
            if session_ids:
                await db.execute(
                    delete(LessonAnswer).where(LessonAnswer.session_id.in_(session_ids))
                )
            await db.execute(
                delete(LessonSession).where(LessonSession.user_id == current_user.id)
            )
            await db.execute(
                delete(UserSkillProgress).where(
                    UserSkillProgress.user_id == current_user.id,
                    UserSkillProgress.skill_id.in_(skill_ids),
                )
            )

    # Remove onboarding row
    await db.execute(
        delete(UserOnboarding).where(UserOnboarding.user_id == current_user.id)
    )

    await db.commit()
    return MessageResponse(message=f"{language.capitalize()} course removed successfully")
