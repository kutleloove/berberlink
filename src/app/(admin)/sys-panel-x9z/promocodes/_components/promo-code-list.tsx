"use client";

import { createPromoCode, deletePromoCode } from "@/actions/admin";
import { useState } from "react";
import { Trash2, Plus, TicketPercent, Calendar, Package as PackageIcon } from "lucide-react";

interface PromoCode {
    id: string;
    code: string;
    discountPercent: number | null;
    discountAmount: any;
    durationDays: number | null;
    maxUses: number | null;
    usedCount: number;
    expiresAt: Date | null;
    isActive: boolean;
    validPackage?: {
        id: string;
        name: string;
    } | null;
}

interface Package {
    id: string;
    name: string;
    price: any;
}

export function PromoCodeList({ promoCodes, packages }: { promoCodes: PromoCode[], packages: Package[] }) {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    async function handleDelete(id: string) {
        if (!confirm("Silmek istiyor musunuz?")) return;
        await deletePromoCode(id);
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        const formData = new FormData(event.currentTarget);
        const result = await createPromoCode(formData);

        if (result.error) {
            alert(result.error);
        } else {
            setIsModalOpen(false);
            (event.target as HTMLFormElement).reset();
        }
        setLoading(false);
    }

    return (
        <div>
            <div className="mb-6 flex justify-end">
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
                >
                    <Plus size={16} />
                    Yeni Promosyon Kodu
                </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Kod</th>
                                <th className="px-6 py-4 font-semibold">Kapsam</th>
                                <th className="px-6 py-4 font-semibold">İndirim</th>
                                <th className="px-6 py-4 font-semibold">Kullanım</th>
                                <th className="px-6 py-4 font-semibold">Geçerlilik</th>
                                <th className="px-6 py-4 font-semibold text-right">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {promoCodes.map((code) => (
                                <tr key={code.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4 font-mono font-medium text-slate-900">
                                        {code.code}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {code.validPackage ? (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700">
                                                <PackageIcon size={12} />
                                                {code.validPackage.name}
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
                                                Tüm Paketler
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {code.discountPercent
                                            ? `%${code.discountPercent} İndirim`
                                            : code.durationDays
                                                ? `${code.durationDays} Gün Ücretsiz`
                                                : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {code.usedCount} / {code.maxUses || '∞'}
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {code.expiresAt
                                            ? new Date(code.expiresAt).toLocaleDateString('tr-TR')
                                            : 'Süresiz'}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleDelete(code.id)}
                                            className="text-slate-400 hover:text-red-600 transition"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="mb-4 text-xl font-bold text-slate-900">Promosyon Kodu Ekle</h2>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Kod (Örn: SUMMER2024)</label>
                                <input name="code" required className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white placeholder:text-slate-400 uppercase" placeholder="KOD GİRİNİZ" />
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700">Geçerli Paket</label>
                                <select name="validPackageId" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white">
                                    <option value="">Tüm Paketlerde Geçerli</option>
                                    {packages.map(pkg => (
                                        <option key={pkg.id} value={pkg.id}>
                                            {pkg.name} ({Number(pkg.price).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY' })})
                                        </option>
                                    ))}
                                </select>
                                <p className="mt-1 text-xs text-slate-500">
                                    Bu kodun sadece belirli bir pakette geçerli olmasını istiyorsanız seçiniz.
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">İndirim (%)</label>
                                    <input name="discountPercent" type="number" max="100" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white placeholder:text-slate-400" placeholder="Boş bırakılabilir" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Deneme Süresi (Gün)</label>
                                    <input name="durationDays" type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white placeholder:text-slate-400" placeholder="Örn: 90" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Max Kullanım</label>
                                    <input name="maxUses" type="number" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white placeholder:text-slate-400" placeholder="Sınırsız için boş" />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-slate-700">Son Tarih</label>
                                    <input name="expiresAt" type="date" className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-900 bg-white placeholder:text-slate-400" />
                                </div>
                            </div>

                            <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-lg">
                                Not: "İndirim (%)" alanı boş bırakılıp "Deneme Süresi" girilirse, kod kullanıldığında belirtilen gün kadar ücretsiz kullanım hakkı verilir.
                            </p>

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
                                    {loading ? "Ekleniyor..." : "Ekle"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
