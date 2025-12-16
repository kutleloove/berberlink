import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Tags,
  ShieldCheck,
  LayoutDashboard,
  MessageSquare,
  LogOut
} from "lucide-react";
import { UserButton } from "@/components/auth/user-button";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const sidebarItems = [
    { label: "Panel", href: "/sys-panel-x9z", icon: LayoutDashboard },
    { label: "Paket Yönetimi", href: "/sys-panel-x9z/packages", icon: Package },
    { label: "Promosyonlar", href: "/sys-panel-x9z/promocodes", icon: Tags },
    { label: "Doğrulamalar", href: "/sys-panel-x9z/verifications", icon: ShieldCheck },
    { label: "Destek", href: "/sys-panel-x9z/support", icon: MessageSquare },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="hidden w-64 flex-col bg-slate-900 text-slate-300 md:flex flex-shrink-0">
        <div className="flex h-16 items-center px-6 border-b border-slate-800">
          <span className="text-xl font-bold text-white">Yönetici Paneli</span>
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors hover:bg-slate-800 hover:text-white"
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="border-t border-slate-800 p-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 rounded-lg px-4 py-3 font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          >
            <LogOut className="h-5 w-5" />
            <span>Uygulamaya Dön</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-white px-6">
          <h1 className="font-semibold text-slate-800">BerberLink Admin</h1>
          <UserButton />
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
