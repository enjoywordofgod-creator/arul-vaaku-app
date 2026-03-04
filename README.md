<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Vaarthayin Vithai – Church Messages App

This repository contains a simple Vite/React frontend coupled with an Express
backend for managing and viewing church message videos. The server stores data
in `data.json` and exposes a small admin API protected by JWT.

## 💻 Local Development

Prerequisites:
1. [Node.js](https://nodejs.org) (v18+ recommended)
2. Git (optional, for cloning the repo)

1. Clone the project and navigate into it:
   ```bash
   git clone <repo-url>
   cd "new app new"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy the example environment file and edit values if desired:
   ```bash
   cp .env.example .env
   # set ADMIN_USERNAME, ADMIN_PASSWORD, JWT_SECRET, PORT, etc.
   ```
4. Start the development server (frontend + API):
   ```bash
   npm run dev
   ```
   The site will be available at http://localhost:3000 by default.

5. Type‑check or lint if you want to catch issues:
   ```bash
   npm run type-check
   npm run lint
   ```

## 🚀 Production Build

To build the frontend assets:
```bash
npm run build
```
The compiled files will be placed under `dist/`, and `server.ts` will serve them
when `NODE_ENV=production`.

## 🔐 Admin API

- POST `/api/login` – body `{ username, password }` returns `{ token }`.
- Use `Authorization: Bearer <token>` on protected routes like:
  - `/api/messages` (POST/PUT/DELETE)
  - `/api/playlists` (POST/PUT/DELETE)
  - `/api/admin/export`, `/api/admin/import`

Default credentials: `admin` / `admin123` (override via env vars).

## 📝 Notes

- Data persists in `data.json` at project root.
- CORS is enabled on the API to allow the frontend to communicate with it.
- The backend listens on `PORT` environment variable (fallback 3000).

---
*Now the app is ready to be used locally or deployed to any Node.js host.*
