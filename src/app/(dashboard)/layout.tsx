import { syncUser } from "@/lib/auth-sync";
import { redirect } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Scissors } from "lucide-react";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ... syncUser ve error handling kodları burada kalacak ...
  try {
    const user = await syncUser();
    if (!user) redirect("/sign-in");
  } catch (error) {
    console.error("Auth sync error:", error);
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md px-6 h-16 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-xl text-slate-900">
          <Scissors className="w-6 h-6" />
          <span>BerberLink</span>
        </Link>
        
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900">
            Ana Sayfa
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
