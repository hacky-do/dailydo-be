#!/usr/bin/env bash
# EC2 deploy script — run by GitHub Actions via SSH
set -euo pipefail

DOMAIN="api.daily-do.com"
EMAIL="admin@daily-do.com"
APP_DIR="/home/ubuntu/app"
VOLUME_NAME="backend_letsencrypt"

cd "$APP_DIR"
mkdir -p docker/nginx/conf.d

# ── helpers ────────────────────────────────────────────────────────────────

write_http_conf() {
  cat > docker/nginx/conf.d/default.conf << 'NGINX'
server {
    listen 80;
    server_name api.daily-do.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        proxy_pass         http://user-api:4000;
        proxy_http_version 1.1;
        proxy_set_header   Host              $host;
        proxy_set_header   X-Real-IP         $remote_addr;
        proxy_set_header   X-Forwarded-For   $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
    }
}
NGINX
}

write_https_conf() {
  cat > docker/nginx/conf.d/default.conf << 'NGINX'
server {
    listen 80;
    server_name api.daily-do.com;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl;
    http2 on;
    server_name api.daily-do.com;

    ssl_certificate     /etc/letsencrypt/live/api.daily-do.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.daily-do.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/api.daily-do.com/chain.pem;

    ssl_protocols             TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_session_cache         shared:SSL:10m;
    ssl_session_timeout       1d;
    ssl_stapling              on;
    ssl_stapling_verify       on;

    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Frame-Options           SAMEORIGIN;
    add_header X-Content-Type-Options    nosniff;

    location / {
        proxy_pass         http://user-api:4000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade          $http_upgrade;
        proxy_set_header   Connection       'upgrade';
        proxy_set_header   Host             $host;
        proxy_set_header   X-Real-IP        $remote_addr;
        proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto $scheme;
        proxy_read_timeout 90;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINX
}

cert_exists() {
  docker run --rm -v "${VOLUME_NAME}:/etc/letsencrypt" alpine \
    test -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" 2>/dev/null
}

# ── pull latest images ─────────────────────────────────────────────────────

echo "▶ Pulling images..."
docker compose pull user-api batch

# ── first-time SSL bootstrap ───────────────────────────────────────────────

if cert_exists; then
  echo "▶ Certificate found — starting with HTTPS config"
  write_https_conf
  docker compose up -d --remove-orphans
  docker compose exec nginx nginx -s reload
else
  echo "▶ No certificate found — bootstrapping SSL..."

  write_http_conf
  docker compose up -d redis user-api batch nginx
  echo "  Waiting for nginx..."
  sleep 5

  echo "  Requesting certificate from Let's Encrypt..."
  docker compose run --rm --entrypoint certbot certbot certonly \
    --webroot --webroot-path=/var/www/certbot \
    --email "$EMAIL" --agree-tos --no-eff-email \
    -d "$DOMAIN"

  write_https_conf
  docker compose restart nginx
  docker compose up -d certbot
fi

# ── cleanup old images ─────────────────────────────────────────────────────

echo "▶ Cleaning up unused Docker resources..."
docker system prune -af --volumes=false

# ── status ─────────────────────────────────────────────────────────────────

docker compose ps
echo "✔ Deployment complete"
