# TODO

## Payment System

### Recurring Payment Error Handling


- [ ] To secure payments we should not do it with ADMIN user but with Token generated from strapi
- [ ] **Send notification to users when recurring payment fails** (expired card, insufficient funds, etc.)
  - Implement email notification system
  - Include error details and instructions to update payment method
  - Link to payment method update page
- [ ] Handle refund logic