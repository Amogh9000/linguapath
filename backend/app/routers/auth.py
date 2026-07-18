"""Authentication routes: signup, login, me, Google OAuth stub."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import create_access_token, hash_password, verify_password
from app.deps import get_current_user
from app.models import (
    User, UserStats, UserOnboarding, UserSkillProgress,
    LessonSession, LessonAnswer, UserAchievement,
)
from app.schemas import (
    LoginRequest,
    MessageResponse,
    SignupRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Register a new local user. Creates User + UserStats with defaults."""
    # Check uniqueness
    existing = await db.execute(
        select(User).where((User.email == body.email) | (User.username == body.username))
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username or email already taken",
        )

    user = User(
        username=body.username,
        email=body.email,
        password_hash=hash_password(body.password),
        auth_provider="local",
    )
    db.add(user)
    await db.flush()  # Populate user.id

    # Create default stats row
    stats = UserStats(user_id=user.id)
    db.add(stats)

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email + password, returns JWT."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if user is None or user.password_hash is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token(user.id)
    return TokenResponse(access_token=token)


@router.get("/me", response_model=UserResponse)
async def me(current_user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return current_user


@router.post("/google", status_code=status.HTTP_501_NOT_IMPLEMENTED)
async def google_oauth_stub():
    """Placeholder for future Google OAuth integration."""
    return {"detail": "Google OAuth coming soon"}


@router.delete("/account", response_model=MessageResponse)
async def delete_account(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently deletes the authenticated user's account and all related data.
    The client must clear its JWT after calling this.
    """
    uid = current_user.id

    # Delete in dependency order to satisfy FK constraints
    # 1. LessonAnswers (linked to LessonSessions)
    session_ids_result = await db.execute(
        select(LessonSession.id).where(LessonSession.user_id == uid)
    )
    session_ids = [row[0] for row in session_ids_result.all()]
    if session_ids:
        await db.execute(delete(LessonAnswer).where(LessonAnswer.session_id.in_(session_ids)))

    # 2. LessonSessions
    await db.execute(delete(LessonSession).where(LessonSession.user_id == uid))

    # 3. UserSkillProgress
    await db.execute(delete(UserSkillProgress).where(UserSkillProgress.user_id == uid))

    # 4. UserAchievements
    await db.execute(delete(UserAchievement).where(UserAchievement.user_id == uid))

    # 5. UserOnboarding
    await db.execute(delete(UserOnboarding).where(UserOnboarding.user_id == uid))

    # 6. UserStats
    await db.execute(delete(UserStats).where(UserStats.user_id == uid))

    # 7. User itself
    await db.execute(delete(User).where(User.id == uid))

    await db.commit()
    return MessageResponse(message="Account deleted successfully")
