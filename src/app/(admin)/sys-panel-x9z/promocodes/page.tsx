import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PromoCodeList } from "./_components/promo-code-list";

export default async function PromoCodesPage() {
    const session = await getSession();
    if (!session?.userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { id: session.userId as string },
    });

    if (dbUser?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const promoCodes = await db.promoCode.findMany({
        orderBy: { createdAt: "desc" },
        include: {
            validPackage: true // Hangi pakete ait oldugunu gormek icin
        }
    });

    const packages = await db.package.findMany({
        where: { isActive: true },
        select: { id: true, name: true, price: true }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Promosyon Kodları</h2>
                <p className="text-slate-500">İndirim ve deneme süresi kodlarını yönetin.</p>
            </div>

            <PromoCodeList promoCodes={promoCodes} packages={packages} />
        </div>
    );
}
