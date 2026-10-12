import { IContributor } from "@/src/models/contributor";

import getData from "./getData";

export async function getUserContributor(
  userEmail: string,
): Promise<IContributor | null> {
  try {
    const { data: contributors } = await getData({
      type: "contributors",
      populate: { avatar: { fields: ["url"] } },
      filters: {
        email: userEmail,
      },
    });

    return contributors.length > 0 ? contributors[0] : null;
  } catch {
    return null;
  }
}
