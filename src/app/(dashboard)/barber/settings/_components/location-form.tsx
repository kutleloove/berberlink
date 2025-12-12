"use client";

import { updateLocation } from "@/actions/settings";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

// Map bileşenini dinamik import ediyoruz (SSR kapalı)
const MapPicker = dynamic(() => import("@/components/ui/map-picker"), { 
  ssr: false,
  loading: () => <div className="h-[400px] bg-slate-100 rounded-2xl animate-pulse flex items-center justify-center text-slate-400">Harita Yükleniyor...</div>
});

interface LocationFormProps {
  initialAddress: string;
  initialLat: number | null;
  initialLng: number | null;
}

export function LocationForm({ initialAddress, initialLat, initialLng }: LocationFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!position) {
      alert("Lütfen haritadan konum seçiniz.");
      return;
    }

    setLoading(true);
    const formData = new FormData(event.currentTarget);
    formData.set("lat", position[0].toString());
    formData.set("lng", position[1].toString());

    await updateLocation(formData);
    setLoading(false);
    alert("Konum kaydedildi.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Açık Adres</label>
        <textarea 
          name="address" 
          defaultValue={initialAddress}
          required 
          placeholder="Dükkanınızın tam adresi..." 
          className="w-full px-4 py-2 border rounded-lg focus:ring-2 ring-slate-900 outline-none h-24 resize-none" 
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">Harita Konumu</label>
        <p className="text-xs text-slate-500 mb-2">Dükkanınızın tam yerini işaretlemek için haritaya tıklayın.</p>
        <MapPicker position={position} onPositionChange={setPosition} />
      </div>

      <button 
        disabled={loading} 
        className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="animate-spin" size={18} />}
        Konumu Kaydet
      </button>
    </form>
  );
}

