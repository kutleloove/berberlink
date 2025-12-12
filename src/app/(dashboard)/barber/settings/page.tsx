import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { LocationForm } from "./_components/location-form";

export default async function SettingsPage() {
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
    <div className="p-4 md:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dükkan Ayarları</h1>
        <a href="/barber" className="text-slate-600 hover:text-slate-900">
          ← Panele Dön
        </a>
      </div>

      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <h2 className="text-xl font-semibold mb-6">Konum Bilgileri</h2>
        <LocationForm 
          initialAddress={dbUser.profile.address || ""}
          initialLat={dbUser.profile.latitude}
          initialLng={dbUser.profile.longitude}
        />
      </div>
    </div>
  );
}

