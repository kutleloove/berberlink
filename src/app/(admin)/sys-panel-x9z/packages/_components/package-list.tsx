"use client";

import { createPackage, deletePackage } from "@/actions/admin";
import { useState } from "react";
import { Trash2, Plus, Calculator } from "lucide-react";

interface Package {
    id: string;
    name: string;
    price: any;
    durationDays: number;
    description: string | null;
    features: string[];
    isActive: boolean;
    taxRate: number;
    isTaxIncluded: boolean;
}

export function PackageList({ packages }: { packages: Package[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleDelete(id: string) {
        if (!confirm("Paketi silmek istiyor musunuz?")) return;
        await deletePackage(id);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await createPackage(formData);

        if (result.error) {
            alert(result.error);
        } else {
            setIsModalOpen(false);
            (event.target as HTMLFormElement).reset();
        }
        setLoading(false);
    }

    function calculateTax(price: number, taxRate: number, isIncluded: boolean) {
        let taxAmount = 0;
        let netPrice = 0;
        let totalPrice = 0;

        if (isIncluded) {
            // Price includes tax: Total = Net * (1 + rate/100)
            // Net = Total / (1 + rate/100)
            totalPrice = price;
            netPrice = price / (1 + taxRate / 100);
            taxAmount = totalPrice - netPrice;
        } else {
            // Price excludes tax
            netPrice = price;
            taxAmount = price * (taxRate / 100);
            totalPrice = price + taxAmount;
        }

        return { netPrice, taxAmount, totalPrice };
    }

    return (
        <div>
            <div className="mb-6 flex justify-end">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                    <Plus size={16} />
                    Yeni Paket Ekle
                </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => {
                    const { netPrice, taxAmount } = calculateTax(Number(pkg.price), pkg.taxRate, pkg.isTaxIncluded);

                    return (
                        <div key={pkg.id} className="relative flex flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                            <div className="absolute top-4 right-4">
                                <button
                                    onClick={() => handleDelete(pkg.id)}
                                    className="rounded p-2 text-slate-400 hover:bg-red-50 hover:text-red-500"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>

                            <h3 className="text-lg font-bold text-slate-900">{pkg.name}</h3>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="text-3xl font-bold text-slate-900">
                                    {Number(pkg.price).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                </span>
                                <span className="text-sm text-slate-500 font-medium">
                                    {pkg.isTaxIncluded ? '(KDV Dahil)' : '+ KDV'}
                                </span>
                            </div>
                            <div className="mt-1 text-sm text-slate-500">{pkg.durationDays} gün</div>

                            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs space-y-1 border border-slate-100">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Maliyet (KDV Hariç):</span>
                                    <span className="font-medium text-slate-900">
                                        {netPrice.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">KDV (%{pkg.taxRate}):</span>
                                    <span className="font-medium text-green-600">
                                        {taxAmount.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })}
                                    </span>
                                </div>
                                {pkg.isTaxIncluded && (
                                    <div className="pt-1 text-slate-400 text-[10px] italic">
                                        * İşletme faturadan {taxAmount.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TL düşebilir.
                                    </div>
                                )}
                            </div>

                            <p className="mt-4 text-sm text-slate-600 line-clamp-2">{pkg.description}</p>

                            <ul className="mt-6 space-y-2 flex-1">
                                {pkg.features.map((feature, index) => (
                                    <li key={index} className="flex items-start gap-2 text-sm text-slate-600">
                                        <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-500" />
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    );
                })}
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
                        <h2 className="mb-4 text-xl font-bold text-slate-900">Yeni Paket Oluştur</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Paket Adı</label>
                                <input name="name" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white placeholder:text-slate-400" placeholder="Örn: Gold Paket" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Fiyat (TL)</label>
                                    <input name="price" type="number" step="0.01" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white placeholder:text-slate-400" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Süre (Gün)</label>
                                    <input name="durationDays" type="number" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white placeholder:text-slate-400" defaultValue="30" />
                                </div>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <Calculator className="w-4 h-4 text-slate-500" />
                                    <span className="text-sm font-semibold text-slate-700">Vergi Ayarları</span>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="mb-1 block text-sm font-medium text-slate-700">KDV Oranı (%)</label>
                                        <input name="taxRate" type="number" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white placeholder:text-slate-400" defaultValue="20" />
                                    </div>
                                    <div className="flex items-center pt-6">
                                        <label className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                                            <input name="isTaxIncluded" type="checkbox" value="true" defaultChecked className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-slate-900" />
                                            Fiyata KDV Dahil
                                        </label>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-500">
                                    Örn: 1200 TL ve %20 KDV seçildiğinde, dahil ise matrah 1000 TL olur. Hariç ise toplam 1440 TL olur.
                                </p>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Açıklama</label>
                                <textarea name="description" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white placeholder:text-slate-400" rows={2} />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Özellikler (Her satıra bir tane)</label>
                                <textarea name="features" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white placeholder:text-slate-400" rows={4} placeholder="Örn:&#10;Sınırsız Randevu&#10;7/24 Destek" />
                            </div>

                            <div className="mt-6 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                >
                                    İptal
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                                >
                                    {loading ? "Oluşturuluyor..." : "Oluştur"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
