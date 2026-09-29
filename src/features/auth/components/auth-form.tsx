"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, signInWithGoogle, type AuthState } from "@/features/auth/actions";

const inputClass =
  "w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10";

export function AuthForm({ mode, next }: { mode: "login" | "signup"; next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    mode === "login" ? signIn : signUp,
    undefined
  );
  const isLogin = mode === "login";

  return (
    <div className="mx-auto w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">
        {isLogin ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {isLogin ? "Log in to view your orders and wishlist." : "Sign up to save your cart and track orders."}
      </p>

      <form action={action} className="mt-6 space-y-3">
        <input type="hidden" name="next" value={next} />
        {!isLogin && (
          <input name="full_name" placeholder="Full name" autoComplete="name" required className={inputClass} />
        )}
        <input name="email" type="email" placeholder="Email" autoComplete="email" required className={inputClass} />
        <input
          name="password"
          type="password"
          placeholder="Password"
          autoComplete={isLogin ? "current-password" : "new-password"}
          required
          className={inputClass}
        />

        {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
        {state?.message && <p className="text-sm text-green-700">{state.message}</p>}

        <button
          disabled={pending}
          className="w-full rounded-xl bg-brand py-3 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "Please wait…" : isLogin ? "Log in" : "Create account"}
        </button>
      </form>

      <div className="my-4 flex items-center gap-3 text-xs text-muted">
        <span className="h-px flex-1 bg-line" /> or <span className="h-px flex-1 bg-line" />
      </div>

      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next} />
        <button className="w-full rounded-xl border border-line py-3 text-sm font-medium transition hover:bg-surface">
          Continue with Google
        </button>
      </form>

      <div className="mt-6 flex justify-between text-sm text-muted">
        {isLogin ? (
          <>
            <Link href="/forgot-password" className="hover:text-ink">Forgot password?</Link>
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="hover:text-ink">Create account</Link>
          </>
        ) : (
          <Link href={`/login?next=${encodeURIComponent(next)}`} className="hover:text-ink">
            Already have an account? Log in
          </Link>
        )}
      </div>
    </div>
  );
}
