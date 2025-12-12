import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCustomers } from "@/actions/customer";
import { CustomerList } from "./_components/customer-list";
import Link from "next/link";
import { UserPlus } from "lucide-react";

export default async function CustomersPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  const customers = await getCustomers(dbUser.profile.id);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Müşteriler</h1>
          <p className="text-sm text-slate-500 mt-1">Randevu almış müşterilerinizi görüntüleyin ve yönetin</p>
        </div>
        <Link
          href="/barber/customers/new"
          className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
        >
          <UserPlus size={18} />
          Yeni Müşteri
        </Link>
      </div>

      <CustomerList customers={customers} />
    </div>
  );
}

