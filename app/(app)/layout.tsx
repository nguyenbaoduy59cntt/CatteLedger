import { redirect } from "next/navigation";
import AppNav from "@/components/AppNav";
import MobileTabBar from "@/components/MobileTabBar";
import { getCurrentUser } from "@/lib/auth";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-full flex-col bg-zinc-50 dark:bg-zinc-950">
      <AppNav user={user} />
      <main className="mx-auto w-full max-w-5xl flex-1 px-3 py-4 pb-[calc(4.5rem+env(safe-area-inset-bottom))] sm:px-4 sm:py-6 sm:pb-6">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
