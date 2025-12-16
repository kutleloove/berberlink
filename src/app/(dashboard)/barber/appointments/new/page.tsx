import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { NewAppointmentForm } from "../_components/new-appointment-form";

export default async function NewAppointmentPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
    include: { profile: true }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  const customers = await db.user.findMany({
    where: {
      role: "CUSTOMER",
      appointmentsAsCustomer: {
        some: {
          barberId: dbUser.profile.id
        }
      }
    },
    orderBy: { name: "asc" }
  });

  const services = await db.service.findMany({
    where: { profileId: dbUser.profile.id }
  }).then(services => services.map(service => ({
    ...service,
    price: Number(service.price) // Decimal'i number'a dönüştür
  })));

  const staffList = await db.staff.findMany({
    where: {
      profileId: dbUser.profile.id,
      isActive: true
    },
    include: {
      role: true
    }
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Yeni Randevu Ekle</h1>
        <p className="text-sm text-slate-500 mt-1">Manuel olarak randevu oluşturun</p>
      </div>

      <NewAppointmentForm
        customers={customers}
        services={services}
        staffList={staffList}
        profileId={dbUser.profile.id}
      />
    </div>
  );
}

