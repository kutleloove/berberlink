import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function CustomerPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: {
      appointmentsAsCustomer: {
        include: {
          barber: true,
          services: true
        },
        orderBy: { startTime: "desc" }
      }
    }
  });

  if (!dbUser) redirect("/sign-in");

  return (
    <div className="p-4 md:p-10 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Hoş Geldin, {dbUser.name}</h1>
          <p className="text-slate-500">Randevularını buradan takip edebilirsin.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <h2 className="text-xl font-bold text-slate-900">Randevularım</h2>
        
        {dbUser.appointmentsAsCustomer.length === 0 ? (
          <div className="bg-white p-10 rounded-2xl shadow-sm border border-slate-100 text-center">
            <p className="text-slate-500 mb-4">Henüz bir randevunuz bulunmuyor.</p>
            <a href="/" className="inline-block bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition">
              Berber Ara
            </a>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">Berber</th>
                    <th className="px-6 py-4 font-semibold">Tarih</th>
                    <th className="px-6 py-4 font-semibold">Saat</th>
                    <th className="px-6 py-4 font-semibold">Hizmetler</th>
                    <th className="px-6 py-4 font-semibold">Tutar</th>
                    <th className="px-6 py-4 font-semibold">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dbUser.appointmentsAsCustomer.map((apt) => (
                    <tr key={apt.id} className="hover:bg-slate-50 transition">
                      <td className="px-6 py-4 font-medium text-slate-900">{apt.barber.shopName}</td>
                      <td className="px-6 py-4 text-slate-600">
                        {apt.startTime.toLocaleDateString('tr-TR')}
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                        {apt.startTime.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
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
                            apt.status === "CANCELLED" ? "bg-red-100 text-red-800" :
                            "bg-slate-100 text-slate-800"
                          }`}>
                          {apt.status === "CONFIRMED" ? "Onaylandı" :
                           apt.status === "PENDING" ? "Bekliyor" :
                           apt.status === "CANCELLED" ? "İptal" : "Tamamlandı"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {dbUser.role !== "BARBER" && (
        <div className="mt-12 p-6 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-1">Berber misiniz?</h3>
            <p className="text-slate-300">İşletmenizi kaydedin ve randevuları yönetmeye başlayın.</p>
          </div>
          <a href="/onboarding" className="bg-white text-slate-900 px-6 py-3 rounded-xl font-bold hover:bg-slate-100 transition">
            İşletme Hesabına Geç
          </a>
        </div>
      )}
    </div>
  );
}
