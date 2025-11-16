# Evergreen — Social platform for the elderly to participate in activities with their loved ones


![Evergreen](https://img.shields.io/badge/Evergreen-v1.0.0-0B8F55)
![Next.js](https://img.shields.io/badge/Next.js-000?logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?logo=postgresql&logoColor=white)
![Auth.js](https://img.shields.io/badge/Auth.js-000?logo=nextdotjs&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-2496ED?logo=docker&logoColor=white)
![Featherless AI](https://img.shields.io/badge/Featherless_AI-6E59A5)

Evergreen is a web app that helps older adults find things to do with their loved ones. Users share what they enjoy, invite family or friends, and get AI-ranked recommendations for nearby events and at-home activities—all through an accessible, senior-friendly interface.

- Built with **Next.js, TypeScript, Tailwind CSS 4, Prisma, PostgreSQL, Auth.js**, and **Docker**.
- AI assistance via **Featherless** for understanding preferences, creating joint plans, keywording events, and generating lightweight wellness/activity ideas.
- Event data comes from the **Espoo Linked Events API**, merged with user preferences for relevance.

## Why We Built This
- Loneliness grows with age; one-third of older adults experience social isolation.
- Many apps assume tech confidence and exclude people with deteriorating eyesight or mobility.
- Evergreen gives seniors agency: they propose outings, invite loved ones, and see options tailored to what everyone enjoys—reviving traditions, discovering new hobbies, and making shared experiences effortless.

## Product Snapshot
- **Accessible onboarding** collects interests, dislikes, mobility considerations, and city; preferences are normalized by LLM into structured profiles.
- **Personalized ideas**: AI-generated general suggestions plus real nearby events (Espoo Linked Events) ranked by what the senior and their circle like.
- **Loved ones & invites**: add relatives/friends, capture their interests, and get joint activity matches.
- **Dashboard & planner**: activity feed, calendar entries, health log, and quick invites in one place.
- **Wellness helpers**: yoga/“micro-stretch” style prompts and daily idea nudges to keep people moving even when staying home.

## Architecture & Stack
- **Frontend**: Next.js 16 + React 19, App Router, Tailwind CSS 4, Radix UI, lucide icons, light/dark themes.
- **Auth**: Auth.js credentials with bcrypt password hashing, Prisma adapter, secure sessions.
- **Data**: PostgreSQL (Docker Compose), Prisma schema for users, relatives, matches, suggestions, calendar, and history.
- **AI**: Featherless chat completions for preference normalization, general suggestions, joint activities, event keyword generation, and wellness plans.
- **Integrations**: Espoo Linked Events API fetch for real-world activities; Prisma Studio for database inspection, Yoga API.

## Getting Started
Prerequisites: Node 20+, npm, Docker + Docker Compose, and a Featherless API key.

1) **Environment**
```bash
cp .env.example .env
# Fill in NEXTAUTH_SECRET, FEATHERLESS_API_KEY, and any DB overrides.
```

2) **Database**
```bash
docker compose up -d db
```

3) **Install & prime Prisma**
```bash
npm install
npx prisma generate
npx prisma db push
```

4) **Run the app locally**
```bash
npm run dev   # http://localhost:3000
```
Optional: `docker compose up studio` (Prisma Studio on port 5555) or use the containerized dev server via `docker compose up web` if you prefer running Node inside Docker.

## Key Commands
- `npm run dev` — Next.js dev server (Turbopack).
- `npm run build` / `npm start` — production build and start.
- `npm run prisma:studio` — open Prisma Studio locally.

## AI Usage & Data Privacy
- We send **preference text and event context** to Featherless to normalize interests, create joint plans, draft yoga/active ideas, and to generate keywords for the Espoo events search. Raw chat history is not stored; the original onboarding text is saved alongside the normalized profile to let users edit later.
- **Passwords are bcrypt-hashed**, sessions go through Auth.js/Prisma, and user/relative data is stored in PostgreSQL.
- Keep secrets in `.env`, prefer long random values for `NEXTAUTH_SECRET`, and rotate the Featherless key regularly. Avoid placing personal health information in free-text fields; only supply what is necessary for recommendations.

## Deployment Notes
- Expect outgoing HTTP to the Espoo Linked Events API and Featherless. Ensure those endpoints are allowed in your environment.
- Set `NEXTAUTH_URL`/`NEXT_PUBLIC_APP_URL` to the public origin in production.
- Run `npx prisma db push` (or migrations) against your production database before starting `next start`.

## Our Motivation
Evergreen exists so older adults don’t have to wait to be invited—they can confidently propose ideas, plan with family, and enjoy their city on their own terms. Accessible design, gentle AI guidance, and privacy-first data handling keep the focus on human connection during the golden years.
