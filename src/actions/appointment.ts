"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";
import { generateFutureSubscriptionAppointments } from "./appointments";

export async function createAppointment(
  barberId: string,
  serviceIds: string[],
  date: Date,
  staffId?: string // Personel ID (opsiyonel)
) {
  const dbUser = await getCurrentUser();

  if (!dbUser) {
    return { error: "Randevu almak için giriş yapmalısınız." };
  }

  // Abonelik randevusu kontrolü: Eğer aktif abonelik randevusu varsa ve aylık değilse, yeni randevu alamaz
  const activeSubscription = await db.subscriptionAppointment.findFirst({
    where: {
      customerId: dbUser.id,
      barberId,
      isActive: true,
      recurrenceType: { not: "MONTHLY" }, // Aylık hariç
    },
  });

  if (activeSubscription) {
    return {
      error: "Aktif bir abonelik randevunuz bulunmaktadır. Yeni randevu almak için önce mevcut aboneliğinizi iptal etmeniz veya güncellemeniz gerekmektedir."
    };
  }

  try {
    // Seçilen hizmetlerin toplam süresini ve fiyatını hesapla
    const services = await db.service.findMany({
      where: {
        id: { in: serviceIds }
      }
    });

    const totalDuration = services.reduce((acc, s) => acc + s.duration, 0);

    // Bitiş saatini hesapla
    const endTime = new Date(date.getTime() + totalDuration * 60000);

    // Çakışma kontrolü - Personel bazlı veya işletme bazlı
    const conflictWhere: any = {
      barberId,
      status: { not: "CANCELLED" },
      OR: [
        {
          startTime: { lte: date },
          endTime: { gt: date },
        },
        {
          startTime: { lt: endTime },
          endTime: { gte: endTime },
        },
      ],
    };

    // Eğer personel seçildiyse, sadece o personelin randevularını kontrol et
    // Eğer personel seçilmediyse, işletme genelinde kontrol et (staffId null olanlar)
    if (staffId) {
      conflictWhere.staffId = staffId;
    } else {
      conflictWhere.staffId = null;
    }

    const conflict = await db.appointment.findFirst({
      where: conflictWhere,
    });

    if (conflict) {
      return {
        error: staffId
          ? "Seçilen personel için bu saatte başka bir randevu mevcut."
          : "Seçilen saatte başka bir randevu mevcut."
      };
    }

    // Randevuyu oluştur - Otomatik onaylanmış olarak
    await db.appointment.create({
      data: {
        customerId: dbUser.id,
        barberId,
        startTime: date,
        endTime,
        status: "CONFIRMED", // Otomatik onaylanmış
        staffId: staffId || null, // Personel ataması
        services: {
          connect: serviceIds.map(id => ({ id }))
        }
      }
    });

    // Abonelik randevularından gelecek randevuları oluştur
    await generateFutureSubscriptionAppointments(barberId);

    revalidatePath("/appointments"); // Müşteri paneli
    revalidatePath(`/dashboard`);    // Berber paneli
    revalidatePath(`/barber/customers`); // Yeni müşteri listesini güncelle

    return { success: true };

  } catch (error) {
    console.error(error);
    return { error: "Randevu oluşturulurken bir hata oluştu." };
  }
}

