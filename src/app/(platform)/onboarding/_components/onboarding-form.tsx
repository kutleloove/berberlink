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
      <div className="space-y-2">
        <label htmlFor="shopName" className="block text-sm font-medium text-slate-300 ml-1">
          İşletme Adı
        </label>
        <input
          type="text"
          id="shopName"
          name="shopName"
          required
          placeholder="Örn: Ahmet Erkek Kuaförü"
          className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all hover:bg-slate-800"
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="block text-sm font-medium text-slate-300 ml-1">
          İşletme URL Adresi
        </label>
        <div className="flex items-center group">
          <span className="bg-slate-900 border border-r-0 border-white/10 px-4 py-3.5 rounded-l-xl text-slate-400 text-sm font-medium">
            berberlink.com/
          </span>
          <input
            type="text"
            id="slug"
            name="slug"
            required
            placeholder="ahmet-kuafor"
            className="w-full px-4 py-3.5 border border-white/10 border-l-0 rounded-r-xl bg-slate-900 text-white placeholder-slate-500 focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 focus:outline-none transition-all hover:bg-slate-800"
          />
        </div>
        <p className="text-xs text-slate-500 mt-1 ml-1">Türkçe karakter ve boşluk kullanmayınız.</p>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-200 text-sm flex items-center gap-2 animate-shake">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-4 px-6 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 text-white font-bold text-lg shadow-lg shadow-gold-500/20 hover:shadow-gold-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "İşletmeyi Oluştur"}
      </button>
    </form>
  );
}

