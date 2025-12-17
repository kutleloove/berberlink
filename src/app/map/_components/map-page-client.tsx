"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Scissors, Search, MapPin, Navigation, X, Calendar, MessageSquare, Star } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { UserButton } from "@/components/auth/user-button";
import QuickAppointmentModal from "@/components/ui/quick-appointment-modal";
import { toggleFavorite } from "@/actions/favorite";
import { Lightbox } from "@/components/ui/lightbox";

const FullScreenMap = dynamic(() => import("@/components/ui/fullscreen-map"), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-500">Harita Yükleniyor...</div>
});

interface Service {
  id: string;
  name: string;
  duration: number;
  price: string;
}

interface Barber {
  id: string;
  shopName: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  isActive?: boolean;
  averageRating: number | null;
  logoUrl?: string | null;
  isFavorite?: boolean;
  services?: Service[];
  workingHours?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    isClosed: boolean;
  }[];
  photos?: string[];
}

export default function MapPageClient({ barbers, favoriteBarbers = [], mapCenter, isAuthenticated }: { barbers: Barber[], favoriteBarbers?: Barber[], mapCenter: [number, number], isAuthenticated: boolean }) {
  // const { isLoaded, user } = useUser(); // Removed Clerk hook
  const user = isAuthenticated ? { id: "current" } : null; // Mock user existence for logic if needed, or rely on isAuthenticated
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [favoriteStatus, setFavoriteStatus] = useState<Record<string, boolean>>(() => {
    const status: Record<string, boolean> = {};
    barbers.forEach(barber => {
      if (barber.isFavorite !== undefined) {
        status[barber.id] = barber.isFavorite;
      }
    });
    return status;
  });

  // Lightbox State
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // selectedBarber değiştiğinde favori durumunu güncelle
  useEffect(() => {
    if (selectedBarber && selectedBarber.isFavorite !== undefined) {
      setFavoriteStatus(prev => ({
        ...prev,
        [selectedBarber.id]: selectedBarber.isFavorite!,
      }));
    }
  }, [selectedBarber]);

  // Arama filtresi
  const filteredBarbers = useMemo(() => {
    if (!searchQuery.trim()) {
      // Arama yapılmamışken favori berberleri göster
      return favoriteBarbers.length > 0 ? favoriteBarbers : barbers;
    }

    const query = searchQuery.toLowerCase();
    return barbers.filter(b =>
      b.shopName.toLowerCase().includes(query) ||
      (b.address && b.address.toLowerCase().includes(query))
    );
  }, [barbers, favoriteBarbers, searchQuery]);

  // Hiç berber yokken, kullanıcının konumunu iste ve haritayı yakınında aç
  useEffect(() => {
    if (barbers.length === 0 && favoriteBarbers.length === 0 && typeof window !== "undefined" && "geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation([pos.coords.latitude, pos.coords.longitude]);
        },
        () => {
          // Kullanıcı reddederse veya hata olursa, İstanbul (mapCenter) kullanılmaya devam edilir
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
        }
      );
    }
  }, [barbers.length, favoriteBarbers.length]);

  const effectiveCenter: [number, number] =
    selectedBarber && selectedBarber.latitude && selectedBarber.longitude
      ? [selectedBarber.latitude, selectedBarber.longitude]
      : userLocation || mapCenter;

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setIsLightboxOpen(true);
  }

  return (
    <div className="flex h-screen w-full overflow-hidden relative font-sans bg-slate-950">
      {/* Sol Sidebar - Arama ve Liste */}
      <div className={`w-full md:w-96 bg-slate-900/95 backdrop-blur-md border-r border-slate-800 flex flex-col overflow-hidden transition-transform z-20 shadow-2xl ${selectedBarber ? "translate-x-0" : "translate-x-0"
        }`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 sticky top-0 z-10 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2 font-display font-bold text-xl text-white hover:text-gold-400 transition-colors">
              <div className="bg-gold-500 text-slate-900 p-1 rounded-lg">
                <Scissors size={20} />
              </div>
              <span className="tracking-tight">BerberLink</span>
            </Link>
            <div className="flex items-center gap-2">
              {isAuthenticated && <UserButton />}
            </div>
          </div>

          {/* Arama Kutusu */}
          <div className="relative group">
            <Search className="absolute left-3 top-3 text-slate-500 group-hover:text-gold-400 transition-colors" size={18} />
            <input
              type="text"
              placeholder="Berber adı veya adres ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 placeholder:text-slate-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500 focus:outline-none text-sm transition-all"
            />
          </div>
        </div>

        {/* Sonuçlar Listesi veya Seçili Berber Detayı */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {selectedBarber ? (
            // Seçili Berber Detay Paneli
            <div className="p-0">
              {/* Hero Section */}
              <div className="relative">
                {selectedBarber.photos && selectedBarber.photos.length > 0 ? (
                  <div
                    className="aspect-video w-full bg-slate-800 cursor-pointer group relative overflow-hidden"
                    onClick={() => openLightbox(0)}
                  >
                    <img
                      src={selectedBarber.photos[0]}
                      alt={selectedBarber.shopName}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-80"></div>
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 backdrop-blur-[1px]">
                      <span className="text-white text-xs font-bold uppercase tracking-wider border border-white/30 px-3 py-1 rounded-full backdrop-blur-md">Galeriyi Aç</span>
                    </div>
                  </div>
                ) : (
                  <div className="aspect-video w-full bg-slate-800 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '16px 16px' }}></div>
                    <Scissors size={48} className="text-slate-600" />
                  </div>
                )}

                <button
                  onClick={() => setSelectedBarber(null)}
                  className="absolute top-4 left-4 p-2 bg-slate-900/50 hover:bg-slate-900 border border-white/10 rounded-full text-white backdrop-blur-md transition-all z-10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-5 -mt-6 relative">
                <div className="bg-slate-800/80 backdrop-blur-xl border border-white/5 rounded-2xl p-4 shadow-xl">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h2 className="text-2xl font-display font-bold text-white mb-1 leading-tight">{selectedBarber.shopName}</h2>
                      {selectedBarber.address && (
                        <div className="flex items-start gap-1.5 text-slate-400 text-sm">
                          <MapPin size={14} className="mt-0.5 flex-shrink-0 text-gold-500" />
                          <span className="line-clamp-2">{selectedBarber.address}</span>
                        </div>
                      )}
                    </div>
                    {selectedBarber.logoUrl ? (
                      <div className="w-14 h-14 rounded-xl border-2 border-slate-700 shadow-lg overflow-hidden flex-shrink-0 bg-slate-900 ml-3">
                        <img src={selectedBarber.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-14 h-14 bg-slate-700 rounded-xl flex items-center justify-center font-bold text-xl text-slate-400 border-2 border-slate-600 ml-3 shadow-lg">
                        {selectedBarber.shopName[0]}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex items-center gap-1 bg-gold-500/10 px-2 py-1 rounded-lg border border-gold-500/20">
                      <Star size={14} className="fill-gold-400 text-gold-400" />
                      <span className="text-gold-400 font-bold text-xs">{selectedBarber.averageRating || "Yeni"}</span>
                    </div>
                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (!selectedBarber) return;
                        const result = await toggleFavorite(selectedBarber.id);
                        if (result && !result.error) {
                          setFavoriteStatus(prev => ({
                            ...prev,
                            [selectedBarber.id]: result.isFavorite,
                          }));
                        }
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border transition-all text-xs font-medium ${favoriteStatus[selectedBarber.id]
                        ? "bg-red-500/10 border-red-500/30 text-red-400"
                        : "bg-slate-700/50 border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-white"
                        }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${favoriteStatus[selectedBarber.id] ? "fill-current" : ""}`} />
                      {favoriteStatus[selectedBarber.id] ? "Favorilerde" : "Favorile"}
                    </button>
                  </div>

                  {/* Photos Preview */}
                  {selectedBarber.photos && selectedBarber.photos.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-2">
                      {selectedBarber.photos.slice(1).map((photo, index) => (
                        <div
                          key={index}
                          onClick={() => openLightbox(index + 1)}
                          className="w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border border-slate-600 cursor-pointer hover:border-gold-500 transition-colors"
                        >
                          <img src={photo} alt="Thumb" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button
                      onClick={() => setIsAppointmentModalOpen(true)}
                      className="bg-gold-500 text-slate-900 py-3 rounded-xl font-bold text-sm hover:bg-gold-400 transition shadow-lg shadow-gold-500/20 flex items-center justify-center gap-2"
                    >
                      <Calendar size={16} /> Randevu
                    </button>
                    <button
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedBarber.latitude},${selectedBarber.longitude}`;
                        window.open(url, '_blank');
                      }}
                      className="bg-slate-700 text-white py-3 rounded-xl font-medium text-sm hover:bg-slate-600 transition border border-slate-600 flex items-center justify-center gap-2"
                    >
                      <Navigation size={16} /> Yol Tarifi
                    </button>
                  </div>
                </div>

                <div className="mt-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Çalışma Saatleri</h3>
                    {selectedBarber.workingHours && selectedBarber.workingHours.length > 0 ? (
                      <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4 space-y-2">
                        {selectedBarber.workingHours.map((wh) => (
                          <div key={wh.dayOfWeek} className="flex justify-between text-sm">
                            <span className="text-slate-400">{["Paz", "Pzt", "Sal", "Çar", "Per", "Cum", "Cmt"][wh.dayOfWeek]}</span>
                            <span className={wh.isClosed ? "text-red-400" : "text-slate-200"}>{wh.isClosed ? "Kapalı" : `${wh.startTime} - ${wh.endTime}`}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-500 italic">Bilgi bulunmuyor.</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // Berber Listesi
            <div className="p-4">
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="font-display font-semibold text-slate-200">
                  {searchQuery.trim() ? "Arama Sonuçları" : favoriteBarbers.length > 0 ? "Favorilerim" : "Tüm Berberler"}
                </h2>
                <span className="text-xs font-medium bg-slate-800 text-slate-400 px-2 py-1 rounded-md border border-slate-700">{filteredBarbers.length}</span>
              </div>

              {filteredBarbers.length === 0 ? (
                <div className="text-center py-16 px-4">
                  <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-600">
                    <Search size={24} />
                  </div>
                  <h3 className="text-slate-200 font-medium mb-1">Berber Bulunamadı</h3>
                  <p className="text-sm text-slate-500">Arama kriterlerinizi değiştirerek tekrar deneyin.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBarbers.map(barber => {
                    if (!barber.latitude || !barber.longitude) return null;

                    return (
                      <div
                        key={barber.id}
                        onClick={() => setSelectedBarber(barber)}
                        className={`p-3 rounded-xl border cursor-pointer transition-all group ${selectedBarber?.id === barber.id
                          ? "border-gold-500 bg-slate-800 shadow-md ring-1 ring-gold-500/20"
                          : "border-slate-800 bg-slate-900/40 hover:bg-slate-800 hover:border-slate-700"
                          }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            {barber.logoUrl ? (
                              <div className="w-16 h-16 bg-slate-800 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0 group-hover:border-slate-500 transition-colors">
                                <img src={barber.logoUrl} alt="Logo" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-16 h-16 bg-gradient-to-br from-slate-800 to-slate-900 rounded-lg flex items-center justify-center font-display font-bold text-slate-500 flex-shrink-0 border border-slate-800 group-hover:text-gold-400 transition-colors">
                                {barber.shopName[0]}
                              </div>
                            )}
                            {barber.averageRating && (
                              <div className="absolute -bottom-2 -right-2 bg-slate-900 border border-slate-700 text-[10px] font-bold text-gold-400 px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                                <Star size={8} className="fill-current" /> {barber.averageRating}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0 pt-0.5">
                            <h3 className="font-display font-bold text-slate-200 group-hover:text-white transition-colors truncate">{barber.shopName}</h3>
                            {barber.address && (
                              <div className="flex items-start gap-1 text-xs text-slate-500 mt-1 mb-2">
                                <MapPin size={12} className="mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-1">{barber.address}</span>
                              </div>
                            )}

                            <div className="flex items-center gap-2">
                              {barber.workingHours && barber.workingHours.find(w => w.dayOfWeek === new Date().getDay() && !w.isClosed) ? (
                                <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-400/20">Açık</span>
                              ) : (
                                <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">Kapalı</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Sağ Taraf - Harita */}
      <div className="flex-1 relative z-10">
        {/* Mobilde: Seçili berber varsa detay paneli aşağıdan açılır - DARK MODE TASARIMI GEREKİR AMA ŞİMDİLİK KISACA GEÇELİM */}
        {selectedBarber && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 rounded-t-3xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
            {/* Mobile Detail View reused or simplified */}
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-bold text-xl">{selectedBarber.shopName}</h2>
                <button onClick={() => setSelectedBarber(null)} className="p-2 bg-slate-800 rounded-full text-white"><X size={20} /></button>
              </div>
              {/* ... content similar to desktop sidebar ... */}
              <button onClick={() => setIsAppointmentModalOpen(true)} className="w-full bg-gold-500 text-slate-900 font-bold py-3 rounded-xl mb-4">Randevu Al</button>
            </div>
          </div>
        )}

        <FullScreenMap
          barbers={filteredBarbers}
          center={effectiveCenter}
          darkMode={true}
          userLocation={userLocation || undefined}
          selectedBarberId={selectedBarber?.id}
          onMarkerClick={(barber) => {
            if (!barber) {
              setSelectedBarber(null);
              return;
            }
            setSelectedBarber(barber);
            // Favori durumunu güncelle
            if (barber.isFavorite !== undefined) {
              setFavoriteStatus(prev => ({
                ...prev,
                [barber.id]: barber.isFavorite,
              }));
            }
          }}
          onBookAppointment={(barber) => {
            setSelectedBarber(barber);
            setIsAppointmentModalOpen(true);
          }}
        />
      </div>

      {/* Quick Appointment Modal */}
      {selectedBarber && isAppointmentModalOpen && (
        <QuickAppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => {
            setIsAppointmentModalOpen(false);
          }}
          barberId={selectedBarber.id}
          barberName={selectedBarber.shopName}
          services={selectedBarber.services || []}
        />
      )}

      {/* Lightbox for Gallery */}
      {selectedBarber && selectedBarber.photos && (
        <Lightbox
          images={selectedBarber.photos}
          isOpen={isLightboxOpen}
          onClose={() => setIsLightboxOpen(false)}
          initialIndex={lightboxIndex}
        />
      )}
    </div>
  );
}

