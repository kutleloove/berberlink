import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getStaffRoles } from "@/actions/staff-role";
import { StaffRoleList } from "./_components/staff-role-list";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function StaffRolesPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
    include: { profile: true }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  const roles = await getStaffRoles(dbUser.profile.id);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personel Rolleri</h1>
          <p className="text-sm text-slate-500 mt-1">Çırak, Kalfa, Usta gibi roller oluşturun</p>
        </div>
        <Link
          href="/barber/staff/roles/new"
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
        >
          <Plus size={18} />
          Yeni Rol
        </Link>
      </div>

      <StaffRoleList roles={roles} />
    </div>
  );
}



