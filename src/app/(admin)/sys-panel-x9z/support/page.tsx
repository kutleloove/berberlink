import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { SupportTicketList } from "./_components/ticket-list";

export default async function SupportPage() {
    const session = await getSession();
    if (!session?.userId) redirect("/sign-in");

    const dbUser = await db.user.findUnique({
        where: { id: session.userId as string },
    });

    if (dbUser?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    // Not: SupportTicket oluşturulma özelliği kullanıcı tarafında henüz yok,
    // bu yüzden burası şimdilik boş gelecek.
    const tickets = await db.supportTicket.findMany({
        include: {
            user: true
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight text-slate-900">Destek Talepleri</h2>
                <p className="text-slate-500">Kullanıcılardan gelen destek mesajları.</p>
            </div>

            <SupportTicketList tickets={tickets} />
        </div>
    );
}
