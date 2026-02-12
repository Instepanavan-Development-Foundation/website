import { IProjectPayment } from "../models/getData";

/**
 * Fetch user's active subscriptions (recurring payments) from the API
 * Returns all project-payments for a user's payment methods
 *
 * This replaces the complex client-side logic that:
 * - Manually constructed URLSearchParams
 * - Required JWT token handling
 * - Had hardcoded field selections
 *
 * SECURITY: Requires JWT authentication. User can only access their own data.
 *
 * @param userDocumentId - The user's documentId
 * @returns Array of subscriptions with populated project and payment method data
 */
export async function getUserSubscriptions(
  userDocumentId: string
): Promise<IProjectPayment[]> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:1337";
  const url = `${baseUrl}/api/contributor/subscriptions/${userDocumentId}`;

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
      console.error("Failed to fetch subscriptions:", response.statusText);
      return [];
    }

    const json = await response.json();
    return json.data || [];
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return [];
  }
}
