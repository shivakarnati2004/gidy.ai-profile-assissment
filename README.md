# shiva karnati

## Local setup (permanent localhost default)

Permanent development ports:
- Frontend: `http://localhost:8082`
- Backend: `http://localhost:4000`

Prerequisites:
- Node.js 18+
- npm
- PostgreSQL

### 1) Install dependencies

```sh
npm install
npm --prefix server install
```

### 2) Configure environment files

Create root `.env` from `.env.example`.

Create `server/.env` from `server/.env.example` and configure at least:
- `DATABASE_URL`
- `JWT_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`

Optional smoke-test env:
- `DEMO_USER_EMAIL`
- `DEMO_USER_PASSWORD`

### 3) Prepare database

```sh
cd server
npx prisma migrate dev
npx prisma generate
cd ..
```

### 4) Run application

Preferred fixed localhost mode:
```sh
npm run dev:full
```
This keeps frontend/backend on `8082/4000` and reuses already-running local services on those same ports.

If those ports are stuck or in use by old processes, run:
```sh
npm run dev:full:reset
```

Alternative auto-fallback mode:
```sh
npm run dev:full:auto
```

Manual split mode:
```sh
npm run dev:backend
npm run dev:frontend:8082
```

## Deploy on Render (free tier, safe setup)

This project can be deployed on Render using the included Blueprint file: `render.yaml`.

### Important free-tier note first

Render plan availability can change by region/time. If a free PostgreSQL option is not shown in your Render account, use the lowest available Postgres plan.

### A to Z deploy steps (Blueprint method)

1) Create GitHub repo and push code

From project root:

```sh
git init
git add .
git commit -m "prepare render deploy"
git branch -M main
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

2) Open Render dashboard

- Go to https://dashboard.render.com
- Sign in with your GitHub account.

3) Create a Blueprint deploy

- Click **New +** -> **Blueprint**.
- Select your GitHub repo.
- Render detects `render.yaml`.

4) Confirm services created by Blueprint

Render will create:
- `profile-postgres` (PostgreSQL database)
- `profile-backend` (Node web service)
- `profile-frontend` (Static site)

Note: the static service in `render.yaml` intentionally omits a `plan` field, because some Render accounts reject `plan: free` for `env: static` services.

5) Set backend environment variables (required)

In `profile-backend` -> **Environment**, set:
- `CORS_ORIGIN` = your frontend Render URL (example: `https://profile-frontend.onrender.com`)
- `FRONTEND_URL` = same frontend URL

Already auto-wired by Blueprint:
- `DATABASE_URL` (from Render Postgres)
- `JWT_SECRET` (auto-generated)
- `NODE_ENV=production`
- `DISABLE_OTP_VERIFICATION=true`

6) Set frontend environment variable (required)

In `profile-frontend` -> **Environment**, set:
- `VITE_API_URL` = your backend Render URL (example: `https://profile-backend.onrender.com`)

7) Trigger redeploy after env updates

- Open `profile-backend` -> **Manual Deploy** -> **Deploy latest commit**.
- Open `profile-frontend` -> **Manual Deploy** -> **Deploy latest commit**.

8) Wait for green deploy logs

Backend logs should include:
- build success (`npm run build`)
- migration success (`npm run start:render` runs prisma generate + migrate deploy)
- server start (`npm run start:render`)

Frontend logs should include:
- static build success (`npm run build`)
- publish from `dist`

9) Verify backend health

Open:

```text
https://<your-backend>.onrender.com/api/health
```

Expected response:

```json
{"status":"ok"}
```

10) Verify frontend routes and SPA refresh

Open:
- `https://<your-frontend>.onrender.com/`
- `https://<your-frontend>.onrender.com/login`
- `https://<your-frontend>.onrender.com/profile`

The project includes `public/_redirects` so direct route refresh works on Render Static hosting.

11) Authentication behavior when SMTP is not configured

