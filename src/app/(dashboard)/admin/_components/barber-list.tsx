"use client";

import { toggleBarberStatus, addSubscription } from "@/actions/admin";
import { useState } from "react";
import { MoreHorizontal, ShieldCheck, Ban, CalendarPlus } from "lucide-react";

interface Barber {
  id: string;
  shopName: string;
  slug: string;
  isActive: boolean;
  subscriptionEndsAt: Date | null;
  user: {
    email: string;
    name: string | null;
  };
  _count: {
    appointments: number;
  };
}

export function BarberList({ barbers }: { barbers: Barber[] }) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleToggleStatus(id: string, currentStatus: boolean) {
    if (!confirm(currentStatus ? "Berberi engellemek istiyor musunuz?" : "Berberi aktif etmek istiyor musunuz?")) return;
    setLoading(id);
    await toggleBarberStatus(id, !currentStatus);
    setLoading(null);
  }

  async function handleAddSubscription(id: string) {
    const months = prompt("Kaç ay eklemek istiyorsunuz?", "12");
    if (!months) return;
    
    setLoading(id);
    await addSubscription(id, parseInt(months));
    setLoading(null);
    alert("Süre eklendi.");
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
          <tr>
            <th className="px-6 py-4 font-semibold">İşletme</th>
            <th className="px-6 py-4 font-semibold">Yetkili</th>
            <th className="px-6 py-4 font-semibold">Randevular</th>
            <th className="px-6 py-4 font-semibold">Abonelik Bitiş</th>
            <th className="px-6 py-4 font-semibold">Durum</th>
            <th className="px-6 py-4 font-semibold text-right">İşlemler</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {barbers.map((barber) => (
            <tr key={barber.id} className="hover:bg-slate-50 transition">
              <td className="px-6 py-4">
                <div className="font-medium text-slate-900">{barber.shopName}</div>
                <div className="text-xs text-slate-500">/{barber.slug}</div>
              </td>
              <td className="px-6 py-4">
                <div className="text-slate-900">{barber.user.name}</div>
                <div className="text-xs text-slate-500">{barber.user.email}</div>
              </td>
              <td className="px-6 py-4 text-slate-600">
                {barber._count.appointments}
              </td>
              <td className="px-6 py-4 text-slate-600">
                {barber.subscriptionEndsAt 
                  ? new Date(barber.subscriptionEndsAt).toLocaleDateString('tr-TR')
                  : <span className="text-red-500">Yok</span>
                }
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                  ${barber.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                  {barber.isActive ? "Aktif" : "Pasif"}
                </span>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2">
                  <button 
                    onClick={() => handleAddSubscription(barber.id)}
                    disabled={loading === barber.id}
                    title="Süre Ekle"
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                  >
                    <CalendarPlus size={18} />
                  </button>
                  <button 
                    onClick={() => handleToggleStatus(barber.id, barber.isActive)}
                    disabled={loading === barber.id}
                    title={barber.isActive ? "Engelle" : "Aktif Et"}
                    className={`p-2 rounded-lg transition ${
                      barber.isActive ? "text-red-600 hover:bg-red-50" : "text-green-600 hover:bg-green-50"
                    }`}
                  >
                    {barber.isActive ? <Ban size={18} /> : <ShieldCheck size={18} />}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

