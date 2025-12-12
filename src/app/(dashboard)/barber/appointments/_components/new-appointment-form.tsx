"use client";

import { User, Service, Staff } from "@prisma/client";
import { createAppointment } from "@/actions/appointment";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface NewAppointmentFormProps {
  customers: User[];
  services: Service[];
  staffList: (Staff & { role: { name: string } | null })[];
  profileId: string;
}

export function NewAppointmentForm({
  customers,
  services,
  staffList,
  profileId
}: NewAppointmentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (selectedServiceIds.length === 0) {
      alert("En az bir hizmet seçmelisiniz.");
      setLoading(false);
      return;
    }

    const appointmentDate = new Date(`${date}T${time}`);
    const result = await createAppointment(
      profileId,
      selectedServiceIds,
      appointmentDate,
      selectedStaffId || undefined
    );

    setLoading(false);

    if (result.success) {
      router.push("/barber/appointments/active");
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Müşteri *
          </label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(e.target.value)}
            required
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
          >
            <option value="">Müşteri seçin</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name || customer.email}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Personel
          </label>
          <select
            value={selectedStaffId}
            onChange={(e) => setSelectedStaffId(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
          >
            <option value="">Personel seçin (İşletme geneli)</option>
            {staffList.map((staff) => (
              <option key={staff.id} value={staff.id}>
                {staff.name} {staff.role && `(${staff.role.name})`}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Hizmetler *
          </label>
          <div className="grid md:grid-cols-3 gap-3">
            {services.map((service) => (
              <label
                key={service.id}
                className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  checked={selectedServiceIds.includes(service.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedServiceIds([...selectedServiceIds, service.id]);
                    } else {
                      setSelectedServiceIds(selectedServiceIds.filter(id => id !== service.id));
                    }
                  }}
                  className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                />
                <div>
                  <span className="text-sm font-medium text-slate-700">{service.name}</span>
                  <div className="text-xs text-slate-500">
                    {service.duration} dk - {Number(service.price).toFixed(2)} ₺
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tarih *
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Saat *
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Link
            href="/barber/appointments/active"
            className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            İptal
          </Link>
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
            Randevu Oluştur
          </button>
        </div>
      </form>
    </div>
  );
}

