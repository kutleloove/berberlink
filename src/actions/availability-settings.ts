"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function saveWorkingHours(formData: FormData) {
  const user = await currentUser();
  if (!user) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  try {
    // Her gün için çalışma saatlerini kaydet
    for (let dayOfWeek = 0; dayOfWeek < 7; dayOfWeek++) {
      const isClosed = formData.get(`closed-${dayOfWeek}`) === "on";
      
      // WorkingHour'ı oluştur/güncelle
      const workingHour = await db.workingHour.upsert({
        where: {
          profileId_dayOfWeek: {
            profileId: dbUser.profile.id,
            dayOfWeek,
          }
        },
        update: {
          isClosed,
        },
        create: {
          profileId: dbUser.profile.id,
          dayOfWeek,
          isClosed,
        }
      });

      // Eğer kapalı değilse, vardiyaları kaydet
      if (!isClosed) {
        // Önce mevcut vardiyaları sil
        await db.shift.deleteMany({
          where: { workingHourId: workingHour.id }
        });

        // Yeni vardiyaları ekle
        const shiftCount = parseInt(formData.get(`shiftCount-${dayOfWeek}`) as string) || 1;
        
        for (let i = 0; i < shiftCount; i++) {
          const startTime = formData.get(`shift-${dayOfWeek}-${i}-start`) as string;
          const endTime = formData.get(`shift-${dayOfWeek}-${i}-end`) as string;
          
          if (startTime && endTime) {
            await db.shift.create({
              data: {
                workingHourId: workingHour.id,
                startTime,
                endTime,
              }
            });
          }
        }
      } else {
        // Kapalıysa tüm vardiyaları sil
        await db.shift.deleteMany({
          where: { workingHourId: workingHour.id }
        });
      }
    }

    revalidatePath("/barber/availability");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Güncellenemedi." };
  }
}
