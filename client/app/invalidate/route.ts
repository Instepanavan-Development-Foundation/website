import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    revalidatePath("/", "layout");
    return NextResponse.json({
      success: true,
      message: "Cache invalidated successfully!",
    });
  } catch (error) {
    console.error("Error invalidating cache:", error);
    return NextResponse.json(
      { success: false, message: "Error invalidating cache" },
      { status: 500 }
    );
  }
}
