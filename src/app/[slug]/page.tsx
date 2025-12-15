import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookingWizard } from "./_components/booking-wizard";
import { Footer } from "@/components/ui/footer";

interface BarberPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function BarberProfilePage({ params }: BarberPageProps) {
  const { slug } = await params;

  const profile = await db.profile.findUnique({
    where: { slug },
    include: {
      services: true,
      user: {
        select: {
          name: true,
          image: true,
        },
      },
    },
  });

  if (!profile) {
    return notFound();
  }

  // Decimal to string conversion for Client Component
  const formattedServices = profile.services.map(s => ({
    ...s,
    price: s.price.toString()
  }));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-slate-900">
            {profile.shopName}
          </Link>
          <div className="text-sm text-slate-500">
            {profile.address || "Konum belirtilmemiş"}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Sol Kolon: Profil Bilgileri */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 sticky top-24">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-slate-200 overflow-hidden">
                  {profile.user.image ? (
                    <img src={profile.user.image} alt={profile.shopName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-2xl font-bold">
                      {profile.shopName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h1 className="font-bold text-lg text-slate-900">{profile.shopName}</h1>
                  <p className="text-sm text-slate-500">{profile.user.name}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-1">Hakkında</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {profile.bio || "Henüz bir açıklama eklenmemiş."}
                  </p>
                </div>
                
                <div className="pt-4 border-t">
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">Çalışma Saatleri</h3>
                  <div className="text-sm text-slate-600 space-y-1">
                    <div className="flex justify-between"><span>Pzt - Cum</span> <span>09:00 - 20:00</span></div>
                    <div className="flex justify-between"><span>Cmt</span> <span>09:00 - 21:00</span></div>
                    <div className="flex justify-between text-red-500"><span>Paz</span> <span>Kapalı</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Kolon: Hizmetler ve Randevu */}
          <div className="md:col-span-2 space-y-6">
            <BookingWizard barberId={profile.id} services={formattedServices} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
