import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { prisma } from "@/lib/shopify";
import { generateTryOnWithNanoBanana } from "@/lib/ai";
import crypto from "crypto";

// Helper to fetch a remote image and convert to base64
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch image: ${url}`);
  const buffer = await response.arrayBuffer();
  const mimeType = response.headers.get("Content-Type") || "image/png";
  const base64 = Buffer.from(buffer).toString("base64");
  return { data: base64, mimeType };
}

// Helper to convert File to base64
async function fileToBase64(file: File): Promise<{ data: string; mimeType: string }> {
  const buffer = await file.arrayBuffer();
  const base64 = Buffer.from(buffer).toString("base64");
  return { data: base64, mimeType: file.type };
}

// Helper to verify App Proxy signature
function verifyProxySignature(query: URLSearchParams, secret: string) {
  const params = Object.fromEntries(query.entries());
  const signature = params.signature;
  delete params.signature;

  const sortedParams = Object.keys(params)
    .sort()
    .map((key) => `${key}=${Array.isArray(params[key]) ? params[key].join(",") : params[key]}`)
    .join("");

  const calculatedSignature = crypto
    .createHmac("sha256", secret)
    .update(sortedParams)
    .digest("hex");

  return calculatedSignature === signature;
}

export async function POST(req: NextRequest) {
  // 1. Verify Request (App Proxy)
  const url = new URL(req.url);
  const isValid = verifyProxySignature(url.searchParams, process.env.SHOPIFY_API_SECRET!);
  
  // Note: For local dev, you might skip this check or ensure ngrok is set up correctly
  if (!isValid && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const closeupFile = formData.get("closeup") as File;
    const fullbodyFile = formData.get("fullbody") as File;
    const customerId = formData.get("customerId") as string;
    const productId = formData.get("productId") as string;
    const productImage = formData.get("productImage") as string;

    if (!closeupFile || !fullbodyFile || !productImage) {
      return NextResponse.json({ error: "Missing files or product image" }, { status: 400 });
    }

    // 2. Upload to Supabase
    const timestamp = Date.now();
    const closeupPath = `${customerId || "guest"}/${timestamp}_closeup_${closeupFile.name}`;
    const fullbodyPath = `${customerId || "guest"}/${timestamp}_fullbody_${fullbodyFile.name}`;

    const { error: closeupError } = await supabaseAdmin.storage
      .from("user-photos")
      .upload(closeupPath, closeupFile, { upsert: true });

    const { error: fullbodyError } = await supabaseAdmin.storage
      .from("user-photos")
      .upload(fullbodyPath, fullbodyFile, { upsert: true });

    if (closeupError || fullbodyError) {
      throw new Error("Upload failed");
    }

    const closeupUrl = supabaseAdmin.storage.from("user-photos").getPublicUrl(closeupPath).data.publicUrl;
    const fullbodyUrl = supabaseAdmin.storage.from("user-photos").getPublicUrl(fullbodyPath).data.publicUrl;

    // 3. Save to DB
    if (customerId) {
      await prisma.userPhoto.createMany({
        data: [
          { customerId, type: "closeup", url: closeupUrl },
          { customerId, type: "fullbody", url: fullbodyUrl },
        ],
      });
    }

    // 4. Call AI Service (Nano Banana 2)
    const [userImg, garmentImg] = await Promise.all([
      fileToBase64(fullbodyFile),
      fetchImageAsBase64(productImage),
    ]);

    const generatedBase64 = await generateTryOnWithNanoBanana({
      userImageBase64: userImg.data,
      userImageMimeType: userImg.mimeType,
      garmentImageBase64: garmentImg.data,
      garmentImageMimeType: garmentImg.mimeType,
    });

    // 5. Upload generated result to Supabase
    const resultBuffer = Buffer.from(generatedBase64, "base64");
    const resultPath = `${customerId || "guest"}/${timestamp}_result.png`;

    const { error: resultError } = await supabaseAdmin.storage
      .from("user-photos")
      .upload(resultPath, resultBuffer, {
        contentType: "image/png",
        upsert: true,
      });

    if (resultError) throw resultError;

    const resultUrl = supabaseAdmin.storage.from("user-photos").getPublicUrl(resultPath).data.publicUrl;

    // 6. Save Result (Optional)
    if (customerId) {
      await prisma.tryOnResult.create({
        data: {
          customerId,
          productId,
          resultUrl,
        },
      });
    }

    return NextResponse.json({ resultUrl });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
