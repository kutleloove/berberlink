
import { Scissors } from "lucide-react";
import Link from "next/link";

export default function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen w-full flex bg-slate-950 text-white">
            {/* Left Panel - Brand & Testimonials (Hidden on mobile) */}
            <div className="hidden lg:flex w-1/2 relative overflow-hidden bg-slate-900 border-r border-white/5 items-center justify-center p-12">
                {/* Background Effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/50"></div>
                    <div className="absolute -top-24 -left-24 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl opacity-50"></div>
                    <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl opacity-50"></div>

                    {/* Grid Pattern */}
                    <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>
                </div>

                <div className="relative z-10 max-w-lg">
                    <Link href="/" className="inline-flex items-center gap-3 font-display font-bold text-3xl text-white mb-12">
                        <div className="bg-gradient-to-br from-gold-400 to-gold-600 text-slate-950 p-2.5 rounded-xl shadow-lg shadow-gold-500/20">
                            <Scissors size={32} />
                        </div>
                        <span>BerberLink</span>
                    </Link>

                    <div className="space-y-8">
                        <h2 className="font-display text-4xl font-bold leading-tight">
                            Aradığın tarz <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-300 via-gold-500 to-gold-300 animate-shimmer">
                                bir tık uzağında.
                            </span>
                        </h2>

                        <p className="text-lg text-slate-400 leading-relaxed">
                            &quot;Şehrin en iyi berberlerini keşfetmek ve sıra beklemeden randevu almak hiç bu kadar kolay olmamıştı. BerberLink ile tarzımı şansa bırakmıyorum.&quot;
                        </p>

                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-gold-500/50 flex items-center justify-center overflow-hidden">
                                <span className="font-bold text-slate-400">CK</span>
                            </div>
                            <div>
                                <p className="font-bold text-white">Caner K.</p>
                                <p className="text-sm text-gold-500">Mutlu Müşteri</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Panel - Form Area */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
                <div className="absolute inset-0 z-0 pointer-events-none lg:hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950"></div>
                </div>

                <div className="w-full max-w-md relative z-10">
                    {children}
                </div>
            </div>
        </div>
    );
}
