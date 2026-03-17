import type { StrapiApp } from '@strapi/strapi/admin';
import { useFetchClient } from '@strapi/admin/strapi-admin';

const PAYMENT_LOG_UID = 'api::payment-log.payment-log';

function PaymentAction(ctx: any) {
  if (!ctx) return null;
  const { document, documentId, model } = ctx;
  if (model !== PAYMENT_LOG_UID) return null;
  if (!document) return null;
  if (document.paymentStatus === 'cancelled' || document.paymentStatus === 'refunded') return null;
  if (!document.success && document.paymentStatus !== 'partial_refund') return null;

  const { post } = useFetchClient();
  const hoursElapsed = (Date.now() - new Date(document.createdAt).getTime()) / (1000 * 60 * 60);
  const canCancel = hoursElapsed <= 71;

  const refundedSoFar = document.refundedAmount || 0;
  const remaining = (document.amount || 0) - refundedSoFar;
  if (remaining <= 0) return null;

  if (canCancel) {
    return {
      label: 'Cancel Payment',
      variant: 'danger' as const,
      position: 'panel' as const,
      dialog: {
        type: 'dialog' as const,
        title: 'Cancel Payment',
        content: `Cancel payment of ${document.amount} ${document.currency}? This will fully reverse the transaction.`,
        onConfirm: async () => {
          try {
            await post('/api/payment/cancel-payment', {
              paymentLogDocumentId: documentId,
            });
            window.location.reload();
          } catch (error: any) {
            alert('Cancel failed: ' + (error?.response?.data?.error || error.message));
          }
        },
      },
    };
  }

  // Over 72 hours — refund only
  return {
    label: refundedSoFar > 0 ? `Refund (${remaining} remaining)` : 'Refund Payment',
    variant: 'danger' as const,
    position: 'panel' as const,
    dialog: {
      type: 'dialog' as const,
      title: 'Refund Payment',
      content: `Refund up to ${remaining} ${document.currency} to the cardholder.`,
      onConfirm: async () => {
        const input = prompt(`Enter refund amount (max ${remaining}):`);
        if (!input) return;

        const amount = parseFloat(input);
        if (isNaN(amount) || amount <= 0 || amount > remaining) {
          alert(`Invalid amount. Must be between 0 and ${remaining}`);
          return;
        }

        try {
          await post('/api/payment/refund-payment', {
            paymentLogDocumentId: documentId,
            amount,
          });
          window.location.reload();
        } catch (error: any) {
          alert('Refund failed: ' + (error?.response?.data?.error || error.message));
        }
      },
    },
  };
}

export default {
  config: {
    locales: [],
  },
  bootstrap(app: StrapiApp) {
    const cm = app.getPlugin('content-manager') as any;
    cm.apis.addDocumentAction(PaymentAction);
  },
};
