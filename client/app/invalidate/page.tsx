import { revalidatePath } from "next/cache";

// TODO: Write in documentation about this page functionality
export default async function Invalidate() {
  try {
    revalidatePath("/", "layout");
    return <div>Cache invalidated successfully!</div>;
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return <div>Error invalidating cache</div>;
  }
}
