import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const isDev = process.env.NODE_ENV === "development";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookieOptions: {
        secure: isDev ? false : true,
        sameSite: "lax",
        path: "/",
      },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, {
                ...options,
                secure: isDev ? false : options?.secure ?? true,
                sameSite: options?.sameSite ?? "lax",
                path: options?.path ?? "/",
              })
            );
          } catch {
            // Called from a Server Component: safe to ignore, proxy refreshes the session.
          }
        },
      },
    }
  );
}