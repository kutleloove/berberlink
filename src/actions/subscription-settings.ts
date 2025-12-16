"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function saveSubscriptionSettings(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  try {
    const allowSubscriptionAppointments = formData.get("allowSubscriptionAppointments") === "on";
    const allowTimeChanges = formData.get("allowTimeChanges") === "on";

    // İzin verilen tekrar türlerini topla
    const allowedRecurrenceTypes: string[] = [];
    if (formData.get("recurrenceType-DAILY") === "on") {
      allowedRecurrenceTypes.push("DAILY");
    }
    if (formData.get("recurrenceType-WEEKLY") === "on") {
      allowedRecurrenceTypes.push("WEEKLY");
    }
    if (formData.get("recurrenceType-MONTHLY") === "on") {
      allowedRecurrenceTypes.push("MONTHLY");
    }

    await db.profile.update({
      where: { id: dbUser.profile.id },
      data: {
        allowSubscriptionAppointments,
        allowedRecurrenceTypes: allowSubscriptionAppointments ? (allowedRecurrenceTypes as any) : undefined,
        allowTimeChanges: allowSubscriptionAppointments ? allowTimeChanges : true,
      }
    });

    revalidatePath("/barber/settings");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Güncellenemedi." };
  }
}


