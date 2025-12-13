import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barberId: string }> }
) {
  try {
    const { barberId } = await params;
    
    // Tüm çalışma saatlerini getir
    const workingHours = await db.workingHour.findMany({
      where: {
        profileId: barberId,
      },
      include: {
        shifts: true,
      },
      orderBy: {
        dayOfWeek: "asc",
      },
    });

    const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
    
    const result = workingHours.map(wh => ({
      dayOfWeek: wh.dayOfWeek,
      dayName: dayNames[wh.dayOfWeek] || `Unknown (${wh.dayOfWeek})`,
      isClosed: wh.isClosed,
      shiftsCount: wh.shifts.length,
      shifts: wh.shifts.map(s => `${s.startTime}-${s.endTime}`),
    }));

    return NextResponse.json({
      barberId,
      workingHours: result,
      note: "dayOfWeek: 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi",
    });
  } catch (error) {
    console.error("Error fetching working hours:", error);
    return NextResponse.json(
      { error: "Çalışma saatleri alınamadı" },
      { status: 500 }
    );
  }
}

