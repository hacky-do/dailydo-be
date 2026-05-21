# Docker Runbook

This repository now uses a single root `docker-compose.yml`.

## Prerequisites

- Create `.env` from `.env.example`
- Set external PostgreSQL and Redis endpoints in `.env`
- Set JWT PEM keys in `.env`

## Build and Run

```bash
docker compose build --no-cache
docker compose up -d
docker compose ps
docker compose logs -f user-api batch
```

## Stop

```bash
docker compose down
```

## Ports

- `user-api`: `${USER_API_PORT:-4000}`
- `batch`: `${BATCH_PORT:-4002}`

`docker-compose.yml` does not start PostgreSQL or Redis containers. Those services are expected to be provided externally through env vars.
