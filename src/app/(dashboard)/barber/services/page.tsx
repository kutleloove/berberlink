import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ServiceForm } from "./_components/service-form";
import { ServiceList } from "./_components/service-list";

export default async function ServicesPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: {
      profile: {
        include: { services: true }
      }
    }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  // Decimal nesnelerini serialize et (Client Component'e geçirilebilir hale getir)
  const serializedServices = dbUser.profile.services.map(service => ({
    id: service.id,
    name: service.name,
    duration: service.duration,
    price: service.price.toString(), // Decimal'ı string'e dönüştür
  }));

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Hizmet Yönetimi</h1>
        <a href="/barber" className="text-slate-600 hover:text-slate-900">
          ← Panele Dön
        </a>
      </div>

      <div className="grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-xl font-semibold mb-4">Yeni Hizmet Ekle</h2>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <ServiceForm />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-4">Mevcut Hizmetler</h2>
          <ServiceList services={serializedServices} />
        </div>
      </div>
    </div>
  );
}

