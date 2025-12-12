import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
  });

  if (!dbUser) return null;

  // Role based redirection
  if (dbUser.role === "ADMIN") redirect("/admin");
  if (dbUser.role === "BARBER") redirect("/barber");
  redirect("/customer");
}

