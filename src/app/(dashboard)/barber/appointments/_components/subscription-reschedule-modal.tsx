"use client";

import { useState } from "react";
import { X, Loader2 } from "lucide-react";
import { barberRescheduleSubscriptionAppointmentDate } from "@/actions/subscription-appointment";

interface SubscriptionRescheduleModalProps {
  subscriptionId: string;
  originalDate: Date;
  barberId: string;
  onClose: () => void;
}

export function SubscriptionRescheduleModal({
  subscriptionId,
  originalDate,
  barberId,
  onClose,
}: SubscriptionRescheduleModalProps) {
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [loading, setLoading] = useState(false);

  const handleReschedule = async () => {
    if (!newDate || !newTime) {
      alert("Lütfen yeni tarih ve saat seçin.");
      return;
    }

    setLoading(true);
    const result = await barberRescheduleSubscriptionAppointmentDate(
      subscriptionId,
      originalDate,
      new Date(newDate),
      newTime,
      barberId
    );
    setLoading(false);

    if (result.success) {
      alert("Randevu başarıyla değiştirildi.");
      onClose();
      window.location.reload();
    } else {
      alert(result.error || "Randevu değiştirilemedi.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-900">Randevu Tarihini Değiştir</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Mevcut Tarih
            </label>
            <input
              type="text"
              value={new Date(originalDate).toLocaleDateString('tr-TR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
              disabled
              className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Yeni Tarih
            </label>
            <input
              type="date"
              value={newDate}
              onChange={(e) => setNewDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Yeni Saat
            </label>
            <input
              type="time"
              value={newTime}
              onChange={(e) => setNewTime(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            İptal
          </button>
          <button
            onClick={handleReschedule}
            disabled={!newDate || !newTime || loading}
            className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading && <Loader2 className="animate-spin" size={16} />}
            Değiştir
          </button>
        </div>
      </div>
    </div>
  );
}


