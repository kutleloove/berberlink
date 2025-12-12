"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Admin yetkisi kontrolü
async function checkAdmin() {
  const { userId } = await auth();
  if (!userId) return false;
  
  const user = await db.user.findUnique({
    where: { email: (await auth()).sessionClaims?.primaryEmail as string }, // currentUser() kullanmak daha iyi olurdu ama hızlıca böyle
  });

  return user?.role === "ADMIN";
}

export async function toggleBarberStatus(profileId: string, isActive: boolean) {
  if (!await checkAdmin()) return { error: "Yetkisiz işlem." };

  try {
    await db.profile.update({
      where: { id: profileId },
      data: { isActive }
    });
    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "İşlem başarısız." };
  }
}

export async function addSubscription(profileId: string, months: number) {
  if (!await checkAdmin()) return { error: "Yetkisiz işlem." };

  try {
    const profile = await db.profile.findUnique({ where: { id: profileId } });
    if (!profile) return { error: "Berber bulunamadı." };

    const currentEnd = profile.subscriptionEndsAt && profile.subscriptionEndsAt > new Date()
      ? profile.subscriptionEndsAt
      : new Date();

    const newEnd = new Date(currentEnd);
    newEnd.setMonth(newEnd.getMonth() + months);

    await db.profile.update({
      where: { id: profileId },
      data: { 
        subscriptionEndsAt: newEnd,
        isActive: true // Abonelik eklenince otomatik aktif olsun
      }
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (error) {
    return { error: "Abonelik eklenemedi." };
  }
}

