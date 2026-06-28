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

### Backend (Python)

Python deps are declared in `pyproject.toml` and pinned in `uv.lock`. No dedicated backend lint/test tool is configured.

- Install deps: `uv sync`
- Run API: `uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
- Apply migrations: `uv run alembic upgrade head`
- Create revision: `uv run alembic revision -m "message"`
- Autogenerate revision: `uv run alembic revision --autogenerate -m "message"`
- Basic sanity check: `uv run python -m compileall app`

### Frontend (Vite + React)

From `frontend/`:

- Install: `npm install`
- Dev server: `npm run dev`
- Typecheck + build (Docker mode): `npm run build`
- Lint: `npm run lint`

CI/Docker build (matches `.github/workflows/build*.yml`):

- `cd frontend && npm install && CI=false npm run build && cp -r ./dist ../dist`

### Docker (full app)

- Build image: `docker build -t tissue:local .`
- Run container (example from `README.md`):

```bash
docker run -d --name=tissue \
  -e TZ="Asia/Shanghai" \
  -e DEFAULT_LOCALE="zh-CN" \
  -p '9193:9193' \
  -v '/path/for/config':'/app/config' \
  -v '/path/for/video':'/data/video' \
  -v '/path/for/file':'/data/file' \
  -v '/path/for/downloads':'/downloads' \
  tissue:local
