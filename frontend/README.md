# LinguaPath Frontend

Next.js 14 app for LinguaPath — the gamified language-learning UI.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (include `/api`), e.g. `http://localhost:8000/api` |

## Deploy on Vercel

1. Import the GitHub repo in Vercel.
2. Set **Root Directory** to `frontend` (if deploying from the monorepo root).
3. Set `NEXT_PUBLIC_API_URL` to your production API URL.
4. Deploy.

`vercel.json` is included for framework defaults. See the root [README](../README.md) for full monorepo + CORS notes.

## Stack

- Next.js 14 (App Router)
- Tailwind CSS
- Framer Motion + GSAP (loaders, scroll path, motion)
- Zustand / localStorage auth token
