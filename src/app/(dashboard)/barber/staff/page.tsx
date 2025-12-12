import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getStaffList } from "@/actions/staff";
import { StaffList } from "./_components/staff-list";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default async function StaffPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  const staffList = await getStaffList(dbUser.profile.id);
  const roles = await db.staffRole.findMany({
    where: { profileId: dbUser.profile.id }
  });
  const services = await db.service.findMany({
    where: { profileId: dbUser.profile.id }
  }).then(services => services.map(service => ({
    ...service,
    price: Number(service.price) // Decimal'i number'a dönüştür
  })));

  // Staff listesindeki serviceAssignments içindeki service'leri serialize et
  const serializedStaffList = staffList.map(staff => ({
    ...staff,
    serviceAssignments: staff.serviceAssignments.map(sa => ({
      ...sa,
      service: {
        ...sa.service,
        price: Number(sa.service.price) // Decimal'i number'a dönüştür
      }
    }))
  }));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personeller</h1>
          <p className="text-sm text-slate-500 mt-1">İşletmenizdeki personelleri yönetin</p>
        </div>
        <Link
          href="/barber/staff/new"
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
        >
          <UserPlus size={18} />
          Yeni Personel
        </Link>
      </div>

      <StaffList staffList={serializedStaffList} roles={roles} services={services} />
    </div>
  );
}