```

Runtime entrypoint (see `entrypoint`): starts Nginx, runs `alembic upgrade head`, then runs Uvicorn on port 8000.

### Tests

There is currently no dedicated backend/frontend test runner configured in this repo.

- Future `pytest` single file: `pytest path/to/test_file.py`
- Future `pytest` single test: `pytest path/to/test_file.py::test_name`
- Future `pytest` keyword: `pytest -k "keyword"`
- If frontend tests are added later, prefer documenting the exact `npm run test -- <pattern>` form here.

## Code Style / Conventions

### General

- Keep changes scoped: don’t hand-edit generated artifacts (notably `dist/` and `frontend/dist/`).
- Prefer small, reviewable diffs; avoid drive-by reformatting.
- Avoid committing secrets. This repo currently contains hard-coded secrets/defaults (e.g. JWT secret and default admin password); do not add more.

### Python (FastAPI backend)

**Imports**

- Use absolute imports within the app: `from app...` (consistent with existing code).
- Group imports: stdlib, third-party, local `app.*`. Keep groups separated by a blank line.

**Formatting**

- Match surrounding file style (this codebase is not uniformly formatted).
- 4-space indentation; avoid unnecessary vertical whitespace.

**Typing**

- Python 3.11 is used in Docker (`Dockerfile`), so modern typing is OK (`X | None`, `list[str]`).
- Use Pydantic v2 patterns (`model_dump()` etc.).
- Add type hints at boundaries: API handlers, dependency providers, service methods that are reused.

**Architecture / layering**

- API routes live in `app/api/*.py` and are registered in `app/api/__init__.py`.
- Keep route handlers thin: parse/validate inputs, call a service, return a response.
- Business logic lives in `app/service/*.py`.
- DB session is provided via `app.db.get_db()`; it also stores the session on `app.middleware.requestvars.g().db`.

**Responses**

- Successful responses typically use `app.schema.r.R` helpers:
  - `return R.ok(data)`
  - `return R.list(data, total=...)`

**Error handling**

- Prefer raising the project’s exceptions so global handlers apply:
  - `BizException` for expected 4xx business errors
  - `AuthenticationException` / `AuthorizationException` for auth failures
- For user-facing API errors, treat `error.code` as the stable contract. `message` / `details` are fallback text, not the primary protocol.
- `BizException(...)` should keep a readable fallback message, but new/updated call sites should also provide `error_code`.
- Use `error_params` only for stable, display-safe placeholders (e.g. `provider`, `spider_key`). Do not put raw exception text, stack traces, HTML, or sensitive values into params.
- Do not replace API error codes with backend-rendered localized strings. API errors and backend-owned notifications/logs are separate concerns.
- Avoid bare `except:` in new code; catch expected exception types and re-raise a meaningful project exception.
- Use `app.utils.logger.logger` for errors/warnings instead of `print()`.

**Naming**

- Modules, functions, variables: `snake_case`
- Classes: `PascalCase`
- Constants: `UPPER_SNAKE_CASE`
- FastAPI routers: module-level `router = APIRouter()`

**Security / config**

- Prefer environment variables or config files under `config/` for secrets.
- The JWT secret in `app/utils/security.py` is currently hard-coded; treat it as a deployment concern and avoid expanding this pattern.

### TypeScript/React (frontend)

**Tooling**

- TypeScript is `strict` (`frontend/tsconfig.json`).
- Lint is ESLint (`frontend/.eslintrc.cjs`). There is no Prettier config in this repo.

**Formatting**

- Match the file you touch (quote style and semicolons are currently mixed).
- Keep imports readable; avoid long relative import chains when a local index/export exists.

**Imports**

- Group imports roughly as: React/framework, third-party libs, local modules, then styles.
- Use `import type { ... }` for type-only imports when it improves clarity.

**API calls / auth**

- Use the shared Axios instance from `frontend/src/utils/requests.ts`.
- Auth token is injected via request interceptor; 401 triggers `store.dispatch.auth.logout()`.
- Keep locale-aware request behavior in the shared interceptor. `Accept-Language` is derived from the frontend i18n runtime, not from ad hoc per-call headers.

**Config**

- Docker build uses `--mode docker` and expects API at `document.location.origin + '/api'` (`frontend/src/configs/docker.ts`).
- Development config currently points to a specific LAN host (`frontend/src/configs/development.ts`); don’t hard-code new environment-specific URLs.

**Internationalization**

- Frontend i18n uses `i18next` + `react-i18next` + `i18next-browser-languagedetector`.
- Backend also has its own lightweight i18n layer for backend-owned user-visible text such as notifications and log messages.

Must follow:

- Treat `i18next` as the single source of truth for current language. Do not mirror locale state into Rematch unless there is a new, explicit need.
- Internal frontend language codes are `zh` and `en`. Keep these app-level codes stable even if browser detection returns values like `zh-CN` or `en-US`.
- Keep third-party locale mappings in `frontend/src/i18n/third-party/`. Do not scatter Ant Design / Day.js locale conversion logic across pages.
- Translation resources live under `frontend/src/i18n/resources/` and are split by namespace/module, not by one giant shared file.
- Use explicit namespace-qualified keys in UI code:
  - `auth:login.title`
  - `routes:home`
  - `errors:REQUEST_FAILED`
- Prefer the `namespace:key.path` form even when `useTranslation()` already names the namespace. This avoids ambiguity when a page later consumes multiple namespaces.
- Reserve namespaces by responsibility:
  - `common`: shared actions, generic status text
  - `routes`: navigation labels, route titles, menu/tab text
  - `errors`: backend error-code mappings and generic request failures
  - feature namespaces such as `auth`, `video`, `setting`, etc. for domain-specific UI text
- When adding backend error handling on the frontend, prefer `error.code` -> `errors:*` translation mapping first, then fall back to backend-provided message text only if no translation key exists.
- Backend error response shape is expected to be:
  - `error.code`: stable machine key
  - `error.params`: optional interpolation params
  - `message` / `details`: fallback human-readable text
- When frontend translates backend errors, pass `error.params` into `i18n.t(...)` so placeholders can interpolate.
- Backend default locale comes from `DEFAULT_LOCALE` and currently supports `zh-CN` / `en-US`.
- Backend user-visible text should go through `app.i18n.translate(...)` or `app.i18n.build_text(...)` instead of hard-coded Chinese/English strings in services/providers.
- Keep backend i18n keys responsibility-based:
  - `notify.*.title`
  - `notify.*.body`
  - `log.*`
  - `message.*`
- Prefer complete templates plus params for backend notifications and user-visible logs. Use small reusable keys only for genuinely atomic labels or tags.

Current implementation facts:

- Browser detection checks `localStorage` first, then `navigator`, and unmatched values fall back to Chinese.
- Backend-facing language headers use regioned values:
  - `zh` -> `zh-CN`
  - `en` -> `en-US`
- Ant Design locale mapping lives in `frontend/src/i18n/third-party/antd.ts`.
- Day.js locale mapping lives in `frontend/src/i18n/third-party/dayjs.ts`.
- Backend i18n entrypoints live in `app/i18n/` and are exposed from `app.i18n`.

## Cursor / Copilot Rules

- No Cursor rules found (`.cursor/rules/` or `.cursorrules` not present).
- No GitHub Copilot instructions found (`.github/copilot-instructions.md` not present).
