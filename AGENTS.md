# Agent Guide (tissue)

This repo is a FastAPI + SQLite backend with a Vite/React frontend. Python dependencies are managed with `uv`. In Docker, Nginx serves the built frontend and reverse-proxies `/api/*` to the backend.

## Repo Map

- `app/`: FastAPI backend
- `alembic/`, `alembic.ini`: DB migrations (SQLite by default)
- `config/`: runtime data (SQLite DB, logs) created at runtime
- `nginx/app.conf`: serves `/app/dist` and proxies `/api/*` -> `127.0.0.1:8000`
- `frontend/`: Vite + React + TS + Ant Design UI
- `dist/`: built frontend output copied here for Docker/Nginx (treat as generated)

## Build / Lint / Test Commands

- Backend:
  - Install deps: `uv sync`
  - Run API: `uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
  - Apply migrations: `uv run alembic upgrade head`
  - Create revision: `uv run alembic revision -m "message"`
  - Autogenerate revision: `uv run alembic revision --autogenerate -m "message"`
  - Sanity check: `uv run python -m compileall app`
- Frontend (from `frontend/`):
  - Install: `npm install`
  - Dev server: `npm run dev`
  - Build: `npm run build`
  - Lint: `npm run lint`
- CI/Docker frontend build: `cd frontend && npm install && CI=false npm run build && cp -r ./dist ../dist`
- Docker image: `docker build -t tissue:local .`
- Tests: there is no dedicated backend/frontend test runner yet.

## Code Style / Conventions

- General:
  - Do not hand-edit generated artifacts, especially `dist/` and `frontend/dist/`.
  - Keep diffs scoped; avoid drive-by reformatting.
  - Do not add new hard-coded secrets.
- Backend:
  - Use absolute `app...` imports and keep import groups readable.
  - Match surrounding style; Python 3.11 and Pydantic v2 patterns are OK.
  - Keep route handlers thin in `app/api/*`; business logic belongs in `app/service/*`.
  - DB session comes from `app.db.get_db()` and is also stored on `app.middleware.requestvars.g().db`.
  - Successful responses usually use `app.schema.r.R` helpers such as `R.ok(...)` and `R.list(...)`.
  - Prefer project exceptions: `BizException` for expected 4xx business errors, `AuthenticationException` / `AuthorizationException` for auth failures.
  - For user-facing API errors, `error.code` is the stable contract; `message` / `details` are fallback text.
  - New `BizException(...)` call sites should include `error_code`; use `error_params` only for stable, display-safe placeholders.
  - Do not localize API error payloads on the backend; backend i18n is for backend-owned logs/notifications.
  - Avoid bare `except:` and use `app.utils.logger.logger` instead of `print()`.
- Frontend:
  - TypeScript is `strict`; lint is ESLint.
  - Match surrounding style and keep imports readable; use `import type` when helpful.
  - Use the shared Axios instance from `frontend/src/utils/requests.ts`.
  - `Accept-Language` comes from frontend i18n via the shared interceptor; do not set ad hoc per-request locale headers.
  - Docker mode expects API at `document.location.origin + '/api'`; do not hard-code new environment-specific URLs.

**Internationalization**

- Frontend i18n uses `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
- Backend also has its own lightweight i18n layer for backend-owned user-visible text such as notifications and log messages.

Must follow:

- Frontend:
  - Treat `i18next` as the single source of truth for current language. Do not mirror locale state into Rematch unless there is a new, explicit need.
  - Internal frontend language codes are `zh` and `en`. Keep these app-level codes stable even if browser detection returns values like `zh-CN` or `en-US`.
  - Keep third-party locale mappings in `frontend/src/i18n/third-party/`. Do not scatter Ant Design / Day.js locale conversion logic across pages.
  - Translation resources live under `frontend/src/i18n/resources/` and are split by namespace/module, not by one giant shared file.
  - Use explicit namespace-qualified keys in UI code, such as `auth:login.title`, `routes:home`, and `errors:REQUEST_FAILED`.
  - Prefer the `namespace:key.path` form even when `useTranslation()` already names the namespace. This avoids ambiguity when a page later consumes multiple namespaces.
  - Reserve namespaces by responsibility: `common` for shared actions/status, `routes` for navigation labels, `errors` for backend error-code mappings and generic request failures, and feature namespaces such as `auth`, `video`, `setting` for domain-specific UI text.
  - When adding backend error handling on the frontend, prefer `error.code` -> `errors:*` translation mapping first, then fall back to backend-provided message text only if no translation key exists.
  - When frontend translates backend errors, pass `error.params` into `i18n.t(...)` so placeholders can interpolate.
- Backend:
  - Default locale comes from `DEFAULT_LOCALE` and supports `zh-CN` / `zh-TW` / `en-US` / `ja-JP`.
  - User-visible backend text should go through `app.i18n.translate(...)` or `app.i18n.build_text(...)` instead of hard-coded strings in services/providers.
  - Keep backend i18n keys responsibility-based: `notify.*.title`, `notify.*.body`, `log.*`, `message.*`.
  - Prefer complete templates plus params for backend notifications and user-visible logs. Use small reusable keys only for genuinely atomic labels or tags.
- Shared API contract:
  - Backend error response shape is `error.code` for the stable machine key, `error.params` for optional interpolation params, and `message` / `details` only as fallback human-readable text.

Current implementation facts:

- Browser detection checks `localStorage` first, then `navigator`, and unmatched values fall back to Chinese.
- Frontend third-party locale mappings live in `frontend/src/i18n/third-party/antd.ts` and `frontend/src/i18n/third-party/dayjs.ts`.
- Backend locale support is defined in `app/i18n/locale.py` via `SUPPORTED_LOCALES = ('zh-CN', 'zh-TW', 'en-US', 'ja-JP')`.
- Backend message bundles currently live in `app/i18n/messages.py`.
- Backend i18n entrypoints live in `app/i18n/` and are exposed from `app.i18n`.

## Cursor / Copilot Rules

- No Cursor rules found (`.cursor/rules/` or `.cursorrules` not present).
- No GitHub Copilot instructions found (`.github/copilot-instructions.md` not present).
