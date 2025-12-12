"use client";

import { createBarberProfile } from "@/actions/barber";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2 } from "lucide-react";

export function OnboardingForm({ userId }: { userId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    formData.append("dbUserId", userId);

    const result = await createBarberProfile(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/barber");
      router.refresh();
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <label htmlFor="shopName" className="block text-sm font-medium text-slate-700 mb-1">
          İşletme Adı
        </label>
        <input
          type="text"
          id="shopName"
          name="shopName"
          required
          placeholder="Örn: Ahmet Erkek Kuaförü"
          className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">
          İşletme URL Adresi
        </label>
        <div className="flex items-center">
          <span className="bg-slate-100 border border-r-0 border-slate-300 px-3 py-2 rounded-l-lg text-slate-500 text-sm">
            berberlink.com/
          </span>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            placeholder="ahmet-kuafor"
            className="w-full px-4 py-2 border border-slate-300 rounded-r-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1">Türkçe karakter ve boşluk kullanmayınız.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="animate-spin" size={18} />}
        İşletmeyi Oluştur
      </button>
    </form>
  );
}

