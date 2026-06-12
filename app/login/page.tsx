import AuthForm from "@/components/AuthForm";

export default function LoginPage() {
  return (
    <div className="flex min-h-full items-center justify-center bg-zinc-50 px-3 py-8 sm:px-4 sm:py-12 dark:bg-zinc-950">
      <AuthForm mode="login" />
    </div>
  );
}
