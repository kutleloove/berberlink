"use client";

import { purchasePackage } from "@/actions/payment";
import { useState } from "react";
import { CreditCard, Lock, Calendar } from "lucide-react";

export function CheckoutForm({ packageId, onSuccess }: { packageId: string, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const cardData = {
            cardHolderName: formData.get("cardHolderName") as string,
            cardNumber: formData.get("cardNumber") as string,
            expireMonth: formData.get("expireMonth") as string,
            expireYear: formData.get("expireYear") as string,
            cvc: formData.get("cvc") as string,
        };

        try {
            const result = await purchasePackage(packageId, cardData);

            if (result.error) {
                setError(result.error);
            } else {
                alert("Ödeme başarıyla alındı! Şimdi işletme ayarlarınızı tamamlayalım.");
                onSuccess();
                window.location.href = "/barber/settings";
            }
        } catch (e) {
            setError("Beklenmedik bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                    {error}
                </div>
            )}

            <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Kart Sahibi</label>
                <div className="relative">
                    <input
                        name="cardHolderName"
                        required
                        placeholder="AD SOYAD"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pl-10 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500"
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <span className="text-xs font-bold">AZ</span>
                    </div>
                </div>
            </div>

            <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Kart Numarası</label>
                <div className="relative">
                    <input
                        name="cardNumber"
                        required
                        placeholder="0000 0000 0000 0000"
                        maxLength={19}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pl-10 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 font-mono"
                    />
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Son Kullanma Tarihi</label>
                    <div className="flex gap-2">
                        <select name="expireMonth" className="w-full rounded-lg border border-slate-300 px-2 py-2.5 text-slate-900 bg-white">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
                                <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
                            ))}
                        </select>
                        <select name="expireYear" className="w-full rounded-lg border border-slate-300 px-2 py-2.5 text-slate-900 bg-white">
                            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">CVC / CWW</label>
                    <div className="relative">
                        <input
                            name="cvc"
                            required
                            maxLength={3}
                            placeholder="123"
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 pl-10 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-indigo-500 font-mono"
                        />
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    </div>
                </div>
            </div>

            <div className="pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-xl bg-indigo-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 disabled:opacity-50 disabled:shadow-none transition-all"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="h-5 w-5 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Ödeme İşleniyor...
                        </span>
                    ) : (
                        "Ödemeyi Tamamla"
                    )}
                </button>
                <p className="mt-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                    <Lock size={12} />
                    Ödeme bilgileriniz Webdetek 256-bit SSL ile korunmaktadır.
                </p>
            </div>
        </form>
    );
}
