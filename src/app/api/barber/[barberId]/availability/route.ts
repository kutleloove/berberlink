import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barberId: string }> }
) {
  try {
    const { barberId } = await params;
    const searchParams = request.nextUrl.searchParams;
    const month = parseInt(searchParams.get("month") || new Date().getMonth().toString());
    const year = parseInt(searchParams.get("year") || new Date().getFullYear().toString());
    const dateStr = searchParams.get("date"); // Belirli bir tarih için saatleri getir

    // Eğer date parametresi varsa, o tarih için müsait saatleri getir
    if (dateStr) {
      // Tarihi timezone sorunlarından kaçınmak için manuel parse et
      // "2025-12-13" formatından yıl, ay, gün çıkar
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day); // month 0-indexed
      const dayOfWeek = date.getDay();

      // Çalışma saatlerini getir
      const workingHour = await db.workingHour.findUnique({
        where: {
          profileId_dayOfWeek: {
            profileId: barberId,
            dayOfWeek,
          },
        },
        include: {
          shifts: {
            orderBy: { startTime: "asc" },
          },
        },
      });

      if (!workingHour || workingHour.isClosed || workingHour.shifts.length === 0) {
        return NextResponse.json({
          availableHours: [],
          unavailableHours: [],
        });
      }

      // Tatil kontrolü
      const holidays = await db.holiday.findMany({
        where: {
          profileId: barberId,
          startDate: { lte: date },
          endDate: { gte: date },
        },
      });

      if (holidays.length > 0) {
        return NextResponse.json({
          availableHours: [],
          unavailableHours: [],
        });
      }

      // O günkü randevuları çek
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const appointments = await db.appointment.findMany({
        where: {
          barberId,
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
          status: { not: "CANCELLED" },
          staffId: null, // İşletme geneli
        },
        select: {
          startTime: true,
          endTime: true,
        },
      });

      // Müsait ve dolu saatleri hesapla
      const availableHours: string[] = [];
      const unavailableHours: string[] = [];
      const interval = 30; // dakika

      for (const shift of workingHour.shifts) {
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
          const timeStr = `${currentSlot.getHours().toString().padStart(2, "0")}:${currentSlot.getMinutes().toString().padStart(2, "0")}`;

          // Randevu çakışma kontrolü
          const isBusy = appointments.some((appt) => {
            return (
              (currentSlot >= appt.startTime && currentSlot < appt.endTime) ||
              (slotEndTime > appt.startTime && slotEndTime <= appt.endTime) ||
              (currentSlot <= appt.startTime && slotEndTime >= appt.endTime)
            );
          });

          if (isBusy) {
            unavailableHours.push(timeStr);
          } else {
            availableHours.push(timeStr);
          }

          currentSlot = new Date(currentSlot.getTime() + interval * 60000);
        }
      }

      return NextResponse.json({
        availableHours,
        unavailableHours,
      });
    }

    // Ay için müsait ve müsait olmayan tarihleri getir
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const availableDates: string[] = [];
    const unavailableDates: string[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Timezone sorunlarından kaçınmak için tarihi manuel oluştur
      const year = d.getFullYear();
      const month = d.getMonth();
      const day = d.getDate();
      const date = new Date(year, month, day); // Yerel timezone'da tarih oluştur
      const dayOfWeek = date.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

      // Geçmiş tarih kontrolü
      if (date < today) {
        unavailableDates.push(dateStr);
        continue;
      }

      // Çalışma saati kontrolü
      const workingHour = await db.workingHour.findUnique({
        where: {
          profileId_dayOfWeek: {
            profileId: barberId,
            dayOfWeek,
          },
        },
        include: {
          shifts: true,
        },
      });

      // Debug: Tüm günler için detaylı log
      const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        console.log(`[Availability API] ${dateStr} (${dayNames[dayOfWeek]}, dayOfWeek=${dayOfWeek}):`, {
          found: !!workingHour,
          isClosed: workingHour?.isClosed,
          shiftsCount: workingHour?.shifts.length || 0,
          willBeAvailable: !(!workingHour || workingHour.isClosed || workingHour.shifts.length === 0),
          workingHourId: workingHour?.id,
        });
      }

      if (!workingHour || workingHour.isClosed || workingHour.shifts.length === 0) {
        unavailableDates.push(dateStr);
        continue;
      }

      // Tatil kontrolü
      const holidays = await db.holiday.findMany({
        where: {
          profileId: barberId,
          startDate: { lte: date },
          endDate: { gte: date },
        },
      });

      if (holidays.length > 0) {
        unavailableDates.push(dateStr);
        continue;
      }

      availableDates.push(dateStr);
    }

    return NextResponse.json({
      availableDates,
      unavailableDates,
    });
  } catch (error) {
    console.error("Error fetching availability:", error);
    return NextResponse.json(
      { error: "Müsaitlik bilgisi alınamadı" },
      { status: 500 }
    );
  }
}

