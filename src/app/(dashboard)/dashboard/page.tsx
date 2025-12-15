import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Scissors, User, Calendar, Settings, Users, Briefcase } from "lucide-react";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: {
      profile: true,
      appointmentsAsCustomer: {
        take: 5,
        orderBy: { startTime: "desc" },
        include: {
          barber: true,
          services: true,
        },
      },
    },
  });

  if (!dbUser) return null;

  // Eğer işletme profili varsa ama rol BARBER değilse, rolü düzelt
  if (dbUser.profile && dbUser.role !== "BARBER") {
    await db.user.update({
      where: { id: dbUser.id },
      data: { role: "BARBER" },
    });
    dbUser.role = "BARBER";
  }

  // Admin için direkt yönlendirme
  if (dbUser.role === "ADMIN") redirect("/admin");

  const isBarber = dbUser.role === "BARBER" && dbUser.profile;

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Hoş Geldin, {dbUser.name}</h1>
        <p className="text-slate-500">Yönetim paneline hoş geldin</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        {/* Müşteri Paneli */}
        <Link
          href="/customer"
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all hover:border-slate-300 group"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-200 transition">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Müşteri Paneli</h2>
              <p className="text-sm text-slate-500">Randevularını yönet</p>
            </div>
          </div>
          <p className="text-slate-600 text-sm mb-4">
            Randevularını görüntüle, abonelik randevularını yönet ve yeni randevu al.
          </p>
          {dbUser.appointmentsAsCustomer.length > 0 && (
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <Calendar className="w-4 h-4" />
              <span>{dbUser.appointmentsAsCustomer.length} aktif randevu</span>
            </div>
          )}
        </Link>

        {/* Berber Paneli - Sadece berberler için */}
        {isBarber ? (
          <Link
            href="/barber"
            className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all hover:border-slate-300 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-slate-800 transition">
                <Scissors className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Berber Paneli</h2>
                <p className="text-sm text-slate-500">{dbUser.profile.shopName}</p>
              </div>
            </div>
            <p className="text-slate-600 text-sm mb-4">
              İşletmenizi yönetin, randevuları takip edin, personel ve hizmetleri düzenleyin.
            </p>
            <div className="flex items-center gap-4 text-sm text-slate-500">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Müşteriler</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Randevular</span>
              </div>
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4" />
                <span>Ayarlar</span>
              </div>
            </div>
          </Link>
        ) : (
          <Link
            href="/onboarding"
            className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center group-hover:bg-white/20 transition">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Berber Ol</h2>
                <p className="text-sm text-slate-300">İşletmenizi kaydedin</p>
              </div>
            </div>
            <p className="text-slate-200 text-sm mb-4">
              İşletmenizi BerberLink'e kaydedin ve randevuları yönetmeye başlayın.
            </p>
            <div className="inline-flex items-center gap-2 text-sm text-white font-medium">
              <span>Hemen Başla</span>
              <span className="group-hover:translate-x-1 transition">→</span>
            </div>
          </Link>
        )}
      </div>

      {/* Hızlı Erişim */}
      {isBarber && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Hızlı Erişim</h3>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/barber/appointments/active"
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
            >
              <Calendar className="w-5 h-5 text-slate-600 mb-2" />
              <h4 className="font-semibold text-slate-900 text-sm">Aktif Randevular</h4>
              <p className="text-xs text-slate-500 mt-1">Randevuları görüntüle</p>
            </Link>
            <Link
              href="/barber/customers"
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
            >
              <Users className="w-5 h-5 text-slate-600 mb-2" />
              <h4 className="font-semibold text-slate-900 text-sm">Müşteriler</h4>
              <p className="text-xs text-slate-500 mt-1">Müşteri listesi</p>
            </Link>
            <Link
              href="/barber/settings"
              className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition"
            >
              <Settings className="w-5 h-5 text-slate-600 mb-2" />
              <h4 className="font-semibold text-slate-900 text-sm">Ayarlar</h4>
              <p className="text-xs text-slate-500 mt-1">İşletme ayarları</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

