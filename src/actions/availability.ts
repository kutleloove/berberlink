"use server";

import { db } from "@/lib/db";

export async function getAvailableSlots(
  barberId: string, 
  date: Date, 
  staffId?: string, // Personel ID (opsiyonel)
  serviceId?: string // Hizmet ID - bu hizmete atanmış personelleri bulmak için
) {
  const dayOfWeek = date.getDay(); // 0: Pazar, 1: Pzt...

  let workingHour: any = null;
  let shifts: any[] = [];
  let breaks: any[] = [];

  // Eğer personel seçildiyse, personelin çalışma saatlerini kullan
  if (staffId) {
    const staffWorkingHour = await db.staffWorkingHour.findUnique({
      where: {
        staffId_dayOfWeek: {
          staffId,
          dayOfWeek,
        }
      },
      include: {
        shifts: {
          orderBy: { startTime: "asc" }
        }
      }
    });

    if (staffWorkingHour && !staffWorkingHour.isClosed && staffWorkingHour.shifts.length > 0) {
      workingHour = staffWorkingHour;
      shifts = staffWorkingHour.shifts;
      
      // Personel bazlı molalar
      breaks = await db.staffBreak.findMany({
        where: {
          staffId,
          dayOfWeek,
        }
      });
    }
  }

  // Eğer personel çalışma saati yoksa veya personel seçilmediyse, işletme genelini kullan
  if (!workingHour || shifts.length === 0) {
    workingHour = await db.workingHour.findUnique({
      where: {
        profileId_dayOfWeek: {
          profileId: barberId,
          dayOfWeek,
        }
      },
      include: {
        shifts: {
          orderBy: { startTime: "asc" }
        }
      }
    });

    if (workingHour) {
      shifts = workingHour.shifts;
    }

    // İşletme geneli molalar
    breaks = await db.break.findMany({
      where: {
        profileId: barberId,
        dayOfWeek,
      }
    });
  }

  // Eğer çalışma saati tanımlanmamışsa veya kapalıysa müsaitlik yok
  if (!workingHour || workingHour.isClosed || shifts.length === 0) {
    return [];
  }

  // Tatil kontrolü (işletme geneli)
  const holidays = await db.holiday.findMany({
    where: {
      profileId: barberId,
      startDate: { lte: date },
      endDate: { gte: date },
    }
  });

  if (holidays.length > 0) {
    return [];
  }

  // O günkü randevuları çek - Personel bazlı veya işletme geneli
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const appointmentWhere: any = {
    barberId,
    startTime: {
      gte: startOfDay,
      lte: endOfDay,
    },
    status: { not: "CANCELLED" },
  };

  // Eğer personel seçildiyse, sadece o personelin randevularını kontrol et
  // Eğer personel seçilmediyse, işletme genelinde (staffId null) kontrol et
  if (staffId) {
    appointmentWhere.staffId = staffId;
  } else {
    appointmentWhere.staffId = null;
  }

  const appointments = await db.appointment.findMany({
    where: appointmentWhere,
    select: {
      startTime: true,
      endTime: true,
    }
  });

  const slots: Date[] = [];
  const interval = 30; // dakika

  // Her vardiya için slot oluştur
  for (const shift of shifts) {
    const [startH, startM] = shift.startTime.split(":").map(Number);
    const [endH, endM] = shift.endTime.split(":").map(Number);

    let currentSlot = new Date(date);
    currentSlot.setHours(startH, startM, 0, 0);

    const shiftEndTime = new Date(date);
    shiftEndTime.setHours(endH, endM, 0, 0);

    while (currentSlot < shiftEndTime) {
      // Geçmiş zaman kontrolü
      if (currentSlot < new Date()) {
        currentSlot = new Date(currentSlot.getTime() + interval * 60000);
        continue;
      }

      const slotEndTime = new Date(currentSlot.getTime() + interval * 60000);

      // Mola kontrolü - Slot herhangi bir mola ile çakışıyor mu?
      const isInBreak = breaks.some(br => {
        const [brStartH, brStartM] = br.startTime.split(":").map(Number);
        const [brEndH, brEndM] = br.endTime.split(":").map(Number);
        
        const breakStart = new Date(date);
        breakStart.setHours(brStartH, brStartM, 0, 0);
        
        const breakEnd = new Date(date);
        breakEnd.setHours(brEndH, brEndM, 0, 0);

        return (
          (currentSlot >= breakStart && currentSlot < breakEnd) ||
          (slotEndTime > breakStart && slotEndTime <= breakEnd) ||
          (currentSlot <= breakStart && slotEndTime >= breakEnd)
        );
      });

      if (isInBreak) {
        currentSlot = new Date(currentSlot.getTime() + interval * 60000);
        continue;
      }

      // Randevu çakışma kontrolü
      const isBusy = appointments.some(appt => {
        return (
          (currentSlot >= appt.startTime && currentSlot < appt.endTime) ||
          (slotEndTime > appt.startTime && slotEndTime <= appt.endTime) ||
          (currentSlot <= appt.startTime && slotEndTime >= appt.endTime)
        );
      });

      if (!isBusy) {
        slots.push(new Date(currentSlot));
      }

      // Bir sonraki slot'a geç
      currentSlot = new Date(currentSlot.getTime() + interval * 60000);
    }
  }

  // Slotları sırala
  return slots.sort((a, b) => a.getTime() - b.getTime());
}

// Bir tarihin müsait olup olmadığını kontrol et (takvim için)
export async function isDateAvailable(
  barberId: string, 
  date: Date, 
  staffId?: string
): Promise<boolean> {
  const dayOfWeek = date.getDay();
  
  let workingHour: any = null;

  // Eğer personel seçildiyse, personelin çalışma saatlerini kontrol et
  if (staffId) {
    workingHour = await db.staffWorkingHour.findUnique({
      where: {
        staffId_dayOfWeek: {
          staffId,
          dayOfWeek,
        }
      },
      include: {
        shifts: true
      }
    });
  }

  // Eğer personel çalışma saati yoksa veya personel seçilmediyse, işletme genelini kontrol et
  if (!workingHour || workingHour.shifts.length === 0) {
    workingHour = await db.workingHour.findUnique({
      where: {
        profileId_dayOfWeek: {
          profileId: barberId,
          dayOfWeek,
        }
      },
      include: {
        shifts: true
      }
    });
  }

  // Kapalı veya vardiya yoksa müsait değil
  if (!workingHour || workingHour.isClosed || workingHour.shifts.length === 0) {
    return false;
  }

  // Tatil kontrolü (işletme geneli)
  const holidays = await db.holiday.findMany({
    where: {
      profileId: barberId,
      startDate: { lte: date },
      endDate: { gte: date },
    }
  });

  if (holidays.length > 0) {
    return false;
  }

  // Geçmiş tarih kontrolü
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date < today) {
    return false;
  }

  return true;
}

// Bir hizmete atanmış personelleri getir
export async function getStaffForService(barberId: string, serviceId: string) {
  const service = await db.service.findUnique({
    where: { id: serviceId },
    include: {
      staffAssignments: {
        include: {
          staff: {
            include: {
              role: true
            }
          }
        }
      }
    }
  });

  if (!service) return [];

  return service.staffAssignments
    .filter(sa => sa.staff.isActive)
    .map(sa => sa.staff);
}
