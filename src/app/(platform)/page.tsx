import Link from "next/link";
import { ArrowRight, Scissors, Calendar, Store, ShieldCheck, MapPin, Search, Clock } from "lucide-react";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import MiniMap from "@/components/ui/mini-map";
import { Footer } from "@/components/ui/footer";

export default async function LandingPage() {
  const session = await getSession();

  // Eğer kullanıcı giriş yapmamışsa, klasik Landing Page göster
  if (!session?.userId) {
    return <MarketingLanding />;
  }

  // Giriş yapmış kullanıcı için veri çekelim
  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
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
    take: 4,
    select: { id: true, shopName: true, slug: true, address: true, latitude: true, longitude: true, photos: true }
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-gold-500 selection:text-white">
      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl text-white">
            <div className="bg-gradient-to-br from-gold-400 to-gold-600 text-slate-950 p-1.5 rounded-lg shadow-lg shadow-gold-500/20">
              <Scissors size={20} />
            </div>
            <span>BerberLink</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">
              Panelim
            </Link>
            <Link href="/map" className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-sm font-medium text-white hover:bg-white/10 hover:border-gold-500/30 transition-all group">
              <MapPin size={16} className="text-gold-400 group-hover:scale-110 transition-transform" />
              Haritada Ara
            </Link>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Karşılama */}
        <div className="mb-10 relative">
          <div className="absolute -left-20 -top-20 w-64 h-64 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <h1 className="text-3xl font-display font-bold text-white relative z-10">
            Merhaba, <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 animate-shimmer">{dbUser?.name}</span> 👋
          </h1>
          <p className="text-slate-400 mt-2 text-lg relative z-10">Bugün tarzını yenilemek için harika bir gün!</p>
        </div>

        {/* Arama Kutusu */}
        <div className="bg-white/5 p-8 rounded-3xl border border-white/5 shadow-2xl shadow-black/50 mb-12 backdrop-blur-md relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <div className="relative max-w-2xl mx-auto z-10">
            <Search className="absolute left-5 top-4 text-gold-500" size={24} />
            <input
              type="text"
              placeholder="Berber adı, semt veya hizmet ara..."
              className="w-full pl-14 pr-6 py-4 rounded-2xl bg-slate-900/50 border border-white/10 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 outline-none text-white placeholder:text-slate-500 transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-center mt-6 relative z-10">
            {["Saç Kesimi", "Sakal Tıraşı", "Cilt Bakımı", "Çocuk Tıraşı"].map(tag => (
              <button key={tag} className="px-5 py-2 bg-white/5 border border-white/5 rounded-full text-sm font-medium text-slate-300 hover:border-gold-500/50 hover:text-gold-400 hover:bg-gold-500/10 transition-all duration-300">
                {tag}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Sol Kolon: Yaklaşan Randevular */}
          <div className="md:col-span-1 space-y-6">
            <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
              <Calendar className="text-gold-400" size={24} />
              Yaklaşan Randevular
            </h2>

            {dbUser?.appointmentsAsCustomer && dbUser.appointmentsAsCustomer.length > 0 ? (
              <div className="space-y-4">
                {dbUser.appointmentsAsCustomer.map(apt => (
                  <div key={apt.id} className="bg-slate-900 border border-white/10 p-5 rounded-2xl shadow-lg hover:border-gold-500/30 transition-all group">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-white group-hover:text-gold-400 transition-colors">{apt.barber.shopName}</h3>
                        <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                          <MapPin size={12} /> {apt.barber.address || "Adres yok"}
                        </p>
                      </div>
                      <div className="bg-gold-500/20 text-gold-400 px-3 py-1 rounded-full text-xs font-bold border border-gold-500/20">
                        {new Date(apt.startTime).toLocaleDateString("tr-TR", { day: 'numeric', month: 'short' })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-300 mb-3 bg-white/5 p-2 rounded-lg">
                      <Clock size={14} className="text-gold-500" />
                      {new Date(apt.startTime).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <Link href={`/${apt.barber.slug}`} className="block w-full text-center bg-white/5 hover:bg-gold-500 hover:text-slate-950 text-white py-2 rounded-xl text-sm font-semibold transition-all duration-300">
                      Detayları Gör
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/50 border border-white/5 border-dashed rounded-2xl p-8 text-center">
                <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-600">
                  <Calendar size={24} />
                </div>
                <p className="text-slate-400 font-medium">Planlanmış randevunuz yok.</p>
                <Link href="/map" className="inline-block mt-4 text-gold-400 hover:text-gold-300 text-sm font-semibold hover:underline">
                  Hemen randevu al &rarr;
                </Link>
              </div>
            )}

            {dbUser?.role !== "BARBER" && (
              <div className="bg-indigo-900/20 p-6 rounded-2xl border border-indigo-500/20 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl -mr-10 -mt-10 transition-all duration-500 group-hover:bg-indigo-500/20"></div>
                <h3 className="font-display font-bold text-indigo-300 mb-2 relative z-10">Berber misiniz?</h3>
                <p className="text-sm text-indigo-200/70 mb-5 relative z-10">İşletmenizi kaydedin, randevuları modern bir sistemle yönetin.</p>
                <Link href="/onboarding" className="block w-full bg-indigo-600 text-white text-center py-3 rounded-xl font-medium hover:bg-indigo-500 transition shadow-lg shadow-indigo-500/20 relative z-10">
                  İşletme Hesabına Geç
                </Link>
              </div>
            )}
          </div>

          {/* Sağ Kolon: Harita ve Öneriler */}
          <div className="md:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-xl text-white flex items-center gap-2">
                <Store className="text-blue-400" size={24} />
                Yakındaki Popüler Berberler
              </h2>
              <Link href="/map" className="text-sm text-gold-400 hover:text-gold-300 font-medium hover:underline">
                Tümünü Gör
              </Link>
            </div>

            {/* Mini Harita */}
            <div className="bg-slate-900 rounded-3xl overflow-hidden border border-white/10 shadow-2xl h-[250px] relative group cursor-pointer">
              <MiniMap barbers={nearbyBarbers} />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent pointer-events-none" />
              <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                <div>
                  <h3 className="text-white font-bold text-lg mb-1">Haritada Keşfet</h3>
                  <p className="text-slate-300 text-sm">Konumuna özel en iyi berberleri gör</p>
                </div>
                <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/10 group-hover:bg-gold-500 group-hover:text-slate-950 text-white transition-all duration-300 transform group-hover:scale-110 shadow-lg">
                  <ArrowRight size={24} />
                </div>
              </div>
              <Link href="/map" className="absolute inset-0 z-10" aria-label="Haritayı aç"></Link>
            </div>

            {/* Liste */}
            {nearbyBarbers.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {nearbyBarbers.map(barber => (
                  <Link key={barber.id} href={`/${barber.slug}`} className="bg-slate-900 border border-white/10 p-4 rounded-2xl flex gap-4 hover:border-gold-500/30 hover:bg-white/5 transition-all group">
                    <div className="w-16 h-16 bg-slate-800 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 relative">
                      {barber.photos && barber.photos.length > 0 ? (
                        <img src={barber.photos[0]} alt={barber.shopName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          <Store size={24} />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-white truncate group-hover:text-gold-400 transition-colors">{barber.shopName}</h3>
                      <p className="text-sm text-slate-400 truncate flex items-center gap-1 mt-1">
                        <MapPin size={12} /> {barber.address || "Adres yok"}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center gap-1 text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                          <ShieldCheck size={10} /> 4.8
                        </div>
                        <span className="text-xs font-bold text-white bg-slate-800 group-hover:bg-gold-500 group-hover:text-slate-950 px-3 py-1 rounded-full transition-colors ml-auto border border-white/5">
                          Randevu Al
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="bg-slate-900/50 p-10 rounded-2xl border border-white/10 text-center">
                <p className="text-slate-500 mb-4">Henüz haritada berber bulunmuyor.</p>
                <Link href="/map" className="inline-block bg-slate-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-gold-500 hover:text-slate-950 transition">
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

// Orijinal Marketing Landing Page Bileşeni - Yenilenmiş Premium Tasarım
function MarketingLanding() {
  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-white selection:bg-gold-500 selection:text-white font-sans">

      {/* Navbar */}
      <header className="fixed top-0 z-50 w-full border-b border-white/10 bg-slate-950/80 backdrop-blur-md transition-all">
        <div className="container mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 font-display font-bold text-2xl text-white">
            <div className="bg-gradient-to-br from-gold-400 to-gold-600 text-slate-950 p-2 rounded-xl shadow-lg shadow-gold-500/20">
              <Scissors size={24} />
            </div>
            <span>BerberLink</span>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <Link href="#features" className="hover:text-gold-400 transition-colors">Özellikler</Link>
            <Link href="#how-it-works" className="hover:text-gold-400 transition-colors">Nasıl Çalışır?</Link>
            <Link href="#pricing" className="hover:text-gold-400 transition-colors">Fiyatlar</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-white font-medium hover:text-gold-400 transition-colors"
            >
              Giriş Yap
            </Link>
            <Link
              href="/sign-up"
              className="bg-white text-slate-950 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-gold-400 hover:text-white transition-all shadow-lg hover:shadow-gold-500/20"
            >
              Kayıt Ol
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* Hero Section */}
        <section className="relative h-screen min-h-[800px] flex items-center justify-center overflow-hidden">
          {/* Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="/hero-bg.png"
              alt="Luxury Barber Shop"
              className="w-full h-full object-cover scale-105 animate-slow-zoom"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-slate-950"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_0%,rgba(2,6,23,1)_100%)]"></div>
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 text-gold-400 text-sm font-medium mb-8 backdrop-blur-sm animate-fade-in-up">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-gold-500"></span>
              </span>
              Yeni Nesil Randevu Sistemi
            </div>

            <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-tight animate-fade-in-up delay-100">
              Tarzınızı <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 animate-shimmer">
                Mükemmelleştirin
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-slate-300 mb-12 leading-relaxed max-w-2xl mx-auto font-light animate-fade-in-up delay-200">
              Sıra beklemeye son. Şehrin en iyi berberlerinden saniyeler içinde randevu alın.
              İşletmeniz için modern yönetim paneli.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
              <Link
                href="/sign-up"
                className="group relative w-full sm:w-auto flex items-center justify-center gap-3 bg-gold-500 text-white px-8 py-4 rounded-full text-lg font-bold hover:bg-gold-600 transition-all shadow-xl shadow-gold-500/20 overflow-hidden"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:animate-shine" />
                <span>Hemen Başla</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="#demo"
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white/5 text-white border border-white/10 px-8 py-4 rounded-full text-lg font-medium hover:bg-white/10 transition backdrop-blur-sm"
              >
                Keşfet
              </Link>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-32 bg-slate-950 relative overflow-hidden">
          {/* Background Decoration */}
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent"></div>

          <div className="container mx-auto px-4 relative z-10">
            <div className="text-center mb-20">
              <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-6">Neden BerberLink?</h2>
              <p className="text-slate-400 text-lg max-w-2xl mx-auto">
                Hem müşteriler hem de işletme sahipleri için tasarlanmış, teknoloji ve estetiğin buluşma noktası.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Calendar className="w-8 h-8 text-gold-400" />}
                title="7/24 Online Randevu"
                description="Müşterileriniz dükkan kapalıyken bile randevu alabilsin. Telefon trafiğinden kurtulun, işinize odaklanın."
              />
              <FeatureCard
                icon={<Store className="w-8 h-8 text-blue-400" />}
                title="Premium Web Sitesi"
                description="Kendi alan adınızla (berberahmet.com) tamamen özelleştirilebilir, modern ve mobil uyumlu bir web siteniz olsun."
              />
              <FeatureCard
                icon={<ShieldCheck className="w-8 h-8 text-emerald-400" />}
                title="Güven & Prestij"
                description="Onaylı işletme rozeti, gerçek müşteri yorumları ve puanlama sistemi ile kaliteniziHerkese gösterin."
              />
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-brand-900">
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
          </div>

          <div className="container mx-auto px-4 text-center relative z-10">
            <h2 className="font-display text-4xl md:text-6xl font-bold text-white mb-8">
              Geleceğin Berber Deneyimi
            </h2>
            <p className="text-slate-300 text-xl mb-12 max-w-3xl mx-auto font-light">
              İlk ay tamamen ücretsiz deneyin. Memnun kalmazsanız tek tıkla iptal edin. Kart bilgisi gerekmez.
            </p>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center bg-white text-slate-900 px-10 py-5 rounded-full text-xl font-bold hover:bg-gold-400 hover:text-white transition-all shadow-2xl hover:shadow-gold-500/30 transform hover:-translate-y-1"
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
    <div className="group bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-gold-500/30 hover:bg-white/10 transition-all duration-300 hover:-translate-y-2">
      <div className="mb-6 bg-white/5 w-16 h-16 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 border border-white/5 group-hover:border-gold-500/20">
        {icon}
      </div>
      <h3 className="font-display text-2xl font-bold text-white mb-4 group-hover:text-gold-400 transition-colors">{title}</h3>
      <p className="text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
        {description}
      </p>
    </div>
  );
}
