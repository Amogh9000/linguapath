# LinguaPath Backend

This is the backend for LinguaPath, a Duolingo-clone language learning platform. It is built with FastAPI, SQLAlchemy 2.0 (async), and SQLite.

## Architecture & Design Decisions

### Answer-Stripping & Server-Authoritative Logic
A critical design decision in this backend is the **server-authoritative lesson loop** with **answer-stripping**.
- When a user starts a lesson, the backend returns the exercises but explicitly **strips out the correct answers**. This prevents any client-side cheating where a user could inspect network traffic or client state to find answers.
- All answer verification, XP calculation, heart deduction, and streak tracking occur exclusively on the server. The client simply submits an answer and reacts to the server's response.
- **Heart Regeneration** is computed lazily on read, avoiding the need for a complex and resource-intensive background cron job.

## Setup Instructions

1. **Install Dependencies:**
   Ensure you have Python 3.11+ installed. Run:
   ```bash
   pip install -r requirements.txt
   ```

2. **Environment Variables:**
   A `.env` file is included by default with a mock secret key and a local SQLite database path (`sqlite+aiosqlite:///./linguapath.db`).

3. **Run the Server:**
   ```bash
   uvicorn main:app --reload --port 8000
   ```
   The database will automatically initialize and seed with courses, exercises, a demo user, and leaderboard data on startup if it is empty.

## API Endpoints

### Auth
- `POST /api/auth/signup` - Register a new user (`username`, `email`, `password`)
- `POST /api/auth/login` - Authenticate (`email`, `password`)
- `GET /api/auth/me` - Get current user profile (Requires Bearer Token)
- `POST /api/auth/google` - Stub for Google OAuth

### Onboarding
- `POST /api/onboarding` - Set user language preferences
- `GET /api/onboarding` - Get user language preferences

### Path / Learning
- `GET /api/path` - Returns the full unit and skill tree for the chosen language
- `GET /api/user/stats` - Returns user stats, lazily computing heart regeneration
- `POST /api/user/hearts/refill` - Refills hearts using gems
- `POST /api/user/day/advance` - Dev-only endpoint to test streak and heart regeneration

### Lessons
- `POST /api/lesson/{lesson_id}/start` - Starts a lesson session (answers stripped)
- `POST /api/session/{session_id}/answer` - Submits an answer for grading
- `POST /api/session/{session_id}/complete` - Completes a session, awarding XP and updating streaks

### Social & Profile
- `GET /api/leaderboard` - Returns top users by XP
- `GET /api/user/profile` - Returns full user profile (stats, achievements, skills)
- `PATCH /api/user/avatar` - Update avatar configuration
