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
    <div className="w-full">
      <div className="mb-8 text-center text-white">
        <h1 className="font-display text-4xl font-bold mb-2">İşletmenizi Oluşturun ✂️</h1>
        <p className="text-slate-400">
          BerberLink&apos;te yerinizi alın ve randevuları profesyonelce yönetmeye başlayın.
        </p>
      </div>

      <OnboardingForm userId={dbUser?.id || ""} />
    </div>
  );
}

