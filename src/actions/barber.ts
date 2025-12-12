"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createBarberProfile(formData: FormData) {
  const { userId } = await auth();

  if (!userId) {
    return { error: "Oturum açmanız gerekiyor." };
  }

  const shopName = formData.get("shopName") as string;
  const slug = formData.get("slug") as string;
  const dbUserId = formData.get("dbUserId") as string;

  if (!shopName || !slug) {
    return { error: "Lütfen tüm alanları doldurun." };
  }

  // Slug kontrolü (Benzersiz olmalı)
  const existingSlug = await db.profile.findUnique({
    where: { slug },
  });

  if (existingSlug) {
    return { error: "Bu URL adresi daha önce alınmış." };
  }

  try {
    // Transaction ile hem kullanıcı rolünü güncelle hem de profili oluştur
    await db.$transaction([
      db.user.update({
        where: { id: dbUserId },
        data: { role: "BARBER" },
      }),
      db.profile.create({
        data: {
          userId: dbUserId,
          shopName,
          slug,
          // Varsayılan tema ayarları
          themeConfig: {
            color: "slate",
            font: "inter"
          }
        },
      }),
    ]);

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }
}

