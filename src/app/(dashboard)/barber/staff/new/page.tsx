import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { StaffForm } from "../_components/staff-form";

export default async function NewStaffPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
    include: { profile: true }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  const roles = await db.staffRole.findMany({
    where: { profileId: dbUser.profile.id }
  });
  const services = await db.service.findMany({
    where: { profileId: dbUser.profile.id }
  }).then(services => services.map(service => ({
    ...service,
    price: Number(service.price) // Decimal'i number'a dönüştür
  })));

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Yeni Personel Ekle</h1>
        <p className="text-sm text-slate-500 mt-1">İşletmenize yeni bir personel ekleyin</p>
      </div>

      <StaffForm roles={roles} services={services} />
    </div>
  );
}

