import { SimpleForm } from "@/features/auth/components/simple-form";
import { requestPasswordReset } from "@/features/auth/actions";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold tracking-tight">Reset your password</h1>
      <p className="mt-1 text-sm text-muted">We'll email you a link to choose a new one.</p>
      <SimpleForm action={requestPasswordReset} field="email" label="Email" button="Send reset link" />
    </main>
  );
}
