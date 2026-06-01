# Orion – Implementation Plan (One‑Page)

**Objective**: Harden security, boost performance, and refactor the codebase for maintainability while preserving existing functionality.

---

## 0️⃣ Foundations (Week 0)
- **Version control**: Tag current commit (`v0.1‑pre‑hardening`) and create a `hardening` branch.
- **Dependency audit**: Run `npm audit` on client & server, upgrade all high‑severity packages (axios, lodash, mongoose, socket.io‑parser, etc.).
- **Helmet & CORS**: `npm i helmet`; add `app.use(helmet());` and replace static CORS origin with an env‑var `CORS_ORIGIN`.
- **Secure cookies**: Ensure `refreshToken` cookie uses `secure: process.env.NODE_ENV === 'production'`.
- **Request correlation ID**: Install `express-request-id`; add `app.use(requestId());` and pass `req.id` to logger.

---

## 1️⃣ Critical Security (Weeks 1‑2)
1. **Persist Refresh Tokens**
   - Create `models/RefreshToken.js` (hashed token, userId, expiresAt, revoked).
   - Update `utils/generateToken.js` to store a hash of the refresh token.
   - On login: create a RefreshToken record; on refresh: verify hash, rotate token, revoke old.
   - On logout: revoke token.
2. **Refresh‑Token Rotation** – Always issue a new refresh token on `/auth/refresh`.
3. **Rate Limiting & Account Lockout**
   - Install `express-rate-limit` on `/auth/login` (5 req/min per IP).
   - Store failed‑login attempts on the User document; lock account for 15 min after 5 failures.
4. **Encrypt 2FA Secret**
   - Extend the `encryptionPlugin` to the `twoFactorAuth.secret` and `tempSecret` fields in `model/user.js` and run a migration to encrypt existing values.
5. **(Optional) CSRF protection** – Verify SameSite=Strict; add CSRF header check if needed.

---

## 2️⃣ Authorization & Permissions (Week 3)
- **Cache role‑permission sets**: Use `node-cache` (TTL 5 min) in `middleware/authMiddleware.js` after loading user/roles.
- **Merge system‑role permissions**: Add `SYSTEM_ROLE_PERMISSIONS` map in `config/permissions.js` and union it with functional role permissions.
- **Replace legacy `authorize` middleware**: Search all routes, replace with `checkPermissions` (e.g., `router.use(protect, checkPermissions(PERMISSIONS.MANAGE_USERS))`).
- **Fine‑grained VIEW/EDIT permissions**: Add `VIEW_*` constants to `permissions.js` and update route guards accordingly.

---

## 3️⃣ Data Model & Query Optimisation (Week 4)
- **Add missing indexes** (via `schema.index()`):
  - `User.systemRole`, `User.department`, `User.manager`
  - `Task.author`, `Task.assignees`, `Task.status`, `Task.dueDate`
  - `Department.name`, `Role.name`
- **Use `.lean()`** on all read‑only `find` queries in controllers.
- **Full‑text index on `User.name`** (optional) for free‑text search.
- **Bulk write** for mass updates (replace loops with `Model.bulkWrite`).

---

## 4️⃣ Service Layer & Structured Logging (Weeks 5‑6)
- **Create services**:
  - `services/authService.js` (login, refresh, logout, 2FA)
  - `services/userService.js` (CRUD, password hash, audit log)
  - `services/taskService.js` (task CRUD, dependency checks)
- Refactor controllers to call service functions only.
- **Structured logging**:
  - Install `winston`, configure JSON transport.
  - Replace all `console.*` with `logger.*` (include `req.id`, `userId`, `ip`).
- **Async error wrapper**: implement `asyncHandler(fn)` and apply to every async route.

---

## 5️⃣ Real‑Time Scaling & Fault Tolerance (Weeks 7‑8)
- **Socket.io Redis adapter**: `npm i socket.io-redis`; configure `io.adapter(redisAdapter(...))` for multi‑process scaling.
- **Validate access token on each socket event**; disconnect if invalid and require client reconnection with fresh token.
- **MongoDB reconnection handling**: listen to `mongoose.connection` events, return `503 Service Unavailable` when disconnected; add `/health` endpoint.
- **(Optional) Access‑token blacklist** on logout – store JWT `jti` in an in‑memory set with TTL.

---

## 6️⃣ Client Improvements (Week 9)
- **Persist auth state**: add `redux-persist` (or store token in a short‑lived HttpOnly cookie) so a refresh keeps the user logged in after page reload.
- **Remove CRA proxy**: delete `proxy` from `client/package.json`; use `REACT_APP_API_URL` env variable for all API calls.
- **Show server error messages**: forward `err.response?.data?.message` to UI toasts.
- **Axios 401 interceptor**: on 401, call `/auth/refresh`, retry the original request; on failure redirect to login.

---

## 7️⃣ Release & Roll‑out (Week 10)
1. Merge `hardening` into `main` after all tests pass.
2. Run integration/E2E tests on a staging environment.
3. Deploy to staging (HTTPS, Redis, multiple Node workers).
4. Perform OWASP ZAP / npm audit security scan.
5. Deploy to production via blue‑green or canary.
6. Monitor logs for auth failures, DB reconnections, and socket events.

---

## Success Criteria
- **Zero high‑severity audit findings** (client & server). 
- **Refresh token persisted & rotatable**, revocable on logout/compromise. 
- **Rate‑limit** blocks >5 login attempts per minute per IP and locks the account after repeated failures. 
- **All protected routes** use `checkPermissions`; permission checks are cached (≤1 DB call/request). 
- **Key queries** hit indexes (`IXSCAN`) and respond < 200 ms on a 10 k‑record dataset. 
- **Socket.io** works with 2+ Node workers (messages delivered to all clients). 
- **Client** remains logged in after refresh and automatically refreshes access tokens on 401. 
- **Structured logs** include request ID, user ID, severity; ingestible by ELK. 
- **Production runs over HTTPS** with `Secure` cookies and Helmet/CSP headers.

---

*Prepared by OpenCode – automated audit and implementation roadmap.*