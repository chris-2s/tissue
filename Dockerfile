FROM python:3.11.4-slim-bullseye
LABEL authors="Chris Chen"

ENV LANG="C.UTF-8" \
    TZ="Asia/Shanghai" \
    PUID=0 \
    PGID=0 \
    UMASK=000

RUN apt-get update -y \
    && apt-get -y install nginx locales gosu

COPY ./nginx/ /etc/nginx/conf.d/
COPY . /app/

WORKDIR /app
RUN pip install -r requirements.txt \
    && chown -R www-data /app/dist \
    && locale-gen zh_CN.UTF-8 \
    && groupadd -r tissue -g 911 \
    && useradd -r tissue -g tissue -s /bin/bash -u 911

EXPOSE 9193
VOLUME [ "/app/config" ]

ENTRYPOINT ["./entrypoint"]