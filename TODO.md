# TODO

## Images

- [ ] Implement image resizing in Strapi using `jimp` (pure JS, no native deps). On upload, generate `thumbnail` (156px), `small` (500px), `medium` (750px), `large` (1000px) variants stored in Strapi's `formats` field. Sharp cannot be used — production VPS (AMD Phenom II) lacks SSE4.1/AVX2. See [`docs/images.md`](docs/images.md).

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
- [ ] Fix Payment log, when payment is removed logs are invisible