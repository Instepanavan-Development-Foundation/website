# Payment System Documentation

## Overview

This document describes the payment system architecture for the Instepanavan donation platform. The system handles both one-time and recurring donations through Ameriabank's payment gateway, with background processing managed by Hatchet.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Payment Registration Flow](#payment-registration-flow)
- [Recurring Payment Flow](#recurring-payment-flow)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Ameriabank Integration](#ameriabank-integration)
- [Hatchet Integration](#hatchet-integration)
- [Security Considerations](#security-considerations)
- [Environment Variables](#environment-variables)

---

## Architecture Overview

```
┌─────────────┐
│   Frontend  │
│  (Next.js)  │
└──────┬──────┘
       │
       │ HTTP
       ▼
┌─────────────────────────────────────────┐
│         Strapi Backend                  │
│                                         │
│  ┌──────────────────────────────────┐  │
│  │   Payment Controller             │  │
│  │  - init-payment                  │  │
│  │  - get-payment-details           │  │
│  │  - do-recurring-payment          │  │
│  └──────────┬───────────────────────┘  │
│             │                           │
│  ┌──────────▼───────────────────────┐  │
│  │   Payment Services               │  │
│  │  - banking.ts (Ameriabank API)   │  │
│  │  - strapi.ts (Database)          │  │
│  └──────────────────────────────────┘  │
└─────────────┬────────────────────────┬──┘
              │                        │
              │ HTTPS                  │
              ▼                        │
     ┌────────────────┐                │
     │   Ameriabank   │                │
     │  Payment API   │                │
     └────────────────┘                │
                                       │
                                       ▼
                              ┌────────────────┐
                              │  Hatchet Queue │
                              │   (Optional)   │
                              │                │
                              │ - Cron Jobs    │
                              │ - Workers      │
                              │ - Event Queue  │
                              └────────────────┘
```

---

## Payment Registration Flow

### 1. Initiate Payment

**Endpoint:** `POST /api/payment/init-payment`

**Request Body:**
```json
{
  "amount": 5000,
  "projectDocumentId": "abc123",
  "email": "donor@example.com",
  "currencyCode": "051",
  "lang": "am"
}
```

**Process:**
1. Validates required fields: `amount`, `projectDocumentId`, `email`
2. Generates unique `orderId` (random between `MIN_ORDER_ID` and `MAX_ORDER_ID`)
3. Creates payment parameters including unique `CardHolderID`:
   ```
   CardHolderID = `${email}_${projectDocumentId}_${uuid}`
   ```
4. Calls Ameriabank `/InitPayment` API
5. Returns payment URL

**Response:**
```json
{
  "url": "https://services.ameriabank.am/VPOS/Payments/Pay?id=PaymentID123&lang=am"
}
```

**Implementation:** [controllers/payment.ts:6-44](controllers/payment.ts#L6-L44)

---

### 2. User Completes Payment

1. User redirected to Ameriabank payment page
2. User enters card details (Visa/Mastercard)
3. Ameriabank processes payment with `PaymentType: 6` (enables card binding)
4. Ameriabank **saves card binding** using `CardHolderID` for future recurring charges
5. User redirected back to `BackURL` with `PaymentID` parameter

---

### 3. Retrieve Payment Details

**Endpoint:** `POST /api/payment/get-payment-details`

**Request Body:**
```json
{
  "paymentId": "PaymentID123",
  "projectDocumentId": "abc123"
}
```

**Process:**
1. Calls Ameriabank `/GetPaymentDetails` with `PaymentID`
2. Validates `ResponseCode === "00"` (success)
3. Saves payment to database (see [Database Registration](#4-database-registration))

**Response:**
```json
true
```

**Implementation:** [controllers/payment.ts:46-67](controllers/payment.ts#L46-L67)

---

### 4. Database Registration

#### 4a. Create Payment Method
Stores card binding information for future recurring payments.

**Service:** [services/strapi.ts:119-141](services/strapi.ts#L119-L141)

**Data:**
```javascript
{
  type: "ameriabank",
  params: {
    BindingID: "7891011",           // Ameriabank's internal binding ID
    CardNumber: "************1234",  // Masked card number
    CardHolderID: "donor@example.com_abc123_uuid", // Our unique identifier
    ExpDate: "12/26"                 // Card expiration date
  }
}
```

**Schema:** [payment-method/schema.json](../payment-method/content-types/payment-method/schema.json)

---

#### 4b. Create Payment Log
Audit trail for all payment attempts.

**Service:** [services/strapi.ts:142-177](services/strapi.ts#L142-L177)

**Data:**
```javascript
{
  amount: 5000,
  currency: "051",
  orderId: 3831547,
  success: true,
  details: { /* Full Ameriabank response */ }
}
```

**Schema:** [payment-log/schema.json](../payment-log/content-types/payment-log/schema.json)

---

#### 4c. Create Project Payment
Links payment method to project for recurring processing.

**Service:** [services/strapi.ts:71-104](services/strapi.ts#L71-L104)

**Data:**
```javascript
{
  amount: 5000,
  currency: "051",
  type: "recurring",              // ⚠️ Currently hardcoded
  name: "Donation for project abc123",
  payment_method: paymentMethod.documentId,
  payment_logs: [paymentLog.documentId],
  project: "abc123",
  isPaymentInProgress: false
}
```

**Schema:** [project-payment/schema.json](../project-payment/content-types/project-payment/schema.json)

---

#### 4d. Update Project Totals
Increments gathered amount and checks if goal is reached.

**Service:** [services/strapi.ts:61-69](services/strapi.ts#L61-L69)

**Updates:**
```javascript
{
  gatheredAmount: currentProject.gatheredAmount + 5000,
  isArchived: (gatheredAmount + 5000) >= requiredAmount
}
```

---

## Recurring Payment Flow

### 1. System Initialization

**On Strapi Bootstrap:** [../../index.ts:21-23](../../index.ts#L21-L23)
```javascript
bootstrap({ strapi }) {
  initQueue(strapi); // Starts Hatchet worker
}
```

**Worker Initialization:** [../../../queue/worker.ts](../../../queue/worker.ts)
- Checks if `HATCHET_CLIENT_TOKEN` exists
- If missing: logs warning, gracefully degrades
- If present: starts recurring payment system

---

### 2. Hatchet Client Setup

**Client Initialization:** [../../../queue/hatchet-client.ts](../../../queue/hatchet-client.ts)
```javascript
export const hatchet = process.env.HATCHET_CLIENT_TOKEN
  ? HatchetClient.init({
      log_level: 'INFO',
      host_port: process.env.HATCHET_CLIENT_HOST_PORT,
    })
  : null;
```

**Graceful Degradation:**
- System continues to work for one-time payments if Hatchet is not configured
- Recurring payments simply won't be processed automatically

---

### 3. Cron Job Configuration

**Schedule:** [../../../queue/workflow.ts:121](../../../queue/workflow.ts#L121)
```javascript
const cronSchedule = "* * * * *"; // ⚠️ Currently every minute (should be monthly)
```

**Registration:** [../../../queue/workflow.ts:148-152](../../../queue/workflow.ts#L148-L152)
```javascript
await recurringPaymentsTask.cron(
  `monthly-payments ${cronSchedule}`,
  cronSchedule,
  {}
);
```

**Worker Start:** [../../../queue/workflow.ts:123-125](../../../queue/workflow.ts#L123-L125)
```javascript
const worker = await hatchet.worker("recurring-payments-worker", {
  workflows: [recurringPaymentsTask, upper]
});
await worker.start();
```

---

### 4. Monthly Processing Task

**Task:** [../../../queue/workflow.ts:53-108](../../../queue/workflow.ts#L53-L108)

**Process:**

#### Step 1: Query Recurring Projects
```javascript
const projects = await strapi.documents("api::project.project").findMany({
  filters: {
    donationType: "recurring"
  },
  populate: {
    project_payments: {
      fields: ["id", "amount"]
    }
  }
});
```

#### Step 2: Queue Individual Payments
```javascript
for (const project of projects) {
  for (const projectPayment of project.project_payments) {
    await hatchet.events.push("project-payment:create", {
      amount: projectPayment.amount,
      documentId: projectPayment.documentId,
      email: "TODO: dummy EMAIL ADD LATER" // ❌ Missing user email
    });
  }
}
```

---

### 5. Individual Payment Processing

**Workflow:** [../../../queue/workflow.ts:21-50](../../../queue/workflow.ts#L21-L50)

**Event:** `"project-payment:create"`

**Task Execution:**
```javascript
upper?.task({
  name: "upper",
  fn: async (input, ctx) => {
    const { documentId } = input;

    // Call internal API endpoint
    const response = await axiosClient.post(
      `/api/payment/do-recurring-payment`,
      { projectPaymentId: documentId }
    );

    return { message: response.data.message };
  }
});
```

---

### 6. Recurring Payment Execution

**Endpoint:** `POST /api/payment/do-recurring-payment`

**⚠️ Security Warning:** No authentication currently implemented

**Request Body:**
```json
{
  "projectPaymentId": "payment123"
}
```

**Process:** [controllers/payment.ts:69-146](controllers/payment.ts#L69-L146)

#### Step 1: Fetch Project Payment with Binding
```javascript
const projectPayment = await strapi.documents("api::project-payment.project-payment").findOne({
  documentId: "payment123",
  populate: {
    payment_method: { fields: ["params"] },
    project: { fields: ["donationType"] }
  }
});
```

#### Step 2: Validate Project Type
```javascript
if (projectPayment.project.donationType !== "recurring") {
  throw new Error("Project donation type is not recurring");
}
```

#### Step 3: Check for Duplicate Payment
Prevents charging the same payment multiple times in the same month.

```javascript
const thisMonthLog = await getProjectPaymentLogForThisMonth(projectPaymentId);
if (thisMonthLog) {
  return { message: "The payment was already processed this month" };
}
```

**Implementation:** [services/strapi.ts:224-252](services/strapi.ts#L224-L252)

#### Step 4: Set Payment Lock
```javascript
if (projectPayment.isPaymentInProgress) {
  throw Error("Payment is in progress");
}
await updateProjectPaymentIsPaymentInProgress(projectPaymentId, true);
```

#### Step 5: Generate New OrderID
```javascript
const orderId = await getOrderId(); // Random between MIN_ORDER_ID and MAX_ORDER_ID
```

#### Step 6: Call Ameriabank Binding Payment
```javascript
const url = `${process.env.PAYMENT_API_BASE_URL}/MakeBindingPayment`;

const params = {
  ClientID: process.env.CLIENT_ID,
  Username: process.env.PAYMENT_USERNAME,
  Password: process.env.PAYMENT_PASSWORD,
  Amount: projectPayment.amount,
  OrderID: orderId,
  Currency: projectPayment.currency,
  CardHolderID: bindingData.CardHolderID, // From saved payment method
  Description: projectPayment.name,
  Timeout: 900,
  PaymentType: 6
};

const response = await axios.post(url, params);
```

**Implementation:** [services/banking.ts:137-152](services/banking.ts#L137-L152)

#### Step 7: Log Transaction
```javascript
await createPaymentLog({
  paymentDetails: response.data,
  projectPaymentId,
  success: true
});
```

#### Step 8: Release Lock
```javascript
await updateProjectPaymentIsPaymentInProgress(projectPaymentId, false);
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────────┐
│      Project        │
│                     │
│  donationType:      │
│   - "recurring"     │
│   - "one time"      │
│  gatheredAmount     │
│  requiredAmount     │
│  isArchived         │
└──────────┬──────────┘
           │ 1:N
           ▼
┌──────────────────────┐
│  Project-Payment     │◄──────────┐
│                      │           │
│  amount              │           │ N:1
│  currency            │           │
│  type:               │       ┌───┴──────────────┐
│   - "recurring"      │       │ Payment-Method   │
│   - "one_time"       │       │                  │
│  name                │       │  type: "ameria..." │
│  isPaymentInProgress │       │  params: {       │
└──────────┬───────────┘       │    BindingID,    │
           │ 1:N               │    CardHolderID, │
           ▼                   │    CardNumber,   │
┌──────────────────────┐       │    ExpDate       │
│   Payment-Log        │       │  }               │
│                      │       └──────────────────┘
│  amount              │
│  currency            │
│  orderId             │
│  success             │
│  details (JSON)      │
│  createdAt           │
└──────────────────────┘
```

### Schema Files

- **Project:** [../project/content-types/project/schema.json](../project/content-types/project/schema.json)
- **Project-Payment:** [../project-payment/content-types/project-payment/schema.json](../project-payment/content-types/project-payment/schema.json)
- **Payment-Method:** [../payment-method/content-types/payment-method/schema.json](../payment-method/content-types/payment-method/schema.json)
- **Payment-Log:** [../payment-log/content-types/payment-log/schema.json](../payment-log/content-types/payment-log/schema.json)

---

## API Endpoints

### Public Endpoints

#### `POST /api/payment/init-payment`
Initialize a new payment.

**Request:**
```json
{
  "amount": 5000,
  "projectDocumentId": "abc123",
  "email": "donor@example.com",
  "currencyCode": "051",
  "lang": "am"
}
```

**Response:**
```json
{
  "url": "https://services.ameriabank.am/VPOS/Payments/Pay?id=PaymentID123&lang=am"
}
```

---

#### `POST /api/payment/get-payment-details`
Retrieve payment details after user completes payment.

**Request:**
```json
{
  "paymentId": "PaymentID123",
  "projectDocumentId": "abc123"
}
```

**Response:**
```json
true
```

---

### Internal Endpoints

#### `POST /api/payment/do-recurring-payment`
⚠️ **Should be admin-only but currently has no authentication**

Process a recurring payment using saved payment method.

**Request:**
```json
{
  "projectPaymentId": "payment123"
}
```

**Response:**
```json
{
  "message": "Payment was successfully processed"
}
```

**Error Responses:**
```json
{
  "message": "The payment was already processed this month"
}
```
```json
{
  "errorMessage": "Project donation type is not recurring"
}
```

---

#### `POST /api/payment/trigger-all-payments`
⚠️ **Should be admin-only but currently has no authentication**

Manually trigger recurring payments for all projects or a specific project.

**Request:**
```json
{
  "projectDocumentId": "abc123" // Optional
}
```

**Response:**
```json
{
  "message": "Processing"
}
```

---

## Ameriabank Integration

### API Base URLs

- **API Endpoint:** `https://services.ameriabank.am/VPOS/api/VPOS`
- **Payment Page:** `https://services.ameriabank.am/VPOS/Payments/Pay`

### Endpoints Used

#### `/InitPayment`
Creates a new payment session.

**Request:**
```json
{
  "ClientID": "merchant_id",
  "Username": "api_username",
  "Password": "api_password",
  "Amount": 5000,
  "OrderID": 3831547,
  "Currency": "051",
  "BackURL": "https://instepanavan.am/payment-success",
  "Description": "Donation for project abc123",
  "Timeout": 900,
  "CardHolderID": "donor@example.com_abc123_uuid",
  "PaymentType": 6
}
```

**Response:**
```json
{
  "PaymentID": "PaymentID123",
  "ResponseCode": "00"
}
```

---

#### `/GetPaymentDetails`
Retrieves payment status and binding information.

**Request:**
```json
{
  "PaymentID": "PaymentID123",
  "Username": "api_username",
  "Password": "api_password"
}
```

**Response:**
```json
{
  "ResponseCode": "00",
  "Amount": 5000,
  "OrderID": 3831547,
  "Currency": "051",
  "BindingID": "7891011",
  "CardNumber": "************1234",
  "CardHolderID": "donor@example.com_abc123_uuid",
  "ExpDate": "12/26",
  "Description": "Donation for project abc123"
}
```

---

#### `/MakeBindingPayment`
Charges a previously saved card.

**Request:**
```json
{
  "ClientID": "merchant_id",
  "Username": "api_username",
  "Password": "api_password",
  "Amount": 5000,
  "OrderID": 3831789,
  "Currency": "051",
  "CardHolderID": "donor@example.com_abc123_uuid",
  "Description": "Recurring donation",
  "Timeout": 900,
  "PaymentType": 6
}
```

**Response:**
```json
{
  "ResponseCode": "00",
  "PaymentID": "PaymentID456"
}
```

### Response Codes

- `00` - Success
- `0101` - Card has expired
- Other codes indicate various error conditions (see [utils/ameriabank-error-parser.ts](utils/ameriabank-error-parser.ts))

### Error Handling for Expired Cards

**Current Behavior:**
When a recurring payment fails due to an expired card:
1. Ameriabank returns error code `0101` ("Card has expired")
2. The error is logged to `payment-log`
3. The payment fails silently - no user notification
4. The system will retry the payment next month (which will fail again)

**Design Decision:**
- ❌ **No automatic retry logic** - Failed recurring payments are not retried with alternative payment methods
- ❌ **No fallback mechanism** - The system does not attempt to use a different saved card
- ✅ **Silent failure** - Recurring donations stop processing when the card expires
- ⏳ **User notification (TODO)** - Email notifications when payment fails are not yet implemented

This approach ensures predictable behavior and prevents unexpected charges. Users are responsible for maintaining valid payment methods.

### Implementation

**Service:** [services/banking.ts](services/banking.ts)

---

## Hatchet Integration

### Components

#### Hatchet Client
**File:** [../../../queue/hatchet-client.ts](../../../queue/hatchet-client.ts)

Conditionally initializes Hatchet client only if `HATCHET_CLIENT_TOKEN` is provided.

---

#### Workflows
**File:** [../../../queue/workflow.ts](../../../queue/workflow.ts)

**Two workflows:**

1. **`recurring-payments-monthly`** - Main cron task
   - Queries all recurring projects
   - Pushes events to queue

2. **`upper`** - Individual payment processor
   - Triggered by `project-payment:create` event
   - Calls internal API to process payment

---

#### Worker
**File:** [../../../queue/worker.ts](../../../queue/worker.ts)

Initializes and starts the Hatchet worker with both workflows.

---

### Rate Limiting

**Configuration:** [../../../queue/workflow.ts:118](../../../queue/workflow.ts#L118)
```javascript
await hatchet.admin.putRateLimit("limit", 10, RateLimitDuration.SECOND);
```

Limits processing to 10 payments per second.

---

### Cron Management

**Deletion of Old Crons:** [../../../queue/workflow.ts:128-146](../../../queue/workflow.ts#L128-L146)

On each initialization, the system deletes all existing cron jobs before creating new ones to prevent duplicates.

---

## Security Considerations

### ❌ Critical Issues

1. **No Authentication on Recurring Payment Endpoints**
   - `/do-recurring-payment` - Anyone can trigger charges
   - `/trigger-all-payments` - Public access to cron trigger
   - **TODO:** Add admin-only authentication ([controllers/payment.ts:68](controllers/payment.ts#L68), [controllers/payment.ts:148](controllers/payment.ts#L148))

2. **Missing User Association**
   - Payment methods not linked to users ([services/strapi.ts:131](services/strapi.ts#L131))
   - No email tracking for recurring payments ([../../../queue/workflow.ts:95](../../../queue/workflow.ts#L95))

3. **Hardcoded Payment Type**
   - All payments marked as "recurring" regardless of actual type ([services/strapi.ts:84](services/strapi.ts#L84))
   - Should respect project's `donationType` field

---

### ⚠️ Potential Issues

1. **Race Condition Risk**
   - `isPaymentInProgress` lock prevents overlapping charges
   - Multiple cron triggers could still queue duplicate events
   - Monthly check helps but not foolproof

2. **OrderID Collision**
   - Random generation between MIN/MAX could theoretically collide
   - Retry logic exists but may need improvement ([services/banking.ts:90-99](services/banking.ts#L90-L99))

3. **Sensitive Data in Logs**
   - Full payment details logged to console
   - Consider sanitizing before logging

---

### ✅ Good Practices

1. **Graceful Degradation**
   - System continues to work if Hatchet is not configured
   - Clear warnings in logs

2. **Duplicate Payment Prevention**
   - Monthly payment log check
   - Payment in progress flag

3. **Audit Trail**
   - All transactions logged in `payment-log`
   - Success/failure tracked

---

## Environment Variables

### Required for Payment Processing

```bash
# Ameriabank API Configuration
PAYMENT_API_BASE_URL=https://services.ameriabank.am/VPOS/api/VPOS
PAYMENT_API_DETAILS_URL=https://services.ameriabank.am/VPOS/Payments/Pay
CLIENT_ID=your_merchant_id
PAYMENT_USERNAME=your_api_username
PAYMENT_PASSWORD=your_api_password

# Payment Settings
CURRENCY_AM=051                    # Armenian Dram currency code
SUCCESS_RESPONSE_CODE=00           # Ameriabank success response code
MIN_ORDER_ID=3831001              # Minimum OrderID for random generation
MAX_ORDER_ID=3832000              # Maximum OrderID for random generation
PAYMENT_TIMEOUT=900               # Payment timeout in seconds (15 minutes)

# Application URLs
BACK_URL=https://instepanavan.am/payment-success
BASE_URL=http://localhost:1337    # For internal API calls from Hatchet
```

### Optional for Recurring Payments

```bash
# Hatchet Configuration (optional - system gracefully degrades without it)
HATCHET_CLIENT_TOKEN=your_hatchet_token
HATCHET_CLIENT_HOST_PORT=localhost:7077
```

**To get Hatchet token:**
1. Access Hatchet UI at http://localhost:8888
2. Login with admin@example.com / Admin123!!
3. Generate API token
4. Add to `.env` file

---

## Known TODOs

### High Priority

- [x] **Add authentication to recurring payment endpoints** — Both `doRecurringPayment` and `triggerAllPayments` now check `x-admin-api-key` header against `ADMIN_API_KEY` env var ([controllers/payment.ts:107-110](controllers/payment.ts#L107-L110), [controllers/payment.ts:198-201](controllers/payment.ts#L198-L201))
- [x] **Link payment methods to users** — `createProjectPaymentMethod` now saves `userDocumentId` (string) and `users_permissions_user` (numeric) ([services/strapi.ts:132-147](services/strapi.ts#L132-L147))
- [x] **Fix hardcoded payment type** — Now uses project's `donationType` directly (`"recurring"` or `"one time"`). Project-payment schema enum updated to match ([services/strapi.ts:94](services/strapi.ts#L94))
- [ ] **Add email to project payments** — Still uses dummy email `"TODO: dummy EMAIL ADD LATER"` ([../../../queue/workflow.ts:111](../../../queue/workflow.ts#L111))
- [x] **Change cron schedule to monthly** — Now runs on 4th, 14th, 24th of each month at 00:00 UTC ([../../../queue/workflow.ts:67-71](../../../queue/workflow.ts#L67-L71))

### Medium Priority

- [x] **Handle donation type properly** — Payment type now derived from project's `donationType` in `createProjectPayment` ([services/strapi.ts:85-87](services/strapi.ts#L85-L87)). Note: TODO comment in [controllers/payment.ts:9](controllers/payment.ts#L9) can be removed
- [ ] **Update payment logs relation** — Still no logic to update project payment with new logs ([services/strapi.ts:178-180](services/strapi.ts#L178-L180))
- [ ] **Add logic to update project payment with logs** — TODO comment still present ([services/strapi.ts:179](services/strapi.ts#L179))

### Low Priority

- [x] **Add authentication check comment** — Hatchet worker now sends `x-admin-api-key` header ([../../../queue/workflow.ts:42](../../../queue/workflow.ts#L42))
- [x] **Prevent deletion of historical logs** — Old cron deletion loop removed; crons are now registered with `onCrons` declaratively and handle "already exists" gracefully ([../../../queue/workflow.ts:150-161](../../../queue/workflow.ts#L150-L161))

---

## Testing

### Manual Testing Endpoints

#### Test Recurring Payment for Single Project
```bash
curl -X POST http://localhost:1337/api/payment/trigger-all-payments \
  -H "Content-Type: application/json" \
  -d '{"projectDocumentId": "abc123"}'
```

#### Test Recurring Payment for All Projects
```bash
curl -X POST http://localhost:1337/api/payment/trigger-all-payments \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Test Single Payment Processing
```bash
curl -X POST http://localhost:1337/api/payment/do-recurring-payment \
  -H "Content-Type: application/json" \
  -d '{"projectPaymentId": "payment123"}'
```

---

## Troubleshooting

### Recurring Payments Not Processing

1. **Check Hatchet is running:**
   ```bash
   docker compose -f docker-compose.dev.yml ps hatchet
   ```

2. **Verify Hatchet token is set:**
   ```bash
   grep HATCHET_CLIENT_TOKEN server/.env
   ```

3. **Check Hatchet logs:**
   ```bash
   docker compose -f docker-compose.dev.yml logs -f hatchet
   ```

4. **Access Hatchet UI:**
   - URL: http://localhost:8888
   - Credentials: admin@example.com / Admin123!!

### Payment Initialization Fails

1. **Check Ameriabank credentials:**
   - Verify `CLIENT_ID`, `PAYMENT_USERNAME`, `PAYMENT_PASSWORD`

2. **Check OrderID range:**
   - Verify `MIN_ORDER_ID` and `MAX_ORDER_ID` are valid

3. **Review logs:**
   - Check console output for Ameriabank API errors

### Duplicate Payments

1. **Check monthly log query:**
   - Review `getProjectPaymentLogForThisMonth` logic

2. **Verify `isPaymentInProgress` flag:**
   - Ensure flag is properly reset after processing

---

## File Structure

```
server/src/api/payment/
├── PAYMENT.md                    # This documentation
├── controllers/
│   └── payment.ts                # API endpoint handlers
├── services/
│   ├── payment.ts                # Service aggregator
│   ├── banking.ts                # Ameriabank API integration
│   └── strapi.ts                 # Database operations
├── routes/
│   └── payment.ts                # Route definitions
└── constants/
    ├── apis.ts                   # API constant names
    └── currencies.ts             # Currency mappings

server/queue/
├── hatchet-client.ts             # Hatchet client initialization
├── workflow.ts                   # Recurring payment workflows
└── worker.ts                     # Worker initialization
```