- OTP routes need SMTP to send real codes.
- For this free-tier setup, `DISABLE_OTP_VERIFICATION=true` bypasses OTP checks so signup can continue without SMTP.
- Existing users can still log in if already present in database.

12) Optional SMTP setup (recommended for full auth)

Set these in backend environment:
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

13) Keep deployment safe

- Do not set `CORS_ORIGIN=*` in production.
- Do not expose `JWT_SECRET`, `DATABASE_URL`, or `SMTP_PASS`.
- Use Render environment variables only (not hardcoded secrets).

14) Free-tier runtime expectations

- Services may sleep when idle.
- First request after idle can be slow (cold start).
- This is expected on free tier.

15) Updating app after first deploy

```sh
git add .
git commit -m "your update"
git push origin main
```

With auto-deploy enabled, Render redeploys automatically.

### Commands used by Render from this repo

Backend (`profile-backend`):
- Build: `npm install --include=dev && npm run build`
- Start: `npm run start:render`

Frontend (`profile-frontend`):
- Build: `npm install && npm run build`
- Publish directory: `dist`

### Quick troubleshooting

- `CORS blocked`:
	- Ensure backend `CORS_ORIGIN` exactly matches frontend URL.
- `Frontend loads but API fails`:
	- Check frontend `VITE_API_URL` points to backend Render URL.
- `Login/Create Account shows Request failed with status 404`:
	- Frontend is likely calling its own static site instead of backend API.
	- Set `VITE_API_URL` in `profile-frontend` to your backend URL and redeploy frontend.
- `Database errors`:
	- Check backend deploy logs for `prisma migrate deploy` output.
- `404 on refresh`:
	- Ensure `public/_redirects` exists and redeploy frontend.

## Script reference

- `npm run dev` -> frontend fixed on `8082`
- `npm run dev:frontend:8082` -> frontend fixed on `8082`
- `npm run dev:frontend:auto` -> frontend tries `8082`, then `5173`
- `npm run dev:backend` -> backend on `4000`
- `npm run dev:full` -> backend + frontend fixed (`4000/8082`)
- `npm run dev:full:reset` -> kills listeners on `4000/8082` (Windows) and starts fixed mode
- `npm run dev:full:auto` -> backend + frontend with frontend fallback ports
- `npm run build` -> frontend production build
- `npm --prefix server run build` -> backend production build
- `powershell -ExecutionPolicy Bypass -File .\smoke-test.ps1` -> smoke tests

## Tech stack

Frontend:
- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui
- TanStack Query

Backend:
- Node.js + Express + TypeScript
- Prisma ORM + PostgreSQL
- JWT + bcryptjs for auth
- Nodemailer (SMTP) for OTP emails
- Multer for profile photo upload handling

## Innovation features and why they help Gidy

1) Skill Endorsement System
- Users can endorse skills and see endorsement counts in profile skills.
- Why chosen: adds trust and social proof to user profiles, helping recruiters/teams quickly evaluate strengths.

2) Interactive Work Timeline
- Experience is shown as an interactive timeline panel, so users can switch timeline items quickly.
- Why chosen: improves scanability of career history and gives Gidy profiles a more engaging professional layout.

3) Persistent Dark Mode
- Theme toggle in navbar persists across sessions.
- Why chosen: improves usability and accessibility for long sessions and low-light usage.

4) AI-Generated Bio Summary (tag-based)
- Profile edit has “Generate AI Summary” using headline, skills, and goals.
- Why chosen: helps users create profile content faster and improves profile completion quality.

5) Profile + Logout
- Users can set profile and resume links directly in profile data.
- Profile page includes a logout button to clear local session and redirect to login.
- Why chosen: direct profile updates improve personal branding while logout strengthens account/session safety.

## API highlights

- `GET /api/health`
- `POST /api/auth/request-otp`
- `POST /api/auth/verify-otp`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/profile/:username`
- `PUT /api/profile/:username`
- `POST /api/skills/:skillId/endorse`
- `GET /api/skills/:skillId/endorsements`
