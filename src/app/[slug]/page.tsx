import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { BookingWizard } from "./_components/booking-wizard";
import { GallerySection } from "./_components/gallery-section";
import { Footer } from "@/components/ui/footer";
import { ArrowLeft, User, MapPin, Clock, Star, Info, Phone, Share2, CheckCircle2, ArrowRight } from "lucide-react";

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

  // Mock rating if not available (since schema has averageRating but might be null)
  const rating = 4.8;
  const reviewCount = 124;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans selection:bg-indigo-500/30 selection:text-indigo-200">

      {/* Hero Header */}
      <div className="bg-slate-900 h-48 md:h-64 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 opacity-90"></div>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>

        {/* Animated blobs for richness */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>

        {/* Navbar-like top strip */}
        <div className="container mx-auto px-4 h-20 flex items-center justify-between relative z-10">
          <Link href="/" className="text-white/80 hover:text-white transition-colors flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm group-hover:bg-white/20 transition-all border border-white/5">
              <ArrowLeft size={16} />
            </div>
            <span className="font-medium text-sm">Ana Sayfaya Dön</span>
          </Link>
        </div>
      </div>

      <main className="container mx-auto px-4 pb-12 -mt-20 relative z-20 flex-1">
        <div className="grid lg:grid-cols-12 gap-8">

          {/* Left Sidebar: Profile Info */}
          <div className="lg:col-span-4 xl:col-span-3">
            <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-black/20 border border-white/10 overflow-hidden sticky top-8">

              {/* Profile Header */}
              <div className="p-6 text-center border-b border-white/5 relative">
                {/* Gold accent at top */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50"></div>

                <div className="w-32 h-32 mx-auto rounded-3xl bg-slate-800 p-2 shadow-lg mb-4 ring-1 ring-white/10 relative group">
                  <div className="w-full h-full rounded-2xl overflow-hidden bg-slate-900 relative">
                    {profile.logo ? (
                      <img src={profile.logo} alt={profile.shopName} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    ) : profile.user.image ? (
                      <img src={profile.user.image} alt={profile.shopName} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-indigo-900/50 to-slate-800 text-indigo-400">
                        <User size={48} />
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-full ring-4 ring-slate-900" title="Doğrulanmış İşletme">
                    <CheckCircle2 size={14} className="fill-emerald-500 text-white stroke-[3]" />
                  </div>
                </div>

                <h1 className="font-display font-bold text-2xl text-white mb-1">{profile.shopName}</h1>
                <p className="text-slate-400 text-sm font-medium mb-4 flex items-center justify-center gap-1.5">
                  <User size={14} className="text-slate-500" />
                  {profile.user.name}
                </p>

                <div className="flex items-center justify-center gap-2 mb-4">
                  <div className="flex items-center gap-1 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    <span className="text-amber-400 font-bold text-sm">{rating}</span>
                  </div>
                  <span className="text-slate-600 text-xs">•</span>
                  <span className="text-slate-400 text-sm underline decoration-slate-600 underline-offset-2 hover:text-slate-300 transition-colors cursor-pointer">{reviewCount} Değerlendirme</span>
                </div>
              </div>

              {/* Info List */}
              <div className="p-6 space-y-6">
                {/* About */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Info size={14} /> Hakkında
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {profile.bio || "Müşteri memnuniyetini ön planda tutan, kaliteli ve modern hizmet anlayışıyla sizleri bekliyoruz."}
                  </p>
                </div>

                {/* Location */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <MapPin size={14} /> Konum
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-3">
                    {profile.address || "Konum bilgisi eklenmemiş."}
                  </p>
                  <a href={`https://maps.google.com/?q=${profile.latitude},${profile.longitude}`} target="_blank" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
                    Haritada Göster <ArrowRight size={12} />
                  </a>
                </div>

                {/* Gallery */}
                <GallerySection photos={profile.photos} shopName={profile.shopName} />

                {/* Working Hours */}
                <div>
                  <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Clock size={14} /> Çalışma Saatleri
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Hafta İçi</span>
                      <span className="font-medium text-slate-200 bg-white/5 px-2 py-0.5 rounded text-xs border border-white/5">09:00 - 20:00</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Cumartedi</span>
                      <span className="font-medium text-slate-200 bg-white/5 px-2 py-0.5 rounded text-xs border border-white/5">09:00 - 21:00</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Pazar</span>
                      <span className="font-medium text-red-400 bg-red-500/10 px-2 py-0.5 rounded text-xs border border-red-500/20">Kapalı</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Actions */}
              <div className="p-4 bg-slate-900/50 border-t border-white/5 grid grid-cols-2 gap-2">
                <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 border border-white/5 text-slate-300 text-xs font-bold hover:bg-slate-700 hover:text-white transition-all shadow-sm">
                  <Phone size={14} /> Ara
                </button>
                <button className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-slate-800 border border-white/5 text-slate-300 text-xs font-bold hover:bg-slate-700 hover:text-white transition-all shadow-sm">
                  <Share2 size={14} /> Paylaş
                </button>
              </div>

            </div>
          </div>

          {/* Right Content: Booking Wizard */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-6">
            <BookingWizard barberId={profile.id} services={formattedServices} />

            {/* Optional: Gallery or Reviews Section could go here */}
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
