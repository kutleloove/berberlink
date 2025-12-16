import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PackageList } from "./_components/package-list";

export default async function PackagesPage() {
    const session = await getSession();
    if (!session?.userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { id: session.userId as string },
    });

    if (dbUser?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const packages = await db.package.findMany({
        orderBy: { price: "asc" }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Paket Yönetimi</h2>
                <p className="text-slate-500">Abonelik paketlerini buradan yönetebilirsiniz.</p>
            </div>

            <PackageList packages={packages} />
        </div>
    );
}
