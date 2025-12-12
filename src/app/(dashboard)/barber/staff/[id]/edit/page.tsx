import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { StaffForm } from "../../_components/staff-form";
import { notFound } from "next/navigation";

export default async function EditStaffPage({
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

  const staff = await db.staff.findUnique({
    where: { id },
    include: {
      serviceAssignments: true
    }
  });

  if (!staff || staff.profileId !== dbUser.profile.id) {
    notFound();
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
        <h1 className="text-2xl font-bold text-slate-900">Personel Düzenle</h1>
        <p className="text-sm text-slate-500 mt-1">{staff.name}</p>
      </div>

      <StaffForm 
        roles={roles} 
        services={services}
        staff={{
          ...staff,
          serviceAssignments: staff.serviceAssignments.map(sa => ({
            serviceId: sa.serviceId
          }))
        }}
      />
    </div>
  );
}

