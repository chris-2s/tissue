# Agent Guide (tissue)

This repo is a FastAPI + SQLite backend with a Vite/React frontend. In Docker, Nginx serves the built frontend and reverse-proxies `/api/*` to the backend.

## Repo Map

- `app/`: FastAPI backend
- `alembic/`, `alembic.ini`: DB migrations (SQLite by default)
- `config/`: runtime data (SQLite DB, logs) created at runtime
- `nginx/app.conf`: serves `/app/dist` and proxies `/api/*` -> `127.0.0.1:8000`
- `frontend/`: Vite + React + TS + Ant Design UI
- `dist/`: built frontend output copied here for Docker/Nginx (treat as generated)

## Build / Lint / Test Commands

### Backend (Python)

Python deps are pinned in `requirements.txt`. There is no dedicated lint/test tool configured in this repo (no `pyproject.toml`, `ruff`, `black`, `pytest`, etc.).

- Install deps (local dev)
  - `python -m venv .venv && source .venv/bin/activate`
  - `pip install -r requirements.txt`

- Run API server (local dev)
  - `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`

- DB migrations
  - Apply latest: `alembic upgrade head`
  - Create revision (manual edits likely needed): `alembic revision -m "message"`
  - Autogenerate (requires models importable): `alembic revision --autogenerate -m "message"`

- Basic “does it run” checks (since no linter/test suite is present)
  - Import/bytecode sanity: `python -m compileall app`

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
  -p '9193:9193' \
  -v '/path/for/config':'/app/config' \
  -v '/path/for/video':'/data/video' \
  -v '/path/for/file':'/data/file' \
  -v '/path/for/downloads':'/downloads' \
  tissue:local
```

Runtime entrypoint (see `entrypoint`): starts Nginx, runs `alembic upgrade head`, then runs Uvicorn on port 8000.

### Tests (and running a single test)

There are currently no tests in the repo (`tests/`, `pytest.ini`, `*.test.*`, etc. are absent).

If/when tests are added with `pytest`, standard single-test patterns are:

- One file: `pytest path/to/test_file.py`
- One test: `pytest path/to/test_file.py::test_name`
- One test by keyword: `pytest -k "keyword"`

If/when frontend tests are added (e.g. Vitest), prefer `npm run test -- <pattern>` and document the exact script here.

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

**Config**

- Docker build uses `--mode docker` and expects API at `document.location.origin + '/api'` (`frontend/src/configs/docker.ts`).
- Development config currently points to a specific LAN host (`frontend/src/configs/development.ts`); don’t hard-code new environment-specific URLs.

## Cursor / Copilot Rules

- No Cursor rules found (`.cursor/rules/` or `.cursorrules` not present).
- No GitHub Copilot instructions found (`.github/copilot-instructions.md` not present).
