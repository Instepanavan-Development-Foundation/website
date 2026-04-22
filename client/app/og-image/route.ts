import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ imageUrl: null }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Instepanavan/1.0)" },
      next: { revalidate: 3600 },
    });

    const html = await res.text();

    // Try both attribute orderings for og:image
    const match =
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ||
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i);

    const imageUrl = match?.[1] ?? null;

    return NextResponse.json(
      { imageUrl },
      {
        headers: { "Cache-Control": "public, max-age=3600" },
      },
    );
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}
