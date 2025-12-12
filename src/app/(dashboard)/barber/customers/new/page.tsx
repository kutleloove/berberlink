import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CustomerForm } from "../_components/customer-form";

export default async function NewCustomerPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Yeni Müşteri Ekle</h1>
        <p className="text-sm text-slate-500 mt-1">Fiziksel veya telefon ile randevu alan müşterileri ekleyin</p>
      </div>

      <CustomerForm profileId={dbUser.profile.id} />
    </div>
  );
}

