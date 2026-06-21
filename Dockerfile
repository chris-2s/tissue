FROM python:3.11.4-slim-bullseye
COPY --from=ghcr.io/astral-sh/uv:0.11.21 /uv /uvx /bin/
LABEL authors="Chris"

ENV LANG="C.UTF-8" \
    TZ="Asia/Shanghai" \
    PUID=0 \
    PGID=0 \
    UMASK=000 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv \
    PATH="/app/.venv/bin:$PATH"

RUN apt-get update -y \
    && apt-get -y install nginx locales gosu

COPY ./nginx/ /etc/nginx/conf.d/
WORKDIR /app
COPY pyproject.toml uv.lock README.md /app/
RUN uv sync --frozen --no-dev \
    && mkdir -p /app/dist \
    && locale-gen zh_CN.UTF-8 \
    && groupadd -r tissue -g 911 \
    && useradd -r tissue -g tissue -s /bin/bash -u 911

COPY . /app/
RUN chown -R www-data /app/dist \
    && chmod +x /app/entrypoint

EXPOSE 9193
VOLUME [ "/app/config" ]

ENTRYPOINT ["./entrypoint"]
