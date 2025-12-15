"use client";

import { Appointment, Staff } from "@prisma/client";
import { Calendar, User, Scissors, Edit, X, Clock, AlertCircle, Repeat } from "lucide-react";
import { useState } from "react";
import { reassignAppointment, cancelAppointment, changeAppointmentStaff } from "@/actions/appointments";
import { AppointmentReassignModal } from "./appointment-reassign-modal";

interface AppointmentListProps {
  appointments: (Appointment & {
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
    }[];
    pendingChange: {
      id: string;
      newStartTime: Date;
      newEndTime: Date;
      newStaffId: string | null;
      reason: string | null;
      isApproved: boolean;
      isRejected: boolean;
    } | null;
    subscriptionAppointment: {
      id: string;
      recurrenceType: string;
    } | null;
  })[];
  staffList: Staff[];
}

export function AppointmentList({ appointments, staffList }: AppointmentListProps) {
  const [reassigningId, setReassigningId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<typeof appointments[0] | null>(null);

  const handleCancel = async (id: string) => {
    if (!confirm("Bu randevuyu iptal etmek istediğinize emin misiniz?")) return;
    
    const result = await cancelAppointment(id);
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
  };

  if (appointments.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <p className="text-slate-500">Henüz randevu bulunmuyor.</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        {appointments.map((appointment) => (
          <div
            key={appointment.id}
            className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-md transition"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  {appointment.customer.image ? (
                    <img
                      src={appointment.customer.image}
                      alt={appointment.customer.name || "Müşteri"}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                      <User size={20} className="text-slate-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold text-slate-900">
                      {appointment.customer.name || "İsimsiz Müşteri"}
                    </h3>
                    <p className="text-sm text-slate-500">{appointment.customer.email}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-slate-600">
                    <Calendar size={18} />
                    <span className="text-sm">
                      {new Date(appointment.startTime).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>
                  </div>
                  {appointment.staff && (
                    <div className="flex items-center gap-2 text-slate-600">
                      <User size={18} />
                      <span className="text-sm">{appointment.staff.name}</span>
                    </div>
                  )}
                  {appointment.subscriptionAppointment && (
                    <div className="flex items-center gap-2 text-blue-600">
                      <Repeat size={18} />
                      <span className="text-sm font-medium">Abone Randevusu</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-600">
                    <Scissors size={18} />
                    <div className="flex flex-wrap gap-1">
                      {appointment.services.map((service) => (
                        <span
                          key={service.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700"
                        >
                          {service.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {appointment.pendingChange && !appointment.pendingChange.isApproved && !appointment.pendingChange.isRejected && (
                  <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
                    <AlertCircle size={18} />
                    <span>Müşteri onayı bekleniyor: {new Date(appointment.pendingChange.newStartTime).toLocaleDateString('tr-TR')}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => {
                    setSelectedAppointment(appointment);
                    setReassigningId(appointment.id);
                  }}
                  className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                  title="Düzenle"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleCancel(appointment.id)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                  title="İptal Et"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {reassigningId && selectedAppointment && (
        <AppointmentReassignModal
          appointment={selectedAppointment}
          staffList={staffList}
          onClose={() => {
            setReassigningId(null);
            setSelectedAppointment(null);
          }}
        />
      )}
    </>
  );
}

