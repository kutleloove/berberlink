"use client";

import { createCustomer } from "@/actions/customer";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface CustomerFormProps {
  profileId: string;
}

export function CustomerForm({ profileId }: CustomerFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const result = await createCustomer(formData, profileId);

    setLoading(false);

    if (result.success) {
      router.push("/barber/customers");
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Müşteri Bilgileri</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ad Soyad *
              </label>
              <input
                type="text"
                name="name"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                E-posta *
              </label>
              <input
                type="email"
                name="email"
                required
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                name="phone"
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            * Manuel eklenen müşteriler siteye giriş yapamaz, sadece randevu kaydı için kullanılır.
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Link
            href="/barber/customers"
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
            Kaydet
          </button>
        </div>
      </form>
    </div>
  );
}

