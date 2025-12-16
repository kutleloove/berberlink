import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { WorkingHoursForm } from "./_components/working-hours-form";

export default async function AvailabilityPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
    include: {
      profile: {
        include: {
          workingHours: {
            include: {
              shifts: {
                include: {
                  staff: {
                    select: {
                      id: true,
                      name: true
                    }
                  }
                },
                orderBy: { startTime: "asc" }
              }
            }
          },
          staff: {
            where: { isActive: true },
            select: {
              id: true,
              name: true
            },
            orderBy: { name: "asc" }
          }
        }
      }
    }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  // Varsayılan saatleri oluştur (Eğer yoksa)
  const workingHours = dbUser.profile.workingHours.map(wh => ({
    dayOfWeek: wh.dayOfWeek,
    isClosed: wh.isClosed,
    shifts: wh.shifts.map(s => ({
      startTime: s.startTime,
      endTime: s.endTime,
      staffId: s.staffId || null,
      staffName: s.staff?.name || null
    }))
  }));

  const staffList = dbUser.profile.staff;

  return (
    <div className="p-6 md:p-10 lg:p-12 max-w-5xl mx-auto">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">Çalışma Saatleri</h1>
        <p className="text-slate-500 text-sm font-medium">Haftalık çalışma programınızı düzenleyin</p>
      </div>

      <div className="bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-slate-200/60">
        <div className="mb-8 pb-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Haftalık Program</h2>
          <p className="text-slate-500 text-sm">Her gün için çalışma saatlerinizi ve vardiyalarınızı belirleyin</p>
        </div>
        <WorkingHoursForm existingHours={workingHours} staffList={staffList} />
      </div>
    </div>
  );
}

