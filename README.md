# LinguaPath

Gamified language-learning app inspired by Duolingo. Users learn Spanish, French, or Japanese through a skill path, arcade-style UI, hearts/coins economy, leaderboards, and a customizable 2D owl mascot.

---

## Table of contents

1. [Setup instructions](#setup-instructions)
2. [Architecture overview](#architecture-overview)
3. [Database schema](#database-schema)
4. [API overview](#api-overview)
5. [Features](#features)
6. [Deploy (Vercel)](#deploy-vercel-frontend)
7. [Scripts](#scripts)

---

## Monorepo layout

```
duolingo_v2/
├── frontend/                 # Next.js 14 (App Router) UI
│   ├── src/app/              # Pages: landing, auth, learn, lesson, profile, …
│   ├── src/components/       # SideNav, Shop, MascotAvatar, exercises, …
│   ├── src/lib/              # api.ts, types, sounds, ThemeProvider, i18n
│   ├── .env.example
│   └── package.json
├── backend/                  # FastAPI + SQLAlchemy (async) + SQLite
│   ├── app/
│   │   ├── core/             # config, database, security (JWT)
│   │   ├── routers/          # auth, onboarding, path, lessons, user, social
│   │   ├── models.py         # ORM schema
│   │   ├── schemas.py        # Pydantic request/response models
│   │   └── deps.py           # get_current_user
│   ├── main.py               # App entry + CORS + lifespan seed
│   ├── seed.py               # Courses, exercises, demo user
│   ├── requirements.txt
│   └── .env.example
├── .gitignore
└── README.md
```

---

## Setup instructions

### Prerequisites

- **Node.js** 18+ and npm
- **Python** 3.11+
- Git

### 1. Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # optional; defaults work for local SQLite
uvicorn main:app --reload --port 8000
```

- API base: `http://localhost:8000`
- Interactive docs: [http://localhost:8000/docs](http://localhost:8000/docs)
- On first start, tables are created and the DB is seeded if empty.

**Demo account (seeded):**

| Field    | Value                 |
|----------|-----------------------|
| Email    | `demo@linguapath.com` |
| Password | `demo1234`            |

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

`.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 3. Typical local flow

1. Start backend on port **8000**
2. Start frontend on port **3000**
3. Open the landing page → Get Started / Log in → onboarding (new users) → Learn path

---

## Architecture overview

```
┌─────────────────────┐         HTTPS / JSON          ┌──────────────────────────┐
│  Next.js frontend   │  ←──────────────────────────→ │  FastAPI backend         │
│  (App Router)       │   Bearer JWT in localStorage  │  /api/*                  │
│                     │                               │                          │
│  • Landing + i18n   │                               │  • Auth (JWT)            │
│  • Auth / onboard   │                               │  • Onboarding            │
│  • Learn path UI    │                               │  • Path + progress       │
│  • Lesson player    │                               │  • Lessons (server-grade)│
│  • Shop / hearts    │                               │  • Shop / coins / hearts │
│  • Profile mascot   │                               │  • Profile / leaderboard │
└─────────────────────┘                               └────────────┬─────────────┘
                                                                   │
                                                                   ▼
                                                          SQLite (aiosqlite)
                                                          linguapath.db
```

### Design principles

| Area | Approach |
|------|----------|
| **Lessons** | Server-authoritative. Exercises are returned **without** correct answers. Grading, XP, hearts, and streaks happen only on the server. |
| **Hearts** | Lazy regeneration on read (1 heart / 30 min since last loss), plus optional coin refill. |
| **Coins** | Stored as `gems` in the DB; UI calls them **coins**. Mock IAP packs + one-time free 1000-coin offer per account. |
| **Theme** | Light by default. Dark mode only from Settings after login. |
| **Auth** | Email/password → JWT access token. Token kept in `localStorage` (`lp_token`). |

### Frontend stack

- Next.js 14, React 18, TypeScript, Tailwind CSS
- Framer Motion + GSAP (loaders, scroll path, UI motion)
- Zustand (lesson session state)
- Web Audio SFX (`src/lib/sounds.ts`)

### Backend stack

- FastAPI, Pydantic v2, SQLAlchemy 2.0 (async)
- aiosqlite / SQLite
- JWT via `python-jose`, passwords via `passlib` + bcrypt

### Content hierarchy

```
Course (es | fr | ja)
  └── Unit
        └── Skill          ← unlock / crowns / progress
              └── Lesson
                    └── Exercise   (multiple_choice | translate | match_pairs | fill_blank | type_answer)
```

---

## Database schema

SQLite file: `backend/linguapath.db` (created on startup).

### Entity relationship (simplified)

```
users ─┬─ user_onboarding
       ├─ user_stats
       ├─ user_skill_progress ── skills
       ├─ lesson_sessions ──┬─ lessons
       │                    └─ lesson_answers ── exercises
       └─ user_achievements ── achievements

courses ── units ── skills ── lessons ── exercises
```

### Tables

#### `users`
| Column | Type | Notes |
|--------|------|--------|
| id | int PK | |
| username | string unique | |
| email | string unique | |
| password_hash | string? | |
| auth_provider | string | default `local` |
| avatar_config | JSON | `{ outfit, accessory, color }` |
| created_at | datetime | |

#### `user_onboarding`
| Column | Type | Notes |
|--------|------|--------|
| user_id | int PK/FK → users | |
| chosen_language | string | `spanish` / `french` / `japanese` |
| proficiency_level | string | |
| daily_commitment_minutes | int | |

#### `user_stats`
| Column | Type | Notes |
|--------|------|--------|
| user_id | int PK/FK → users | |
| xp_total | int | |
| streak_count | int | |
| last_activity_date | date? | |
| hearts_current / hearts_max | int | default 5 |
| hearts_last_lost_at | datetime? | regen clock |
| gems | int | **coins** in the UI |
| free_coin_offer_claimed | bool | one-time welcome gift |
| daily_goal_xp / daily_xp_today / daily_xp_date | | daily quest |

#### Course tree
| Table | Key fields |
|-------|------------|
| `courses` | name, language_code (`es` / `fr` / `ja`) |
| `units` | course_id, order_index, title, description |
| `skills` | unit_id, order_index, title, icon_key |
| `lessons` | skill_id, order_index |
| `exercises` | lesson_id, type, prompt, options (JSON), correct_answer (JSON), audio_text |

#### Progress & sessions
| Table | Key fields |
|-------|------------|
| `user_skill_progress` | user_id + skill_id unique; status `locked` \| `available` \| `completed`; crowns |
| `lesson_sessions` | user_id, lesson_id, status, xp_earned, mistake_count |
| `lesson_answers` | session_id, exercise_id, is_correct, user_response |

#### Achievements
| Table | Key fields |
|-------|------------|
| `achievements` | code, title, description, icon_key |
| `user_achievements` | user_id + achievement_id PK; progress_current / progress_target |

---

## API overview

Base path: **`/api`**  
Auth: `Authorization: Bearer <access_token>` on protected routes.

Interactive OpenAPI: [http://localhost:8000/docs](http://localhost:8000/docs)

### Auth — `/api/auth`

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/signup` | No | Register → JWT |
| POST | `/auth/login` | No | Login → JWT |
| GET | `/auth/me` | Yes | Current user + avatar_config |
| DELETE | `/auth/account` | Yes | Delete account |
| POST | `/auth/google` | — | Stub (501) |

### Onboarding — `/api/onboarding`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/onboarding` | Set language, proficiency, daily goal |
| GET | `/onboarding` | Get onboarding prefs |

### Learning path — `/api`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/path` | Full unit → skill tree with unlock status for the user’s language |

### Lessons — `/api`

| Method | Path | Description |
|--------|------|-------------|
| POST | `/lesson/{lesson_id}/start` | Start session; exercises **without** answers |
| POST | `/session/{session_id}/answer` | Grade response; update hearts on miss |
| POST | `/session/{session_id}/complete` | Award XP, streak, mark skill progress |

### User / economy — `/api/user`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/user/stats` | Stats + lazy heart regen |
| POST | `/user/hearts/refill` | Refill hearts for 350 coins |
| POST | `/user/coins/free-offer` | **One-time** +1000 coins per account |
| POST | `/user/coins/purchase/{pack_id}` | Mock packs: `starter`, `popular`, `mega`, `legendary` |
| POST | `/user/day/advance` | Dev-only day skip |
| GET | `/user/courses` | Enrolled course summary |
| POST | `/user/courses/{language}/reset` | Reset skill progress |
| DELETE | `/user/courses/{language}` | Remove course / re-onboard |

### Social / profile — `/api`

| Method | Path | Description |
|--------|------|-------------|
| GET | `/leaderboard` | Top users by XP + your rank |
| GET | `/user/profile` | Profile, stats, achievements |
| PATCH | `/user/avatar` | Update mascot `{ outfit, accessory, color }` |

### Coin packs (mock)

| `pack_id` | Coins | Label |
|-----------|-------|--------|
| starter | 500 | $0.99 |
| popular | 1200 | $1.99 |
| mega | 2500 | $4.99 |
| legendary | 6500 | $9.99 |

---

## Features

### Product

- Landing page with arcade loader, 3D CTAs, scroll-drawn level path, multi-language site copy
- Auth + onboarding (language / level / daily commitment)
- Zigzag skill path with locked / available / completed nodes
- Lesson player: match pairs, multiple choice, translate, fill blank, type answer
- Hearts, streaks, daily XP quest, leaderboard
- **Shop** (left sidebar): buy coins + one-time free gift; spend on hearts / boosts
- **Profile**: customize 2D owl (Classic / Explorer / Astro, Glasses / Hat, Green / Blue / Gold / Red)
- Same mascot appears on lesson screens
- Light default theme; dark mode from Settings only

### Seeded courses

Spanish (`es`), French (`fr`), Japanese (`ja`) — units, skills, lessons, and exercise banks in `backend/seed.py`.

---

## Deploy (Vercel frontend)

1. Push the repo to GitHub.
2. Import in [Vercel](https://vercel.com/new); set **Root Directory** to `frontend`.
3. Env: `NEXT_PUBLIC_API_URL=https://your-api.example.com`
4. Host the FastAPI backend separately (Railway, Render, Fly.io, etc.).
5. On the API host set:

```env
CORS_ORIGINS=https://your-app.vercel.app
```

### Checklist

- [ ] Root Directory = `frontend`
- [ ] `NEXT_PUBLIC_API_URL` points at production API
- [ ] Backend `CORS_ORIGINS` includes the Vercel URL
- [ ] `npm run build` succeeds locally

---

## Scripts

| Location | Command | Purpose |
|----------|---------|---------|
| frontend | `npm run dev` | Dev server (port 3000) |
| frontend | `npm run build` | Production build |
| frontend | `npm run start` | Serve production build |
| frontend | `npm run lint` | ESLint |
| backend | `python -m uvicorn main:app --reload --port 8000` | API with auto-reload |

---

## License

Private / educational project.
