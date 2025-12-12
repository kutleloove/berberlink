"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getAppointments(profileId: string, type: "active" | "past" | "all" = "all") {
  const now = new Date();
  
  const where: any = {
    barberId: profileId,
    status: { not: "CANCELLED" }
  };

  if (type === "active") {
    where.startTime = { gte: now };
  } else if (type === "past") {
    where.startTime = { lt: now };
  }

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
      pendingChange: true
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

export async function reassignAppointment(
  appointmentId: string,
  newStaffId: string | null,
  newStartTime: Date,
  newEndTime: Date,
  reason?: string
) {
  const user = await currentUser();
  if (!user) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
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
  const user = await currentUser();
  if (!user) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
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

