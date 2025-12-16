"use client";

import { CreditCard, Crown, Clock, CalendarDays, AlertTriangle } from "lucide-react";
import Link from "next/link";

interface SubscriptionStatusProps {
    subscription?: {
        endDate: Date;
        package?: {
            name: string;
        } | null;
    };
    isActive: boolean;
    subscriptionEndsAt: Date | null;
}

export function SubscriptionStatus({ subscription, isActive, subscriptionEndsAt }: SubscriptionStatusProps) {
    const endDate = subscriptionEndsAt || (subscription?.endDate);
    const daysLeft = endDate
        ? Math.ceil((new Date(endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    const packageName = subscription?.package?.name || "Bilinmeyen Paket";

    return (
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 relative overflow-hidden">
            {/* Arka plan dekorasyonu */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
                <div className="flex items-start justify-between">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="p-1.5 bg-white/10 rounded-lg">
                                <Crown size={18} className="text-yellow-400" />
                            </span>
                            <h3 className="font-semibold text-lg text-slate-100">Abonelik Durumu</h3>
                        </div>
                        <p className="text-slate-400 text-sm">BerberLink iş ortağı üyeliğiniz.</p>
                    </div>

                    <Link href="/pricing" className="px-4 py-2 bg-white text-slate-900 rounded-lg text-sm font-semibold hover:bg-slate-100 transition shadow-lg">
                        Paketi Yükselt / Yenile
                    </Link>
                </div>

                <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Mevcut Paket</p>
                        <p className="text-xl font-bold bg-gradient-to-r from-white to-slate-300 bg-clip-text text-transparent">
                            {packageName}
                        </p>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Durum</p>
                        <div className="flex items-center gap-2">
                            {isActive ? (
                                <>
                                    <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                    <span className="text-lg font-semibold text-green-400">Aktif</span>
                                </>
                            ) : (
                                <>
                                    <AlertTriangle size={18} className="text-red-500" />
                                    <span className="text-lg font-semibold text-red-500">Pasif / Sona Erdi</span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                        <p className="text-xs text-slate-400 uppercase font-bold tracking-wider mb-1">Kalan Süre</p>
                        <div className="flex items-end gap-2">
                            <span className="text-2xl font-bold text-white">{daysLeft > 0 ? daysLeft : 0}</span>
                            <span className="text-sm text-slate-400 mb-1">gün</span>
                            {daysLeft < 15 && daysLeft > 0 && (
                                <span className="text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded ml-auto border border-amber-400/20">
                                    Yaklaşıyor
                                </span>
                            )}
                        </div>
                        {endDate && (
                            <p className="text-xs text-slate-500 mt-2">
                                Bitiş: {new Date(endDate).toLocaleDateString("tr-TR")}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
