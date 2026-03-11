import { IProjectFunding } from "@/models/project-funding";

/**
 * Fetch dynamic project funding data from the API
 * This calculates funding based on successful payment logs
 *
 * For recurring projects:
 * - Shows current month's gathered amount vs monthly goal (requiredAmount)
 * - Only counts successful payments from this month
 *
 * For one-time projects:
 * - Shows all-time gathered amount vs total goal (requiredAmount)
 * - Counts all successful payments ever
 *
 * @param projectDocumentId - The project's documentId (not numeric id)
 * @returns IProjectFunding with dynamic calculated amounts, or null if not found
 */
export default async function getProjectFunding(
  projectDocumentId: string,
): Promise<IProjectFunding | null> {
  const baseUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:1337";
  const url = `${baseUrl}/api/projects/${projectDocumentId}/funding`;

  try {
    const response = await fetch(url, {
      next: { revalidate: 0 }, // Always fetch fresh data
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();

    return json.data || null;
  } catch (error) {
    console.error("Failed to fetch project funding:", error);

    return null;
  }
}
