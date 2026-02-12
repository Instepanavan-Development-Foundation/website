import { IPaymentLog } from "../models/getData";

/**
 * Fetch user's payment history from the API
 * Returns all payment logs (successful and failed) for a user's payment methods
 * Sorted by date descending (newest first)
 *
 * This replaces the complex client-side logic that:
 * - Looped through payment methods
 * - Made multiple API calls
 * - Manually deduplicated results
 *
 * SECURITY: Requires JWT authentication. User can only access their own data.
 *
 * @param userDocumentId - The user's documentId
 * @returns Array of payment logs with populated project data
 */
export async function getUserPaymentHistory(
  userDocumentId: string
): Promise<IPaymentLog[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:1337";
  const url = `${baseUrl}/api/contributor/payment-history/${userDocumentId}`;

  try {
    // Get JWT token from localStorage
    const { getToken } = await import("@/src/services/userService");
    const jwt = getToken();

    if (!jwt) {
      console.error("No authentication token found");
      return [];
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      next: { revalidate: 0 }, // Always fetch fresh data
    });

    if (!response.ok) {
      console.error("Failed to fetch payment history:", response.statusText);
      return [];
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching payment history:", error);
    return [];
  }
}
