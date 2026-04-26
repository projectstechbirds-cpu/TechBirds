# TechBirds — Launch Checklist

Server: single VPS (4 vCPU / 8 GB recommended). User: `techbirds`. Layout under `/srv/techbirds/` and `/var/www/techbirds/`.

## 1. DNS (Cloudflare)
- [ ] `techbirdsgroup.com` A → server IP (proxied)
- [ ] `www.techbirdsgroup.com` CNAME → `techbirdsgroup.com`
- [ ] `blog.techbirdsgroup.com` A → server IP (proxied)
- [ ] `app.techbirdsgroup.com` A → server IP (proxied)
- [ ] `api.techbirdsgroup.com` A → server IP (DNS only — Let's Encrypt HTTP-01 needs unproxied, OR use Cloudflare Origin Cert)
- [ ] MX → SendGrid (or Workspace) — separate from web
- [ ] SPF / DKIM / DMARC TXT records set for SendGrid
- [ ] SSL/TLS mode: Full (strict) once origin certs are installed

## 2. Server bootstrap
- [ ] Ubuntu 22.04 LTS, fully updated
- [ ] Non-root sudo user `techbirds` created
- [ ] UFW: allow 22/80/443 only
- [ ] fail2ban installed for sshd
- [ ] Postgres 15, Redis 7, Nginx, Python 3.12+, Node 20, npm installed
- [ ] WeasyPrint system deps: `apt install libpango-1.0-0 libpangoft2-1.0-0`

## 3. Database
- [ ] `CREATE DATABASE techbirds;` + role `techbirds` with strong password
- [ ] `pg_hba.conf` restricts to localhost
- [ ] Daily `pg_dump` cron → R2 backups bucket (retention 30 days)
- [ ] Run `alembic upgrade head`
- [ ] Seed: `python scripts/seed_roles.py && python scripts/seed_leave.py && python scripts/seed_holidays.py`

## 4. Cloudflare R2
- [ ] Buckets created: public, blog, feed, files, backups
- [ ] Access key + secret created with read/write to those buckets
- [ ] CORS rules applied where needed (public + blog, for direct browser fetches)

## 5. App deployment
- [ ] `/srv/techbirds/api/` — git checkout, `python -m venv .venv`, `pip install -e .[prod]`, `mkdir var`
- [ ] `.env` populated from `.env.production.example` (chmod 600, owned by techbirds)
- [ ] `npm ci && npm run build` — produces `dist/` for www, blog, app
- [ ] `rsync` each `apps/*/dist` to `/var/www/techbirds/<name>/dist`
- [ ] `chown -R www-data:www-data /var/www/techbirds`

## 6. systemd
- [ ] Copy `infra/systemd/*.service` to `/etc/systemd/system/`
- [ ] `systemctl daemon-reload && systemctl enable --now techbirds-api techbirds-worker techbirds-beat`
- [ ] `journalctl -u techbirds-api -f` shows clean startup

## 7. Nginx + TLS
- [ ] Copy `infra/nginx/*.conf` to `/etc/nginx/sites-available/`, symlink into `sites-enabled/`
- [ ] `certbot --nginx -d techbirdsgroup.com -d www.techbirdsgroup.com -d blog.techbirdsgroup.com -d app.techbirdsgroup.com -d api.techbirdsgroup.com`
- [ ] `nginx -t && systemctl reload nginx`
- [ ] Verify SSL Labs score ≥ A on each host
- [ ] Verify HSTS, CSP, X-Frame-Options headers via `curl -sI`

## 8. Smoke tests
- [ ] `https://techbirdsgroup.com/` loads, sitemap.xml + robots.txt resolve
- [ ] `https://blog.techbirdsgroup.com/sitemap.xml` returns dynamic XML from API
- [ ] `https://api.techbirdsgroup.com/health` → 200
- [ ] Enquiry form on / submits, admin receives email
- [ ] OTP login on app.techbirdsgroup.com works end-to-end (request → email → verify)
- [ ] Apply leave, approve as admin, employee notified
- [ ] Upload sample document as HR, employee sees download link
- [ ] Generate sample payroll run, release, employee downloads payslip PDF

## 9. Observability
- [ ] Sentry DSN set; trigger a test error, confirm it appears
- [ ] `journalctl` rotation enabled
- [ ] Uptime monitor (UptimeRobot / BetterStack) hitting `/health` every 5 min
- [ ] Cloudflare analytics enabled

## 10. Post-launch
- [ ] Verify backup restore works on a staging box at least once
- [ ] Document on-call + escalation in `runbooks/` (separate)
- [ ] Schedule quarterly review of dependencies (`pip list --outdated`, `npm outdated`)
