import { IPaymentMethod } from "@/src/models/payment-method";
import { getToken, getCurrentUser } from "@/src/services/userService";

export async function getUserPaymentMethods(): Promise<IPaymentMethod[]> {
  const jwt = getToken();

  if (!jwt) {
    throw new Error("No authentication token found");
  }

  try {
    const userDocumentId = await getUserDocumentId();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment-methods?populate=*&filters[userDocumentId][$eq]=${userDocumentId}`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch payment methods: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error("Error fetching payment methods:", error);
    throw error;
  }
}

export async function deletePaymentMethod(documentId: string): Promise<void> {
  const jwt = getToken();

  if (!jwt) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment-methods/${documentId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${jwt}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to delete payment method: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting payment method:", error);
    throw error;
  }
}

async function getUserDocumentId(): Promise<string> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("No user found");
  }

  const documentId = (user as any).documentId;
  if (!documentId) {
    throw new Error("User documentId not found");
  }

  return documentId;
}

export function getPaymentMethodDisplayName(paymentMethod: IPaymentMethod): string {
  if (paymentMethod.type === "ameriabank" && paymentMethod.params) {
    const cardNumber = paymentMethod.params.CardNumber || paymentMethod.params.cardNumber || "";
    // Detect card type from card number
    const firstDigits = cardNumber.replace(/\*/g, '').substring(0, 6);
    if (firstDigits.startsWith('4')) return 'Visa';
    if (firstDigits.startsWith('5') || firstDigits.startsWith('2')) return 'Mastercard';
    if (firstDigits.startsWith('34') || firstDigits.startsWith('37')) return 'American Express';
    if (firstDigits.startsWith('6')) return 'Discover';
    return "Ameriabank";
  }
  return paymentMethod.type;
}

export function getPaymentMethodDetails(paymentMethod: IPaymentMethod): string {
  if (paymentMethod.type === "ameriabank" && paymentMethod.params) {
    const cardNumber = paymentMethod.params.CardNumber || paymentMethod.params.cardNumber;
    if (cardNumber) {
      return cardNumber; // Already masked like 408306**1818
    }
    if (paymentMethod.params.bankAccount) {
      return `Account: ${paymentMethod.params.bankAccount}`;
    }
  }
  return "Payment method details";
}