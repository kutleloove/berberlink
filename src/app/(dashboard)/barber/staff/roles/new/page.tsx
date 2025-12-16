import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { StaffRoleForm } from "../_components/staff-role-form";

export default async function NewStaffRolePage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Yeni Rol Ekle</h1>
        <p className="text-sm text-slate-500 mt-1">Çırak, Kalfa, Usta gibi yeni bir rol oluşturun</p>
      </div>

      <StaffRoleForm />
    </div>
  );
}

