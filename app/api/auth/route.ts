import { NextRequest, NextResponse } from "next/server";
import shopify from "@/lib/shopify";

export async function GET(req: NextRequest) {
  const shop = req.nextUrl.searchParams.get("shop");
  if (!shop) {
    return NextResponse.json({ error: "Missing shop parameter" }, { status: 400 });
  }

  // Begin Auth
  return await shopify.auth.begin({
    shop: shop,
    callbackPath: "/api/auth/callback",
    isOnline: false,
    rawRequest: req,
    rawResponse: new NextResponse(),
  });
}
