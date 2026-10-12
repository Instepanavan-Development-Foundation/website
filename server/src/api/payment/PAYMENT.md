# Payment System Documentation

## Overview

This document describes the payment system architecture for the Instepanavan donation platform. The system handles both one-time and recurring donations through Ameriabank's payment gateway, with recurring charges scheduled by Strapi's built-in cron.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Payment Registration Flow](#payment-registration-flow)
- [Recurring Payment Flow](#recurring-payment-flow)
- [Database Schema](#database-schema)
- [API Endpoints](#api-endpoints)
- [Ameriabank Integration](#ameriabank-integration)
- [Recurring Payment Scheduling](#recurring-payment-scheduling)
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
                              │  Strapi Cron   │
                              │ (4th/14th/24th)│
                              │                │
                              │ - In-process   │
                              │ - Sequential   │
                              │ - No queue     │
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
2. Generates unique `orderId` via PostgreSQL sequence (`SELECT nextval('payment_order_id_seq')`) — collision-free even under concurrent load
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
  initQueue(strapi); // Registers the recurring payments cron
}
```

**Worker Initialization:** [../../../queue/worker.ts](../../../queue/worker.ts)
- Calls `startRecurringPaymentSystem`, which registers the cron with `strapi.cron.add`
- Skipped under Jest so tests never fire a real run

---

### 2. Cron Job Configuration

**Registration:** [../../../queue/workflow.ts](../../../queue/workflow.ts) (`startRecurringPaymentSystem`)
```javascript
strapi.cron.add({
  recurringPayments: {
    task: () => runRecurringPayments(),
    options: { rule: "0 0 4,14,24 * *", tz: "Etc/UTC" },
  },
});
```

An in-process guard skips a trigger (cron or manual) while a run is already in progress.

---

### 3. Monthly Processing Task

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

#### Step 2: Process Individual Payments (sequentially)
```javascript
for (const project of projects) {
  for (const projectPayment of project.project_payments) {
    await upper.fn({
      amount: projectPayment.amount,
      documentId: projectPayment.documentId,
      email: "TODO: dummy EMAIL ADD LATER" // ❌ Missing user email
    });
  }
}
```

---

### 4. Individual Payment Processing

**Workflow:** [../../../queue/workflow.ts:21-50](../../../queue/workflow.ts#L21-L50)

**Task Execution:**
```javascript
const upper = {
  fn: async (input) => {
    const { documentId } = input;

    // Call internal API endpoint
    const response = await axiosClient.post(
      `/api/payment/do-recurring-payment`,
      { projectPaymentId: documentId }
    );

    return { message: response.data.message, status: response.status };
  }
};
```

---

### 6. Recurring Payment Execution

**Endpoint:** `POST /api/payment/do-recurring-payment`

**Auth:** Requires a real admin session token (`Authorization: Bearer <token>`), verified via `verifyAdminAuth` — the same check used by cancel/refund. The recurring payments cron mints its own token in-process for a dedicated admin account (see `RECURRING_PAYMENTS_ADMIN_USER_ID` in `.env`); no static shared secret is involved.

**Request Body:**
```json
{
  "projectPaymentId": "payment123"
}
```

**Process:** [controllers/payment.ts](controllers/payment.ts)

#### Step 1: Fetch Project Payment with Binding
```javascript
const projectPayment = await service.getProjectPaymentWithMethod(projectPaymentId);
```

#### Step 2: Validate Project Type
```javascript
if (projectPayment.project.donationType !== "recurring") {
  throw new Error("Project donation type is not recurring");
}
```

#### Step 3: Generate OrderID
```javascript
const orderId = await service.getOrderId();
// → SELECT nextval('payment_order_id_seq') — atomically unique, no collisions
```

#### Step 4: Atomic Lock + Charge + Log (single transaction)

This is the core of double-charge prevention. Everything happens inside one PostgreSQL transaction:

```javascript
const result = await service.doRecurringPaymentWithAtomicLock({
  projectPaymentId,
  projectPaymentData: { ... },
  orderId,
});
```

**Inside `doRecurringPaymentWithAtomicLock`** ([services/strapi.ts](services/strapi.ts)):

```
BEGIN TRANSACTION
  SELECT ... FROM project_payments WHERE document_id = ? FOR UPDATE
  ↑ Concurrent requests BLOCK HERE until the first commits

  IF success log exists this month → ROLLBACK, return alreadyProcessed
  IF failed log exists within last 3 days → ROLLBACK, return alreadyProcessed
  
  makeBindingPayment(...)   ← bank charged while lock is held
  
  INSERT INTO payment_logs  ← log written while lock is held
  INSERT INTO payment_logs_project_payment_lnk
COMMIT
```

The `FOR UPDATE` row lock on `project_payments` ensures that when 10 concurrent requests arrive (e.g. a manual trigger overlaps the cron), only one proceeds. The others wait, then see the log from the first and return `alreadyProcessed: true`.

#### Step 5: Return Result

- `200` — payment charged and logged successfully
- `203` — already processed this month (idempotent, not an error)
- `400` — bank declined (logged, will retry on next cron date)

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

## Recurring Payment Scheduling

### Components

#### Workflow
**File:** [../../../queue/workflow.ts](../../../queue/workflow.ts)

1. **`recurringPaymentsTask`** - Main cron task
   - Queries all recurring projects
   - Processes each project payment sequentially via `upper`

2. **`upper`** - Individual payment processor
   - Calls internal API to process payment

---

#### Worker
**File:** [../../../queue/worker.ts](../../../queue/worker.ts)

Registers the Strapi cron (00:00 UTC on the 4th, 14th and 24th) on bootstrap.

---

### Run State

Runs live in memory only. If Strapi restarts mid-run, the remaining payments are picked up by the next scheduled run.

---

## Concurrency & Double-Charge Protection

### Recurring Payments (cron-triggered)

The guard uses a **PostgreSQL `SELECT ... FOR UPDATE` row lock** on the `project_payments` row, held for the entire duration of the bank charge and log write. This means:

- 10 concurrent requests for the same subscription → only 1 charges the bank, 9 block at the lock and return `alreadyProcessed`
- Cron firing twice (the May 4 incident) → same protection, no double-charge

**Retry schedule** (cron runs on 4th, 14th, 24th):
- ✅ Successful payment this month → blocked for the rest of the month
- ✅ Failed payment within last 3 days → blocked (prevents same-cron-run retry spam)
- ✅ Failed payment older than 3 days → allowed (user may have received salary, card updated)
- ✅ Payment from last month → allowed (monthly billing resets)

### One-Time Payments (`get-payment-details`)

Uses `pg_advisory_xact_lock(hashtext(paymentId))` — a transaction-scoped advisory lock keyed on the Ameriabank `PaymentID`. Two browser tabs redirecting back simultaneously are serialized: the second sees the log already saved by the first and returns the amount without re-saving.

### Cancel & Refund (admin panel)

Both use **optimistic atomic UPDATE** before calling the bank:
- Cancel: `UPDATE ... SET payment_status = 'cancelling' WHERE NOT IN ('cancelled','refunded','cancelling')` → returns 409 if already claimed
- Refund: `UPDATE ... SET refunded_amount = refunded_amount + ? WHERE refunded_amount + ? <= amount` → prevents over-refund even with concurrent admin clicks

---

## Security Considerations

### ✅ Fixed

1. **Authentication on recurring payment endpoints**
   - `/do-recurring-payment` and `/trigger-all-payments` both require a real admin
     session token via `verifyAdminAuth` — same mechanism as cancel/refund
   - No static shared secret: the recurring payments cron mints its own token in-process for a
     dedicated admin account ([../../../queue/workflow.ts](../../../queue/workflow.ts),
     `getSystemAdminToken` / `RECURRING_PAYMENTS_ADMIN_USER_ID`)
   - Manual triggers use a real admin's own browser session token (see the
     `trigger-recurring-payment` Claude skill)

2. **Double-charge race condition** — fixed via `FOR UPDATE` lock (see above)

3. **OrderID collisions** — fixed via PostgreSQL sequence (atomic, no repeats ever)

4. **One-time payment double-save** — fixed via advisory lock in `getPaymentDetails`

5. **Cancel/refund TOCTOU** — fixed via atomic conditional UPDATE

---

### ⚠️ Known Gaps

1. **`payWithSavedCard` has no idempotency guard**
   - User double-clicking "Pay with saved card" sends two concurrent requests
   - Both can charge the bank and create two payment logs
   - Low priority (user-initiated, authenticated), tracked in TODO.md

2. **Crash between bank charge and log commit**
   - If the server crashes after `makeBindingPayment` succeeds but before `COMMIT`, the next cron run sees no log and charges again
   - Fix requires pre-writing a pending log; tracked in TODO.md

3. **Cancel/refund exception rollback**
   - If the bank API *throws* (network timeout) rather than returning a non-success code, the optimistic claim stays stuck
   - Intentionally deferred; manually fixable via DB update

---

### ✅ Good Practices

1. **Audit trail** — all transactions (success and failure) logged in `payment-log`
2. **Armenia timezone** — month boundaries computed in UTC+4, not server local time
3. **30-second HTTP timeouts** — all Ameriabank API calls have explicit timeouts

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
PAYMENT_TIMEOUT=900               # Payment timeout in seconds (15 minutes)
# OrderIDs are now generated via PostgreSQL sequence — MIN/MAX_ORDER_ID no longer needed

# Application URLs
BACK_URL=https://instepanavan.am/payment-success
BASE_URL=http://localhost:1337    # For internal API calls from the recurring payments cron
```

### Required for Recurring Payments

```bash
# Admin user the recurring payments cron mints its session token for
RECURRING_PAYMENTS_ADMIN_USER_ID=1
```

---

## Known TODOs

### High Priority

- [x] **Add authentication to recurring payment endpoints** — Both `doRecurringPayment` and `triggerAllPayments` now require a real admin session token via `verifyAdminAuth`, same as cancel/refund (no static shared secret anymore — see "Recurring Payments" in [../../../../README.md](../../../../README.md))
- [x] **Link payment methods to users** — `createProjectPaymentMethod` now saves `userDocumentId` (string) and `users_permissions_user` (numeric) ([services/strapi.ts:132-147](services/strapi.ts#L132-L147))
- [x] **Fix hardcoded payment type** — Now uses project's `donationType` directly (`"recurring"` or `"one time"`). Project-payment schema enum updated to match ([services/strapi.ts:94](services/strapi.ts#L94))
- [x] **Add email to project payments** — Now populates user email via project_payment → payment_method → users_permissions_user ([../../../queue/workflow.ts:89-112](../../../queue/workflow.ts#L89-L112))
- [x] **Change cron schedule to monthly** — Now runs on 4th, 14th, 24th of each month at 00:00 UTC ([../../../queue/workflow.ts:67-71](../../../queue/workflow.ts#L67-L71))

### Medium Priority

- [x] **Handle donation type properly** — Payment type now derived from project's `donationType` in `createProjectPayment` ([services/strapi.ts:85-87](services/strapi.ts#L85-L87)). Note: TODO comment in [controllers/payment.ts:9](controllers/payment.ts#L9) can be removed
- [x] **Update payment logs relation** — Already handled: `createPaymentLog` sets `project_payment: projectPaymentId` which links both sides via Strapi's `manyToOne`/`inversedBy` relation. Removed dead TODO.
- [x] **Add logic to update project payment with logs** — Same as above; no extra update needed since the relation is bidirectional by schema design

### Low Priority

- [x] **Add authentication check comment** — The recurring payments cron now mints its own admin session token in-process ([../../../queue/workflow.ts](../../../queue/workflow.ts), `getSystemAdminToken`)
- [x] **Prevent deletion of historical logs** — Old cron deletion loop removed; crons are now registered with `onCrons` declaratively and handle "already exists" gracefully ([../../../queue/workflow.ts:150-161](../../../queue/workflow.ts#L150-L161))

---

## Cancel & Refund

### Overview

Ameriabank supports two reversal operations:

- **CancelPayment** — Full reversal, available within **72 hours** of payment. Money hasn't settled yet, so it's voided.
- **RefundPayment** — Partial or full refund, **no time limit**. Money was already settled; it's sent back to the cardholder.

Both require the `PaymentID` from the original transaction.

### Ameriabank API

**CancelPayment:** `POST {PAYMENT_API_BASE_URL}/CancelPayment`
```json
{ "PaymentID": "...", "Username": "...", "Password": "..." }
```

**RefundPayment:** `POST {PAYMENT_API_BASE_URL}/RefundPayment`
```json
{ "PaymentID": "...", "Username": "...", "Password": "...", "Amount": 10.0 }
```

Both return `{ "ResponseCode": "00", "ResponseMessage": "..." }` on success.

### Implementation

**Backend endpoints** ([controllers/payment.ts](controllers/payment.ts)):
- `POST /api/payment/cancel-payment` — `{ paymentLogDocumentId }` — admin auth required
- `POST /api/payment/refund-payment` — `{ paymentLogDocumentId, amount }` — admin auth required

**Auth:** Both endpoints verify the admin JWT via `strapi.sessionManager` (same mechanism as Strapi's internal admin auth). No API key needed — the admin session cookie is used.

**Banking service** ([services/banking.ts](services/banking.ts)):
- `cancelPayment(paymentId)` — calls Ameriabank CancelPayment
- `refundPayment(paymentId, amount)` — calls Ameriabank RefundPayment

### Payment Log Fields

The `payment-log` schema includes:
- `paymentId` (string) — Ameriabank PaymentID, saved when payment is created
- `paymentStatus` (enum: `completed`, `cancelled`, `refunded`, `partial_refund`) — lifecycle state
- `refundedAmount` (decimal) — cumulative refund amount

**Note:** `GetPaymentDetails` does not return `PaymentID` in its response. The `PaymentID` is injected from the value the frontend sends to `getPaymentDetails` before saving.

### Strapi Admin Button

A single button appears in the payment-log edit view panel ([server/src/admin/app.tsx](../../../admin/app.tsx)):

- **< 72 hours since payment:** Shows "Cancel Payment" — full reversal
- **> 72 hours since payment:** Shows "Refund Payment" — prompts for amount
- **After cancel or full refund:** Button hidden
- **After partial refund:** Shows "Refund (X remaining)"

### Flow

1. Admin opens a payment-log entry in Strapi
2. Clicks "Cancel Payment" or "Refund Payment"
3. Confirms in dialog (refund also prompts for amount)
4. Frontend calls `/api/payment/cancel-payment` or `/api/payment/refund-payment` with admin session cookie
5. Controller validates: log exists, has `paymentId`, eligible status, amount within bounds
6. Calls Ameriabank API
7. On success: updates `paymentStatus`, `success`, `refundedAmount` on the payment log
8. Page reloads showing updated state

---

## Testing

### Automated Regression Tests

```bash
cd server && npm test -- --testPathPatterns=duplicate-payment-guard
```

Covers:
- 10 concurrent requests → bank charged exactly once (May 4 incident regression)
- Failed payment on 4th → retried on 14th (salary scenario)
- Successful payment → blocked for rest of month
- Last month's success → does not block this month
- Failure < 3 days ago → blocked (same cron window)
- Failure > 3 days ago → allowed (next cron window)
- 50 concurrent `getOrderId()` calls → all unique
- Two tabs redirecting simultaneously → only one payment log saved

### Manual Testing Endpoints

All three now require `Authorization: Bearer <admin-token>` instead of a static key —
see the `trigger-recurring-payment` Claude skill for how to get a token from your own
admin session.

#### Test Recurring Payment for Single Project
```bash
curl -X POST http://localhost:1337/api/payment/trigger-all-payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"projectDocumentId": "abc123"}'
```

#### Test Recurring Payment for All Projects
```bash
curl -X POST http://localhost:1337/api/payment/trigger-all-payments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{}'
```

#### Test Single Payment Processing
```bash
curl -X POST http://localhost:1337/api/payment/do-recurring-payment \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"projectPaymentId": "payment123"}'
```

---

## Troubleshooting

### Recurring Payments Not Processing

1. **Check the cron was registered** (Strapi startup logs):
   ```
   ✅ Recurring payments: Crons registered (4th, 14th, 24th at 00:00 UTC = 04:00 AM Armenia)
   ```

2. **Verify the admin user is set:**
   ```bash
   grep RECURRING_PAYMENTS_ADMIN_USER_ID server/.env
   ```

3. **Find the run in the Strapi logs** — each run logs `[run <id>]` start and summary lines.

### Payment Initialization Fails

1. **Check Ameriabank credentials:**
   - Verify `CLIENT_ID`, `PAYMENT_USERNAME`, `PAYMENT_PASSWORD`

2. **Check OrderID sequence exists:**
   ```bash
   docker exec strapi_postgres_dev psql -U strapi -d instepanavan -c \
     "SELECT last_value FROM payment_order_id_seq;"
   ```

3. **Review logs:**
   - Check console output for Ameriabank API errors

### Duplicate Payments

1. **Check if the FOR UPDATE lock is working:**
   ```bash
   # Run the regression test suite
   cd server && npm test -- --testPathPatterns=duplicate-payment-guard
   ```

2. **Check payment_logs for this subscription this month:**
   ```bash
   docker exec strapi_postgres_dev psql -U strapi -d instepanavan -c \
     "SELECT id, success, created_at FROM payment_logs
      JOIN payment_logs_project_payment_lnk lnk ON lnk.payment_log_id = payment_logs.id
      JOIN project_payments pp ON pp.id = lnk.project_payment_id
      WHERE pp.document_id = '<projectPaymentId>'
      AND created_at >= date_trunc('month', now())
      ORDER BY created_at DESC;"
   ```

3. **Clear logs for a subscription (dev/test only):**
   ```bash
   docker exec strapi_postgres_dev psql -U strapi -d instepanavan -c \
     "DELETE FROM payment_logs WHERE id IN (
       SELECT payment_log_id FROM payment_logs_project_payment_lnk
       WHERE project_payment_id = (
         SELECT id FROM project_payments WHERE document_id = '<projectPaymentId>'
       )
     );"
   ```

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
├── workflow.ts                   # Recurring payment run + cron registration
└── worker.ts                     # Bootstrap initialization
```
