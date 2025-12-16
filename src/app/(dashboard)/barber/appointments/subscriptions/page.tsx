import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { getBarberSubscriptionAppointments } from "@/actions/subscription-appointment";
import { SubscriptionAppointmentsList } from "../_components/subscription-appointments-list";

export default async function SubscriptionAppointmentsPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
    include: { profile: true }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  const subscriptions = await getBarberSubscriptionAppointments(dbUser.profile.id);
  const staffList = await db.staff.findMany({
    where: {
      profileId: dbUser.profile.id,
      isActive: true
    }
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Abone Randevuları</h1>
        <p className="text-sm text-slate-500 mt-1">Tekrarlayan randevuları yönetin</p>
      </div>

      <SubscriptionAppointmentsList
        subscriptions={subscriptions as any}
        staffList={staffList}
        barberId={dbUser.profile.id}
      />
    </div>
  );
}


