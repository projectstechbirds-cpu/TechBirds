# TechBirds — Deployment Guide (paste into Claude chat)

> **Instructions to Claude:** The user is deploying the TechBirds platform to a single Linux VPS named **KVM1**. They have a Windows laptop and will SSH into the server. Walk them through the phases below **one at a time**, in order. After each phase, ask them to paste the output of the verification command before moving on. If a step fails, help them debug — common failure modes are listed at the bottom. Do **not** skip ahead. Do **not** combine phases. Confirm at the end of each phase before continuing.

---

## Project context (read first)

**TechBirds** is a monorepo with four apps and three shared packages:

```
apps/
  www/    Marketing site            Vite + React + TS    (port 5173)
  blog/   Public journal            Vite + React + TS    (port 5174)
  app/    Employee portal (OTP)     Vite + React + TS    (port 5175)
  api/    Backend                   FastAPI + SQLAlchemy + Celery (port 8000 in prod)
packages/
  ui-kit/   Design tokens + primitives
  content/  Static copy
  sdk/      Typed API client
```

Repo layout the deploy targets on the server:
- `/srv/techbirds/api/` — checked-out repo, Python venv, `.env` lives here
- `/var/www/techbirds/{www,blog,app}/dist/` — built static frontends served by Nginx
- `/var/backups/techbirds/` — local pg_dump landing zone before R2 upload

Hosts:
- `techbirdsgroup.com` → marketing site
- `blog.techbirdsgroup.com` → blog
- `app.techbirdsgroup.com` → employee portal
- `api.techbirdsgroup.com` → FastAPI

Stack on KVM1: Ubuntu 22.04 LTS, Postgres 16, Redis 7, Nginx, Python 3.12, Node 20, gunicorn (uvicorn worker), Celery worker + beat, systemd, Let's Encrypt.

Storage: Cloudflare R2 (S3-compatible) for blog assets, feed attachments, employee documents, payslip PDFs, and Postgres backups.

Email: SendGrid SMTP.

---

## Pre-flight — confirm with the user before starting

Ask the user to confirm each item. Block on any "no":

1. **KVM1 server** is provisioned, Ubuntu 22.04, root or sudo access available, IP address known.
2. **DNS** for `techbirdsgroup.com` is at Cloudflare and they can edit records.
3. **Cloudflare R2** account exists; they can create buckets + access keys.
4. **SendGrid** account exists with a verified sender for `techbirdsgroup.com` and an API key in hand.
5. **Repo** is on GitHub at a URL they can `git clone` (HTTPS is fine for the first deploy; SSH key for CI later).
6. **Domain ownership** — they can prove ownership for Let's Encrypt (DNS or HTTP challenge).

If any are missing, stop and tell the user what to provision before continuing.

---

## Phase 1 — Server bootstrap (one-time)

**Goal:** Fresh Ubuntu box with all OS-level deps, a non-root user, firewall, and fail2ban.

```bash
# As root over SSH
apt update && apt -y upgrade
apt install -y \
  postgresql-16 postgresql-client-16 \
  redis-server \
  nginx \
  python3.12 python3.12-venv python3-pip \
  build-essential libpq-dev \
  libpango-1.0-0 libpangoft2-1.0-0 libcairo2 \
  awscli \
  ufw fail2ban \
  curl git unzip
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

adduser --disabled-password --gecos "" techbirds
usermod -aG sudo techbirds
mkdir -p /home/techbirds/.ssh
cp /root/.ssh/authorized_keys /home/techbirds/.ssh/
chown -R techbirds:techbirds /home/techbirds/.ssh
chmod 700 /home/techbirds/.ssh
chmod 600 /home/techbirds/.ssh/authorized_keys

ufw allow OpenSSH
ufw allow http
ufw allow https
ufw --force enable

systemctl enable --now fail2ban
```

**Verification — paste output of:**
```bash
node --version && python3.12 --version && nginx -v && psql --version && redis-cli --version && ufw status
```
Expect: Node v20.x, Python 3.12.x, nginx version, psql 16.x, redis-cli 7.x, UFW active with 22/80/443.

---

## Phase 2 — Postgres + Redis

**Goal:** A `techbirds` database + role, both accepting connections only on localhost.

