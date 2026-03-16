import { NextRequest, NextResponse } from "next/server";
import shopify from "@/lib/shopify";

export async function POST(req: NextRequest) {
  const topic = req.headers.get("x-shopify-topic") || "";
  const shop = req.headers.get("x-shopify-shop-domain") || "";
  const body = await req.text();

  try {
    const isValid = await shopify.webhooks.validate({
      rawBody: body,
      rawRequest: req,
      rawResponse: new NextResponse(),
    });

    if (!isValid.valid) {
      return NextResponse.json({ error: "Invalid Webhook" }, { status: 401 });
    }

    switch (topic) {
      case "APP_UNINSTALLED":
        // Handle uninstall
        break;
      default:
        console.log(`Webhook ${topic} received for ${shop}`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Webhook failed" }, { status: 500 });
  }
}
