import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Add middleware logic if needed, e.g., verifying session for /app/* routes
  // For now, we handle auth in the API routes and page components
  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*"],
};
