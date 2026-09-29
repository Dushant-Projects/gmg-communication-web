import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16: Middleware was renamed to Proxy.
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

// Also provide default export for compatibility
export default proxy;

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};