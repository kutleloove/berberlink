import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { BarberList } from "./_components/barber-list";

export default async function AdminDashboard() {
    const session = await getSession();
    if (!session?.userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { id: session.userId as string },
    });

    if (dbUser?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    // Tüm berberleri çek
    const barbers = await db.profile.findMany({
        include: {
            user: true,
            _count: {
                select: { appointments: true }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    const activeSubscriptions = barbers.filter(b => b.isActive && b.subscriptionEndsAt && b.subscriptionEndsAt > new Date()).length;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Genel Bakış</h2>
                <p className="text-slate-500">Sistem durumunu buradan takip edebilirsiniz.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500">Toplam Berber</h3>
                    <div className="mt-2 text-3xl font-bold text-slate-900">{barbers.length}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500">Aktif Abonelik</h3>
                    <div className="mt-2 text-3xl font-bold text-slate-900">{activeSubscriptions}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                    <h3 className="text-sm font-medium text-slate-500">Bu Ay Kayıt</h3>
                    <div className="mt-2 text-3xl font-bold text-slate-900">
                        {barbers.filter(b => b.createdAt > new Date(new Date().setDate(1))).length}
                    </div>
                </div>
            </div>

            <div>
                <h3 className="mb-4 text-xl font-semibold text-slate-900">Berber Listesi</h3>
                <BarberList barbers={barbers} />
            </div>
        </div>
    );
}
