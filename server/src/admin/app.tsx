import type { StrapiApp } from '@strapi/strapi/admin';
import { useFetchClient } from '@strapi/admin/strapi-admin';

const PAYMENT_LOG_UID = 'api::payment-log.payment-log';

function CancelPaymentAction({ document, documentId, model }: any) {
  if (model !== PAYMENT_LOG_UID) return null;
  if (!document) return null;
  if (!document.success) return null;
  if (document.status === 'cancelled' || document.status === 'refunded') return null;

  const { post } = useFetchClient();
  const hoursElapsed = (Date.now() - new Date(document.createdAt).getTime()) / (1000 * 60 * 60);
  const isExpired = hoursElapsed > 71;

  return {
    label: isExpired ? 'Cancel (expired)' : 'Cancel Payment',
    disabled: isExpired,
    variant: 'danger',
    position: 'panel' as const,
    dialog: {
      type: 'dialog' as const,
      title: 'Cancel Payment',
      content: `Are you sure you want to cancel this payment of ${document.amount} ${document.currency}? This will fully reverse the transaction.`,
      onConfirm: async () => {
        try {
          await post('/api/payment/cancel-payment', {
            paymentLogDocumentId: documentId,
          });
          window.location.reload();
        } catch (error: any) {
          console.error('Cancel payment error:', error);
          alert('Cancel failed: ' + (error?.response?.data?.error || error.message));
        }
      },
    },
  };
}

function RefundPaymentAction({ document, documentId, model }: any) {
  if (model !== PAYMENT_LOG_UID) return null;
  if (!document) return null;
  if (document.status === 'cancelled' || document.status === 'refunded') return null;
  if (!document.success && document.status !== 'partial_refund') return null;

  const { post } = useFetchClient();
  const refundedSoFar = document.refundedAmount || 0;
  const remaining = (document.amount || 0) - refundedSoFar;

  if (remaining <= 0) return null;

  return {
    label: refundedSoFar > 0 ? `Refund (${remaining} remaining)` : 'Refund Payment',
    variant: 'danger',
    position: 'panel' as const,
    dialog: {
      type: 'dialog' as const,
      title: 'Refund Payment',
      content: `Enter refund amount (max ${remaining} ${document.currency}). This will refund the specified amount to the cardholder.`,
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
          console.error('Refund payment error:', error);
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
    const contentManager = app.getPlugin('content-manager');
    contentManager.apis.addDocumentAction([CancelPaymentAction, RefundPaymentAction]);
  },
};
