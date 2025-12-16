import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

// Cache için revalidate süresi (saniye)
export const revalidate = 60; // 1 dakika

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
    const staffId = searchParams.get("staffId"); // Personel ID (opsiyonel)

    // Eğer date parametresi varsa, o tarih için müsait saatleri getir
    if (dateStr) {
      // Tarihi timezone sorunlarından kaçınmak için manuel parse et
      // "2025-12-13" formatından yıl, ay, gün çıkar
      const [year, month, day] = dateStr.split("-").map(Number);
      const date = new Date(year, month - 1, day); // month 0-indexed
      const dayOfWeek = date.getDay();

      // Çalışma saatlerini getir - Personel bazlı veya işletme geneli
      let workingHour: any = null;
      let shifts: any[] = [];

      // Eğer personel seçildiyse, önce personelin çalışma saatlerini kontrol et
      if (staffId) {
        const staffWorkingHour = await db.staffWorkingHour.findUnique({
          where: {
            staffId_dayOfWeek: {
              staffId,
              dayOfWeek,
            },
          },
          include: {
            shifts: {
              orderBy: { startTime: "asc" },
            },
          },
        });

        if (staffWorkingHour && !staffWorkingHour.isClosed && staffWorkingHour.shifts.length > 0) {
          workingHour = staffWorkingHour;
          shifts = staffWorkingHour.shifts;
        }
      }

      // Eğer personel çalışma saati yoksa veya personel seçilmediyse, işletme genelini kontrol et
      if (!workingHour || shifts.length === 0) {
        const barberWorkingHour = await db.workingHour.findUnique({
          where: {
            profileId_dayOfWeek: {
              profileId: barberId,
              dayOfWeek,
            },
          },
          include: {
            shifts: {
              include: {
                staff: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
              orderBy: { startTime: "asc" },
            },
          },
        });

        if (barberWorkingHour) {
          // Eğer personel seçildiyse, sadece o personelin vardiyalarını göster
          if (staffId) {
            shifts = barberWorkingHour.shifts.filter(s => s.staffId === staffId);
          } else {
            // Personel seçilmediyse, personel atanmamış vardiyaları göster
            shifts = barberWorkingHour.shifts.filter(s => !s.staffId);
          }

          if (shifts.length > 0) {
            workingHour = {
              ...barberWorkingHour,
              shifts,
            };
          }
        }
      }

      if (!workingHour || workingHour.isClosed || shifts.length === 0) {
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
      if (staffId) {
        appointmentWhere.staffId = staffId;
      } else {
        appointmentWhere.staffId = null; // İşletme geneli
      }

      // Kullanıcının kendi abonelik randevularını almak için
      const session = await getSession();
      let currentUserId: string | null = null;
      if (session?.userId) {
        currentUserId = session.userId as string;
      }

      const appointments = await db.appointment.findMany({
        where: appointmentWhere,
        select: {
          startTime: true,
          endTime: true,
          customerId: true,
          subscriptionAppointmentId: true,
        },
      });

      // Müsait ve dolu saatleri hesapla
      const availableHours: string[] = [];
      const unavailableHours: string[] = [];
      const mySubscriptionHours: string[] = []; // Kullanıcının kendi abonelik randevuları
      const interval = 30; // dakika

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
          const timeStr = `${currentSlot.getHours().toString().padStart(2, "0")}:${currentSlot.getMinutes().toString().padStart(2, "0")}`;

          // Randevu çakışma kontrolü
          const busyAppointment = appointments.find((appt) => {
            return (
              (currentSlot >= appt.startTime && currentSlot < appt.endTime) ||
              (slotEndTime > appt.startTime && slotEndTime <= appt.endTime) ||
              (currentSlot <= appt.startTime && slotEndTime >= appt.endTime)
            );
          });

          if (busyAppointment) {
            // Kullanıcının kendi abonelik randevusu mu kontrol et
            if (
              currentUserId &&
              busyAppointment.customerId === currentUserId &&
              busyAppointment.subscriptionAppointmentId
            ) {
              // Kullanıcının kendi abonelik randevusu - özel göster
              mySubscriptionHours.push(timeStr);
            } else {
              // Başkasının randevusu veya kullanıcının normal randevusu - dolu
              unavailableHours.push(timeStr);
            }
          } else {
            // Müsait saat
            availableHours.push(timeStr);
          }

          currentSlot = new Date(currentSlot.getTime() + interval * 60000);
        }
      }

      return NextResponse.json({
        availableHours,
        unavailableHours,
        mySubscriptionHours, // Kullanıcının kendi abonelik randevuları
      });
    }

    // Ay için müsait ve müsait olmayan tarihleri getir - OPTIMIZED: Batch queries
    const startDate = new Date(year, month, 1);
    const endDate = new Date(year, month + 1, 0);

    const availableDates: string[] = [];
    const unavailableDates: string[] = [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // OPTIMIZATION: Tüm çalışma saatlerini tek seferde çek
    const allWorkingHours = await db.workingHour.findMany({
      where: { profileId: barberId },
      include: {
        shifts: {
          include: {
            staff: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    // OPTIMIZATION: Personel çalışma saatlerini tek seferde çek (eğer staffId varsa)
    let allStaffWorkingHours: any[] = [];
    if (staffId) {
      allStaffWorkingHours = await db.staffWorkingHour.findMany({
        where: { staffId },
        include: { shifts: true },
      });
    }

    // OPTIMIZATION: Tüm tatilleri tek seferde çek
    const allHolidays = await db.holiday.findMany({
      where: {
        profileId: barberId,
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });

    // Çalışma saatlerini dayOfWeek'e göre indexle
    const workingHoursByDay: Record<number, any> = {};
    allWorkingHours.forEach(wh => {
      workingHoursByDay[wh.dayOfWeek] = wh;
    });

    const staffWorkingHoursByDay: Record<number, any> = {};
    allStaffWorkingHours.forEach(wh => {
      staffWorkingHoursByDay[wh.dayOfWeek] = wh;
    });

    // Loop içinde database sorgusu yapmadan işle
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      // Timezone sorunlarından kaçınmak için tarihi manuel oluştur
      const dateYear = d.getFullYear();
      const dateMonth = d.getMonth();
      const dateDay = d.getDate();
      const date = new Date(dateYear, dateMonth, dateDay); // Yerel timezone'da tarih oluştur
      const dayOfWeek = date.getDay(); // 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
      const dateStr = `${dateYear}-${String(dateMonth + 1).padStart(2, "0")}-${String(dateDay).padStart(2, "0")}`;

      // Geçmiş tarih kontrolü
      if (date < today) {
        unavailableDates.push(dateStr);
        continue;
      }

      // Çalışma saati kontrolü - Personel bazlı veya işletme geneli (cache'den)
      let workingHour: any = null;

      // Eğer personel seçildiyse, önce personelin çalışma saatlerini kontrol et
      if (staffId && staffWorkingHoursByDay[dayOfWeek]) {
        const staffWorkingHour = staffWorkingHoursByDay[dayOfWeek];
        if (!staffWorkingHour.isClosed && staffWorkingHour.shifts.length > 0) {
          workingHour = staffWorkingHour;
        }
      }

      // Eğer personel çalışma saati yoksa veya personel seçilmediyse, işletme genelini kontrol et
      if (!workingHour && workingHoursByDay[dayOfWeek]) {
        const barberWorkingHour = workingHoursByDay[dayOfWeek];

        // Eğer personel seçildiyse, sadece o personelin vardiyalarını göster
        if (staffId) {
          const filteredShifts = barberWorkingHour.shifts.filter((s: any) => s.staffId === staffId);
          if (filteredShifts.length > 0) {
            workingHour = {
              ...barberWorkingHour,
              shifts: filteredShifts,
            };
          }
        } else {
          // Personel seçilmediyse, personel atanmamış vardiyaları göster
          const filteredShifts = barberWorkingHour.shifts.filter((s: any) => !s.staffId);
          if (filteredShifts.length > 0) {
            workingHour = {
              ...barberWorkingHour,
              shifts: filteredShifts,
            };
          }
        }
      }

      if (!workingHour || workingHour.isClosed || workingHour.shifts.length === 0) {
        unavailableDates.push(dateStr);
        continue;
      }

      // Tatil kontrolü (cache'den)
      const isHoliday = allHolidays.some(holiday => {
        return date >= holiday.startDate && date <= holiday.endDate;
      });

      if (isHoliday) {
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

