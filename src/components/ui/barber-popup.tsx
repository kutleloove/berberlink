"use client";

import Link from "next/link";
import { Star, MapPin, Calendar } from "lucide-react";
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
  };
  onBookAppointment?: (barber: BarberPopupProps['barber']) => void;
  isFavorite?: boolean;
}

export default function BarberPopup({ barber, onBookAppointment, isFavorite: initialIsFavorite }: BarberPopupProps) {
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

  // Modal state değişikliğini debug et
  useEffect(() => {
    console.log("BarberPopup: isAppointmentModalOpen changed to", isAppointmentModalOpen);
  }, [isAppointmentModalOpen]);

  if (!mounted) {
    return (
      <div className="w-full p-0" style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}>
        <div className="animate-pulse bg-white rounded-xl overflow-hidden shadow-lg">
          <div className="h-20 bg-gradient-to-r from-slate-100 to-slate-200"></div>
          <div className="p-4 space-y-3">
            <div className="h-4 bg-slate-200 rounded w-3/4"></div>
            <div className="h-4 bg-slate-200 rounded w-1/2"></div>
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
      setIsFavorite(result.isFavorite);
    }
    setIsLoading(false);
  };

  const rating = barber.averageRating || 0;
  const hasRating = barber.averageRating !== null && barber.averageRating > 0;

  return (
    <div className="w-full p-0" style={{ width: '300px', minWidth: '300px', maxWidth: '300px' }}>
      <div className="bg-white rounded-xl overflow-hidden shadow-xl border border-slate-100">
        {/* Header with gradient background */}
        <div className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-5 border-b border-slate-100">
          <div className="flex items-start gap-4">
            {/* Logo with better styling */}
            <div className="relative w-20 h-20 rounded-2xl bg-white border-3 border-white shadow-lg overflow-hidden flex-shrink-0 ring-2 ring-slate-100">
              {barber.logoUrl ? (
                <img 
                  src={barber.logoUrl} 
                  alt={barber.shopName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-2xl">
                  {barber.shopName[0]?.toUpperCase() || "B"}
                </div>
              )}
            </div>

            {/* Shop name and rating */}
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="font-bold text-lg text-slate-900 mb-2 line-clamp-2 leading-tight">
                {barber.shopName}
              </h3>
              
              {/* Rating with improved design */}
              {hasRating && (
                <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm px-2.5 py-1 rounded-full w-fit">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-slate-900">
                    {rating.toFixed(1)}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">/ 5.0</span>
                </div>
              )}
            </div>

            {/* Favorite button with improved design */}
            <button
              onClick={handleFavoriteClick}
              disabled={isLoading}
              className={`flex-shrink-0 p-2.5 rounded-xl transition-all duration-200 ${
                isFavorite
                  ? "bg-amber-100 text-amber-600 hover:bg-amber-200 shadow-sm"
                  : "bg-white/80 backdrop-blur-sm text-slate-400 hover:text-amber-500 hover:bg-amber-50 border border-slate-200 hover:border-amber-200 shadow-sm"
              } ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
              title={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
            >
              <Star 
                className={`w-5 h-5 transition-transform duration-200 ${isFavorite ? "fill-current scale-110" : ""}`} 
              />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 bg-white">
          {/* Address with improved styling */}
          {barber.address && (
            <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex-shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-slate-500" />
              </div>
              <span className="text-sm text-slate-700 leading-relaxed line-clamp-2 font-medium">
                {barber.address}
              </span>
            </div>
          )}

          {/* Book button with improved design */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log("Randevu Al button clicked", { 
                hasOnBookAppointment: !!onBookAppointment, 
                barberId: barber.id,
                servicesCount: barber.services?.length || 0,
                currentState: isAppointmentModalOpen
              });
              
              // Modal'ı aç - callback'i çağırmadan önce
              console.log("Setting modal state to true...");
              setIsAppointmentModalOpen(true);
              
              // Callback'i çağırma - çünkü bu map-page-client'taki state'i güncelliyor
              // ve barber-popup'taki state ile çakışıyor
              // if (onBookAppointment) {
              //   console.log("Calling onBookAppointment callback");
              //   onBookAppointment(barber);
              // }
            }}
            className="w-full bg-gradient-to-r from-slate-900 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white text-center py-3.5 rounded-xl text-sm font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span>Randevu Al</span>
          </button>
        </div>
      </div>

      {/* Quick Appointment Modal - Portal ile render et */}
      {mounted && isAppointmentModalOpen && createPortal(
        <QuickAppointmentModal
          isOpen={isAppointmentModalOpen}
          onClose={() => {
            console.log("Closing modal from BarberPopup");
            setIsAppointmentModalOpen(false);
          }}
          barberId={barber.id}
          barberName={barber.shopName}
          services={barber.services || []}
        />,
        document.body
      )}
    </div>
  );
}

