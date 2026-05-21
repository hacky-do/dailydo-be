# 배포 가이드\_v1

## 인프라 구성

| 항목            | 값                                                                               |
| --------------- | -------------------------------------------------------------------------------- |
| 도메인          | `api.dailydo.shop`                                                               |
| EC2 Public IP   | `3.35.133.209`                                                                   |
| EC2 OS          | Ubuntu / SSH User: `ubuntu` / Port: 22                                           |
| RDS             | PostgreSQL — `dailydo-database.c5ggkau8w0e9.ap-northeast-2.rds.amazonaws.com:5432` |
| S3              | `dailydo-bucket` (ap-northeast-2)                                                  |
| Docker Registry | Docker Hub                                                                       |

### Docker 서비스 구성

| 서비스     | 역할                              |
| ---------- | --------------------------------- |
| `user-api` | NestJS API 서버 (포트 4000)       |
| `batch`    | NestJS 배치 서버 (포트 4002)      |
| `redis`    | 캐시 (컨테이너 내부 전용)         |
| `nginx`    | 리버스 프록시 + SSL 종단 (80/443) |
| `certbot`  | Let's Encrypt SSL 자동 발급·갱신  |

---

## EC2 최초 1회 설정

> GitHub Actions 첫 실행 전 EC2에 직접 SSH 접속하여 진행합니다.

### 1. Docker 설치

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker ubuntu
newgrp docker          # 또는 재로그인
docker --version       # 확인
```

### 2. 앱 디렉토리 생성

```bash
mkdir -p /home/ubuntu/app
```

### 3. EC2 보안 그룹 인바운드 규칙 확인

| 포트 | 프로토콜 | 소스      | 용도                                              |
| ---- | -------- | --------- | ------------------------------------------------- |
| 22   | TCP      | 내 IP     | SSH                                               |
| 80   | TCP      | 0.0.0.0/0 | HTTP (Let's Encrypt 인증 + HTTP→HTTPS 리다이렉트) |
| 443  | TCP      | 0.0.0.0/0 | HTTPS                                             |

### 4. DNS A 레코드 등록

도메인 레지스트라에서 아래 레코드를 추가합니다.

```
api.dailydo.shop  →  A  →  3.35.133.209
```

> Let's Encrypt 인증은 도메인이 EC2 IP를 정확히 가리켜야 발급됩니다.

---

## GitHub Secrets 설정

GitHub 리포지토리 → **Settings → Secrets and variables → Actions** 에서 아래 6개를 등록합니다.

| Secret 이름          | 값                                                                 |
| -------------------- | ------------------------------------------------------------------ |
| `DOCKERHUB_USERNAME` | Docker Hub 아이디                                                  |
| `DOCKERHUB_TOKEN`    | Docker Hub → Account Settings → Personal access tokens에서 발급    |
| `EC2_HOST`           | `3.35.133.209`                                                     |
| `EC2_USER`           | `ubuntu`                                                           |
| `EC2_SSH_KEY`        | EC2 PEM 키 파일 전체 내용 (`-----BEGIN RSA PRIVATE KEY-----` 포함) |
| `APP_ENV`            | `.env` 파일 전체 내용 (아래 참고)                                  |

### APP_ENV 등록 방법

로컬의 `.env` 파일 내용을 그대로 복사하여 `APP_ENV` Secret 값으로 붙여넣습니다.

> **주의:** `.env`의 JWT 키는 `\n`이 리터럴 두 글자로 저장되어 있습니다. 복사 시 편집하지 마세요.

---

## CI/CD 흐름

`dev` 브랜치에 push되면 GitHub Actions가 자동 실행됩니다.

```
push to dev
  │
  ├─ [build job] ─ matrix(user-api, batch)
  │     ├── Docker 이미지 빌드 (Dockerfile.app)
  │     └── Docker Hub push
  │           ├── {username}/dailydo-user-api:latest
  │           ├── {username}/dailydo-user-api:{git-sha}
  │           ├── {username}/dailydo-batch:latest
  │           └── {username}/dailydo-batch:{git-sha}
  │
  └─ [deploy job] ─ needs: build
        ├── SCP: docker-compose.yml, nginx conf, deploy.sh → EC2
        └── SSH: .env 복원 → deploy.sh 실행
```

### deploy.sh 동작

```
최초 배포 (인증서 없음)
  1. HTTP-only nginx 설정 적용
  2. redis, user-api, batch, nginx 기동
  3. certbot으로 Let's Encrypt 인증서 발급 (api.dailydo.shop)
  4. HTTPS nginx 설정으로 교체 → nginx reload
  5. certbot 갱신 데몬 기동 (12시간마다 자동 갱신)

이후 배포 (인증서 있음)
  1. 최신 이미지 pull
  2. HTTPS nginx 설정 적용
  3. docker compose up -d --remove-orphans
  4. nginx reload
```

---

## 수동 배포 (긴급 시)

EC2에 SSH 접속 후:

```bash
cd /home/ubuntu/app

# 이미지 업데이트 후 재기동
export DOCKERHUB_USERNAME=<your-dockerhub-username>
export IMAGE_TAG=latest
docker compose pull user-api batch
docker compose up -d --remove-orphans

# 로그 확인
docker compose logs -f user-api
docker compose logs -f nginx

# 서비스 상태
docker compose ps
```

---

## SSL 인증서

- 발급 기관: Let's Encrypt (무료)
- 저장 위치: Docker named volume `backend_letsencrypt`
- 자동 갱신: `certbot` 컨테이너가 12시간마다 `certbot renew` 실행
- 만료 전 30일 이내에만 갱신됨 (90일 유효)

### 인증서 수동 갱신

```bash
cd /home/ubuntu/app
docker compose run --rm certbot renew
docker compose exec nginx nginx -s reload
```

---

## 환경변수 업데이트

`.env` 값이 변경된 경우:

1. 로컬 `.env` 수정
2. GitHub Secrets의 `APP_ENV` 값 업데이트
3. `main`에 push → 자동 배포 시 새 `.env` 반영

또는 EC2에서 직접:

```bash
vi /home/ubuntu/.env
docker compose up -d user-api batch   # 해당 서비스만 재기동
```

---

## 트러블슈팅

### nginx 설정 오류 확인

```bash
docker compose exec nginx nginx -t
```

### Let's Encrypt 인증 실패 시

- DNS A 레코드가 EC2 IP를 정확히 가리키는지 확인 (`nslookup api.dailydo.shop`)
- EC2 보안 그룹 포트 80이 열려 있는지 확인
- 수동으로 재시도:

```bash
cd /home/ubuntu/app
docker compose run --rm certbot certonly \
  --webroot --webroot-path=/var/www/certbot \
  --email admin@dailydo.shop --agree-tos --no-eff-email \
  -d api.dailydo.shop
docker compose restart nginx
```

### DB 연결 실패 시

RDS 보안 그룹에서 EC2의 Security Group 또는 IP가 5432 포트로 인바운드 허용되어 있는지 확인합니다.
