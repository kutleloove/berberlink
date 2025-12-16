"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function updateLocation(formData: FormData) {
  const session = await getSession();
  if (!session?.userId) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  const address = formData.get("address") as string;
  const lat = parseFloat(formData.get("lat") as string);
  const lng = parseFloat(formData.get("lng") as string);

  console.log("📍 [SETTINGS] Konum kaydediliyor:", {
    profileId: dbUser.profile.id,
    shopName: dbUser.profile.shopName,
    address,
    lat,
    lng
  });

  try {
    const updated = await db.profile.update({
      where: { id: dbUser.profile.id },
      data: {
        address,
        latitude: lat,
        longitude: lng,
      }
    });

    console.log("✅ [SETTINGS] Konum başarıyla kaydedildi:", {
      id: updated.id,
      latitude: updated.latitude,
      longitude: updated.longitude
    });

    revalidatePath("/barber/settings");
    revalidatePath("/map"); // Harita sayfasını da yenile
    return { success: true };
  } catch (error) {
    console.error("❌ [SETTINGS] Konum kaydedilemedi:", error);
    return { error: "Konum güncellenemedi." };
  }
}

