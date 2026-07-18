"""Pydantic v2 request/response schemas for all API endpoints."""

from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class SignupRequest(BaseModel):
    username: str = Field(..., min_length=2, max_length=30)
    email: str  # EmailStr requires email-validator; keep simple
    password: str = Field(..., min_length=6)


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    auth_provider: str
    avatar_config: dict | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Onboarding
# ---------------------------------------------------------------------------

class OnboardingRequest(BaseModel):
    chosen_language: str = Field(..., pattern=r"^(spanish|french|japanese)$")
    proficiency_level: str = Field(..., pattern=r"^(new|some_words|pretty_good)$")
    daily_commitment_minutes: int = Field(..., ge=5, le=20)


class OnboardingResponse(BaseModel):
    user_id: int
    chosen_language: str
    proficiency_level: str
    daily_commitment_minutes: int

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Stats
# ---------------------------------------------------------------------------

class UserStatsResponse(BaseModel):
    user_id: int
    xp_total: int
    streak_count: int
    last_activity_date: date | None = None
    hearts_current: int
    hearts_max: int
    hearts_last_lost_at: datetime | None = None
    gems: int  # displayed as "coins" in the UI
    free_coin_offer_claimed: bool = False
    daily_goal_xp: int
    daily_xp_today: int
    daily_xp_date: date | None = None

    model_config = {"from_attributes": True}


class HeartsRefillResponse(BaseModel):
    hearts_current: int
    gems_remaining: int


class CoinPurchaseResponse(BaseModel):
    gems: int
    coins_added: int
    free_coin_offer_claimed: bool = False
    message: str


# Coin pack catalog (mock IAP)
COIN_PACKS = {
    "starter": {"coins": 500, "price_label": "$0.99", "title": "Starter Pack"},
    "popular": {"coins": 1200, "price_label": "$1.99", "title": "Popular Pack"},
    "mega": {"coins": 2500, "price_label": "$4.99", "title": "Mega Pack"},
    "legendary": {"coins": 6500, "price_label": "$9.99", "title": "Legendary Pack"},
}

FREE_COIN_OFFER_AMOUNT = 1000


# ---------------------------------------------------------------------------
# Path / Learning tree
# ---------------------------------------------------------------------------

class SkillProgressInfo(BaseModel):
    status: str = "locked"
    crowns: int = 0
    times_completed: int = 0


class LessonInfo(BaseModel):
    id: int
    order_index: int

    model_config = {"from_attributes": True}


class SkillInfo(BaseModel):
    id: int
    order_index: int
    title: str
    icon_key: str
    lessons: list[LessonInfo]
    progress: SkillProgressInfo

    model_config = {"from_attributes": True}


class UnitInfo(BaseModel):
    id: int
    order_index: int
    title: str
    description: str
    skills: list[SkillInfo]

    model_config = {"from_attributes": True}


class PathResponse(BaseModel):
    course_id: int
    course_name: str
    language_code: str
    units: list[UnitInfo]


# ---------------------------------------------------------------------------
# Exercise (answer-stripped for client)
# ---------------------------------------------------------------------------

class ExerciseOut(BaseModel):
    """Exercise sent to the client — correct_answer is NEVER included."""
    id: int
    order_index: int
    type: str
    prompt: str
    options: Any | None = None
    audio_text: str | None = None
    metadata: dict | None = None

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Lesson session
# ---------------------------------------------------------------------------

class LessonStartResponse(BaseModel):
    session_id: int
    exercises: list[ExerciseOut]


class AnswerRequest(BaseModel):
    exercise_id: int
    response: Any  # flexible: string, list, dict depending on exercise type


class AnswerResponse(BaseModel):
    is_correct: bool
    correct_answer: Any
    hearts_remaining: int
    session_status: str


class LessonCompleteResponse(BaseModel):
    xp_earned: int
    new_streak: int
    crowns: int
    skill_status: str
    leveled_up: bool


# ---------------------------------------------------------------------------
# Leaderboard
# ---------------------------------------------------------------------------

class LeaderboardEntry(BaseModel):
    rank: int
    user_id: int
    username: str
    xp_total: int
    avatar_config: dict | None = None

    model_config = {"from_attributes": True}


class LeaderboardResponse(BaseModel):
    entries: list[LeaderboardEntry]
    current_user_rank: int | None = None


# ---------------------------------------------------------------------------
# Profile
# ---------------------------------------------------------------------------

class AchievementInfo(BaseModel):
    code: str
    title: str
    description: str
    icon_key: str
    earned_at: datetime
    progress_current: int
    progress_target: int


class UserProfileResponse(BaseModel):
    user: UserResponse
    stats: UserStatsResponse
    achievements: list[AchievementInfo]
    completed_skills_count: int


class AvatarUpdateRequest(BaseModel):
    avatar_config: dict


class AvatarUpdateResponse(BaseModel):
    avatar_config: dict


# ---------------------------------------------------------------------------
# Day advance (dev-only)
# ---------------------------------------------------------------------------

class DayAdvanceResponse(BaseModel):
    message: str
    last_activity_date: date | None = None
    hearts_last_lost_at: datetime | None = None


# ---------------------------------------------------------------------------
# Course management
# ---------------------------------------------------------------------------

class CourseInfo(BaseModel):
    language: str          # e.g. "japanese"
    language_code: str     # e.g. "ja"
    course_name: str       # e.g. "Japanese"
    completed_skills: int
    total_skills: int


class UserCoursesResponse(BaseModel):
    courses: list[CourseInfo]


class MessageResponse(BaseModel):
    message: str
