import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { VerificationList } from "./_components/verification-list";

export default async function VerificationsPage() {
    const session = await getSession();
    if (!session?.userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { id: session.userId as string },
    });

    if (dbUser?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const unverifiedBarbers = await db.profile.findMany({
        where: { isVerified: false },
        include: {
            user: true
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Doğrulamalar</h2>
                <p className="text-slate-500">Onay bekleyen berber hesaplarını buradan doğrulayabilirsiniz.</p>
            </div>

            <VerificationList barbers={unverifiedBarbers} />
        </div>
    );
}
