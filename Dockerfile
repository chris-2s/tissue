FROM python:3.11.4-slim-bullseye AS builder
COPY --from=ghcr.io/astral-sh/uv:0.11.21 /uv /uvx /bin/

ENV UV_LINK_MODE=copy \
    UV_NO_CACHE=1 \
    UV_PROJECT_ENVIRONMENT=/app/.venv

WORKDIR /app
COPY pyproject.toml uv.lock README.md /app/
RUN uv sync --frozen --no-dev

FROM python:3.11.4-slim-bullseye AS runtime
LABEL authors="Chris"

ENV LANG="C.UTF-8" \
    LC_ALL="C.UTF-8" \
    TZ="Asia/Shanghai" \
    PUID=0 \
    PGID=0 \
    UMASK=000 \
    PATH="/app/.venv/bin:$PATH"

RUN apt-get update -y \
    && apt-get -y install nginx gosu \
    && groupadd -r tissue -g 911 \
    && useradd -r tissue -g tissue -s /bin/bash -u 911 \
    && rm -rf /var/lib/apt/lists/*

COPY ./nginx/ /etc/nginx/conf.d/
WORKDIR /app
COPY --from=builder /app/.venv /app/.venv
COPY . /app/
RUN chown -R www-data /app/dist \
    && chmod +x /app/entrypoint

EXPOSE 9193
VOLUME [ "/app/config" ]

ENTRYPOINT ["./entrypoint"]
