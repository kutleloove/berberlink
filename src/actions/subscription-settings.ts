"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function saveSubscriptionSettings(formData: FormData) {
  const user = await currentUser();
  if (!user) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
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
        allowedRecurrenceTypes: allowSubscriptionAppointments ? allowedRecurrenceTypes : null,
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


