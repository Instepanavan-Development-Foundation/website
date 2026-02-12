export async function initPayment({
  amount,
  projectDocumentId,
  projectSlug,
  email,
}: {
  amount: number;
  projectDocumentId: string;
  projectSlug: string;
  email: string;
}): Promise<{ url?: string; errorMessage?: string }> {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment/init-payment`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount,
        projectDocumentId,
        projectSlug,
        email,
        currencyCode: "051",
        lang: "am",
        paymentMethod: "ameriabank",
      }),
    }
  );

  return response.json();
}
