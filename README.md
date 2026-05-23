# dailydo-be

내부 개발자 공유용 운영/실행 가이드입니다.

## 서비스 주소

- 도메인 주소: https://www.dailydo.shop
- API URL: https://api.dailydo.shop
- Swagger URL: https://api.dailydo.shop/api-docs/swagger
  - ID/PW: `backend` / `backend_1024`

## 빌드

```bash
pnpm build --filter @infra/social
pnpm build --filter user-api
pnpm build --filter batch
pnpm build --filter @system/jwt
```

## 로컬 > DB 테이블 변경 절차

1. `.env.local`에서 `DB_SYNCHRONIZE=true`로 변경
2. `docker compose -f docker-compose.dev.yml --env-file .env.local up --build -d` 실행
3. 로컬 Swagger 확인
4. DataGrip 등에서 DB 테이블 변경사항 확인
5. `main` 브랜치 > `dev` 브랜치까지 push
6. GitHub Actions 배포 이상 유무 확인

## 로컬 서버 실행

로컬은 `.env.local` + `docker-compose.dev.yml`을 사용한다. `docker-compose.dev.yml`의 `user-api`/`batch`는 `env_file: .env.local`로 컨테이너 환경변수를 주입하고, `--env-file .env.local`은 compose 파일의 변수 치환(`${DB_NAME}` 등)에 쓰인다. 둘 다 필요하다.

### 1. 사전 준비

- Docker Desktop 실행
- 프로젝트 루트에 `.env.local` 생성 (`.env.example` 참고). `.gitignore`에 포함돼 커밋되지 않는다.

### 2. 기동 / 종료

```bash
# 빌드 + 기동 (최초 또는 코드 변경 시)
docker compose -f docker-compose.dev.yml --env-file .env.local up --build -d

# 기동만 (이미 빌드된 경우)
docker compose -f docker-compose.dev.yml --env-file .env.local up -d

# 종료
docker compose -f docker-compose.dev.yml --env-file .env.local down

# 로그 확인
docker compose -f docker-compose.dev.yml --env-file .env.local logs user-api -f
```

### 3. 동작 확인

- Health: http://localhost:4000/health
- Swagger: http://localhost:4000/api-docs/swagger (ID/PW: `backend` / `backend_1024`)
- nginx 경유: http://localhost/health

### 포트 매핑

| 서비스 | 호스트 포트 | 비고 |
| --- | --- | --- |
| user-api | 4000 | |
| batch | 4002 | |
| nginx | 80 | |
| postgres | 5435 | DataGrip 등 호스트 접속용. 컨테이너 내부 통신은 `postgres:5432` |
| redis | 6379 | |

> postgres 호스트 포트가 `5435`인 이유: 기본 `5432`가 다른 로컬 컨테이너와 충돌할 수 있어 `docker-compose.dev.yml`에서 `5435:5432`로 매핑했다. 컨테이너 간 통신(`user-api` → `postgres`)은 내부 네트워크라 영향 없다.
