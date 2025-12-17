"use client";

import { useState } from "react";
import { login } from "@/actions/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Scissors } from "lucide-react";

export default function SignInPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");

        const res = await login(null, formData);
        setLoading(false);

        if (res?.error) {
            setError(res.error);
        } else if (res?.needs2FA) {
            router.push(`/verify-2fa?email=${encodeURIComponent(res.email)}`);
        } else if (res?.success) {
            router.push("/dashboard");
        }
    }

    return (
        <div className="w-full">
            <div className="lg:hidden mb-8 text-center flex justify-center">
                <div className="inline-flex items-center gap-2 font-display font-bold text-2xl text-white">
                    <div className="bg-gradient-to-br from-gold-400 to-gold-600 text-slate-950 p-2 rounded-xl shadow-lg shadow-gold-500/20">
                        <Scissors size={24} />
                    </div>
                    <span>BerberLink</span>
                </div>
            </div>

            <div className="mb-8">
                <h1 className="font-display text-4xl font-bold text-white mb-2">
                    Tekrar Hoşgeldiniz 👋
                </h1>
                <p className="text-slate-400">
                    Hesabınıza giriş yaparak randevularınızı yönetin.
                </p>
            </div>

            <form action={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-300 ml-1">E-posta Adresi</label>
                    <input
                        name="email"
                        type="email"
                        required
                        className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all hover:bg-slate-800"
                        placeholder="ad@sirket.com"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between ml-1">
                        <label className="text-sm font-medium text-slate-300">Şifre</label>
                        <Link href="/forgot-password" className="text-xs font-medium text-gold-500 hover:text-gold-400 hover:underline">
                            Şifremi unuttum?
                        </Link>
                    </div>
                    <input
                        name="password"
                        type="password"
                        required
                        className="w-full px-4 py-3.5 rounded-xl bg-slate-900 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-gold-500/50 focus:border-gold-500/50 transition-all hover:bg-slate-800"
                        placeholder="••••••••"
                    />
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
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Giriş Yap"}
                </button>
            </form>

            <div className="mt-8 text-center text-slate-400">
                Hesabınız yok mu?{" "}
                <Link href="/sign-up" className="text-gold-500 hover:text-gold-400 font-bold hover:underline transition-colors">
                    Hemen kayıt olun
                </Link>
            </div>
        </div>
    );
}
