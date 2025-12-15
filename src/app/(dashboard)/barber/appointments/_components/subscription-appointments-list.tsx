"use client";

import { Staff } from "@prisma/client";
import { Repeat, X, Calendar, User, Scissors, Edit, Loader2, Clock } from "lucide-react";
import { useState } from "react";
import { barberCancelSubscriptionAppointment, barberRescheduleSubscriptionAppointmentDate } from "@/actions/subscription-appointment";
import { SubscriptionRescheduleModal } from "./subscription-reschedule-modal";

interface SubscriptionAppointment {
  id: string;
  recurrenceType: "DAILY" | "WEEKLY" | "MONTHLY";
  startDate: Date;
  endDate: Date | null;
  time: string;
  dayOfWeek: number | null;
  dayOfMonth: number | null;
  customer: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
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
  generatedAppointments: {
    id: string;
    startTime: Date;
    endTime: Date;
    status: string;
  }[];
}

interface SubscriptionAppointmentsListProps {
  subscriptions: SubscriptionAppointment[];
  staffList: Staff[];
  barberId: string;
}

export function SubscriptionAppointmentsList({ subscriptions, staffList, barberId }: SubscriptionAppointmentsListProps) {
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [rescheduling, setRescheduling] = useState<{ subscriptionId: string; date: Date } | null>(null);

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

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm("Bu abonelik randevusunu iptal etmek istediğinizden emin misiniz?")) {
      return;
    }

    setCancelling(subscriptionId);
    const result = await barberCancelSubscriptionAppointment(subscriptionId, barberId);
    setCancelling(null);

    if (result.success) {
      alert("Abonelik randevusu iptal edildi.");
      window.location.reload();
    } else {
      alert(result.error || "Abonelik randevusu iptal edilemedi.");
    }
  };

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <p className="text-slate-500">Henüz abonelik randevusu bulunmuyor.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {subscriptions.map((subscription) => (
          <div
            key={subscription.id}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  {subscription.customer.image ? (
                    <img
                      src={subscription.customer.image}
                      alt={subscription.customer.name || "Müşteri"}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                      <User size={20} className="text-slate-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {subscription.customer.name || "İsimsiz Müşteri"}
                    </h3>
                    <p className="text-sm text-slate-500">{subscription.customer.email}</p>
                  </div>
                  <span className="bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Repeat size={12} />
                    {getRecurrenceLabel(subscription)}
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Clock size={18} />
                    <span className="text-sm">{subscription.time}</span>
                  </div>
                  {subscription.staff && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <User size={18} />
                      <span className="text-sm">{subscription.staff.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Scissors size={18} />
                    <div className="flex flex-wrap gap-1">
                      {subscription.services.map((service) => (
                        <span
                          key={service.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={18} />
                    <span className="text-sm">
                      {new Date(subscription.startDate).toLocaleDateString('tr-TR')} -{" "}
                      {subscription.endDate
                        ? new Date(subscription.endDate).toLocaleDateString('tr-TR')
                        : "Süresiz"}
                    </span>
                  </div>
                </div>

                {subscription.generatedAppointments.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">Gelecek Randevular</h4>
                    <div className="space-y-2">
                      {subscription.generatedAppointments.slice(0, 5).map((apt) => (
                        <div
                          key={apt.id}
                          className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-sm"
                        >
                          <span className="text-slate-600">
                            {new Date(apt.startTime).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <button
                            onClick={() => setRescheduling({ subscriptionId: subscription.id, date: new Date(apt.startTime) })}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            Taşı
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {subscription.exceptions.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <h4 className="text-sm font-semibold text-slate-900 mb-2">İstisnalar</h4>
                    <div className="space-y-2">
                      {subscription.exceptions.map((exception) => (
                        <div
                          key={exception.id}
                          className="flex items-center justify-between p-2 bg-amber-50 rounded-lg text-sm"
                        >
                          <span className="text-slate-600">
                            {new Date(exception.originalDate).toLocaleDateString('tr-TR')}
                            {exception.exceptionType === "RESCHEDULED" && exception.newDate && (
                              <span className="text-blue-600 ml-2">
                                → {new Date(exception.newDate).toLocaleDateString('tr-TR')} {exception.newTime}
                              </span>
                            )}
                            {exception.exceptionType === "CANCELLED" && (
                              <span className="text-red-600 ml-2">(İptal)</span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => handleCancel(subscription.id)}
                  disabled={cancelling === subscription.id}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                  title="İptal Et"
                >
                  {cancelling === subscription.id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <X size={18} />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rescheduling && (
        <SubscriptionRescheduleModal
          subscriptionId={rescheduling.subscriptionId}
          originalDate={rescheduling.date}
          barberId={barberId}
          onClose={() => setRescheduling(null)}
        />
      )}
    </>
  );
}

