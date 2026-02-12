export interface IPaymentMethod {
  id: number;
  documentId: string;
  type: string;
  params: {
    cardNumber?: string;
    lastFour?: string;
    cardType?: string;
    [key: string]: any;
  };
}

export default async function getPaymentMethods(): Promise<IPaymentMethod[]> {
  const jwt = localStorage.getItem("jwt");

  if (!jwt) {
    return [];
  }

  // Get current user to fetch their documentId
  const { getCurrentUser } = await import("@/src/services/userService");
  const user = await getCurrentUser();

  if (!user || !(user as any).documentId) {
    console.error("User documentId not found");
    return [];
  }

  const userDocumentId = (user as any).documentId;
  const url = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment-methods?filters[userDocumentId][$eq]=${userDocumentId}`;

  try {
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      console.error("Failed to fetch payment methods:", res.statusText);
      return [];
    }

    const result = await res.json();
    const methods = result.data || [];

    // Parse params from JSON string to object
    return methods.map((method: any) => ({
      ...method,
      params: typeof method.params === 'string' ? JSON.parse(method.params) : method.params
    }));
  } catch (e) {
    console.error("Error fetching payment methods:", e);
    return [];
  }
}
