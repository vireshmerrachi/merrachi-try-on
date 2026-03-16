import { NextRequest, NextResponse } from "next/server";
import shopify from "@/lib/shopify";

export async function GET(req: NextRequest) {
  try {
    const callback = await shopify.auth.callback({
      rawRequest: req,
      rawResponse: new NextResponse(),
    });

    const { session } = callback;
    // Redirect to app home
    return NextResponse.redirect(
      `https://${shopify.config.hostName}/?shop=${session.shop}&host=${Buffer.from(
        session.shop + "/admin"
      ).toString("base64")}`
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Auth failed" }, { status: 500 });
  }
}
