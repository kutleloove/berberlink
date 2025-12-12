import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DebugPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  // Tüm berberleri çek
  const allBarbers = await db.profile.findMany({
    select: {
      id: true,
      shopName: true,
      slug: true,
      latitude: true,
      longitude: true,
      address: true,
      isActive: true,
      userId: true,
    }
  });

  return (
    <div className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Debug: Veritabanı Durumu</h1>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-4">Sizin Profiliniz</h2>
          <pre className="bg-slate-50 p-4 rounded-lg overflow-auto text-sm">
            {JSON.stringify({
              email: user.emailAddresses[0].emailAddress,
              role: dbUser?.role,
              profile: dbUser?.profile ? {
                id: dbUser.profile.id,
                shopName: dbUser.profile.shopName,
                slug: dbUser.profile.slug,
                address: dbUser.profile.address,
                latitude: dbUser.profile.latitude,
                longitude: dbUser.profile.longitude,
                isActive: dbUser.profile.isActive,
              } : null
            }, null, 2)}
          </pre>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold mb-4">Tüm Berberler ({allBarbers.length})</h2>
          <div className="space-y-4">
            {allBarbers.map(barber => (
              <div key={barber.id} className="border-b pb-4 last:border-0">
                <div className="font-bold text-slate-900">{barber.shopName}</div>
                <div className="text-sm text-slate-600 space-y-1 mt-2">
                  <div>Slug: <code className="bg-slate-100 px-1 rounded">{barber.slug}</code></div>
                  <div>Adres: {barber.address || <span className="text-red-500">YOK</span>}</div>
                  <div>Latitude: {barber.latitude !== null ? <span className="text-green-600">{barber.latitude}</span> : <span className="text-red-500">NULL</span>}</div>
                  <div>Longitude: {barber.longitude !== null ? <span className="text-green-600">{barber.longitude}</span> : <span className="text-red-500">NULL</span>}</div>
                  <div>Aktif: {barber.isActive ? <span className="text-green-600">Evet</span> : <span className="text-red-500">Hayır</span>}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 p-6 rounded-2xl border border-blue-200">
          <h3 className="font-bold text-blue-900 mb-2">Haritada Görünmesi İçin:</h3>
          <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
            <li>Latitude değeri NULL olmamalı</li>
            <li>Longitude değeri NULL olmamalı</li>
            <li>isActive durumu true olmalı (opsiyonel, şu an kontrol edilmiyor)</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

