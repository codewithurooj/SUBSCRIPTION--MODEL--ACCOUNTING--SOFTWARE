# Deploying the backend to a VPS

Moves the FastAPI backend off Render's free tier onto a VPS you control, using
Docker so the runtime environment is identical everywhere. The Postgres
database stays on Neon — nothing about the database changes.

## 1. Prerequisites on the VPS

- Ubuntu 22.04+ (or similar) with a public IP
- A domain or subdomain (e.g. `api.yourdomain.com`) with its DNS A record
  pointed at the VPS's IP
- Docker installed:
  ```bash
  curl -fsSL https://get.docker.com | sh
  ```
- Nginx and certbot installed:
  ```bash
  sudo apt update && sudo apt install -y nginx certbot python3-certbot-nginx
  ```

## 2. Get the code onto the VPS

```bash
git clone https://github.com/codewithurooj/SUBSCRIPTION--MODEL--ACCOUNTING--SOFTWARE.git
cd SUBSCRIPTION--MODEL--ACCOUNTING--SOFTWARE
```

## 3. Set the backend's environment variables

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` and set `DATABASE_URL` to the existing Neon connection
string (the same one currently configured in Render — copy it from Render's
dashboard, don't recreate the database).

## 4. Build and start the backend container

```bash
docker compose -f docker-compose.vps.yml up -d --build
```

This builds the image from `backend/Dockerfile`, runs `alembic upgrade head`
on startup, and binds uvicorn to `127.0.0.1:8000` (not exposed to the
internet directly — Nginx handles that next).

Check it's healthy:
```bash
curl http://127.0.0.1:8000/health
# {"status":"ok"}
```

## 5. Put Nginx in front with HTTPS

```bash
sudo cp deploy/nginx-backend.conf /etc/nginx/sites-available/subscription-backend
sudo nano /etc/nginx/sites-available/subscription-backend   # set server_name to your real domain
sudo ln -s /etc/nginx/sites-available/subscription-backend /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d api.yourdomain.com
```

Certbot obtains a free TLS certificate and rewrites the Nginx config to serve
over HTTPS (and auto-renews going forward).

Verify from outside the VPS:
```bash
curl https://api.yourdomain.com/health
```

## 6. Point the frontend at the new backend

In Vercel, update the `BACKEND_API_URL` environment variable (Production) to
`https://api.yourdomain.com`, then redeploy the frontend so it picks up the
change.

## Redeploying after code changes

```bash
git pull
docker compose -f docker-compose.vps.yml up -d --build
```

## Rolling back

If a deploy breaks something, check out the previous commit and rebuild:
```bash
git log --oneline -5
git checkout <previous-good-commit>
docker compose -f docker-compose.vps.yml up -d --build
```