```bash
# As root
sudo -u postgres psql <<'SQL'
CREATE ROLE techbirds WITH LOGIN PASSWORD 'REPLACE_WITH_STRONG_PASSWORD';
CREATE DATABASE techbirds OWNER techbirds;
GRANT ALL PRIVILEGES ON DATABASE techbirds TO techbirds;
SQL

# Confirm pg_hba.conf only allows local + ::1
grep -E '^(host|local)' /etc/postgresql/16/main/pg_hba.conf | grep -v '^#'

# Redis is bound to 127.0.0.1 by default on Ubuntu — confirm
grep '^bind' /etc/redis/redis.conf

systemctl enable --now postgresql redis-server
```

**Tell the user:** "Pick a strong password and **save it** — you'll paste it into the API .env file in Phase 4."

**Verification:**
```bash
sudo -u postgres psql -c "\l techbirds" && redis-cli ping
```
Expect: `techbirds` database listed, `PONG` from Redis.

---

## Phase 3 — Cloudflare R2 setup (browser, not server)

**Goal:** 5 buckets and one access key with read/write to all of them.

In the Cloudflare dashboard → R2:

1. Create 5 buckets:
   - `techbirds-public`
   - `techbirds-blog`
   - `techbirds-feed`
   - `techbirds-files`
   - `techbirds-backups`
2. Create an API token with **Object Read & Write** scoped to those buckets.
3. Save: `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`.
4. (Optional but recommended) On `techbirds-backups`, add a lifecycle rule to delete objects after 30 days.

**Verification:** Ask the user to paste the bucket list (just names — never the keys) so you can confirm all 5 are present.

---

## Phase 4 — Repo, venv, .env

**Goal:** Code on disk under the `techbirds` user, Python deps installed, environment configured.

```bash
# As techbirds (sudo -iu techbirds)
sudo mkdir -p /srv/techbirds && sudo chown techbirds:techbirds /srv/techbirds
cd /srv/techbirds
git clone https://github.com/<USER>/<REPO>.git api-src
mv api-src/apps/api/* api-src/apps/api/.* api/ 2>/dev/null || true
# (Simpler: keep the whole repo and reference apps/api as the WorkingDirectory)
git clone https://github.com/<USER>/<REPO>.git repo
ln -s /srv/techbirds/repo/apps/api /srv/techbirds/api  # symlink for systemd
cd /srv/techbirds/repo/apps/api
python3.12 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -e ".[prod]"
mkdir -p var

# Drop the env file
cp .env.production.example .env
chmod 600 .env
nano .env   # fill in real values — see notes below
```

**Help the user fill in `.env`** — point out the critical fields:
- `SECRET_KEY` — generate with `python3 -c 'import secrets; print(secrets.token_urlsafe(64))'`
- `DATABASE_URL` and `DATABASE_URL_SYNC` — paste the Postgres password from Phase 2
- `SMTP_PASSWORD` — the SendGrid API key
- All five `R2_*` values from Phase 3
- `SUPER_ADMIN_EMAIL` — should match a real mailbox they control

**Verification:**
```bash
source .venv/bin/activate
python -c "from app.config import get_settings; s = get_settings(); print('OK', s.ENVIRONMENT, s.COOKIE_DOMAIN)"
```
Expect: `OK production .techbirdsgroup.com`. Any traceback means the .env is malformed.

---

## Phase 5 — Database migrations + seeds

```bash
# As techbirds, in /srv/techbirds/repo/apps/api with venv activated
alembic upgrade head
python scripts/seed_admin.py
python scripts/seed_leave.py
python scripts/seed_holidays.py
python scripts/seed_payroll.py   # optional — sample salary structure
python scripts/seed_blog.py      # optional — placeholder blog posts
```

**Verification:**
```bash
psql "$DATABASE_URL_SYNC" -c "\dt"
```
Expect: ~20 tables including `users`, `roles`, `blog_posts`, `payslips`, `employee_documents`.

---

## Phase 6 — systemd units

**Goal:** API, Celery worker, beat, and the backup timer all run under systemd.

