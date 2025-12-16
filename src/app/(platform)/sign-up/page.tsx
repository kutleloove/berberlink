"use client";

import { login, signup } from "@/actions/auth"; // We will use signup action here
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function SignUpPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(formData: FormData) {
        setLoading(true);
        setError("");

        const res = await signup(null, formData);
        setLoading(false);

        if (res?.error) {
            setError(res.error);
        } else if (res?.success) {
            // Auto login or redirect to dashboard
            // Since signup sets the cookie, valid user now
            router.push("/dashboard");
        }
    }

    return (
        <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 relative overflow-hidden">
            {/* Abstract Background Shapes */}
            <div className="absolute bottom-[-10%] right-[-5%] w-[600px] h-[600px] bg-purple-800 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute top-[10%] left-[5%] w-[300px] h-[300px] bg-indigo-500 rounded-full mix-blend-screen filter blur-3xl opacity-20"></div>

            <div className="w-full max-w-md p-8 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl relative z-10 transition-all">
                <div className="mb-8 text-center">
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-200 to-indigo-200 bg-clip-text text-transparent mb-2">
                        Get Started
                    </h1>
                    <p className="text-slate-400 font-medium">Create your BerberLink account</p>
                </div>

                <form action={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Full Name</label>
                        <input
                            name="name"
                            type="text"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="John Doe"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Email</label>
                        <input
                            name="email"
                            type="email"
                            required
                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="you@company.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-300 ml-1">Password</label>
                        <input
                            name="password"
                            type="password"
                            required
                            minLength={6}
                            className="w-full px-4 py-3 rounded-xl bg-slate-900/50 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/20 text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-400">
                    Already have an account?{" "}
                    <Link href="/sign-in" className="text-purple-300 hover:text-white font-semibold transition-colors">
                        Log in
                    </Link>
                </div>
            </div>
        </div>
    );
}
