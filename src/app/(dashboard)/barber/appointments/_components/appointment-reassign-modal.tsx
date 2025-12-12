"use client";

import { Appointment, Staff } from "@prisma/client";
import { X, Save, Loader2 } from "lucide-react";
import { useState } from "react";
import { reassignAppointment } from "@/actions/appointments";

interface AppointmentReassignModalProps {
  appointment: Appointment & {
    customer: {
      id: string;
      name: string | null;
      email: string;
    };
    staff: {
      id: string;
      name: string;
    } | null;
    services: {
      id: string;
      name: string;
    }[];
  };
  staffList: Staff[];
  onClose: () => void;
}

export function AppointmentReassignModal({
  appointment,
  staffList,
  onClose
}: AppointmentReassignModalProps) {
  const [loading, setLoading] = useState(false);
  const [newStaffId, setNewStaffId] = useState(appointment.staffId || "");
  const [newDate, setNewDate] = useState(
    new Date(appointment.startTime).toISOString().split('T')[0]
  );
  const [newTime, setNewTime] = useState(
    new Date(appointment.startTime).toTimeString().slice(0, 5)
  );
  const [reason, setReason] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const newStartTime = new Date(`${newDate}T${newTime}`);
    const totalDuration = appointment.services.reduce((acc, s) => acc + s.duration, 0);
    const newEndTime = new Date(newStartTime.getTime() + totalDuration * 60000);

    const result = await reassignAppointment(
      appointment.id,
      newStaffId || null,
      newStartTime,
      newEndTime,
      reason || undefined
    );

    setLoading(false);

    if (result.success) {
      if (result.requiresApproval) {
        alert("Randevu değişikliği müşteri onayına gönderildi. Müşteri onayladıktan sonra geçerli olacak.");
      }
      window.location.reload();
      onClose();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-900">Randevu Düzenle</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Personel
            </label>
            <select
              value={newStaffId}
              onChange={(e) => setNewStaffId(e.target.value)}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            >
              <option value="">Personel seçin (İşletme geneli)</option>
              {staffList.map((staff) => (
                <option key={staff.id} value={staff.id}>
                  {staff.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Tarih
              </label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Saat
              </label>
              <input
                type="time"
                value={newTime}
                onChange={(e) => setNewTime(e.target.value)}
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Değişiklik Nedeni (Opsiyonel)
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              placeholder="Müşteriye gönderilecek değişiklik nedeni..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <Save size={18} />
              )}
              Kaydet
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

