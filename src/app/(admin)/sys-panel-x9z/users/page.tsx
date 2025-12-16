import { db } from "@/lib/db";
import { UsersTable } from "./_components/users-table";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
    const users = await db.user.findMany({
        include: {
            profile: {
                select: {
                    isActive: true,
                    subscriptionEndsAt: true,
                    shopName: true
                }
            }
        },
        orderBy: { createdAt: "desc" }
    });

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">Kullanıcı Yönetimi</h2>
                    <p className="text-slate-500">
                        Sistemdeki tüm kullanıcıları, rolleri ve abonelik durumlarını yönetin.
                    </p>
                </div>
                <div className="text-sm bg-indigo-50 text-indigo-700 px-3 py-2 rounded-lg font-medium border border-indigo-100">
                    Toplam {users.length} Kullanıcı
                </div>
            </div>

            <UsersTable users={users as any} />
        </div>
    );
}
