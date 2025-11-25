Nexa Auth Backend (with Groq Integration)
-----------------------------------------

This backend provides:
- Auth: register/login/me with MongoDB + JWT
- Groq AI proxy endpoint: /api/groq/generate

Setup:
1. Copy `.env.example` to `.env` and fill values (MONGO_URI, JWT_SECRET, GROQ_API_KEY, GROQ_API_URL).
2. `npm install`
3. `npm run dev` (requires nodemon) or `npm start`

Notes:
- GROQ_API_URL should point to the Groq model endpoint you want to use (check Groq docs).
- Keep GROQ_API_KEY secret; do not expose it client-side.
