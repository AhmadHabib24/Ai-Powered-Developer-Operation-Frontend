# NOVA Frontend

Next.js workspace for **NOVA**, an AI-powered developer operations and performance platform.

Backend: [Ai-Powered-Developer-Operation-Backend](https://github.com/AhmadHabib24/Ai-Powered-Developer-Operation-Backend)

## Stack

Next.js, TypeScript, Tailwind CSS, TanStack Query, Sanctum bearer tokens in `sessionStorage`.

## Setup

```bash
cp .env.example .env.local
npm install
npm run dev
```

`.env.local` should point `NEXT_PUBLIC_API_URL` at the Laravel API (`http://localhost:8000`).

App: http://localhost:3000

On large screens the full sidebar stays. On mobile, use the bottom bar; **Menu** opens the rest of navigation.

Never commit `.env.local`.
