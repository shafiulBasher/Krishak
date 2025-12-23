## Copilot / AI Agent Instructions — Krishak

Short, actionable notes to help an AI coding agent be immediately productive in this repository.

### Big picture
- Backend: Node.js + Express + MongoDB (Mongoose). Entry point: `backend/server.js`.
- Frontend: React + Vite; app root: `frontend/src`, API client: `frontend/src/services/api.js`.
- Data flow: Farmers create product listings -> Buyers add to cart -> Orders created and assigned to Transporters via delivery slots.
- Primary auth: JWT (see `backend/utils/jwt.js`). Roles: `farmer`, `buyer`, `transporter`, `admin` (see `backend/controllers/authController.js`).

### How to run locally (developer workflow)
- Backend: set environment variables (see `MODULE_2_SETUP_CHECKLIST.md` and `backend/.env.example` if present). Required: `MONGO_URI`, `JWT_SECRET`, optionally `PORT` and `ADMIN_*` vars. Start with:
  - npm --prefix backend install
  - npm --prefix backend run dev   # uses nodemon
  - or npm --prefix backend start # production node
- Seed admin user: `node backend/seedAdmin.js` (requires `MONGO_URI` and optional `ADMIN_*` env vars).
- Frontend: npm --prefix frontend install && npm --prefix frontend run dev
  - Ensure `VITE_API_URL` points to the backend API (example: `http://localhost:5000/api`). The frontend reads `import.meta.env.VITE_API_URL`.
  - All API fallbacks now consistently use port 5000. Frontend `.env` file is required.

### Testing & debugging
- API manual test collection: `backend/api-tests-cart-orders.http` (use VS Code REST Client or similar). This contains example requests and expected responses for carts and orders.
- No unit-test framework present; tests are manual / integration-level in docs. Follow `README_MODULE_2.md` for testing checklists.
- When debugging the backend, check `server.js` console logs for env var load hints; server exits if Mongo fails to connect.

### Project-specific conventions & patterns
- API responses follow a consistent shape: `{ success: true|false, data?, message?, count? }`. Use this when adding endpoints or handling responses.
- Controllers use `express-async-handler` and throw errors (set `res.status()` before `throw new Error('...')`). The central error middleware in `server.js` formats the response.
- Auth pattern: include `Authorization: Bearer <token>` header; token created by `generateToken(userId)` in `backend/utils/jwt.js` and verified by `middleware/authMiddleware.js` which also enforces `isActive` checks and role-based `authorize(...roles)`.
- File uploads: use `backend/middleware/uploadMiddleware.js` (multer) and files are served statically from `/uploads`. Product photos are stored under `/uploads/products` and saved as file-path strings (e.g., `/uploads/products/filename.jpg`).
- Many endpoints accept multipart FormData; some fields (location, costBreakdown) may arrive as JSON strings and controllers parse them (`JSON.parse`) — follow the controllers' parsing approach.

### Integration points / external deps
- Google OAuth: `backend/controllers/authController.js` uses `google-auth-library` and `GOOGLE_CLIENT_ID` env var for token verification. Frontend uses `@react-oauth/google`.
- Storage: local disk uploads by default (see `uploadMiddleware`). If migrating to cloud (S3/GCS) keep the same returned path convention or adapt the static server accordingly.

### Quick code guidance for common edits
- Add endpoints using `express.Router()` in `backend/routes/*`, implement handlers in `backend/controllers/*` using `asyncHandler`, and return the standardized response shape.
- If you change auth behavior, update `middleware/authMiddleware.js` and ensure frontend's token handling (`frontend/src/services/api.js`) remains compatible (authorization header + auto logout on 401).
- When changing product images behaviour, update `uploadMiddleware.js`, `server.js` static serving, and any frontend components referencing `API_BASE_URL` + `/uploads` paths.

### Files to reference (examples)
- Backend: `server.js`, `config/db.js`, `controllers/*`, `routes/*`, `middleware/*`, `utils/jwt.js`, `seedAdmin.js`, `api-tests-cart-orders.http`.
- Frontend: `src/services/api.js`, `src/context/*`, `src/pages/*` (see buyer/farmer/admin folders for role-specific flows), `.env.example`.

### Common pitfalls to avoid
- Ensure `VITE_API_URL` and backend `PORT` are aligned; inconsistent defaults exist in code. Prefer explicit env var overrides.
- Do not assume unit tests exist — rely on `api-tests-cart-orders.http` for integration testing.
- Always set `MONGO_URI` and `JWT_SECRET` locally before starting the backend; the server will exit on failed DB connect.

---
If any section is unclear or you'd like more detail (examples for PR messages, testing checklist, or a contributor quickstart), tell me which area to expand and I'll iterate. ✅
