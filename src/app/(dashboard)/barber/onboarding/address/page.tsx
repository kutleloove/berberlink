import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { LocationForm } from "../../settings/_components/location-form";

export default async function AddressOnboardingPage() {
    const session = await getSession();
    if (!session?.userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { id: session.userId as string },
        include: {
            profile: true
        }
    });

    if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
        redirect("/dashboard");
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-slate-900 mb-2">İşletme Adresinizi Belirleyin</h1>
                    <p className="text-slate-500">Müşterilerinizin sizi kolayca bulabilmesi için lütfen açık adresinizi ve harita konumunuzu giriniz.</p>
                </div>

                <LocationForm
                    initialAddress={dbUser.profile.address || ""}
                    initialLat={dbUser.profile.latitude}
                    initialLng={dbUser.profile.longitude}
                    redirectTo="/barber"
                />
            </div>
        </div>
    );
}
