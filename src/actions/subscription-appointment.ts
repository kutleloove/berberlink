"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";
import { generateFutureSubscriptionAppointments } from "./appointments";

// Berberin abonelik randevu ayarlarını kontrol et
export async function getBarberSubscriptionSettings(barberId: string) {
  const profile = await db.profile.findUnique({
    where: { id: barberId },
    select: {
      allowSubscriptionAppointments: true,
      allowedRecurrenceTypes: true,
      allowTimeChanges: true,
    },
  });

  if (!profile) {
    return null;
  }

  return {
    allowSubscriptionAppointments: profile.allowSubscriptionAppointments,
    allowedRecurrenceTypes: (profile.allowedRecurrenceTypes as string[]) || [],
    allowTimeChanges: profile.allowTimeChanges,
  };
}

// Kullanıcının bu berber için aktif abonelik randevusu var mı kontrol et
export async function hasActiveSubscriptionAppointment(barberId: string) {
  const user = await currentUser();
  if (!user) return false;

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
  });

  if (!dbUser) return false;

  const subscription = await db.subscriptionAppointment.findFirst({
    where: {
      customerId: dbUser.id,
      barberId,
      isActive: true,
    },
  });

  return !!subscription;
}

// Abonelik randevusu oluştur
export async function createSubscriptionAppointment(
  barberId: string,
  serviceIds: string[],
  startDate: Date,
  time: string, // "16:00" formatında
  recurrenceType: "DAILY" | "WEEKLY" | "MONTHLY",
  staffId?: string,
  endDate?: Date,
  dayOfWeek?: number, // Haftalık için
  dayOfMonth?: number // Aylık için
) {
  const user = await currentUser();
  if (!user) {
    return { error: "Randevu almak için giriş yapmalısınız." };
  }

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
  });

  if (!dbUser) {
    return { error: "Kullanıcı bulunamadı." };
  }

  try {
    // İlk randevuyu oluştur
    const [hours, minutes] = time.split(":").map(Number);
    const firstAppointmentDate = new Date(startDate);
    firstAppointmentDate.setHours(hours, minutes, 0, 0);

    const services = await db.service.findMany({
      where: { id: { in: serviceIds } },
    });

    const totalDuration = services.reduce((acc, s) => acc + s.duration, 0);
    const firstAppointmentEndTime = new Date(
      firstAppointmentDate.getTime() + totalDuration * 60000
    );

    // Çakışma kontrolü
    const conflictWhere: any = {
      barberId,
      status: { not: "CANCELLED" },
      OR: [
        {
          startTime: { lte: firstAppointmentDate },
          endTime: { gt: firstAppointmentDate },
        },
        {
          startTime: { lt: firstAppointmentEndTime },
          endTime: { gte: firstAppointmentEndTime },
        },
      ],
    };

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
          : "Seçilen saatte başka bir randevu mevcut.",
      };
    }

    // Abonelik randevusunu oluştur
    const subscription = await db.subscriptionAppointment.create({
      data: {
        customerId: dbUser.id,
        barberId,
        recurrenceType,
        startDate: firstAppointmentDate,
        endDate: endDate || null,
        time,
        dayOfWeek: dayOfWeek || null,
        dayOfMonth: dayOfMonth || null,
        staffId: staffId || null,
        services: {
          connect: serviceIds.map((id) => ({ id })),
        },
      },
    });

    // İlk randevuyu oluştur
    await db.appointment.create({
      data: {
        customerId: dbUser.id,
        barberId,
        startTime: firstAppointmentDate,
        endTime: firstAppointmentEndTime,
        status: "CONFIRMED",
        staffId: staffId || null,
        subscriptionAppointmentId: subscription.id,
        services: {
          connect: serviceIds.map((id) => ({ id })),
        },
      },
    });

    // Gelecek randevuları oluştur
    await generateFutureSubscriptionAppointments(barberId);

    revalidatePath("/appointments");
    revalidatePath(`/dashboard`);
    revalidatePath(`/barber/customers`);

    return { success: true, subscriptionId: subscription.id };
  } catch (error) {
    console.error(error);
    return { error: "Abonelik randevusu oluşturulurken bir hata oluştu." };
  }
}

