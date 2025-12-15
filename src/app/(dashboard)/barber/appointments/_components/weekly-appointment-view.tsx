"use client";

import { useMemo, useState } from "react";
import { Staff, WorkingHour, Shift } from "@prisma/client";
import { User, Repeat } from "lucide-react";
import { AppointmentList } from "./appointment-list";

interface WeeklyAppointmentViewProps {
  appointments: any[];
  staffList: Staff[];
  workingHours?: (WorkingHour & { shifts: Shift[] })[];
}

const DAY_NAMES = ["Pzt", "Sal", "Çrş", "Prş", "Cuma", "Ctz", "Pzr"];
const DEFAULT_START = "09:00";
const DEFAULT_END = "19:00";

const parseTimeToMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
};

const minutesToTime = (minutes: number) => {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
};

// UI Monday index (0) -> JS getDay (1)
const toJsDay = (uiDayIndex: number) => (uiDayIndex + 1) % 7;

export function WeeklyAppointmentView({ appointments, staffList, workingHours = [] }: WeeklyAppointmentViewProps) {
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "table">("list");
  const [weekOffset, setWeekOffset] = useState(0); // +1 => next week, -1 => previous week

  // Bu haftanın başlangıcını hesapla (Pazartesi) + offset
  const startOfWeek = useMemo(() => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff));
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() + weekOffset * 7);
    return start;
  }, [weekOffset]);

  // Haftanın günlerini oluştur
  const weekDays = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        return {
          date,
          dayOfWeek: i,
          dayName: DAY_NAMES[i],
        };
      }),
    [startOfWeek]
  );

  const weekStart = startOfWeek;
  const weekEnd = useMemo(() => {
    const end = new Date(startOfWeek);
    end.setDate(startOfWeek.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  }, [startOfWeek]);

  // Çalışma saatlerini günlük aralıklara dönüştür
  const dayWorkingHours = useMemo(() => {
    const map: Record<number, { start: string; end: string } | null> = {};

    workingHours.forEach((wh) => {
      if (wh.isClosed || !wh.shifts || wh.shifts.length === 0) {
        map[wh.dayOfWeek] = null;
        return;
      }

      const start = wh.shifts.reduce((min, s) => Math.min(min, parseTimeToMinutes(s.startTime)), Infinity);
      const end = wh.shifts.reduce((max, s) => Math.max(max, parseTimeToMinutes(s.endTime)), -Infinity);

      map[wh.dayOfWeek] = {
        start: minutesToTime(start),
        end: minutesToTime(end),
      };
    });

    return map;
  }, [workingHours]);

  // Tablo satırlarını çalışma saatlerine göre oluştur
  const timeSlots = useMemo(() => {
    const ranges = weekDays
      .map((_, index) => dayWorkingHours[toJsDay(index)])
      .filter(Boolean) as { start: string; end: string }[];

    const startMinutes =
      ranges.length > 0 ? Math.min(...ranges.map((r) => parseTimeToMinutes(r.start))) : parseTimeToMinutes(DEFAULT_START);
    const endMinutes =
      ranges.length > 0 ? Math.max(...ranges.map((r) => parseTimeToMinutes(r.end))) : parseTimeToMinutes(DEFAULT_END);

    const slots: string[] = [];
    for (let m = startMinutes; m < endMinutes; m += 30) {
      slots.push(minutesToTime(m));
    }
    return slots;
  }, [dayWorkingHours, weekDays]);

  // Bu haftaya ait randevular
  const weekAppointments = useMemo(
    () =>
      appointments.filter((apt) => {
        const start = new Date(apt.startTime);
        return start >= weekStart && start <= weekEnd;
      }),
    [appointments, weekEnd, weekStart]
  );

  // Seçili günün randevularını filtrele
  const filteredAppointments = selectedDay !== null
    ? weekAppointments.filter(apt => {
        const aptDate = new Date(apt.startTime);
        return aptDate.getDay() === toJsDay(selectedDay); // Pazartesi = 0
      })
    : weekAppointments;

  // Tablo görünümü için randevuları organize et
  const getAppointmentsForSlot = (dayIndex: number, timeSlot: string) => {
    const [hour, minute] = timeSlot.split(":").map(Number);
    const slotStart = new Date(weekDays[dayIndex].date);
    slotStart.setHours(hour, minute, 0, 0);
    const slotEnd = new Date(slotStart);
    slotEnd.setMinutes(slotEnd.getMinutes() + 30);

    return weekAppointments.filter(apt => {
      const aptStart = new Date(apt.startTime);
      const aptEnd = new Date(apt.endTime);
      return (
        aptStart.getDay() === toJsDay(dayIndex) && // Pazartesi = 0
        aptStart >= slotStart &&
        aptStart < slotEnd
      );
    });
  };

  if (viewMode === "list") {
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex gap-2">
            {weekDays.map((day, index) => {
              const dayAppointments = weekAppointments.filter(apt => {
                const aptDate = new Date(apt.startTime);
                return aptDate.getDay() === toJsDay(index);
              });

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDay(selectedDay === index ? null : index)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    selectedDay === index
                      ? "bg-slate-900 text-white"
                      : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  <div>{day.dayName}</div>
                  <div className="text-xs mt-1">
                    {dayAppointments.length > 0 && (
                      <span className="bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">
                        {dayAppointments.length}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedDay(null)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Tüm günler
            </button>
            <button
              onClick={() => setViewMode("table")}
              className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
            >
              Tablo Görünümü
            </button>
          </div>
        </div>

        <AppointmentList appointments={filteredAppointments} staffList={staffList} />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-sm text-slate-600">
            ({weekDays[0].date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })} -{" "}
            {weekDays[6].date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })})
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setWeekOffset((w) => w - 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Önceki hafta
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Bu hafta
            </button>
            <button
              onClick={() => setWeekOffset((w) => w + 1)}
              className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100"
            >
              Sonraki hafta
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            setViewMode("list");
            setSelectedDay(null);
          }}
          className="px-4 py-2 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 transition"
        >
          Liste Görünümü
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-700 sticky left-0 bg-slate-50 z-10">
                  Saat
                </th>
                {weekDays
                  .map((day, idx) => ({ day, idx }))
                  .filter(({ idx }) => selectedDay === null || selectedDay === idx)
                  .map(({ day, idx }) => (
                    <th
                      key={idx}
                      onClick={() => setSelectedDay(selectedDay === idx ? null : idx)}
                      className={`px-4 py-3 text-center font-semibold text-slate-700 min-w-[150px] ${
                        selectedDay === idx ? "bg-blue-50" : ""
                      } hover:bg-slate-100 cursor-pointer`}
                    >
                      {day.dayName}
                      <div className="text-xs font-normal text-slate-500 mt-1">
                        {day.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                      </div>
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {timeSlots.map((timeSlot, slotIndex) => {
                const [hour, minute] = timeSlot.split(":").map(Number);

                return (
                  <tr key={slotIndex} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-4 py-2 text-slate-600 font-medium sticky left-0 bg-white z-10">
                      {timeSlot}
                    </td>
                    {weekDays
                      .map((day, idx) => ({ day, idx }))
                      .filter(({ idx }) => selectedDay === null || selectedDay === idx)
                      .map(({ day, idx: dayIndex }) => {
                      const slotAppointments = getAppointmentsForSlot(dayIndex, timeSlot);
                      const isSelected = selectedDay === dayIndex;
                      const slotDateTime = new Date(day.date);
                      slotDateTime.setHours(hour, minute, 0, 0);
                      const isPast = slotDateTime < new Date();

                      return (
                        <td
                          key={dayIndex}
                          className={`px-2 py-1 text-center ${
                            isSelected ? "bg-blue-50" : ""
                          } ${isPast ? "opacity-50" : ""}`}
                        >
                          {slotAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              className="mb-1 p-2 bg-slate-900 text-white rounded text-xs text-left"
                            >
                              <div className="font-semibold truncate">
                                {apt.customer.name || "İsimsiz"}
                              </div>
                              {apt.staff && (
                                <div className="text-slate-300 text-xs mt-1 flex items-center gap-1">
                                  <User size={10} />
                                  {apt.staff.name}
                                </div>
                              )}
                              {apt.subscriptionAppointment && (
                                <div className="text-blue-300 text-xs mt-1 flex items-center gap-1">
                                  <Repeat size={10} />
                                  Abone
                                </div>
                              )}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


