import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { OnboardingForm } from "./_components/onboarding-form";

export default async function OnboardingPage() {
  const session = await getSession();
  if (!session?.userId) redirect("/sign-in");

  // Kullanıcı zaten berber ise yönlendir
  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
    include: { profile: true },
  });

  if (dbUser?.role === "BARBER" && dbUser?.profile) {
    redirect("/barber");
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-lg">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">İşletmenizi Oluşturun</h1>
        <p className="text-slate-600 mb-8">BerberLink'te yerinizi alın ve randevuları yönetmeye başlayın.</p>

        <OnboardingForm userId={dbUser?.id || ""} />
      </div>
    </div>
  );
}

