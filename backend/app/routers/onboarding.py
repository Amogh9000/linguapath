"""Onboarding routes: set/get user language preferences."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.deps import get_current_user
from app.models import User, UserOnboarding
from app.schemas import OnboardingRequest, OnboardingResponse

router = APIRouter(prefix="/api/onboarding", tags=["onboarding"])


@router.post("", response_model=OnboardingResponse)
async def set_onboarding(
    body: OnboardingRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create or update onboarding preferences for the current user."""
    result = await db.execute(
        select(UserOnboarding).where(UserOnboarding.user_id == current_user.id)
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.chosen_language = body.chosen_language
        existing.proficiency_level = body.proficiency_level
        existing.daily_commitment_minutes = body.daily_commitment_minutes
    else:
        existing = UserOnboarding(
            user_id=current_user.id,
            chosen_language=body.chosen_language,
            proficiency_level=body.proficiency_level,
            daily_commitment_minutes=body.daily_commitment_minutes,
        )
        db.add(existing)

    await db.flush()
    return existing


@router.get("", response_model=OnboardingResponse)
async def get_onboarding(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Fetch onboarding preferences; 404 if not yet completed (frontend uses this to gate onboarding flow)."""
    result = await db.execute(
        select(UserOnboarding).where(UserOnboarding.user_id == current_user.id)
    )
    onboarding = result.scalar_one_or_none()
    if onboarding is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Onboarding not completed yet",
        )
    return onboarding
