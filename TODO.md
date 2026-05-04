# TODO

## Images

- [ ] Implement image resizing in Strapi using `jimp` (pure JS, no native deps). On upload, generate `thumbnail` (156px), `small` (500px), `medium` (750px), `large` (1000px) variants stored in Strapi's `formats` field. Sharp cannot be used — production VPS (AMD Phenom II) lacks SSE4.1/AVX2. See [`docs/images.md`](docs/images.md).
- [ ] Fix sharp on the server so Next.js image optimization works. Currently disabled via `unoptimized: true` in [next.config.js](client/next.config.js) — production VPS (AMD Phenom II) lacks SSE4.1/AVX2 which sharp requires.

## Multi-Instance / Portability

- [ ] Replace hardcoded `instepanavan.am` references (emails, URLs) with env vars so the codebase can be deployed for other organizations without code changes. Affected places include `config/plugins.ts` (defaultFrom/defaultReplyTo), `sendDonationNotification` (fallback admin URL, recipient `contact@instepanavan.am`), and any other hardcoded domain strings.

## Payment System

### Recurring Payment Error Handling


- [ ] To secure payments we should not do it with ADMIN user but with Token generated from strapi
- [ ] **Send notification to users when recurring payment fails** (expired card, insufficient funds, etc.)
  - Implement email notification system
  - Include error details and instructions to update payment method
  - Link to payment method update page
- [ ] Handle refund logic
- [ ] **Crash-between-charge-and-log gap** — if the server crashes after `makeBindingPayment` succeeds but before the payment log is committed, the next cron run sees no log and charges the user again. Fix requires pre-writing a `pending` log entry before charging the bank, then resolving it via Ameriabank's `GetPaymentDetails` on recovery. See `doRecurringPaymentWithAtomicLock` in `server/src/api/payment/services/strapi.ts`.
- [x] Fix Payment log, when payment is removed logs are invisible — backfilled `userDocumentId` on old logs in prod DB

## Profile / Auth

- [ ] **`PUT /api/users/me` returns 403 ForbiddenError** — endpoint is registered via `strapi-server.ts` extension and permission `plugin::users-permissions.user.updateMe` exists in `up_permissions` for the authenticated role, but Strapi's auth strategy rejects it. Suspect issue with how `config.scope` is derived for dynamically-pushed plugin routes vs. CASL ability check. Name editing in profile is currently broken.