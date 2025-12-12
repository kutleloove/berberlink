import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BarberSidebar } from "./_components/barber-sidebar";

export default async function BarberLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <BarberSidebar profile={dbUser.profile} />
      <main className="flex-1 overflow-y-auto bg-white/50 backdrop-blur-sm">
        <div className="min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

