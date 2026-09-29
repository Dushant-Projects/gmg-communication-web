import { AuthForm } from "@/features/auth/components/auth-form";
import { safeNext } from "@/lib/utils";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const { next, error } = await searchParams;
  return (
    <main className="flex min-h-screen items-center px-4 py-12">
      <div className="w-full">
        {error && (
          <p role="alert" className="mx-auto mb-4 max-w-sm text-sm text-red-600">
            Sign-in didn't complete. Please try again.
          </p>
        )}
        <AuthForm mode="login" next={safeNext(next, "/account")} />
      </div>
    </main>
  );
}
