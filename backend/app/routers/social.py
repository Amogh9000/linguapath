"""Leaderboard, profile, and avatar customization routes."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps import get_current_user
from app.models import (
    Achievement,
    User,
    UserAchievement,
    UserSkillProgress,
    UserStats,
)
from app.schemas import (
    AchievementInfo,
    AvatarUpdateRequest,
    AvatarUpdateResponse,
    LeaderboardEntry,
    LeaderboardResponse,
    UserProfileResponse,
    UserResponse,
    UserStatsResponse,
)

router = APIRouter(prefix="/api", tags=["social"])


@router.get("/leaderboard", response_model=LeaderboardResponse)
async def get_leaderboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Top N users ranked by xp_total, plus the current user's rank.
    Includes avatar_config for leaderboard display.
    """
    # Get all users with stats, ordered by XP descending
    result = await db.execute(
        select(User, UserStats)
        .join(UserStats, User.id == UserStats.user_id)
        .order_by(UserStats.xp_total.desc())
        .limit(50)
    )
    rows = result.all()

    entries = []
    current_user_rank = None
    for rank_idx, (user, stats) in enumerate(rows, start=1):
        entries.append(
            LeaderboardEntry(
                rank=rank_idx,
                user_id=user.id,
                username=user.username,
                xp_total=stats.xp_total,
                avatar_config=user.avatar_config,
            )
        )
        if user.id == current_user.id:
            current_user_rank = rank_idx

    # If current user not in top 50, find their rank
    if current_user_rank is None:
        result = await db.execute(
            select(func.count())
            .select_from(UserStats)
            .where(
                UserStats.xp_total > (
                    select(UserStats.xp_total)
                    .where(UserStats.user_id == current_user.id)
                    .scalar_subquery()
                )
            )
        )
        higher_count = result.scalar() or 0
        current_user_rank = higher_count + 1

    return LeaderboardResponse(
        entries=entries,
        current_user_rank=current_user_rank,
    )


@router.get("/user/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Full user profile: stats, achievements, completed skills count, avatar."""
    # Stats
    result = await db.execute(
        select(UserStats).where(UserStats.user_id == current_user.id)
    )
    stats = result.scalar_one_or_none()
    if stats is None:
        raise HTTPException(status_code=404, detail="Stats not found")

    # Achievements
    result = await db.execute(
        select(UserAchievement, Achievement)
        .join(Achievement, UserAchievement.achievement_id == Achievement.id)
        .where(UserAchievement.user_id == current_user.id)
    )
    achievement_rows = result.all()
    achievements = [
        AchievementInfo(
            code=ach.code,
            title=ach.title,
            description=ach.description,
            icon_key=ach.icon_key,
            earned_at=ua.earned_at,
            progress_current=ua.progress_current,
            progress_target=ua.progress_target,
        )
        for ua, ach in achievement_rows
    ]

    # Completed skills count
    result = await db.execute(
        select(func.count())
        .select_from(UserSkillProgress)
        .where(
            UserSkillProgress.user_id == current_user.id,
            UserSkillProgress.status == "completed",
        )
    )
    completed_count = result.scalar() or 0

    return UserProfileResponse(
        user=UserResponse.model_validate(current_user),
        stats=UserStatsResponse.model_validate(stats),
        achievements=achievements,
        completed_skills_count=completed_count,
    )


@router.patch("/user/avatar", response_model=AvatarUpdateResponse)
async def update_avatar(
    body: AvatarUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update user's avatar configuration (outfit/accessory/color)."""
    current_user.avatar_config = body.avatar_config
    await db.flush()
    return AvatarUpdateResponse(avatar_config=current_user.avatar_config)
