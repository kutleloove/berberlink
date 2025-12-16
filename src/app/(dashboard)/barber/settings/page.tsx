import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { LocationForm } from "./_components/location-form";
import { SubscriptionSettingsForm } from "./_components/subscription-settings-form";
import { SubscriptionStatus } from "./_components/subscription-status";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
    include: {
      profile: {
        include: {
          subscriptions: {
            take: 1,
            orderBy: { createdAt: "desc" }, // En son abonelik
            include: { package: true }
          }
        }
      }
    }
  });

  if (!dbUser || dbUser.role !== "BARBER" || !dbUser.profile) {
    redirect("/dashboard");
  }

  const currentSubscription = dbUser.profile.subscriptions[0];

  // Abonelik ayarlarını parse et
  const allowedRecurrenceTypes = dbUser.profile.allowedRecurrenceTypes
    ? (dbUser.profile.allowedRecurrenceTypes as any as string[])
    : null;

  return (
    <div className="p-4 md:p-10 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dükkan Ayarları</h1>
        <a href="/barber" className="text-slate-600 hover:text-slate-900">
          ← Panele Dön
        </a>
      </div>

      <div className="space-y-6">
        <SubscriptionStatus
          subscription={currentSubscription as any} // Tip uyuşmazlığını aşmak için şimdilik any
          isActive={dbUser.profile.isActive}
          subscriptionEndsAt={dbUser.profile.subscriptionEndsAt}
        />

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold mb-6">Konum Bilgileri</h2>
          <LocationForm
            initialAddress={dbUser.profile.address || ""}
            initialLat={dbUser.profile.latitude}
            initialLng={dbUser.profile.longitude}
          />
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-semibold mb-6">Abonelik Randevu Ayarları</h2>
          <SubscriptionSettingsForm
            allowSubscriptionAppointments={dbUser.profile.allowSubscriptionAppointments}
            allowedRecurrenceTypes={allowedRecurrenceTypes}
            allowTimeChanges={dbUser.profile.allowTimeChanges}
          />
        </div>
      </div>
    </div>
  );
}