// Kullanıcının abonelik randevularını getir
export async function getSubscriptionAppointments() {
  const user = await currentUser();
  if (!user) return [];

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
  });

  if (!dbUser) return [];

  const subscriptions = await db.subscriptionAppointment.findMany({
    where: {
      customerId: dbUser.id,
      isActive: true,
    },
    include: {
      barber: {
        select: {
          id: true,
          shopName: true,
          slug: true,
        },
      },
      staff: {
        select: {
          id: true,
          name: true,
        },
      },
      services: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
      },
      exceptions: {
        orderBy: { originalDate: "desc" },
        take: 10, // Son 10 istisna
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return subscriptions;
}

// Abonelik randevusunu iptal et
export async function cancelSubscriptionAppointment(subscriptionId: string) {
  const user = await currentUser();
  if (!user) {
    return { error: "Yetkisiz işlem." };
  }

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
  });

  if (!dbUser) {
    return { error: "Kullanıcı bulunamadı." };
  }

  try {
    // Abonelik randevusunu kontrol et
    const subscription = await db.subscriptionAppointment.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.customerId !== dbUser.id) {
      return { error: "Abonelik randevusu bulunamadı." };
    }

    // Aboneliği pasif yap
    await db.subscriptionAppointment.update({
      where: { id: subscriptionId },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/customer");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Abonelik randevusu iptal edilemedi." };
  }
}

