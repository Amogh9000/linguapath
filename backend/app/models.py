"""SQLAlchemy ORM models for the LinguaPath database schema."""

from datetime import date, datetime, timezone

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    JSON,
    String,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


# ---------------------------------------------------------------------------
# User & related
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    username: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String, nullable=True)
    auth_provider: Mapped[str] = mapped_column(String, default="local")
    avatar_config: Mapped[dict | None] = mapped_column(
        JSON, default=lambda: {"outfit": "classic", "accessory": None, "color": "green"}
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)

    # Relationships
    onboarding: Mapped["UserOnboarding | None"] = relationship(
        back_populates="user", uselist=False, lazy="selectin"
    )
    stats: Mapped["UserStats | None"] = relationship(
        back_populates="user", uselist=False, lazy="selectin"
    )
    skill_progress: Mapped[list["UserSkillProgress"]] = relationship(
        back_populates="user", lazy="selectin"
    )
    sessions: Mapped[list["LessonSession"]] = relationship(
        back_populates="user", lazy="selectin"
    )
    achievements: Mapped[list["UserAchievement"]] = relationship(
        back_populates="user", lazy="selectin"
    )


class UserOnboarding(Base):
    __tablename__ = "user_onboarding"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), primary_key=True
    )
    chosen_language: Mapped[str] = mapped_column(String, nullable=False)
    proficiency_level: Mapped[str] = mapped_column(String, nullable=False)
    daily_commitment_minutes: Mapped[int] = mapped_column(Integer, nullable=False)

    user: Mapped["User"] = relationship(back_populates="onboarding")


class UserStats(Base):
    __tablename__ = "user_stats"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), primary_key=True
    )
    xp_total: Mapped[int] = mapped_column(Integer, default=0)
    streak_count: Mapped[int] = mapped_column(Integer, default=0)
    last_activity_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    hearts_current: Mapped[int] = mapped_column(Integer, default=5)
    hearts_max: Mapped[int] = mapped_column(Integer, default=5)
    hearts_last_lost_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    gems: Mapped[int] = mapped_column(Integer, default=500)
    free_coin_offer_claimed: Mapped[bool] = mapped_column(Boolean, default=False)
    daily_goal_xp: Mapped[int] = mapped_column(Integer, default=50)
    daily_xp_today: Mapped[int] = mapped_column(Integer, default=0)
    daily_xp_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    user: Mapped["User"] = relationship(back_populates="stats")


# ---------------------------------------------------------------------------
# Course content hierarchy: Course -> Unit -> Skill -> Lesson -> Exercise
# ---------------------------------------------------------------------------

class Course(Base):
    __tablename__ = "courses"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String, nullable=False)
    language_code: Mapped[str] = mapped_column(String, nullable=False)

    units: Mapped[list["Unit"]] = relationship(
        back_populates="course", lazy="selectin", order_by="Unit.order_index"
    )


class Unit(Base):
    __tablename__ = "units"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    course_id: Mapped[int] = mapped_column(Integer, ForeignKey("courses.id"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)

    course: Mapped["Course"] = relationship(back_populates="units")
    skills: Mapped[list["Skill"]] = relationship(
        back_populates="unit", lazy="selectin", order_by="Skill.order_index"
    )


class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    unit_id: Mapped[int] = mapped_column(Integer, ForeignKey("units.id"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    icon_key: Mapped[str] = mapped_column(String, nullable=False)

    unit: Mapped["Unit"] = relationship(back_populates="skills")
    lessons: Mapped[list["Lesson"]] = relationship(
        back_populates="skill", lazy="selectin", order_by="Lesson.order_index"
    )
    progress: Mapped[list["UserSkillProgress"]] = relationship(
        back_populates="skill", lazy="selectin"
    )


class Lesson(Base):
    __tablename__ = "lessons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    skill_id: Mapped[int] = mapped_column(Integer, ForeignKey("skills.id"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)

    skill: Mapped["Skill"] = relationship(back_populates="lessons")
    exercises: Mapped[list["Exercise"]] = relationship(
        back_populates="lesson", lazy="selectin", order_by="Exercise.order_index"
    )


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    lesson_id: Mapped[int] = mapped_column(Integer, ForeignKey("lessons.id"), nullable=False)
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)  # multiple_choice | translate | match_pairs | fill_blank | type_answer
    prompt: Mapped[str] = mapped_column(String, nullable=False)
    options: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    correct_answer: Mapped[dict | list | str] = mapped_column(JSON, nullable=False)
    audio_text: Mapped[str | None] = mapped_column(String, nullable=True)
    ext_metadata: Mapped[dict | None] = mapped_column("metadata", JSON, nullable=True)

    lesson: Mapped["Lesson"] = relationship(back_populates="exercises")


# ---------------------------------------------------------------------------
# Progress tracking
# ---------------------------------------------------------------------------

class UserSkillProgress(Base):
    __tablename__ = "user_skill_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    skill_id: Mapped[int] = mapped_column(Integer, ForeignKey("skills.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="locked")  # locked | available | completed
    crowns: Mapped[int] = mapped_column(Integer, default=0)
    times_completed: Mapped[int] = mapped_column(Integer, default=0)

    __table_args__ = (UniqueConstraint("user_id", "skill_id"),)

    user: Mapped["User"] = relationship(back_populates="skill_progress")
    skill: Mapped["Skill"] = relationship(back_populates="progress")


class LessonSession(Base):
    __tablename__ = "lesson_sessions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    lesson_id: Mapped[int] = mapped_column(Integer, ForeignKey("lessons.id"), nullable=False)
    status: Mapped[str] = mapped_column(String, default="in_progress")  # in_progress | completed | failed
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    xp_earned: Mapped[int] = mapped_column(Integer, default=0)
    mistake_count: Mapped[int] = mapped_column(Integer, default=0)

    user: Mapped["User"] = relationship(back_populates="sessions")
    lesson: Mapped["Lesson"] = relationship()
    answers: Mapped[list["LessonAnswer"]] = relationship(
        back_populates="session", lazy="selectin"
    )


class LessonAnswer(Base):
    __tablename__ = "lesson_answers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    session_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("lesson_sessions.id"), nullable=False
    )
    exercise_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("exercises.id"), nullable=False
    )
    is_correct: Mapped[bool] = mapped_column(Boolean, nullable=False)
    submitted_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    user_response: Mapped[dict | list | str | None] = mapped_column(JSON, nullable=True)

    session: Mapped["LessonSession"] = relationship(back_populates="answers")
    exercise: Mapped["Exercise"] = relationship()


# ---------------------------------------------------------------------------
# Achievements
# ---------------------------------------------------------------------------

class Achievement(Base):
    __tablename__ = "achievements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    code: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    icon_key: Mapped[str] = mapped_column(String, nullable=False)

    user_achievements: Mapped[list["UserAchievement"]] = relationship(
        back_populates="achievement", lazy="selectin"
    )


class UserAchievement(Base):
    __tablename__ = "user_achievements"

    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id"), primary_key=True
    )
    achievement_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("achievements.id"), primary_key=True
    )
    earned_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=_utcnow)
    progress_current: Mapped[int] = mapped_column(Integer, default=0)
    progress_target: Mapped[int] = mapped_column(Integer, default=1)

    user: Mapped["User"] = relationship(back_populates="achievements")
    achievement: Mapped["Achievement"] = relationship(back_populates="user_achievements")
