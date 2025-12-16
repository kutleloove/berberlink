
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { PricingList } from "./_components/pricing-list";

export default async function PricingPage() {
    const session = await getSession();
    if (!session?.userId) redirect("/sign-in");

    const dbPackages = await db.package.findMany({
        where: { isActive: true },
        orderBy: { price: "asc" } // Ucuzdan pahalıya
    });

    const packages = dbPackages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        description: pkg.description,
        price: Number(pkg.price),
        durationDays: pkg.durationDays,
        features: pkg.features,
        isPopular: pkg.isPopular,
        isTaxIncluded: pkg.isTaxIncluded,
        taxRate: pkg.taxRate
    }));

    return (
        <div className="container mx-auto py-10 px-4">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold text-slate-900 mb-4">İşletmeniz İçin En Uygun Paketi Seçin</h1>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    BerberLink ile işletmenizi dijitalleştirin, randevularınızı yönetin ve gelirinizi artırın.
                </p>
            </div>

            <PricingList packages={packages} />
        </div>
    );
}