// Belirli bir randevuyu iptal et (abonelikten)
export async function cancelSubscriptionAppointmentDate(
  subscriptionId: string,
  date: Date
) {
  const user = await currentUser();
  if (!user) {
    return { error: "Yetkisiz işlem." };
  }

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
  });

  if (!dbUser) {
    return { error: "Kullanıcı bulunamadı." };
  }

  try {
    // Abonelik randevusunu kontrol et
    const subscription = await db.subscriptionAppointment.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.customerId !== dbUser.id) {
      return { error: "Abonelik randevusu bulunamadı." };
    }

    // İstisna oluştur
    await db.subscriptionAppointmentException.create({
      data: {
        subscriptionAppointmentId: subscriptionId,
        originalDate: date,
        exceptionType: "CANCELLED",
      },
    });

    // İlgili randevuyu iptal et
    const dateStr = date.toISOString().split('T')[0];
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    await db.appointment.updateMany({
      where: {
        subscriptionAppointmentId: subscriptionId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    revalidatePath("/customer");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Randevu iptal edilemedi." };
  }
}

// Belirli bir randevuyu değiştir (abonelikten)
export async function rescheduleSubscriptionAppointmentDate(
  subscriptionId: string,
  originalDate: Date,
  newDate: Date,
  newTime: string
) {
  const user = await currentUser();
  if (!user) {
    return { error: "Yetkisiz işlem." };
  }

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
  });

  if (!dbUser) {
    return { error: "Kullanıcı bulunamadı." };
  }

  try {
    // Abonelik randevusunu kontrol et
    const subscription = await db.subscriptionAppointment.findUnique({
      where: { id: subscriptionId },
      include: {
        services: true,
      },
    });

    if (!subscription || subscription.customerId !== dbUser.id) {
      return { error: "Abonelik randevusu bulunamadı." };
    }

    // Berberin saat değişikliğine izin verip vermediğini kontrol et
    const barber = await db.profile.findUnique({
      where: { id: subscription.barberId },
      select: {
        allowTimeChanges: true,
      },
    });

    if (!barber?.allowTimeChanges) {
      return { error: "Bu berber randevu saatlerinin değiştirilmesine izin vermiyor." };
    }

    // Yeni tarih ve saat oluştur
    const [hours, minutes] = newTime.split(":").map(Number);
    const newDateTime = new Date(newDate);
    newDateTime.setHours(hours, minutes, 0, 0);

    const totalDuration = subscription.services.reduce((acc, s) => acc + s.duration, 0);
    const newEndTime = new Date(newDateTime.getTime() + totalDuration * 60000);

    // Çakışma kontrolü
    const conflict = await db.appointment.findFirst({
      where: {
        barberId: subscription.barberId,
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

    if (conflict) {
      return { error: "Seçilen saatte başka bir randevu mevcut." };
    }

    // İstisna oluştur
    await db.subscriptionAppointmentException.create({
      data: {
        subscriptionAppointmentId: subscriptionId,
        originalDate: originalDate,
        exceptionType: "RESCHEDULED",
        newDate: newDateTime,
        newTime: newTime,
      },
    });

    // Eski randevuyu iptal et
    const dateStr = originalDate.toISOString().split('T')[0];
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    await db.appointment.updateMany({
      where: {
        subscriptionAppointmentId: subscriptionId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    // Yeni randevu oluştur
    await db.appointment.create({
      data: {
        customerId: dbUser.id,
        barberId: subscription.barberId,
        startTime: newDateTime,
        endTime: newEndTime,
        status: "CONFIRMED",
        staffId: subscription.staffId,
        subscriptionAppointmentId: subscriptionId,
        services: {
          connect: subscription.services.map((s) => ({ id: s.id })),
        },
      },
    });

    revalidatePath("/customer");
    revalidatePath("/barber/appointments/subscriptions");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Randevu değiştirilemedi." };
  }
}

// Berber için abonelik randevularını getir
export async function getBarberSubscriptionAppointments(barberId: string) {
  const subscriptions = await db.subscriptionAppointment.findMany({
    where: {
      barberId,
      isActive: true,
    },
    include: {
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      },
      staff: {
        select: {
          id: true,
          name: true,
        },
      },
      services: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
      },
      exceptions: {
        orderBy: { originalDate: "desc" },
      },
      generatedAppointments: {
        where: {
          status: { not: "CANCELLED" },
        },
        orderBy: { startTime: "asc" },
        take: 10,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Decimal nesnelerini serialize et (Client Component'e geçirilebilmesi için)
  return subscriptions.map(subscription => ({
    ...subscription,
    services: subscription.services.map(service => ({
      ...service,
      price: Number(service.price), // Decimal'i number'a dönüştür
    })),
  }));
}

// Berber abonelik randevusunu iptal edebilir
export async function barberCancelSubscriptionAppointment(subscriptionId: string, barberId: string) {
  try {
    const subscription = await db.subscriptionAppointment.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription || subscription.barberId !== barberId) {
      return { error: "Abonelik randevusu bulunamadı." };
    }

    await db.subscriptionAppointment.update({
      where: { id: subscriptionId },
      data: {
        isActive: false,
      },
    });

    revalidatePath("/barber/appointments/subscriptions");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Abonelik randevusu iptal edilemedi." };
  }
}

// Berber belirli bir abonelik randevu tarihini taşıyabilir
export async function barberRescheduleSubscriptionAppointmentDate(
  subscriptionId: string,
  originalDate: Date,
  newDate: Date,
  newTime: string,
  barberId: string
) {
  try {
    const subscription = await db.subscriptionAppointment.findUnique({
      where: { id: subscriptionId },
      include: {
        services: true,
      },
    });

    if (!subscription || subscription.barberId !== barberId) {
      return { error: "Abonelik randevusu bulunamadı." };
    }

    const [hours, minutes] = newTime.split(":").map(Number);
    const newDateTime = new Date(newDate);
    newDateTime.setHours(hours, minutes, 0, 0);

    const totalDuration = subscription.services.reduce((acc, s) => acc + s.duration, 0);
    const newEndTime = new Date(newDateTime.getTime() + totalDuration * 60000);

    const conflict = await db.appointment.findFirst({
      where: {
        barberId: subscription.barberId,
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
        subscriptionAppointmentId: { not: subscriptionId },
      },
    });

    if (conflict) {
      return { error: "Seçilen saatte başka bir randevu mevcut." };
    }

    await db.subscriptionAppointmentException.create({
      data: {
        subscriptionAppointmentId: subscriptionId,
        originalDate: originalDate,
        exceptionType: "RESCHEDULED",
        newDate: newDateTime,
        newTime: newTime,
      },
    });

    const dateStr = originalDate.toISOString().split('T')[0];
    const startOfDay = new Date(dateStr);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateStr);
    endOfDay.setHours(23, 59, 59, 999);

    await db.appointment.updateMany({
      where: {
        subscriptionAppointmentId: subscriptionId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      data: {
        status: "CANCELLED",
      },
    });

    await db.appointment.create({
      data: {
        customerId: subscription.customerId,
        barberId: subscription.barberId,
        startTime: newDateTime,
        endTime: newEndTime,
        status: "CONFIRMED",
        staffId: subscription.staffId,
        subscriptionAppointmentId: subscriptionId,
        services: {
          connect: subscription.services.map((s) => ({ id: s.id })),
        },
      },
    });

    revalidatePath("/barber/appointments/subscriptions");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Randevu değiştirilemedi." };
  }
}

