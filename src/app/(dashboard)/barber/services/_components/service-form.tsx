"use client";

import { createService } from "@/actions/service";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ServiceForm() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    
    await createService(formData);
    
    setLoading(false);
    // Formu temizle
    (event.target as HTMLFormElement).reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Hizmet Adı</label>
        <input name="name" required placeholder="Saç Kesimi" className="w-full px-4 py-2 border rounded-lg focus:ring-2 ring-slate-900 outline-none" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Süre (Dk)</label>
          <input name="duration" type="number" required placeholder="30" className="w-full px-4 py-2 border rounded-lg focus:ring-2 ring-slate-900 outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Fiyat (₺)</label>
          <input name="price" type="number" step="0.01" required placeholder="150" className="w-full px-4 py-2 border rounded-lg focus:ring-2 ring-slate-900 outline-none" />
        </div>
      </div>
      <button disabled={loading} className="w-full bg-slate-900 text-white py-2 rounded-lg font-medium flex justify-center items-center">
        {loading ? <Loader2 className="animate-spin" /> : "Ekle"}
      </button>
    </form>
  );
}

