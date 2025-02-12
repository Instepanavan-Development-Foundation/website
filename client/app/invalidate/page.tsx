import { revalidatePath } from "next/cache";

// TODO: Write in documentation about this page functionality
// https://api.instepanavan.am/admin/settings/webhooks/create
// Invalidate website on change

async function invalidateCache() {
  'use server';
  try {
    revalidatePath("/", "layout");
    return true;
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return false;
  }
}

export default async function Invalidate() {
  const success = await invalidateCache();
  
  return (
    <div>
      {success ? "Cache invalidated successfully!" : "Error invalidating cache"}
    </div>
  );
}
