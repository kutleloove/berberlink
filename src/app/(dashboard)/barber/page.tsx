import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function BarberDashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: {
      profile: {
        include: {
          appointments: {
            include: {
              customer: true,
              services: true
            },
            orderBy: { startTime: "desc" }
          },
          services: true
        }
      }
    }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  const { profile } = dbUser;

  return (
    <div className="p-4 md:p-10 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{profile.shopName}</h1>
          <p className="text-slate-500">Yönetim Paneli</p>
        </div>
        <div className="flex gap-4">
          <a 
            href="/barber/availability" 
            className="bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition"
          >
            Çalışma Saatleri
          </a>
          <a 
            href="/barber/services" 
            className="bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
          >
            Hizmetleri Yönet
          </a>
          <a 
            href="/barber/settings" 
            className="bg-white text-slate-900 border border-slate-200 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition"
          >
            Ayarlar
          </a>
          <a 
            href={`/${profile.slug}`} 
            target="_blank" 
            className="text-slate-600 hover:text-slate-900 font-medium flex items-center gap-2 border px-4 py-2 rounded-lg"
          >
            Sayfayı Görüntüle ↗
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm font-medium mb-2">Toplam Randevu</h3>
          <p className="text-3xl font-bold text-slate-900">{profile.appointments.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm font-medium mb-2">Hizmet Sayısı</h3>
          <p className="text-3xl font-bold text-slate-900">{profile.services.length}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h3 className="text-slate-500 text-sm font-medium mb-2">Bugünkü Randevular</h3>
          <p className="text-3xl font-bold text-slate-900">
            {profile.appointments.filter(a => new Date(a.startTime).toDateString() === new Date().toDateString()).length}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Randevu Listesi</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold">Müşteri</th>
                <th className="px-6 py-4 font-semibold">Tarih</th>
                <th className="px-6 py-4 font-semibold">Hizmetler</th>
                <th className="px-6 py-4 font-semibold">Tutar</th>
                <th className="px-6 py-4 font-semibold">Durum</th>
                <th className="px-6 py-4 font-semibold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profile.appointments.map((apt) => (
                <tr key={apt.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-900">{apt.customer.name}</div>
                    <div className="text-xs text-slate-500">{apt.customer.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    <div>{apt.startTime.toLocaleDateString('tr-TR')}</div>
                    <div className="text-xs">{apt.startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">
                    {apt.services.map(s => s.name).join(", ")}
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-900">
                    {apt.services.reduce((acc, s) => acc + Number(s.price), 0)} ₺
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                      ${apt.status === "CONFIRMED" ? "bg-green-100 text-green-800" :
                        apt.status === "PENDING" ? "bg-yellow-100 text-yellow-800" :
                        "bg-red-100 text-red-800"
                      }`}>
                      {apt.status === "CONFIRMED" ? "Onaylandı" :
                       apt.status === "PENDING" ? "Bekliyor" :
                       apt.status === "CANCELLED" ? "İptal" : "Tamamlandı"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800 font-medium">Detay</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