```bash
# As root
cp /srv/techbirds/repo/infra/systemd/techbirds-api.service     /etc/systemd/system/
cp /srv/techbirds/repo/infra/systemd/techbirds-worker.service  /etc/systemd/system/
cp /srv/techbirds/repo/infra/systemd/techbirds-beat.service    /etc/systemd/system/
cp /srv/techbirds/repo/infra/systemd/techbirds-backup.service  /etc/systemd/system/
cp /srv/techbirds/repo/infra/systemd/techbirds-backup.timer    /etc/systemd/system/

# Backup script needs a writable landing zone
mkdir -p /var/backups/techbirds
chown techbirds:techbirds /var/backups/techbirds

systemctl daemon-reload
systemctl enable --now techbirds-api techbirds-worker techbirds-beat techbirds-backup.timer
```

**Verification:**
```bash
systemctl status techbirds-api --no-pager | head -20
curl -sS http://127.0.0.1:8000/health
journalctl -u techbirds-api -n 30 --no-pager
```
Expect: service `active (running)`, `/health` returns `{"status":"ok",...}`, no stack traces in the log.

---

## Phase 7 — DNS cutover

In Cloudflare DNS:

| Type | Name  | Value           | Proxy   |
|------|-------|-----------------|---------|
| A    | @     | <SERVER_IP>     | Proxied |
| CNAME| www   | techbirdsgroup.com | Proxied |
| A    | blog  | <SERVER_IP>     | Proxied |
| A    | app   | <SERVER_IP>     | Proxied |
| A    | api   | <SERVER_IP>     | **DNS only** (so certbot HTTP-01 works) |

SSL/TLS mode: **Full (strict)** — but only after Phase 8 installs origin certs.

**Verification:**
```bash
for h in techbirdsgroup.com blog.techbirdsgroup.com app.techbirdsgroup.com api.techbirdsgroup.com; do
  echo "$h -> $(dig +short $h | head -1)"
done
```
Expect: each hostname resolves to the server IP.

---

## Phase 8 — Nginx + TLS

```bash
# As root
cp /srv/techbirds/repo/infra/nginx/techbirdsgroup.com.conf       /etc/nginx/sites-available/
cp /srv/techbirds/repo/infra/nginx/blog.techbirdsgroup.com.conf  /etc/nginx/sites-available/
cp /srv/techbirds/repo/infra/nginx/app.techbirdsgroup.com.conf   /etc/nginx/sites-available/
cp /srv/techbirds/repo/infra/nginx/api.techbirdsgroup.com.conf   /etc/nginx/sites-available/
for f in techbirdsgroup.com blog.techbirdsgroup.com app.techbirdsgroup.com api.techbirdsgroup.com; do
  ln -sf /etc/nginx/sites-available/$f.conf /etc/nginx/sites-enabled/
done
rm -f /etc/nginx/sites-enabled/default

# Get certs (one cert covering all hosts)
apt install -y certbot python3-certbot-nginx
certbot --nginx --non-interactive --agree-tos -m admin@techbirdsgroup.com \
  -d techbirdsgroup.com -d www.techbirdsgroup.com \
  -d blog.techbirdsgroup.com -d app.techbirdsgroup.com -d api.techbirdsgroup.com

nginx -t && systemctl reload nginx
```

