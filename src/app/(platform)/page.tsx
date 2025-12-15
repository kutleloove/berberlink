import Link from "next/link";
import { ArrowRight, Scissors, Calendar, Store, ShieldCheck, MapPin, Search } from "lucide-react";
import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db";
import MiniMap from "@/components/ui/mini-map";
import { Footer } from "@/components/ui/footer";

export default async function LandingPage() {
  const user = await currentUser();
  
  // Eğer kullanıcı giriş yapmamışsa, klasik Landing Page göster
  if (!user) {
    return <MarketingLanding />;
  }

  // Giriş yapmış kullanıcı için veri çekelim
  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: {
      appointmentsAsCustomer: {
        where: { startTime: { gte: new Date() } }, // Gelecek randevular
        include: { barber: true, services: true },
        orderBy: { startTime: "asc" },
        take: 3
      }
    }
  });

  // Yakındaki berberleri çek (Şimdilik rastgele 5 aktif berber)
  // Gerçek lokasyon bazlı arama için PostGIS veya Haversine formülü gerekir, şimdilik basit tutalım.
  const nearbyBarbers = await db.profile.findMany({
    where: { 
      // isActive kontrolünü kaldırdık (test için)
      latitude: { not: null },
      longitude: { not: null }
    },
    take: 5,
    select: { id: true, shopName: true, slug: true, address: true, latitude: true, longitude: true }
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navbar */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
            <div className="bg-slate-900 text-white p-1 rounded-lg">
              <Scissors size={20} />
            </div>
            <span>BerberLink</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-slate-600 hover:text-slate-900">
              Panelim
            </Link>
            <Link href="/map" className="flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-full text-sm font-medium text-slate-900 hover:bg-slate-200 transition">
              <MapPin size={16} /> Haritada Ara
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Karşılama */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-slate-900">
            Merhaba, {dbUser?.name || user.firstName} 👋
          </h1>
          <p className="text-slate-500 mt-1">Bugün saçların için harika bir gün!</p>
        </div>

        {/* Arama Kutusu */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-10">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Berber adı, semt veya hizmet ara..." 
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-slate-900 outline-none text-slate-900 placeholder:text-slate-400"
            />
          </div>
          
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {["Saç Kesimi", "Sakal Tıraşı", "Cilt Bakımı", "Çocuk Tıraşı"].map(tag => (
              <button key={tag} className="px-4 py-1.5 bg-slate-50 border border-slate-200 rounded-full text-sm text-slate-600 hover:border-slate-900 hover:text-slate-900 transition">
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Sol Kolon: Yaklaşan Randevular */}
          <div className="md:col-span-1 space-y-6">
            <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
              <Calendar size={20} /> Yaklaşan Randevular
            </h2>
            
            {dbUser?.appointmentsAsCustomer && dbUser.appointmentsAsCustomer.length > 0 ? (
              <div className="space-y-4">
                {dbUser.appointmentsAsCustomer.map(apt => (
                  <div key={apt.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-slate-900">{apt.barber.shopName}</h3>
                        <p className="text-sm text-slate-500">{apt.services.map(s => s.name).join(", ")}</p>
                      </div>
                      <span className="bg-green-50 text-green-700 text-xs font-bold px-2 py-1 rounded-lg">
                        {apt.startTime.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'})}
                      </span>
                    </div>
                    <div className="text-sm text-slate-600 border-t pt-2 mt-2 flex justify-between">
                      <span>{apt.startTime.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</span>
                      <Link href="/customer" className="text-blue-600 hover:underline">Detay</Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white p-6 rounded-xl border border-slate-100 text-center text-slate-500">
                Planlanmış bir randevunuz yok.
              </div>
            )}

            {dbUser?.role !== "BARBER" && (
              <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                <h3 className="font-bold text-indigo-900 mb-2">Berber misiniz?</h3>
                <p className="text-sm text-indigo-700 mb-4">İşletmenizi kaydedin, randevuları yönetin.</p>
                <Link href="/onboarding" className="block w-full bg-indigo-600 text-white text-center py-2 rounded-lg font-medium hover:bg-indigo-700 transition">
                  İşletme Hesabına Geç
                </Link>
              </div>
            )}
          </div>

          {/* Sağ Kolon: Harita ve Öneriler */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                <MapPin size={20} /> Yakındaki Berberler
              </h2>
              <Link href="/map" className="text-sm font-medium text-blue-600 hover:underline">Tümünü Gör</Link>
            </div>

            {nearbyBarbers.length > 0 ? (
              <>
                <div className="h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative group">
                  <MiniMap barbers={nearbyBarbers} />
                  <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition pointer-events-none" />
                  <Link href="/map" className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg text-sm font-bold text-slate-900 hover:bg-slate-50 transition pointer-events-auto">
                    Büyük Haritada Aç
                  </Link>
                </div>

                <h2 className="font-bold text-xl text-slate-900 mt-8">Popüler İşletmeler</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {nearbyBarbers.map(barber => (
                    <Link key={barber.id} href={`/${barber.slug}`} className="bg-white p-4 rounded-xl border border-slate-100 hover:border-slate-300 hover:shadow-md transition group">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition">
                          {barber.shopName[0]}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900">{barber.shopName}</h3>
                          <p className="text-xs text-slate-500 truncate max-w-[150px]">{barber.address || "Adres yok"}</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="bg-white p-10 rounded-2xl border border-slate-100 text-center">
                <p className="text-slate-500 mb-4">Henüz haritada berber bulunmuyor.</p>
                <Link href="/map" className="inline-block bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition">
                  Haritayı Aç
                </Link>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Orijinal Marketing Landing Page Bileşeni
function MarketingLanding() {
  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-50 w-full border-b bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-2xl text-slate-900">
            <div className="bg-slate-900 text-white p-1.5 rounded-lg">
              <Scissors size={24} />
            </div>
            <span>BerberLink</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <Link href="#features" className="hover:text-slate-900 transition">Özellikler</Link>
            <Link href="#pricing" className="hover:text-slate-900 transition">Fiyatlar</Link>
            <Link href="/contact" className="hover:text-slate-900 transition">İletişim</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-slate-900 font-medium hover:underline underline-offset-4"
            >
              Giriş Yap
            </Link>
            <Link
              href="/sign-up"
              className="bg-slate-900 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-900/20"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative pt-20 pb-32 overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-6 border border-blue-100">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                Yeni: Kendi alan adınızı bağlayın!
              </div>
              <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6">
                Berberinizle <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                  Bağlantıda Kalın
                </span>
              </h1>
              <p className="text-xl text-slate-600 mb-10 leading-relaxed max-w-2xl mx-auto">
                Sıra beklemeye son. İstediğiniz berberden, istediğiniz saatte randevunuzu alın. 
                Berberler için modern randevu yönetim sistemi.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/sign-up"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full text-lg font-semibold hover:bg-slate-800 transition shadow-xl shadow-slate-900/20"
                >
                  Hemen Başla <ArrowRight size={20} />
                </Link>
                <Link
                  href="#demo"
                  className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-full text-lg font-semibold hover:bg-slate-50 transition"
                >
                  Örnek Sayfa İncele
                </Link>
              </div>
            </div>
          </div>
          
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 pointer-events-none">
             <div className="absolute top-20 left-10 w-72 h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
             <div className="absolute top-20 right-10 w-72 h-72 bg-yellow-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
             <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
          </div>
        </section>

        <section id="features" className="py-24 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">Neden BerberLink?</h2>
              <p className="text-slate-600 max-w-2xl mx-auto">Hem müşteriler hem de işletme sahipleri için hayatı kolaylaştıran çözümler sunuyoruz.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<Calendar className="w-8 h-8 text-blue-600" />}
                title="7/24 Online Randevu"
                description="Müşterileriniz dükkan kapalıyken bile randevu alabilsin. Telefon trafiğinden kurtulun."
              />
              <FeatureCard 
                icon={<Store className="w-8 h-8 text-indigo-600" />}
                title="Size Özel Web Sitesi"
                description="Kendi alan adınızla (berberahmet.com) profesyonel görünümlü bir web siteniz olsun."
              />
              <FeatureCard 
                icon={<ShieldCheck className="w-8 h-8 text-emerald-600" />}
                title="Güvenilir İşletmeler"
                description="Puanlama ve yorum sistemi ile hizmet kalitenizi gösterin, yeni müşteriler kazanın."
              />
            </div>
          </div>
        </section>

        <section className="py-24 bg-slate-900 text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-4xl font-bold mb-6">İşinizi Büyütmeye Hazır mısınız?</h2>
            <p className="text-slate-300 text-lg mb-10 max-w-2xl mx-auto">
              İlk ay ücretsiz deneyin. Memnun kalmazsanız istediğiniz zaman iptal edin.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center bg-white text-slate-900 px-8 py-4 rounded-full text-lg font-bold hover:bg-slate-100 transition"
            >
              Ücretsiz Hesap Oluştur
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition">
      <div className="mb-4 bg-slate-50 w-16 h-16 rounded-xl flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{title}</h3>
      <p className="text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
