"use client";

import { verifyBarber } from "@/actions/admin";
import { useState } from "react";
import { Check, X, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Barber {
    id: string;
    shopName: string;
    slug: string;
    isVerified: boolean;
    user: {
        name: string | null;
        email: string;
    };
    createdAt: Date;
}

export function VerificationList({ barbers }: { barbers: Barber[] }) {
    const [loading, setLoading] = useState<string | null>(null);

    async function handleVerify(id: string) {
        if (!confirm("Berberi doğrulamak istediğinize emin misiniz?")) return;
        setLoading(id);
        await verifyBarber(id);
        setLoading(null);
    }

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <tr>
                            <th className="px-6 py-4 font-semibold">İşletme</th>
                            <th className="px-6 py-4 font-semibold">Yetkili</th>
                            <th className="px-6 py-4 font-semibold">Kayıt Tarihi</th>
                            <th className="px-6 py-4 font-semibold text-right">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {barbers.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                                    Onay bekleyen berber bulunmuyor.
                                </td>
                            </tr>
                        ) : (
                            barbers.map((barber) => (
                                <tr key={barber.id} className="hover:bg-slate-50 transition">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{barber.shopName}</div>
                                        <Link href={`/${barber.slug}`} target="_blank" className="flex items-center gap-1 text-xs text-indigo-600 hover:underline">
                                            /{barber.slug} <ExternalLink size={10} />
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900">{barber.user.name}</div>
                                        <div className="text-xs text-slate-500">{barber.user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(barber.createdAt).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleVerify(barber.id)}
                                            disabled={loading === barber.id}
                                            className="inline-flex items-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                                        >
                                            <Check size={14} />
                                            {loading === barber.id ? "İşleniyor..." : "Onayla"}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
