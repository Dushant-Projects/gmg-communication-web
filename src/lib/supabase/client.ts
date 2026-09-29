import { createBrowserClient } from "@supabase/ssr";

const isDev = process.env.NODE_ENV === "development";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        // Development: IP (192.168.x.x) se access karne ke liye secure:false zaroori hai
        secure: isDev ? false : true,
        sameSite: "lax",
        path: "/",
      },
    }
  );
}