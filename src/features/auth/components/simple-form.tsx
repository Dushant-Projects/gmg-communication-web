"use client";

import { useActionState } from "react";
import type { AuthState } from "@/features/auth/actions";

/** Single-field form used by forgot-password (email) and reset-password (new password). */
export function SimpleForm({
  action,
  field,
  label,
  button,
}: {
  action: (prev: AuthState, fd: FormData) => Promise<AuthState>;
  field: "email" | "password";
  label: string;
  button: string;
}) {
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, undefined);
  return (
    <form action={formAction} className="mt-6 space-y-3">
      <input
        name={field}
        type={field}
        placeholder={label}
        required
        autoComplete={field === "email" ? "email" : "new-password"}
        className="w-full rounded-xl border border-line px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/10"
      />
      {state?.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state?.message && <p className="text-sm text-green-700">{state.message}</p>}
      <button
        disabled={pending}
        className="w-full rounded-xl bg-brand py-3 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Please wait…" : button}
      </button>
    </form>
  );
}
