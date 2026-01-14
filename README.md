# Instepanavan Website

Donation website for Instepanavan Development Foundation.

**Stack:** Next.js 15 + Strapi 5 + PostgreSQL 17 + Hatchet + Ameriabank

## Local Development

```bash
# Start PostgreSQL + Hatchet
docker compose -f docker-compose.dev.yml up

# Get Hatchet token at http://localhost:8080 (admin@example.com / Admin123!!)
# Add HATCHET_CLIENT_TOKEN to server/.env

# Run backend
cd server && npm install && npm run dev

# Run frontend
cd client && npm install && npm run dev
```

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