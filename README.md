# Instepanavan Website

Donation website for Instepanavan Development Foundation.

**Stack:** Next.js 15 + Strapi 5 + PostgreSQL 17 + Ameriabank

## External Integrations

| Service | Purpose |
|---|---|
| **Ameriabank** | Payment gateway for one-time and recurring donations |
| **Telegram** | Bot for content management and publishing notifications |
| **Facebook** | Social sharing and page links |
| **LinkedIn** | Social sharing and profile links |

## Local Development

```bash
# Start PostgreSQL 17
docker compose -f docker-compose.dev.yml up -d

# Run backend
cd server && npm install && npm run dev

# Run frontend
cd client && npm install && npm run dev
```

### Recurring Payments

Recurring donations are charged by Strapi's built-in cron (`server/config/cron-tasks.ts`)
at 00:00 UTC (04:00 Armenia) on the 4th, 14th and 24th of each month. The task processes
due project-payments sequentially in-process via `/api/payment/do-recurring-payment`,
using an admin token it mints for `RECURRING_PAYMENTS_ADMIN_USER_ID` (set in `server/.env`).

**Trigger manually:**
```bash
# Process all recurring payments now (requires an admin bearer token).
# Optionally pass {"projectDocumentId": "..."} to limit it to one project.
curl -X POST http://localhost:1337/api/payment/trigger-all-payments \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -d '{}'
```

**Or process individual payment directly:**
```bash
# Process single recurring payment (requires an admin bearer token)
curl -X POST http://localhost:1337/api/payment/do-recurring-payment \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer YOUR_ADMIN_TOKEN' \
  -d '{"projectPaymentId": "PAYMENT_ID"}'
```

**Note:** These endpoints require a real Strapi admin session token, not a static
API key — log into `/admin`, grab your session's bearer token from a Network tab
request, and use that as `YOUR_ADMIN_TOKEN`. The recurring-payments cron mints its
own token the same way for a dedicated admin account (`RECURRING_PAYMENTS_ADMIN_USER_ID`
in `server/.env`). See the `trigger-recurring-payment` Claude skill for the full steps.

See [PAYMENT.md](server/src/api/payment/PAYMENT.md) for full payment system documentation.

### Restore Production Data Locally

```bash
# Backup production database (PostgreSQL 15) and download
./scripts/backup-prod-db.sh

# Restore to local PostgreSQL 17 (tests migration)
./scripts/restore-backup.sh
```

**Note:** Production currently runs PostgreSQL 15. Local dev uses PostgreSQL 17. The restore script automatically migrates data during import.

## Deploy

```bash
make deploy          # Pull, build, and deploy
make deploy-prod     # SSH to server and deploy
```

First deployment takes ~10 minutes.

## VPN Access (Superadmin)

Connect via WireGuard to access internal services (databases, APIs).

```bash
# Get VPN config after deployment
ssh instepanavan "cd ./website && docker compose -f docker-compose.prod.yml logs wireguard"
```

**Services accessible:** `postgres:5432` • `server:1337`

---

