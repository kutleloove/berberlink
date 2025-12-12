"use client";

import { deleteService } from "@/actions/service";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: string; // Serialized Decimal (string)
}

export function ServiceList({ services }: { services: Service[] }) {
  const router = useRouter();

  async function handleDelete(id: string) {
    if (!confirm("Bu hizmeti silmek istediğinize emin misiniz?")) return;
    await deleteService(id);
    router.refresh();
  }

  if (services.length === 0) {
    return <p className="text-slate-500 text-sm">Henüz hizmet eklenmemiş.</p>;
  }

  return (
    <div className="space-y-3">
      {services.map(service => (
        <div key={service.id} className="bg-white p-4 rounded-xl border border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">{service.name}</h3>
            <p className="text-sm text-slate-500">{service.duration} dk • {parseFloat(service.price).toFixed(2)} ₺</p>
          </div>
          <button 
            onClick={() => handleDelete(service.id)}
            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
          >
            <Trash2 size={18} />
          </button>
        </div>
      ))}
    </div>
  );
}

