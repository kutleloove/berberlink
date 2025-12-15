"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Scissors, Search, MapPin, Navigation, X, Calendar, MessageSquare, Star } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
import QuickAppointmentModal from "@/components/ui/quick-appointment-modal";
import { toggleFavorite } from "@/actions/favorite";

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
  isActive: boolean;
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
}

export default function MapPageClient({ barbers, favoriteBarbers = [], mapCenter }: { barbers: Barber[], favoriteBarbers?: Barber[], mapCenter: [number, number] }) {
  const { isLoaded, user } = useUser();
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

  return (
    <div className="flex h-screen w-full overflow-hidden relative">
      {/* Sol Sidebar - Arama ve Liste */}
      <div className={`w-full md:w-96 bg-white border-r border-slate-200 flex flex-col overflow-hidden transition-transform ${
        selectedBarber ? "translate-x-0" : "translate-x-0"
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 bg-white sticky top-0 z-10">
          <div className="flex items-center justify-between mb-4">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
              <Scissors size={20} />
              <span>BerberLink</span>
            </Link>
            <div className="flex items-center gap-2">
              {isLoaded && user && <UserButton afterSignOutUrl="/" />}
            </div>
          </div>
          
          {/* Arama Kutusu */}
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Berber adı veya adres ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 focus:ring-2 focus:ring-slate-900 focus:outline-none text-sm"
            />
          </div>
        </div>

        {/* Sonuçlar Listesi veya Seçili Berber Detayı */}
        <div className="flex-1 overflow-y-auto">
          {selectedBarber ? (
            // Seçili Berber Detay Paneli
            <div className="p-4">
              <button
                onClick={() => setSelectedBarber(null)}
                className="mb-4 flex items-center gap-2 text-slate-600 hover:text-slate-900 text-sm"
              >
                <X size={18} />
                Geri Dön
              </button>

              <div className="space-y-4">
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center font-bold text-3xl text-slate-400">
                      {selectedBarber.shopName[0]}
                    </div>
                    <button
                      onClick={async () => {
                        if (!selectedBarber) return;
                        const result = await toggleFavorite(selectedBarber.id);
                        if (result && !result.error) {
                          setFavoriteStatus(prev => ({
                            ...prev,
                            [selectedBarber.id]: result.isFavorite,
                          }));
                        }
                      }}
                      className={`p-2.5 rounded-xl transition-all duration-200 ${
                        favoriteStatus[selectedBarber.id]
                          ? "bg-amber-100 text-amber-600 hover:bg-amber-200 shadow-sm"
                          : "bg-slate-100 text-slate-400 hover:text-amber-500 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 shadow-sm"
                      }`}
                      title={favoriteStatus[selectedBarber.id] ? "Favorilerden çıkar" : "Favorilere ekle"}
                    >
                      <Star 
                        className={`w-5 h-5 transition-transform duration-200 ${favoriteStatus[selectedBarber.id] ? "fill-current scale-110" : ""}`} 
                      />
                    </button>
                  </div>
                  <h2 className="text-2xl font-bold text-slate-900 mb-2">{selectedBarber.shopName}</h2>
                  {selectedBarber.address && (
                    <div className="flex items-start gap-2 text-slate-600 mb-4">
                      <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                      <span>{selectedBarber.address}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setIsAppointmentModalOpen(true);
                    }}
                    className="w-full bg-slate-900 text-white text-center py-3 rounded-xl font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                  >
                    <Calendar size={18} />
                    Randevu Al
                  </button>
                  
                  {selectedBarber.latitude && selectedBarber.longitude && (
                    <button 
                      onClick={() => {
                        const url = `https://www.google.com/maps/dir/?api=1&destination=${selectedBarber.latitude},${selectedBarber.longitude}`;
                        window.open(url, '_blank');
                      }}
                      className="w-full border border-slate-300 text-slate-900 text-center py-3 rounded-xl font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2"
                    >
                      <Navigation size={18} />
                      Yol Tarifi
                    </button>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-200">
                  <h3 className="font-semibold text-slate-900 mb-3">Hakkında</h3>
                  <p className="text-sm text-slate-600">
                    {selectedBarber.address || "Henüz bir açıklama eklenmemiş."}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            // Berber Listesi
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-900">
                  {searchQuery.trim() ? "Sonuçlar" : favoriteBarbers.length > 0 ? "Favori Berberler" : "Tüm Berberler"}
                </h2>
                <span className="text-sm text-slate-500">{filteredBarbers.length} berber</span>
              </div>

              {filteredBarbers.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="mb-2">Berber bulunamadı</p>
                  <p className="text-sm">Arama kriterlerinizi değiştirmeyi deneyin</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredBarbers.map(barber => {
                    if (!barber.latitude || !barber.longitude) return null;
                    
                    return (
                      <div
                        key={barber.id}
                        onClick={() => setSelectedBarber(barber)}
                        className={`p-4 rounded-xl border cursor-pointer transition ${
                          selectedBarber?.id === barber.id
                            ? "border-slate-900 bg-slate-50"
                            : "border-slate-200 hover:border-slate-300 hover:shadow-sm"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-400 flex-shrink-0">
                            {barber.shopName[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-bold text-slate-900 mb-1">{barber.shopName}</h3>
                            {barber.address && (
                              <div className="flex items-start gap-1 text-xs text-slate-500 mb-2">
                                <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-2">{barber.address}</span>
                              </div>
                            )}
                            {barber.workingHours && barber.workingHours.length > 0 && (
                              <p className="text-xs text-slate-500">
                                Çalışma:{" "}
                                {barber.workingHours
                                  .filter((wh) => !wh.isClosed)
                                  .map((wh) => `${["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"][wh.dayOfWeek]} ${wh.startTime}-${wh.endTime}`)
                                  .slice(0, 1)
                                  .join(", ") || "Kapalı"}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-2">
                              {!barber.isActive && (
                                <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded">
                                  Pasif
                                </span>
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
      <div className="flex-1 relative">
        {/* Mobilde: Seçili berber varsa detay paneli aşağıdan açılır */}
        {selectedBarber && (
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 rounded-t-2xl shadow-2xl z-50 max-h-[70vh] overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900">{selectedBarber.shopName}</h2>
                <button
                  onClick={() => setSelectedBarber(null)}
                  className="p-2 hover:bg-slate-100 rounded-full"
                >
                  <X size={20} />
                </button>
              </div>
              {selectedBarber.address && (
                <div className="flex items-start gap-2 text-slate-600 mb-4">
                  <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{selectedBarber.address}</span>
                </div>
              )}
              <div className="space-y-3">
                <button
                  onClick={() => window.open(`/${selectedBarber.slug}`, "_blank")}
                  className="w-full bg-slate-900 text-white text-center py-3 rounded-xl font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2"
                >
                  <Calendar size={18} />
                  Randevu Al (Panel)
                </button>
                <button className="w-full border border-slate-300 text-slate-900 text-center py-3 rounded-xl font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2">
                  <Navigation size={18} />
                  Yol Tarifi
                </button>
                <button className="w-full border border-slate-300 text-slate-900 text-center py-3 rounded-xl font-medium hover:bg-slate-50 transition flex items-center justify-center gap-2">
                  <MessageSquare size={18} />
                  Mesaj Gönder
                </button>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-3 mt-4">
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Çalışma Saatleri</h3>
                  {selectedBarber.workingHours && selectedBarber.workingHours.length > 0 ? (
                    <ul className="text-sm text-slate-700 space-y-1">
                      {selectedBarber.workingHours.map((wh) => (
                        <li key={wh.dayOfWeek} className="flex justify-between">
                          <span>{["Paz","Pzt","Sal","Çar","Per","Cum","Cmt"][wh.dayOfWeek]}</span>
                          <span>{wh.isClosed ? "Kapalı" : `${wh.startTime} - ${wh.endTime}`}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-slate-500">Bilgi yok</p>
                  )}
                </div>

                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Hakkında</h3>
                  <p className="text-sm text-slate-600">
                    {selectedBarber.address || "Henüz bir açıklama eklenmemiş."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <FullScreenMap 
          barbers={filteredBarbers} 
          center={effectiveCenter}
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
    </div>
  );
}
