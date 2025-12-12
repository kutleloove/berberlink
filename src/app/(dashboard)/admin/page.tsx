import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BarberList } from "./_components/barber-list";

export default async function AdminDashboard() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
  });

  if (dbUser?.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Tüm berberleri çek
  const barbers = await db.profile.findMany({
    include: {
      user: true,
      _count: {
        select: { appointments: true }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Sistem Yönetimi</h1>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm font-medium mb-2">Toplam Berber</h3>
          <p className="text-3xl font-bold text-slate-900">{barbers.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm font-medium mb-2">Aktif Abonelik</h3>
          <p className="text-3xl font-bold text-slate-900">
            {barbers.filter(b => b.isActive && b.subscriptionEndsAt && b.subscriptionEndsAt > new Date()).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Berber Listesi</h2>
        </div>
        <BarberList barbers={barbers} />
      </div>
    </div>
  );
}
