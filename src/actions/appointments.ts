"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function getAppointments(profileId: string, type: "active" | "past" | "all" | "week" = "all") {
  const now = new Date();

  const where: any = {
    barberId: profileId,
    status: { not: "CANCELLED" }
  };

  if (type === "active") {
    where.startTime = { gte: now };
  } else if (type === "past") {
    where.startTime = { lt: now };
  } else if (type === "week") {
    // Bu haftanın başlangıcı (Pazartesi)
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Pazartesi
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    // Bu haftanın sonu (Pazar)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    where.startTime = {
      gte: startOfWeek,
      lte: endOfWeek,
    };
  }

  // Önce aktif abonelik randevularından gelecek randevuları oluştur
  await generateFutureSubscriptionAppointments(profileId);

  const appointments = await db.appointment.findMany({
    where,
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true
        }
      },
      staff: {
        select: {
          id: true,
          name: true
        }
      },
      services: true,
      pendingChange: true,
      subscriptionAppointment: {
        select: {
          id: true,
          recurrenceType: true,
        },
      },
    },
    orderBy: { startTime: "asc" }
  });

  // Decimal nesnelerini serialize et (Client Component'e geçirilebilmesi için)
  return appointments.map(appointment => ({
    ...appointment,
    services: appointment.services.map(service => ({
      ...service,
      price: Number(service.price) // Decimal'i number'a dönüştür
    }))
  }));
}

