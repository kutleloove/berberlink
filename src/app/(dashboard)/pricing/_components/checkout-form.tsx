"use client";

import { purchasePackage } from "@/actions/payment";
import { useState, useEffect } from "react";
import { CreditCard, Lock, Calendar, X } from "lucide-react";

export function CheckoutForm({ packageId, price, onSuccess }: { packageId: string, price: number, onSuccess: () => void }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [promoCode, setPromoCode] = useState("");
    const [isPromoApplied, setIsPromoApplied] = useState(false);
    const [discountMessage, setDiscountMessage] = useState<string | null>(null);
    const [shouldSkipPayment, setShouldSkipPayment] = useState(false);
    const [discountedPrice, setDiscountedPrice] = useState<number>(price);

    useEffect(() => {
        setDiscountedPrice(price);
    }, [price]);

    async function handleApplyPromo() {
        if (!promoCode.trim()) return;
        setLoading(true);
        setError(null);
        setDiscountMessage(null);

        try {
            const { validatePromoCode } = await import("@/actions/payment");
            const result = await validatePromoCode(promoCode, packageId);

            if (result.error) {
                setError(result.error);
                setIsPromoApplied(false);
                setShouldSkipPayment(false);
                setDiscountedPrice(price);
            } else if (result.success && result.discountPercent) {
                setIsPromoApplied(true);
                setDiscountMessage(`%${result.discountPercent} indirim uygulandı!`);

                // Fiyat hesapla
                let newPrice = price - (price * result.discountPercent / 100);
                if (newPrice < 0) newPrice = 0;
                setDiscountedPrice(newPrice);

                // Eğer %100 veya daha fazla indirimse veya fiyat 0 ise
                if (result.discountPercent >= 100 || newPrice === 0) {
                    setShouldSkipPayment(true);
                } else {
                    setShouldSkipPayment(false);
                }
            } else {
                setError("Promosyon kodunda indirim oranı bulunamadı.");
            }
        } catch (e) {
            setError("Kod doğrulanırken hata oluştu.");
        } finally {
            setLoading(false);
        }
    }

    function handleRemovePromo() {
        setPromoCode("");
        setIsPromoApplied(false);
        setDiscountMessage(null);
        setShouldSkipPayment(false);
        setDiscountedPrice(price);
        setError(null);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);

        let cardData = null;

        if (!shouldSkipPayment) {
            const formData = new FormData(event.currentTarget);
            const rawCardNumber = formData.get("cardNumber") as string;

            // Kart numarası validasyonu
            if (!rawCardNumber || rawCardNumber.replace(/\s/g, "").length < 15) {
                setError("Geçerli bir kart numarası giriniz.");
                setLoading(false);
                return;
            }

            cardData = {
                cardHolderName: formData.get("cardHolderName") as string,
                cardNumber: rawCardNumber,
                expireMonth: formData.get("expireMonth") as string,
                expireYear: formData.get("expireYear") as string,
                cvc: formData.get("cvc") as string,
            };
        }

        try {
            const result = await purchasePackage(packageId, cardData, isPromoApplied ? promoCode : undefined);

            if (result.error) {
                setError(result.error);
            } else {
                alert("İşlem başarılı! Şimdi işletme adresinizi belirleyelim.");
                onSuccess();
                window.location.href = "/barber/onboarding/address";
            }
        } catch (e) {
            setError("Beklenmedik bir hata oluştu.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="space-y-6">
            {/* Dinamik Fiyat Gösterimi */}
            <div className={`mb-6 flex items-center justify-between rounded-lg p-4 border transition-colors ${shouldSkipPayment ? 'bg-green-50 border-green-200' : 'bg-indigo-50 border-indigo-100'}`}>
                <span className={`font-medium ${shouldSkipPayment ? 'text-green-900' : 'text-indigo-900'}`}>Ödenecek Tutar</span>
                <div className="flex flex-col items-end">
                    {isPromoApplied && (
                        <span className="text-sm text-slate-400 line-through">
                            {price.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                        </span>
                    )}
                    <span className={`text-2xl font-bold ${shouldSkipPayment ? 'text-green-700' : 'text-indigo-700'}`}>
                        {discountedPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                    </span>
                </div>
            </div>

            {/* Promosyon Kodu Alanı */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <label className="mb-2 block text-sm font-medium text-slate-700">Promosyon Kodu</label>
                <div className="flex gap-2">
                    <input
                        value={promoCode}
                        disabled={isPromoApplied}
                        onChange={(e) => {
                            setPromoCode(e.target.value);
                            setDiscountMessage(null);
                        }}
                        placeholder={isPromoApplied ? "İndirim kodu uygulandı" : "İndirim kodunuz"}
                        className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-indigo-500 outline-none text-slate-900 placeholder:text-slate-500 disabled:bg-slate-50 disabled:text-slate-400"
                    />
                    <button
                        type="button"
                        onClick={handleApplyPromo}
                        disabled={!promoCode || loading || isPromoApplied}
                        className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Uygula
                    </button>
                </div>

                {isPromoApplied && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-green-50 p-2 border border-green-100 animate-in fade-in slide-in-from-top-1">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={handleRemovePromo}
                                className="p-1 text-slate-400 hover:text-red-500 rounded-full hover:bg-red-50 transition-colors"
                                title="Kodu Kaldır"
                            >
                                <X size={16} />
                            </button>
                            <span className="text-sm font-medium text-green-700">{promoCode}</span>
                        </div>
                        {discountMessage && (
                            <span className="text-sm text-green-600 flex items-center gap-1">
                                ✓ {discountMessage}
                            </span>
                        )}
                    </div>
                )}

                {!isPromoApplied && discountMessage && (
                    <p className="mt-2 text-sm text-green-600 font-medium flex items-center gap-1">
                        ✓ {discountMessage}
                    </p>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                    <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100">
                        {error}
                    </div>
                )}

                {!shouldSkipPayment ? (
                    <>
                        <div className="relative">
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

                            <div className="mt-4">
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

                            <div className="grid grid-cols-2 gap-4 mt-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Son Kullanma</label>
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
                        </div>
                    </>
                ) : (
                    <div className="bg-green-50 p-4 rounded-xl border border-green-100 text-center">
                        <p className="font-bold text-green-700 text-lg">Toplam Tutar: 0.00 TL</p>
                        <p className="text-sm text-green-600 mt-1">Ödeme yapmanıza gerek yoktur.</p>
                    </div>
                )}

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
                                İşleniyor...
                            </span>
                        ) : (
                            shouldSkipPayment ? "Ücretsiz Başla" : "Ödemeyi Tamamla"
                        )}
                    </button>
                    {!shouldSkipPayment && (
                        <p className="mt-3 text-center text-xs text-slate-400 flex items-center justify-center gap-1">
                            <Lock size={12} />
                            Ödeme bilgileriniz Webdetek 256-bit SSL ile korunmaktadır.
                        </p>
                    )}
                </div>
            </form>
        </div>
    );
}
