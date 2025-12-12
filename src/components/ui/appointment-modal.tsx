"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { BookingWizard } from "@/app/[slug]/_components/booking-wizard";

interface AppointmentModalProps {
  barberId: string;
  barberName: string;
  services: Array<{
    id: string;
    name: string;
    duration: number;
    price: string | number;
  }>;
  isOpen: boolean;
  onClose: () => void;
}

export default function AppointmentModal({
  barberId,
  barberName,
  services,
  isOpen,
  onClose,
}: AppointmentModalProps) {
  // Modal açıldığında body scroll'unu engelle
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - Desktop'ta yarı saydam, mobilde tam opak */}
      <div
        className="fixed inset-0 bg-black/50 md:bg-black/30 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div
        className={`
          fixed z-50 bg-white
          md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2
          md:rounded-2xl md:shadow-2xl md:max-w-2xl md:w-full md:max-h-[85vh] md:min-h-[400px] md:overflow-y-auto
          bottom-0 left-0 right-0 top-0
          flex flex-col
          animate-slide-up md:animate-fade-in
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-200 px-4 md:px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Randevu Al</h2>
            <p className="text-sm text-slate-500 mt-0.5">{barberName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="Kapat"
          >
            <X size={24} className="text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6">
          {services.length > 0 ? (
            <BookingWizard barberId={barberId} services={services} onSuccess={onClose} />
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-600 mb-4">Bu berber için henüz hizmet tanımlanmamış.</p>
              <a
                href={`/${barberId}`}
                className="inline-block bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-slate-800 transition"
              >
                Berber Profiline Git
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

