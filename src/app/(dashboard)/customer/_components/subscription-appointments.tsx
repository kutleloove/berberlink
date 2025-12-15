"use client";

import { useState, useEffect } from "react";
import { Repeat, X, Calendar, Clock, User, Scissors, AlertCircle } from "lucide-react";
import { getSubscriptionAppointments, cancelSubscriptionAppointment, cancelSubscriptionAppointmentDate, rescheduleSubscriptionAppointmentDate } from "@/actions/subscription-appointment";
import { Loader2 } from "lucide-react";

interface SubscriptionAppointment {
  id: string;
  recurrenceType: "DAILY" | "WEEKLY" | "MONTHLY";
  startDate: Date;
  endDate: Date | null;
  time: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  barber: {
    id: string;
    shopName: string;
    slug: string;
  };
  staff: {
    id: string;
    name: string;
  } | null;
  services: {
    id: string;
    name: string;
    duration: number;
    price: number;
  }[];
  exceptions: {
    id: string;
    originalDate: Date;
    exceptionType: string;
    newDate: Date | null;
    newTime: string | null;
  }[];
}

export function SubscriptionAppointments() {
  const [subscriptions, setSubscriptions] = useState<SubscriptionAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<string | null>(null);
  const [showRescheduleModal, setShowRescheduleModal] = useState<{ subscriptionId: string; date: Date } | null>(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    setLoading(true);
    const data = await getSubscriptionAppointments();
    setSubscriptions(data as any);
    setLoading(false);
  };

  const handleCancelSubscription = async (subscriptionId: string) => {
    if (!confirm("Bu abonelik randevusunu iptal etmek istediğinizden emin misiniz?")) {
      return;
    }

    setCancelling(subscriptionId);
    const result = await cancelSubscriptionAppointment(subscriptionId);
    setCancelling(null);

    if (result.success) {
      alert("Abonelik randevusu iptal edildi.");
      loadSubscriptions();
    } else {
      alert(result.error || "Abonelik randevusu iptal edilemedi.");
    }
  };

  const handleCancelDate = async (subscriptionId: string, date: Date) => {
    if (!confirm("Bu randevuyu iptal etmek istediğinizden emin misiniz?")) {
      return;
    }

    setCancelling(subscriptionId);
    const result = await cancelSubscriptionAppointmentDate(subscriptionId, date);
    setCancelling(null);

    if (result.success) {
      alert("Randevu iptal edildi.");
      loadSubscriptions();
    } else {
      alert(result.error || "Randevu iptal edilemedi.");
    }
  };

  const handleReschedule = async () => {
    if (!showRescheduleModal || !newDate || !newTime) return;

    setRescheduling(showRescheduleModal.subscriptionId);
    const result = await rescheduleSubscriptionAppointmentDate(
      showRescheduleModal.subscriptionId,
      showRescheduleModal.date,
      new Date(newDate),
      newTime
    );
    setRescheduling(null);
    setShowRescheduleModal(null);
    setNewDate("");
    setNewTime("");

    if (result.success) {
      alert("Randevu başarıyla değiştirildi.");
      loadSubscriptions();
    } else {
      alert(result.error || "Randevu değiştirilemedi.");
    }
  };

  const getRecurrenceLabel = (subscription: SubscriptionAppointment) => {
    const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    
    switch (subscription.recurrenceType) {
      case "DAILY":
        return "Her gün";
      case "WEEKLY":
        return subscription.dayOfWeek !== null 
          ? `Her ${dayNames[subscription.dayOfWeek]}`
          : "Haftalık";
      case "MONTHLY":
        return subscription.dayOfMonth !== null
          ? `Her ayın ${subscription.dayOfMonth}'i`
          : "Aylık";
      default:
        return "Tekrarlayan";
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <Loader2 className="animate-spin mx-auto mb-4 text-slate-400" size={32} />
        <p className="text-slate-500">Yükleniyor...</p>
      </div>
    );
  }

  if (subscriptions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
        <Repeat className="w-5 h-5" />
        Abonelik Randevularım
      </h2>

      <div className="space-y-4">
        {subscriptions.map((subscription) => (
          <div
            key={subscription.id}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {subscription.barber.shopName}
                  </h3>
                  <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    {getRecurrenceLabel(subscription)}
                  </span>
                </div>
                <div className="space-y-1 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>{subscription.time}</span>
                  </div>
                  {subscription.staff && (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      <span>{subscription.staff.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Scissors className="w-4 h-4" />
                    <span>{subscription.services.map(s => s.name).join(", ")}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(subscription.startDate).toLocaleDateString('tr-TR')} -{" "}
                      {subscription.endDate
                        ? new Date(subscription.endDate).toLocaleDateString('tr-TR')
                        : "Süresiz"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleCancelSubscription(subscription.id)}
                disabled={cancelling === subscription.id}
                className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
              >
                {cancelling === subscription.id ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Aboneliği İptal Et"
                )}
              </button>
            </div>

            {subscription.exceptions.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-200">
                <h4 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  İstisnalar
                </h4>
                <div className="space-y-2">
                  {subscription.exceptions.map((exception) => (
                    <div
                      key={exception.id}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-slate-600">
                          {new Date(exception.originalDate).toLocaleDateString('tr-TR')}
                        </span>
                        {exception.exceptionType === "CANCELLED" && (
                          <span className="text-red-600 font-medium">İptal Edildi</span>
                        )}
                        {exception.exceptionType === "RESCHEDULED" && exception.newDate && (
                          <span className="text-blue-600 font-medium">
                            → {new Date(exception.newDate).toLocaleDateString('tr-TR')}{" "}
                            {exception.newTime}
                          </span>
                        )}
                      </div>
                      {exception.exceptionType === "CANCELLED" && (
                        <button
                          onClick={() => handleCancelDate(subscription.id, new Date(exception.originalDate))}
                          disabled={cancelling === subscription.id}
                          className="text-xs text-red-600 hover:text-red-700"
                        >
                          Zaten İptal
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Randevu Tarihini Değiştir
            </h3>
            <div className="space-y-4">
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
                onClick={() => {
                  setShowRescheduleModal(null);
                  setNewDate("");
                  setNewTime("");
                }}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition"
              >
                İptal
              </button>
              <button
                onClick={handleReschedule}
                disabled={!newDate || !newTime || rescheduling === showRescheduleModal.subscriptionId}
                className="px-4 py-2 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition disabled:opacity-50"
              >
                {rescheduling === showRescheduleModal.subscriptionId ? (
                  <Loader2 className="animate-spin" size={16} />
                ) : (
                  "Değiştir"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