**Verification:**
```bash
for h in techbirdsgroup.com blog.techbirdsgroup.com app.techbirdsgroup.com api.techbirdsgroup.com; do
  echo "=== $h ==="
  curl -sI https://$h/health 2>/dev/null | head -1 || curl -sI https://$h | head -1
done
```
Expect: HTTP/2 200 (or a 200/3xx for non-API hosts since they're SPAs without /health).

---

## Phase 9 — Build + ship the frontends

Three options. Pick one:

**Option A — Build on the server (simplest):**
```bash
# As techbirds in /srv/techbirds/repo
npm ci
npm run build
sudo mkdir -p /var/www/techbirds/{www,blog,app}
sudo rsync -a --delete apps/www/dist/  /var/www/techbirds/www/dist/
sudo rsync -a --delete apps/blog/dist/ /var/www/techbirds/blog/dist/
sudo rsync -a --delete apps/app/dist/  /var/www/techbirds/app/dist/
sudo chown -R www-data:www-data /var/www/techbirds
```

**Option B — Use the GitHub Actions deploy job** (recommended for repeat deploys):
1. In repo Settings → Secrets, add `KVM1_HOST` (server IP/hostname) and `KVM1_SSH_KEY` (a private key whose public half is in `/home/techbirds/.ssh/authorized_keys`).
2. Push to `main`. The workflow at `.github/workflows/ci.yml` runs lint + tests, builds frontends, and rsyncs to the server, then restarts services.

**Verification (browser):**
- https://techbirdsgroup.com loads the marketing site
- https://blog.techbirdsgroup.com loads the journal
- https://app.techbirdsgroup.com loads the OTP login screen
- https://api.techbirdsgroup.com/health returns JSON

---

## Phase 10 — Smoke tests

Walk the user through each one. Don't skip — these are the things that fail in subtle ways.

1. Submit the contact form on `techbirdsgroup.com/contact`. Confirm an email arrives at the configured admin inbox.
2. Visit `app.techbirdsgroup.com`, request an OTP for the super-admin email, confirm the email arrives, paste the code, confirm login.
3. Once logged in, hit "Punch in" then "Punch out", confirm the day total updates.
4. As admin, apply for a leave, switch to the approver view, approve it. Confirm the employee gets an email.
5. As admin, upload a sample PDF document for the test employee. Log in as the employee and confirm the download link works (5-minute signed URL).
6. As admin, create a payroll run for the previous month, compute, release, then download the payslip PDF.
7. `https://blog.techbirdsgroup.com/sitemap.xml` returns a valid XML sitemap.

---

## Phase 11 — Backups + monitoring

```bash
# Manually fire the backup once to confirm credentials + R2 work
systemctl start techbirds-backup.service
journalctl -u techbirds-backup.service -n 50 --no-pager
```
Expect: `[backup_db] uploading → s3://techbirds-backups/postgres/...`. Check the bucket in the Cloudflare UI to see the file.

```bash
# Confirm the timer is scheduled
systemctl list-timers techbirds-backup.timer
```

Other monitoring to set up (browser):
- **Sentry** — paste the DSN into `.env` (`SENTRY_DSN=`), restart the API, then trigger a test error.
- **UptimeRobot / BetterStack** — add a 5-minute check on `https://api.techbirdsgroup.com/health`.

---

## Common failure modes

| Symptom | Likely cause | Fix |
|---|---|---|
| `systemctl status techbirds-api` shows `code=exited, status=3/NOTIMPLEMENTED` | `gunicorn` missing from venv | Re-run `pip install -e ".[prod]"` inside the venv. |
| API logs say `connection refused` to Postgres | Wrong password or `pg_hba.conf` rejects | Check `DATABASE_URL` in `.env` and `pg_hba.conf` allows `local` md5 for techbirds. |
| Certbot fails with "DNS problem" on `api.techbirdsgroup.com` | Cloudflare proxy is on for that record | Set `api` record to **DNS only** (grey cloud), retry. Re-enable proxy only if using a Cloudflare Origin Cert instead. |
| Browser shows `ERR_CERT_AUTHORITY_INVALID` on www but other hosts work | Forgot to include `www.techbirdsgroup.com` in the certbot `-d` list | Re-run certbot with the full `-d` list and `--expand`. |
| `502 Bad Gateway` from Nginx on api host | API not running on 127.0.0.1:8000 | `systemctl status techbirds-api`; check journalctl for traceback. |
| Frontend loads but every API call fails with CORS | `CORS_ORIGINS` in `.env` doesn't include the actual origin | Update `.env`, restart `techbirds-api`. |
| Email doesn't arrive | SPF/DKIM/DMARC not set or SendGrid sender unverified | Check SendGrid activity log; add records per their docs. |
| Payslip PDF download returns 404 | R2 key missing — payroll run was never released | In the admin UI, hit "Release" on the payroll run before downloading. |
| Backups timer never fires | Timer not enabled | `systemctl enable --now techbirds-backup.timer` |

---

## After you finish

Tell the user:
- **Don't skip the backup smoke test.** A backup pipeline you've never proved is a backup pipeline that doesn't work.
- **Restore drill.** Within the first month, take one backup file, restore it to a scratch DB on a separate VM, and confirm the data is intact. Schedule this quarterly.
- **CI deploys** are now hands-off — push to `main` and the workflow rsyncs the new frontends and restarts the API. The first deploy is manual; every one after that is `git push`.

Done. Mark the deployment complete in the user's tracker / share the URLs with stakeholders.
