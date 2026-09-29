import { SimpleForm } from "@/features/auth/components/simple-form";
import { updatePassword } from "@/features/auth/actions";

export default function Page() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold tracking-tight">Choose a new password</h1>
      <SimpleForm action={updatePassword} field="password" label="New password (8+ characters)" button="Save password" />
    </main>
  );
}
