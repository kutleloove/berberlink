import Link from "next/link";
import { Star, MapPin, Calendar, X, ArrowRight, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { toggleFavorite } from "@/actions/favorite";
import QuickAppointmentModal from "./quick-appointment-modal";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: string;
}

interface BarberPopupProps {
  barber: {
    id: string;
    shopName: string;
    slug: string;
    address: string | null;
    logoUrl?: string | null;
    averageRating: number | null;
    services?: Service[];
    latitude: number | null;
    longitude: number | null;
    photos?: string[];
  };
  onBookAppointment?: (barber: BarberPopupProps['barber']) => void;
  isFavorite?: boolean;
  onClose?: () => void;
}

export default function BarberPopup({ barber, onBookAppointment, isFavorite: initialIsFavorite, onClose }: BarberPopupProps) {
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite || false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // barber prop'u değiştiğinde isFavorite state'ini güncelle
  useEffect(() => {
    setIsFavorite(initialIsFavorite || false);
  }, [initialIsFavorite]);

  if (!mounted) {
    return (
      <div className="w-full p-0" style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}>
        <div className="animate-pulse bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-white/5">
          <div className="h-24 bg-slate-800"></div>
          <div className="p-5 space-y-4">
            <div className="h-4 bg-slate-800 rounded w-3/4"></div>
            <div className="h-4 bg-slate-800 rounded w-1/2"></div>
            <div className="h-10 bg-slate-800 rounded-xl mt-4"></div>
          </div>
        </div>
      </div>
    );
  }

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setIsLoading(true);
    const result = await toggleFavorite(barber.id);
    if (result && !result.error) {
      setIsFavorite(result.isFavorite ?? false);
    }
    setIsLoading(false);
  };

  const rating = barber.averageRating || 0;
  const hasRating = barber.averageRating !== null && barber.averageRating > 0;

  // Use first photo for header background if available
  const headerImage = barber.photos && barber.photos.length > 0 ? barber.photos[0] : null;

  return (
    <div className="w-full p-0 font-sans" style={{ width: '320px', minWidth: '320px', maxWidth: '320px' }}>
      <div className="bg-slate-900/95 backdrop-blur-md rounded-2xl overflow-hidden shadow-2xl border border-white/10 ring-1 ring-black/20">
        {/* Header Image / Pattern */}
        <div className="relative h-32 bg-slate-950 overflow-hidden">
          {headerImage ? (
            <div className="absolute inset-0">
              <img src={headerImage} alt={barber.shopName} className="w-full h-full object-cover opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent"></div>
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-slate-950 to-indigo-950 opacity-90"></div>
              <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '20px 20px' }}></div>
            </>
          )}

          {/* Close Button */}
          {onClose && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-3 right-3 p-1.5 bg-black/40 hover:bg-black/60 text-white/90 hover:text-white rounded-full backdrop-blur-sm transition-all z-10 border border-white/10"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Profile Info overlap */}
        <div className="px-5 pb-5 -mt-12 relative">
          <div className="flex justify-between items-end mb-3">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl bg-slate-900 p-1 shadow-lg ring-1 ring-white/10">
                <div className="w-full h-full rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center relative">
                  {barber.logoUrl ? (
                    <img
                      src={barber.logoUrl}
                      alt={barber.shopName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-slate-600">
                      {barber.shopName[0]?.toUpperCase() || "B"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mb-1">
              <button
                onClick={handleFavoriteClick}
                disabled={isLoading}
                className={`p-2 rounded-xl transition-all ${isFavorite
                  ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 border border-amber-500/30"
                  : "bg-slate-800 text-slate-400 hover:text-white border border-slate-700 hover:bg-slate-700"
                  } shadow-sm backdrop-blur-sm`}
                title={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
              >
                <Star className={`w-4 h-4 ${isFavorite ? "fill-current" : ""}`} />
              </button>

              <Link
                href={`/${barber.slug}`}
                className="p-2 rounded-xl bg-slate-800 text-blue-400 border border-slate-700 hover:bg-slate-700 hover:text-blue-300 hover:border-slate-600 shadow-sm transition-all backdrop-blur-sm"
                title="Profili Görüntüle"
              >
                <ExternalLink size={16} />
              </Link>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-lg text-white leading-tight">
                {barber.shopName}
              </h3>
              {hasRating && (
                <div className="flex items-center gap-1 bg-amber-500/10 px-1.5 py-0.5 rounded text-xs font-bold text-amber-400 border border-amber-500/20">
                  <Star size={10} className="fill-current" />
                  {rating.toFixed(1)}
                </div>
              )}
            </div>

            {barber.address && (
              <div className="flex items-start gap-1.5 text-xs text-slate-400 leading-relaxed">
                <MapPin size={12} className="mt-0.5 flex-shrink-0 opacity-70" />
                <span className="line-clamp-2">{barber.address}</span>
              </div>
            )}
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsAppointmentModalOpen(true);
            }}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-xl text-sm font-semibold shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 group border border-indigo-500/30"
          >
            <Calendar className="w-4 h-4" />
            <span>Randevu Al</span>
            <ArrowRight size={14} className="opacity-70 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      {/* Quick Appointment Modal */}
      {mounted && isAppointmentModalOpen && createPortal(
        <QuickAppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => setIsAppointmentModalOpen(false)}
          barberId={barber.id}
          barberName={barber.shopName}
          services={barber.services || []}
        />,
        document.body
      )}
    </div>
  );
}
