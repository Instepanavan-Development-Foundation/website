# Instepanavan Website

Donation website for Instepanavan Development Foundation.

**Stack:** Next.js 15 + Strapi 5 + PostgreSQL 17 + Hatchet + Ameriabank

## Local Development

```bash
# Start PostgreSQL 17 + Hatchet
docker compose -f docker-compose.dev.yml up -d

# Generate Hatchet token for local development
# 1. Go to http://localhost:8888
# 2. Login: admin@example.com / Admin123!!
# 3. Navigate to Settings → API Tokens
# 4. Create new API token
# 5. Add HATCHET_CLIENT_TOKEN to server/.env

# Run backend
cd server && npm install && npm run dev

# Run frontend
cd client && npm install && npm run dev
```

### Hatchet & Recurring Payments

**Status:** ✅ Hatchet worker connection working!

**Configuration:**
- Hatchet SDK v1.10.5
- `SERVER_GRPC_INSECURE: "t"` enabled in docker-compose.dev.yml
- `SERVER_GRPC_BROADCAST_ADDRESS: localhost:7077`
- Token generated with correct gRPC settings

**Testing the queue:**
```bash
# Trigger all recurring payments via Hatchet queue (requires ADMIN_API_KEY)
curl -X POST http://localhost:1337/api/payment/trigger-all-payments \
  -H 'Content-Type: application/json' \
  -H 'x-admin-api-key: YOUR_ADMIN_API_KEY' \
  -d '{}'
```

**Or process individual payment directly:**
```bash
# Process single recurring payment (requires ADMIN_API_KEY)
curl -X POST http://localhost:1337/api/payment/do-recurring-payment \
  -H 'Content-Type: application/json' \
  -H 'x-admin-api-key: YOUR_ADMIN_API_KEY' \
  -d '{"projectPaymentId": "PAYMENT_ID"}'
```

**Note:** Get `ADMIN_API_KEY` from `server/.env`. These endpoints are secured with API key authentication for admin/internal use only.

**View workflow runs:**
- Hatchet UI: http://localhost:8888
- Login: admin@example.com / Admin123!!

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

Connect via WireGuard to access internal services (Hatchet UI, databases, APIs).

```bash
# Get VPN config after deployment
ssh instepanavan "cd ./website && docker compose -f docker-compose.prod.yml logs wireguard"
```

**Services accessible:** `hatchet:8080` • `postgres:5432` • `hatchet_postgres:5432` • `server:1337`

---

See [CLAUDE.md.template](CLAUDE.md.template) for detailed documentation.