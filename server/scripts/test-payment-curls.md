# Payment Testing - Manual cURL Commands

## Prerequisites

1. **Strapi running**: `cd server && npm run dev`
2. **Hatchet running**: `docker compose -f docker-compose.dev.yml up -d hatchet`
3. **PostgreSQL running**: `docker compose -f docker-compose.dev.yml up -d postgres`

---

## Step 1: Check Services

### Check Strapi
```bash
curl http://localhost:1337/_health
```

### Check Hatchet
```bash
curl http://localhost:8080/health
```

---

## Step 2: Get Recurring Projects

### List all recurring projects
```bash
curl -s "http://localhost:1337/api/projects?filters[donationType][\$eq]=recurring&populate=*" | jq '.'
```

### Get only project IDs and names
```bash
curl -s "http://localhost:1337/api/projects?filters[donationType][\$eq]=recurring" | jq -r '.data[] | "\(.documentId) - \(.attributes.name)"'
```

---

## Step 3: Get Project-Payments

### List all project-payments for a specific project
```bash
# Replace PROJECT_DOC_ID with actual documentId from step 2
curl -s "http://localhost:1337/api/project-payments?filters[project][documentId][\$eq]=PROJECT_DOC_ID&populate=*" | jq '.'
```

### Get all project-payments (any project)
```bash
curl -s "http://localhost:1337/api/project-payments?populate=*" | jq '.'
```

### Get project-payment IDs and amounts
```bash
curl -s "http://localhost:1337/api/project-payments?populate=*" | jq -r '.data[] | "\(.documentId) - Amount: \(.attributes.amount) \(.attributes.currency)"'
```

---

## Step 4: Test Recurring Payments

### Option A: Process ONE specific project-payment
```bash
# Replace PAYMENT_DOC_ID with actual project-payment documentId from step 3
curl -X POST http://localhost:1337/api/payment/do-recurring-payment \
  -H 'Content-Type: application/json' \
  -d '{
    "projectPaymentId": "PAYMENT_DOC_ID"
  }' | jq '.'
```

### Option B: Trigger ALL payments for ONE project
```bash
# Replace PROJECT_DOC_ID with actual project documentId from step 2
curl -X POST http://localhost:1337/api/payment/trigger-all-payments \
  -H 'Content-Type: application/json' \
  -d '{
    "projectDocumentId": "PROJECT_DOC_ID"
  }' | jq '.'
```

### Option C: Trigger ALL payments for ALL recurring projects
```bash
curl -X POST http://localhost:1337/api/payment/trigger-all-payments \
  -H 'Content-Type: application/json' \
  -d '{}' | jq '.'
```

---

## Step 5: Check Results

### View payment logs
```bash
curl -s "http://localhost:1337/api/payment-logs?sort=createdAt:desc&pagination[limit]=10&populate=*" | jq '.'
```

### View payment logs (formatted)
```bash
curl -s "http://localhost:1337/api/payment-logs?sort=createdAt:desc&pagination[limit]=10" | jq -r '.data[] | "[\(.attributes.createdAt)] \(if .attributes.success then "✓" else "✗" end) \(.attributes.amount) \(.attributes.currency)"'
```

### View payment logs for specific project-payment
```bash
# Replace PAYMENT_DOC_ID with actual project-payment documentId
curl -s "http://localhost:1337/api/payment-logs?filters[project_payment][documentId][\$eq]=PAYMENT_DOC_ID&sort=createdAt:desc" | jq '.'
```

---

## Step 6: Monitor Hatchet

### View Hatchet UI
```
http://localhost:8888
Login: admin@example.com / Admin123!!
```

### Check Hatchet Docker logs
```bash
docker compose -f docker-compose.dev.yml logs -f hatchet
```

### Check Strapi logs
```bash
# If running in terminal, just look at the console
# Or check the logs if running in Docker
```

---

## Creating Test Payment (If No Project-Payments Exist)

### Step 1: Initialize Payment
```bash
# Replace PROJECT_DOC_ID with actual project documentId
curl -X POST http://localhost:1337/api/payment/init-payment \
  -H 'Content-Type: application/json' \
  -d '{
    "amount": 5000,
    "projectDocumentId": "PROJECT_DOC_ID",
    "email": "test@example.com",
    "currencyCode": "051",
    "lang": "am"
  }' | jq '.'
```

**Response will contain:**
```json
{
  "url": "https://servicestest.ameriabank.am/VPOS/Payments/Pay?id=PaymentID123&lang=am"
}
```

### Step 2: Complete Payment
1. Open the URL from response in browser
2. Use Ameriabank test card:
   - **Card Number**: `5100170000000000`
   - **Expiry**: Any future date (e.g., `12/26`)
   - **CVV**: `123`
3. Complete payment on test server

### Step 3: Get Payment Details
```bash
# Replace PAYMENT_ID with the PaymentID from the URL
# Replace PROJECT_DOC_ID with your project documentId
curl -X POST http://localhost:1337/api/payment/get-payment-details \
  -H 'Content-Type: application/json' \
  -d '{
    "paymentId": "PAYMENT_ID",
    "projectDocumentId": "PROJECT_DOC_ID"
  }' | jq '.'
```

---

## Quick Test Workflow Example

```bash
# 1. Get first recurring project
PROJECT_DOC_ID=$(curl -s "http://localhost:1337/api/projects?filters[donationType][\$eq]=recurring" | jq -r '.data[0].documentId')
echo "Project ID: $PROJECT_DOC_ID"

# 2. Get first project-payment for that project
PAYMENT_DOC_ID=$(curl -s "http://localhost:1337/api/project-payments?filters[project][documentId][\$eq]=$PROJECT_DOC_ID" | jq -r '.data[0].documentId')
echo "Payment ID: $PAYMENT_DOC_ID"

# 3. Process that payment
curl -X POST http://localhost:1337/api/payment/do-recurring-payment \
  -H 'Content-Type: application/json' \
  -d "{\"projectPaymentId\": \"$PAYMENT_DOC_ID\"}" | jq '.'

# 4. Check the logs
curl -s "http://localhost:1337/api/payment-logs?sort=createdAt:desc&pagination[limit]=5" | jq -r '.data[] | "[\(.attributes.createdAt)] \(if .attributes.success then "✓" else "✗" end) \(.attributes.amount) \(.attributes.currency)"'
```

---

## Expected Responses

### Successful Payment Processing
```json
{
  "message": "Payment was successfully processed"
}
```

### Already Processed This Month
```json
{
  "message": "The payment was already processed this month"
}
```

### Payment In Progress
```json
{
  "errorMessage": "Project Payment with projectPaymentId xxx is in progress"
}
```

### Invalid Project Type
```json
{
  "errorMessage": "Project donation type is not recurring"
}
```

---

## Troubleshooting

### No projects found
Create a project in Strapi admin with `donationType: "recurring"`

### No project-payments found
Create an initial payment using the "Creating Test Payment" section above

### Hatchet not processing
1. Check Hatchet is running: `docker compose -f docker-compose.dev.yml ps hatchet`
2. Check HATCHET_CLIENT_TOKEN is set in `server/.env`
3. Check Hatchet logs: `docker compose -f docker-compose.dev.yml logs hatchet`

### Ameriabank errors
- Using test server: `https://servicestest.ameriabank.am`
- Credentials in `.env` should be for test environment
- Test card: `5100170000000000`
