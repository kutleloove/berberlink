"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { CheckoutForm } from "./checkout-form";

interface Package {
    id: string;
    name: string;
    price: any;
    durationDays: number;
    description: string | null;
    features: string[];
    isPopular: boolean;
    isTaxIncluded: boolean;
    taxRate: number;
}

export function PricingList({ packages }: { packages: Package[] }) {
    const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);

    return (
        <div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {packages.map((pkg) => (
                    <div
                        key={pkg.id}
                        className={`relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm transition-all hover:shadow-lg ${pkg.isPopular ? "border-indigo-600 ring-2 ring-indigo-600 ring-opacity-20" : "border-slate-200"
                            }`}
                    >
                        {pkg.isPopular && (
                            <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-sm font-medium text-white shadow-sm">
                                En Popüler
                            </span>
                        )}

                        <h3 className="text-xl font-bold text-slate-900">{pkg.name}</h3>
                        <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-4xl font-bold text-slate-900">
                                {Number(pkg.price).toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
                            </span>
                            <span className="text-slate-500">/ {pkg.durationDays === 365 ? 'yıl' : `${pkg.durationDays} gün`}</span>
                        </div>

                        <p className="mt-4 text-slate-600 leading-relaxed">{pkg.description}</p>

                        <button
                            onClick={() => setSelectedPackage(pkg)}
                            className={`mt-8 w-full rounded-xl py-3 text-sm font-semibold transition-colors ${pkg.isPopular
                                ? "bg-indigo-600 text-white hover:bg-indigo-700 shadow-md hover:shadow-indigo-500/30"
                                : "bg-slate-900 text-white hover:bg-slate-800"
                                }`}
                        >
                            Hemen Başla
                        </button>

                        <ul className="mt-8 space-y-4 flex-1">
                            {pkg.features.map((feature, index) => (
                                <li key={index} className="flex items-start gap-3 text-slate-600">
                                    <div className="flex-shrink-0 rounded-full bg-green-100 p-1">
                                        <Check className="h-3.5 w-3.5 text-green-600" />
                                    </div>
                                    <span className="text-sm">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {selectedPackage && (
                <CheckoutModal
                    pkg={selectedPackage}
                    onClose={() => setSelectedPackage(null)}
                />
            )}
        </div>
    );
}

function CheckoutModal({ pkg, onClose }: { pkg: Package, onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b border-slate-100 p-6">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">Ödeme Yap</h2>
                        <p className="text-sm text-slate-500">{pkg.name} paketi için ödeme yapıyorsunuz.</p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        ✕
                    </button>
                </div>

                <div className="p-6">
                    {/* Static price display removed - moved to CheckoutForm */}
                    <CheckoutForm packageId={pkg.id} price={Number(pkg.price)} onSuccess={onClose} />
                </div>
            </div>
        </div>
    )
}
