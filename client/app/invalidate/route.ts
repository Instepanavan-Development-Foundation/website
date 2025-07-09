import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// TODO: Write in documentation about this page functionality
// https://api.instepanavan.am/admin/settings/webhooks/create
// Invalidate website on change

const revalidateAll = async () => {
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
      { status: 500 },
    );
  }
};

export const GET = revalidateAll;
export const POST = revalidateAll;
