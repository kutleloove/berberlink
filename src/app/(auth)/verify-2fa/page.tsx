"use client";

import { verify2FA } from "@/actions/auth";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";

function Verify2FAForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const email = searchParams.get("email");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!email) {
        return <div className="text-white text-center">Error: Email missing from URL</div>;
    }

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");
        // Append email from param
        formData.append("email", email as string);

        const res = await verify2FA(null, formData);
        setLoading(false);

        if (res?.error) {
            setError(res.error);
        } else if (res?.success) {
            router.push("/dashboard");
        }
    }

    return (
        <div className="w-full max-w-md p-8 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl relative z-10">
            <div className="mb-8 text-center">
                <div className="mx-auto w-16 h-16 mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <ShieldCheck className="w-8 h-8" />
                </div>
                <h1 className="text-3xl font-bold text-white mb-2">Two-Factor Auth</h1>
                <p className="text-white/60 text-sm">
                    We sent a code to <span className="font-semibold text-white/90">{email}</span>. <br />
                    Please check your inbox (or console for dev).
                </p>
            </div>

            <form action={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-emerald-100/80 ml-1 text-center block">Enter 6-digit code</label>
                    <input
                        name="code"
                        type="text"
                        required
                        maxLength={6}
                        className="w-full px-4 py-4 rounded-xl bg-black/20 border border-white/10 text-white text-center text-2xl tracking-[0.5em] font-mono placeholder-white/10 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                        placeholder="000000"
                    />
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/20 text-red-100 text-sm text-center">
                        {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-xl bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify Identity"}
                </button>
            </form>
        </div>
    );
}

export default function Verify2FAPage() {
    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gray-950 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-gray-900 via-gray-900 to-black z-0"></div>
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-900/20 rounded-full blur-[100px]"></div>

            <Suspense fallback={<div className="text-white z-10">Loading...</div>}>
                <Verify2FAForm />
            </Suspense>
        </div>
    )
}
