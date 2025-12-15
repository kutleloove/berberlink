import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getAppointments } from "@/actions/appointments";
import { WeeklyAppointmentView } from "../_components/weekly-appointment-view";

export default async function ActiveAppointmentsPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  const appointments = await getAppointments(dbUser.profile.id, "active");
  const staffList = await db.staff.findMany({
    where: { 
      profileId: dbUser.profile.id,
      isActive: true
    }
  });
  const workingHours = await db.workingHour.findMany({
    where: { profileId: dbUser.profile.id },
    include: { shifts: true },
    orderBy: { dayOfWeek: "asc" }
  });

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Aktif Randevular</h1>
        <p className="text-sm text-slate-500 mt-1">Bu haftanın randevularını görüntüleyin ve yönetin</p>
      </div>

      <WeeklyAppointmentView
        appointments={appointments}
        staffList={staffList}
        workingHours={workingHours}
      />
    </div>
  );
}

