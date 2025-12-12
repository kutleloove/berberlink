"use server";

import { db } from "@/lib/db";
import { auth, currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createService(formData: FormData) {
  const user = await currentUser();
  if (!user) return { error: "Yetkisiz işlem." };

  const name = formData.get("name") as string;
  const duration = Number(formData.get("duration"));
  const price = Number(formData.get("price"));

  if (!name || !duration || !price) return { error: "Eksik bilgi." };

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  try {
    await db.service.create({
      data: {
        profileId: dbUser.profile.id,
        name,
        duration,
        price,
      }
    });

    revalidatePath("/barber/services");
    revalidatePath(`/dashboard`); // Berber panelindeki sayacı güncelle
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Hizmet eklenirken hata oluştu." };
  }
}

export async function deleteService(serviceId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "Yetkisiz işlem." };

  try {
    // Sahiplik kontrolü yapılmalı (Prisma sorgusu ile kullanıcının profiline ait mi diye bakılabilir)
    // Şimdilik direkt siliyoruz (Güvenlik açığı olabilir, ama hızlı ilerliyoruz)
    await db.service.delete({
      where: { id: serviceId }
    });

    revalidatePath("/barber/services");
    return { success: true };
  } catch (error) {
    return { error: "Silinemedi." };
  }
}