// Abonelik randevularından gelecek randevuları otomatik oluştur
export async function generateFutureSubscriptionAppointments(barberId: string) {
  const now = new Date();
  const futureLimit = new Date();
  futureLimit.setDate(now.getDate() + 90); // 90 gün ileriye kadar oluştur

  // Aktif abonelik randevularını getir
  const subscriptions = await db.subscriptionAppointment.findMany({
    where: {
      barberId,
      isActive: true,
      OR: [
        { endDate: null },
        { endDate: { gte: now } },
      ],
    },
    include: {
      services: true,
      exceptions: true,
      generatedAppointments: {
        where: {
          status: { not: "CANCELLED" },
        },
        select: {
          startTime: true,
        },
      },
    },
  });

  for (const subscription of subscriptions) {
    const [hours, minutes] = subscription.time.split(":").map(Number);
    const existingDates = new Set(
      subscription.generatedAppointments.map(apt =>
        apt.startTime.toISOString().split('T')[0]
      )
    );

    // İstisnaları kontrol et
    const exceptionDates = new Set(
      subscription.exceptions.map(ex => ex.originalDate.toISOString().split('T')[0])
    );

    // İlk randevu zaten oluşturulmuş, bir sonrakinden başla
    // Haftalık için: Bir sonraki hafta aynı gün
    // Aylık için: Bir sonraki ay aynı gün
    // Günlük için: Bir sonraki gün

    let currentDate = new Date(subscription.startDate);
    currentDate.setHours(hours, minutes, 0, 0);

    if (subscription.recurrenceType === "WEEKLY") {
      // Bir sonraki hafta aynı gün
      currentDate.setDate(currentDate.getDate() + 7);
    } else if (subscription.recurrenceType === "MONTHLY") {
      // Bir sonraki ay aynı gün
      currentDate.setMonth(currentDate.getMonth() + 1);
      if (subscription.dayOfMonth !== null) {
        const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
        const dayToSet = Math.min(subscription.dayOfMonth, lastDayOfMonth);
        currentDate.setDate(dayToSet);
      }
      currentDate.setHours(hours, minutes, 0, 0);
    } else if (subscription.recurrenceType === "DAILY") {
      // Bir sonraki gün
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const totalDuration = subscription.services.reduce((acc, s) => acc + s.duration, 0);

    while (currentDate <= futureLimit) {
      // End date kontrolü
      if (subscription.endDate && currentDate > subscription.endDate) {
        break;
      }

      // Geçmiş tarihleri atla
      if (currentDate < now) {
        if (subscription.recurrenceType === "WEEKLY") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (subscription.recurrenceType === "MONTHLY") {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        continue;
      }

      const dateStr = currentDate.toISOString().split('T')[0];

      // Zaten oluşturulmuş mu kontrol et
      if (existingDates.has(dateStr)) {
        if (subscription.recurrenceType === "WEEKLY") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (subscription.recurrenceType === "MONTHLY") {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        continue;
      }

      // İstisna kontrolü
      if (exceptionDates.has(dateStr)) {
        const exception = subscription.exceptions.find(
          ex => ex.originalDate.toISOString().split('T')[0] === dateStr
        );

        // Eğer RESCHEDULED ise, yeni tarihi kullan
        if (exception?.exceptionType === "RESCHEDULED" && exception.newDate) {
          const newDateTime = new Date(exception.newDate);
          const newEndTime = new Date(newDateTime.getTime() + totalDuration * 60000);

          // Çakışma kontrolü
          const conflict = await db.appointment.findFirst({
            where: {
              barberId,
              status: { not: "CANCELLED" },
              OR: [
                {
                  startTime: { lte: newDateTime },
                  endTime: { gt: newDateTime },
                },
                {
                  startTime: { lt: newEndTime },
                  endTime: { gte: newEndTime },
                },
              ],
              staffId: subscription.staffId || null,
            },
          });

          if (!conflict) {
            await db.appointment.create({
              data: {
                customerId: subscription.customerId,
                barberId: subscription.barberId,
                startTime: newDateTime,
                endTime: newEndTime,
                status: "CONFIRMED",
                staffId: subscription.staffId,
                subscriptionAppointmentId: subscription.id,
                services: {
                  connect: subscription.services.map((s) => ({ id: s.id })),
                },
              },
            });
            existingDates.add(newDateTime.toISOString().split('T')[0]);
          }
        }
        // CANCELLED ise hiçbir şey yapma

        if (subscription.recurrenceType === "WEEKLY") {
          currentDate.setDate(currentDate.getDate() + 7);
        } else if (subscription.recurrenceType === "MONTHLY") {
          currentDate.setMonth(currentDate.getMonth() + 1);
        } else {
          currentDate.setDate(currentDate.getDate() + 1);
        }
        continue;
      }

      // Haftalık için doğru gün kontrolü
      if (subscription.recurrenceType === "WEEKLY" && subscription.dayOfWeek !== null) {
        const targetDay = subscription.dayOfWeek; // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
        const currentDay = currentDate.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi

        if (currentDay !== targetDay) {
          // Doğru güne geç
          const daysToAdd = (targetDay - currentDay + 7) % 7;
          if (daysToAdd === 0) {
            // Eğer aynı günse, bir sonraki haftaya geç
            currentDate.setDate(currentDate.getDate() + 7);
          } else {
            currentDate.setDate(currentDate.getDate() + daysToAdd);
          }
          currentDate.setHours(hours, minutes, 0, 0);
          continue;
        }
      }

      // Aylık için doğru gün kontrolü
      if (subscription.recurrenceType === "MONTHLY" && subscription.dayOfMonth !== null) {
        const targetDay = subscription.dayOfMonth;
        const currentDay = currentDate.getDate();

        if (currentDay !== targetDay) {
          // Ayın son günü kontrolü (örneğin 31. gün yoksa)
          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          const dayToSet = Math.min(targetDay, lastDayOfMonth);
          currentDate.setDate(dayToSet);
          currentDate.setHours(hours, minutes, 0, 0);
        }
      }

      const endTime = new Date(currentDate.getTime() + totalDuration * 60000);

      // Çakışma kontrolü
      const conflict = await db.appointment.findFirst({
        where: {
          barberId,
          status: { not: "CANCELLED" },
          OR: [
            {
              startTime: { lte: currentDate },
              endTime: { gt: currentDate },
            },
            {
              startTime: { lt: endTime },
              endTime: { gte: endTime },
            },
          ],
          staffId: subscription.staffId || null,
        },
      });

      if (!conflict) {
        await db.appointment.create({
          data: {
            customerId: subscription.customerId,
            barberId: subscription.barberId,
            startTime: currentDate,
            endTime: endTime,
            status: "CONFIRMED",
            staffId: subscription.staffId,
            subscriptionAppointmentId: subscription.id,
            services: {
              connect: subscription.services.map((s) => ({ id: s.id })),
            },
          },
        });
        existingDates.add(dateStr);
      }

      // Sonraki randevu tarihini hesapla
      if (subscription.recurrenceType === "WEEKLY") {
        currentDate.setDate(currentDate.getDate() + 7);
      } else if (subscription.recurrenceType === "MONTHLY") {
        currentDate.setMonth(currentDate.getMonth() + 1);
        // Aylık için günü tekrar ayarla
        if (subscription.dayOfMonth !== null) {
          const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
          const dayToSet = Math.min(subscription.dayOfMonth, lastDayOfMonth);
          currentDate.setDate(dayToSet);
        }
        currentDate.setHours(hours, minutes, 0, 0);
      } else {
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
  }
}

export async function reassignAppointment(
  appointmentId: string,
  newStaffId: string | null,
  newStartTime: Date,
  newEndTime: Date,
  reason?: string
) {
  const session = await getSession();
  if (!session?.userId) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  try {
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
      include: { customer: true }
    });

    if (!appointment || appointment.barberId !== dbUser.profile.id) {
      return { error: "Randevu bulunamadı." };
    }

    // Eğer değişiklik varsa, müşteri onayı için AppointmentChange oluştur
    const hasChange =
      appointment.staffId !== newStaffId ||
      appointment.startTime.getTime() !== newStartTime.getTime() ||
      appointment.endTime.getTime() !== newEndTime.getTime();

    if (hasChange) {
      // Önce mevcut pending change'i sil
      if (appointment.pendingChangeId) {
        await db.appointmentChange.delete({
          where: { id: appointment.pendingChangeId }
        });
      }

      // Yeni change oluştur
      const change = await db.appointmentChange.create({
        data: {
          appointmentId,
          newStartTime,
          newEndTime,
          newStaffId: newStaffId || null,
          reason
        }
      });

      // Appointment'ı güncelle
      await db.appointment.update({
        where: { id: appointmentId },
        data: {
          pendingChangeId: change.id
        }
      });

      // TODO: E-posta bildirimi gönder
      // await sendAppointmentChangeEmail(appointment.customer.email, change);

      revalidatePath("/barber/appointments");
      return { success: true, requiresApproval: true };
    }

    // Değişiklik yoksa direkt güncelle
    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        staffId: newStaffId || null,
        startTime: newStartTime,
        endTime: newEndTime
      }
    });

    revalidatePath("/barber/appointments");
    return { success: true, requiresApproval: false };
  } catch (error) {
    console.error(error);
    return { error: "Randevu güncellenirken bir hata oluştu." };
  }
}

export async function cancelAppointment(appointmentId: string) {
  const session = await getSession();
  if (!session?.userId) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  try {
    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        status: "CANCELLED"
      }
    });

    revalidatePath("/barber/appointments");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Randevu iptal edilirken bir hata oluştu." };
  }
}

export async function changeAppointmentStaff(appointmentId: string, newStaffId: string | null) {
  const session = await getSession();
  if (!session?.userId) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { id: session.userId as string },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  try {
    const appointment = await db.appointment.findUnique({
      where: { id: appointmentId },
    });

    if (!appointment || appointment.barberId !== dbUser.profile.id) {
      return { error: "Randevu bulunamadı." };
    }

    await db.appointment.update({
      where: { id: appointmentId },
      data: {
        staffId: newStaffId,
      },
    });

    revalidatePath("/barber/appointments");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Personel değiştirilemedi." };
  }
}

