import { IPaymentMethod } from "@/src/models/payment-method";

export async function getUserPaymentMethods(): Promise<IPaymentMethod[]> {
  const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  
  if (!jwt) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment-methods?populate=*&filters[users_permissions_user][$eq]=${await getUserId()}`,
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

export async function deletePaymentMethod(paymentMethodId: number): Promise<void> {
  const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  
  if (!jwt) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/payment-methods/${paymentMethodId}`,
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

async function getUserId(): Promise<number> {
  const jwt = typeof window !== "undefined" ? localStorage.getItem("jwt") : null;
  
  if (!jwt) {
    throw new Error("No authentication token found");
  }

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/users/me`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status}`);
    }

    const user = await response.json();
    return user.id;
  } catch (error) {
    console.error("Error fetching user ID:", error);
    throw error;
  }
}

export function getPaymentMethodDisplayName(paymentMethod: IPaymentMethod): string {
  if (paymentMethod.type === "ameriabank") {
    return "Ameriabank";
  }
  return paymentMethod.type;
}

export function getPaymentMethodDetails(paymentMethod: IPaymentMethod): string {
  if (paymentMethod.type === "ameriabank" && paymentMethod.params) {
    if (paymentMethod.params.cardNumber) {
      return `**** **** **** ${paymentMethod.params.cardNumber.slice(-4)}`;
    }
    if (paymentMethod.params.bankAccount) {
      return `Account: ${paymentMethod.params.bankAccount}`;
    }
  }
  return "Payment method details";
}