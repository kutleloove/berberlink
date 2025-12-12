import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { StaffRoleForm } from "../../_components/staff-role-form";

export default async function EditStaffRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  const role = await db.staffRole.findUnique({
    where: { id }
  });

  if (!role || role.profileId !== dbUser.profile.id) {
    notFound();
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Rol Düzenle</h1>
        <p className="text-sm text-slate-500 mt-1">{role.name}</p>
      </div>

      <StaffRoleForm role={role} />
    </div>
  );
}

