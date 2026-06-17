# Environment Setup and Deployment Guide

This file describes the complete environment variable structure and deployment configuration for both backend and frontend.

## Repo structure summary

- `backend/`
  - `package.json`
  - `tsconfig.json`
  - `.env` (local development only)
  - `.env.example`
  - `src/`
  - `dist/`
- `frontend/`
  - `package.json`
  - `vite.config.ts`
  - `.env` (local development only)
  - `.env.example`
  - `src/`

## Backend environment variables

### `backend/.env.example`

```env
PORT=5000
NODE_ENV=development
UPLOAD_DIR=uploads
OUTPUT_DIR=outputs
CLEANUP_INTERVAL_MINUTES=60

JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d

MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/?retryWrites=true&w=majority
MONGODB_DB_NAME=pdf_extractor

# Either use Resend or SMTP:
RESEND_API_KEY=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-smtp-password
SMTP_FROM=your-email@example.com

OTP_EXPIRY_MINUTES=10
```

### Meaning of backend env values

- `PORT` — backend server port. Render will usually override this.
- `NODE_ENV` — should be `production` in deployment and `development` locally.
- `UPLOAD_DIR` — upload storage folder path.
- `OUTPUT_DIR` — generated output folder path.
- `CLEANUP_INTERVAL_MINUTES` — interval for cleanup tasks.
- `JWT_SECRET` — secret used to sign authentication tokens.
- `JWT_EXPIRES_IN` — token expiration period.
- `MONGODB_URI` — MongoDB Atlas connection string.
- `MONGODB_DB_NAME` — database name.
- `RESEND_API_KEY` — optional API key for Resend email service.
- `SMTP_HOST` — SMTP server host.
- `SMTP_PORT` — SMTP server port.
- `SMTP_USER` — SMTP username/email address.
- `SMTP_PASS` — SMTP password or app-specific password.
- `SMTP_FROM` — sender email used in OTP emails.
- `OTP_EXPIRY_MINUTES` — how long OTP codes remain valid.

## Frontend environment variables

### `frontend/.env.example`

```env
# Local development
VITE_API_URL=http://localhost:5000

# Production example:
# VITE_API_URL=https://your-backend-url.onrender.com
```

### Meaning of frontend env values

- `VITE_API_URL` — public URL of the backend API used by frontend code.
- All frontend environment vars exposed to browser code must start with `VITE_`.

## Deployment configuration

### Render backend service

Use `backend` as the service root. Set the following in the Render dashboard:

- `NODE_ENV=production`
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `JWT_SECRET`
- One of:
  - `RESEND_API_KEY`
  - or SMTP settings: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `OTP_EXPIRY_MINUTES` (optional override)

Recommended commands for Render:

- Build command: `rm -rf node_modules && npm ci && npm run build`
- Start command: `npm start`
- Root directory: `backend`

### Vercel frontend

Set the following in Vercel environment variables for the production environment:

- `VITE_API_URL=https://your-backend-url.onrender.com`

Use the deployed backend URL from Render.

## Local development

### Backend

Copy `backend/.env.example` to `backend/.env`, then fill in real values.

### Frontend

Copy `frontend/.env.example` to `frontend/.env` and keep `VITE_API_URL=http://localhost:5000` for local backend testing.

## Important notes

- Do not commit real secret values into source control.
- Use `.env.example` only for structure and placeholder values.
- In production, set env variables in the hosting dashboard, not in `.env` files.
- For frontend deploys, the `VITE_API_URL` value must point to the deployed backend URL.

## Useful file references

- `backend/.env.example`
- `frontend/.env.example`
- `ENVIRONMENT.md`
- `backend/src/services/emailService.ts`
- `backend/src/utils/responseSender.ts`
- `frontend/src/constants/api.ts`
