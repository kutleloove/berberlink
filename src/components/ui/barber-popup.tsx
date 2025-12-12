"use client";

import Link from "next/link";
import { Star, MapPin } from "lucide-react";
import { useState, useEffect } from "react";
import { toggleFavorite, getFavoriteStatus } from "@/actions/favorite";

interface BarberPopupProps {
  barber: {
    id: string;
    shopName: string;
    slug: string;
    address: string | null;
    logoUrl?: string | null;
    averageRating: number | null;
  };
  onBookAppointment?: (barber: BarberPopupProps['barber']) => void;
}

export default function BarberPopup({ barber, onBookAppointment }: BarberPopupProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Start as false to show UI immediately
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Check favorite status on mount (non-blocking)
    getFavoriteStatus(barber.id)
      .then((status) => {
        setIsFavorite(status);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Error loading favorite status:", error);
        setIsLoading(false);
      });
  }, [barber.id]);

  // Show loading state only if not mounted yet
  if (!mounted) {
    return (
      <div className="w-full p-4" style={{ width: '280px', minWidth: '280px', maxWidth: '280px' }}>
        <div className="animate-pulse">
          <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-slate-200 rounded w-1/2"></div>
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
    <div className="w-full" style={{ width: '280px', minWidth: '280px', maxWidth: '280px' }}>
      {/* Header with logo and favorite */}
      <div className="relative bg-gradient-to-br from-slate-50 to-slate-100 p-4 rounded-t-lg">
        <div className="flex items-start gap-3">
          {/* Logo */}
          <div className="w-16 h-16 rounded-xl bg-white border-2 border-slate-200 overflow-hidden flex-shrink-0 shadow-sm">
            {barber.logoUrl ? (
              <img 
                src={barber.logoUrl} 
                alt={barber.shopName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600 font-bold text-xl">
                {barber.shopName[0]?.toUpperCase() || "B"}
              </div>
            )}
          </div>

          {/* Shop name and rating */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-slate-900 mb-1 line-clamp-2">
              {barber.shopName}
            </h3>
            
            {/* Rating */}
            {hasRating && (
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-slate-700">
                  {rating.toFixed(1)}
                </span>
                <span className="text-xs text-slate-500">/ 5.0</span>
              </div>
            )}
          </div>

          {/* Favorite button */}
          <button
            onClick={handleFavoriteClick}
            disabled={isLoading}
            className={`flex-shrink-0 p-2 rounded-lg transition-all ${
              isFavorite
                ? "bg-amber-50 text-amber-500 hover:bg-amber-100"
                : "bg-white text-slate-400 hover:text-amber-500 hover:bg-amber-50 border border-slate-200"
            } ${isLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            title={isFavorite ? "Favorilerden çıkar" : "Favorilere ekle"}
          >
            <Star 
              className={`w-5 h-5 ${isFavorite ? "fill-current" : ""}`} 
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Address */}
        {barber.address && (
          <div className="flex items-start gap-2 text-sm text-slate-600">
            <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-slate-400" />
            <span className="line-clamp-2">{barber.address}</span>
          </div>
        )}

        {/* Book button */}
        {onBookAppointment ? (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onBookAppointment(barber);
            }}
            className="block w-full bg-slate-900 text-white text-center py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
          >
            Randevu Al
          </button>
        ) : (
          <Link 
            href={`/${barber.slug}`}
            className="block w-full bg-slate-900 text-white text-center py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            Randevu Al
          </Link>
        )}
      </div>
    </div>
  );
}

