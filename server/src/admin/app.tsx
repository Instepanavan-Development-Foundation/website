import type { StrapiApp } from '@strapi/strapi/admin';

const PAYMENT_LOG_UID = 'api::payment-log.payment-log';

export default {
  config: {
    locales: [],
  },
  bootstrap(app: StrapiApp) {
    (app.getPlugin('content-manager') as any).apis.addDocumentAction((context: any) => {
      if (!context) return null;
      const { document, documentId, model } = context;
      if (model !== PAYMENT_LOG_UID) return null;
      if (!document) return null;
      if (!document.success) return null;
      if (document.status === 'cancelled' || document.status === 'refunded') return null;

      const hoursElapsed = (Date.now() - new Date(document.createdAt).getTime()) / (1000 * 60 * 60);
      const isExpired = hoursElapsed > 71;

      return {
        label: isExpired ? 'Cancel (expired)' : 'Cancel Payment',
        disabled: isExpired,
        variant: 'danger' as const,
        position: 'panel' as const,
        dialog: {
          type: 'dialog' as const,
          title: 'Cancel Payment',
          content: `Cancel payment of ${document.amount} ${document.currency}? This will fully reverse the transaction.`,
          onConfirm: async () => {
            try {
              const res = await fetch('/api/payment/cancel-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ paymentLogDocumentId: documentId }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Cancel failed');
              window.location.reload();
            } catch (err: any) {
              alert('Cancel failed: ' + err.message);
            }
          },
        },
      };
    });

    (app.getPlugin('content-manager') as any).apis.addDocumentAction((context: any) => {
      if (!context) return null;
      const { document, documentId, model } = context;
      if (model !== PAYMENT_LOG_UID) return null;
      if (!document) return null;
      if (document.status === 'cancelled' || document.status === 'refunded') return null;
      if (!document.success && document.status !== 'partial_refund') return null;

      const refundedSoFar = document.refundedAmount || 0;
      const remaining = (document.amount || 0) - refundedSoFar;
      if (remaining <= 0) return null;

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
              const res = await fetch('/api/payment/refund-payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ paymentLogDocumentId: documentId, amount }),
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || 'Refund failed');
              window.location.reload();
            } catch (err: any) {
              alert('Refund failed: ' + err.message);
            }
          },
        },
      };
    });
  },
};
