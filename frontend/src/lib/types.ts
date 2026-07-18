// Based on Backend Pydantic Schemas

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  auth_provider: string;
  avatar_config?: {
    outfit: string;
    accessory: string | null;
    color: string;
  };
  created_at: string;
}

export interface OnboardingResponse {
  user_id: number;
  chosen_language: string;
  proficiency_level: string;
  daily_commitment_minutes: number;
}

export interface UserStatsResponse {
  user_id: number;
  xp_total: number;
  streak_count: number;
  last_activity_date: string | null;
  hearts_current: number;
  hearts_max: number;
  hearts_last_lost_at: string | null;
  gems: number; // coins in the UI
  free_coin_offer_claimed?: boolean;
  daily_goal_xp: number;
  daily_xp_today: number;
  daily_xp_date: string | null;
}

export interface CoinPurchaseResponse {
  gems: number;
  coins_added: number;
  free_coin_offer_claimed: boolean;
  message: string;
}

export interface SkillProgressInfo {
  status: 'locked' | 'available' | 'completed';
  crowns: number;
  times_completed: number;
}

export interface LessonInfo {
  id: number;
  order_index: number;
}

export interface SkillInfo {
  id: number;
  order_index: number;
  title: string;
  icon_key: string;
  lessons: LessonInfo[];
  progress: SkillProgressInfo;
}

export interface UnitInfo {
  id: number;
  order_index: number;
  title: string;
  description: string;
  skills: SkillInfo[];
}

export interface PathResponse {
  course_id: number;
  course_name: string;
  language_code: string;
  units: UnitInfo[];
}

export interface ExerciseOut {
  id: number;
  order_index: number;
  type: 'multiple_choice' | 'translate' | 'match_pairs' | 'fill_blank' | 'type_answer';
  prompt: string;
  options: any | null;
  audio_text: string | null;
  metadata: any | null;
}

export interface LessonStartResponse {
  session_id: number;
  exercises: ExerciseOut[];
  course_language_code?: string;
}

export interface AnswerResponse {
  is_correct: boolean;
  correct_answer: any;
  hearts_remaining: number;
  session_status: 'in_progress' | 'completed' | 'failed';
}

export interface LessonCompleteResponse {
  xp_earned: number;
  new_streak: number;
  crowns: number;
  skill_status: string;
  leveled_up: boolean;
}

export interface LeaderboardEntry {
  rank: number;
  user_id: number;
  username: string;
  xp_total: number;
  avatar_config?: any;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  current_user_rank: number | null;
}

export interface AchievementInfo {
  code: string;
  title: string;
  description: string;
  icon_key: string;
  earned_at: string;
  progress_current: number;
  progress_target: number;
}

export interface UserProfileResponse {
  user: UserResponse;
  stats: UserStatsResponse;
  achievements: AchievementInfo[];
  completed_skills_count: number;
}

// ---------------------------------------------------------------------------
// Course management
// ---------------------------------------------------------------------------

export interface CourseInfo {
  language: string;       // e.g. "japanese"
  language_code: string;  // e.g. "ja"
  course_name: string;    // e.g. "Japanese"
  completed_skills: number;
  total_skills: number;
}

export interface UserCoursesResponse {
  courses: CourseInfo[];
}

export interface MessageResponse {
  message: string;
}
