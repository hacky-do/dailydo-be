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

1. `.env.dev`에서 `DB_SYNCHRONIZE=true`로 변경
2. `docker-compose ... up --build` 실행
3. 로컬 Swagger 확인
4. DataGrip 등에서 DB 테이블 변경사항 확인
5. `main` 브랜치 > `dev` 브랜치까지 push
6. GitHub Actions 배포 이상 유무 확인

## 로컬 서버 실행

```bash
docker-compose -f docker-compose.dev.yml --env-file .env.dev up --build

docker compose -f docker-compose.dev.yml up
docker compose -f docker-compose.dev.yml down
```
