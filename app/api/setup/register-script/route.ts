import { NextRequest, NextResponse } from "next/server";

// This route is called ONCE during setup to register the Script Tag with Shopify.
// The script tag tells Shopify to inject your try-on JS into every storefront page.
export async function GET(req: NextRequest) {
  const shop = process.env.SHOPIFY_SHOP;
  const accessToken = process.env.SHOPIFY_ACCESS_TOKEN;
  const appUrl = process.env.SHOPIFY_APP_URL;

  if (!shop || !accessToken || !appUrl) {
    return NextResponse.json({ error: "Missing env vars" }, { status: 500 });
  }

  const scriptSrc = `${appUrl}/try-on.js`;

  try {
    // First, check if script tag already exists
    const listRes = await fetch(`https://${shop}/admin/api/2024-01/script_tags.json`, {
      method: "GET",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
    });

    const listData = await listRes.json();
    const existing = listData.script_tags?.find((s: any) => s.src === scriptSrc);

    if (existing) {
      return NextResponse.json({ message: "Script tag already registered", script_tag: existing });
    }

    // Register a new script tag
    const res = await fetch(`https://${shop}/admin/api/2024-01/script_tags.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        script_tag: {
          event: "onload",
          src: scriptSrc,
          display_scope: "online_store",
        },
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ error: err }, { status: 500 });
    }

    const data = await res.json();
    return NextResponse.json({ message: "Script tag registered successfully!", script_tag: data.script_tag });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to register script tag" }, { status: 500 });
  }
}
