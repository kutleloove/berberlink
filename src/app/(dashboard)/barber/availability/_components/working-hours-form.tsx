"use client";

import { saveWorkingHours } from "@/actions/availability-settings";
import { Loader2, Plus, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface Shift {
  startTime: string;
  endTime: string;
  staffId?: string | null;
  staffName?: string | null;
}

interface WorkingHour {
  dayOfWeek: number;
  isClosed: boolean;
  shifts: Shift[];
}

interface Staff {
  id: string;
  name: string;
}

const DAYS = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];

export function WorkingHoursForm({ existingHours, staffList = [] }: { existingHours: WorkingHour[], staffList?: Staff[] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Her gün için kapalı durumunu tut
  const [closedDays, setClosedDays] = useState<Record<number, boolean>>(() => {
    const closed: Record<number, boolean> = {};
    existingHours.forEach(wh => {
      closed[wh.dayOfWeek] = wh.isClosed;
    });
    // Varsayılan olarak Pazar kapalı
    for (let i = 0; i < 7; i++) {
      if (closed[i] === undefined) {
        closed[i] = i === 0;
      }
    }
    return closed;
  });

  // Her gün için vardiya sayısını tut
  const [shiftCounts, setShiftCounts] = useState<Record<number, number>>(() => {
    const counts: Record<number, number> = {};
    existingHours.forEach(wh => {
      counts[wh.dayOfWeek] = wh.isClosed ? 0 : Math.max(wh.shifts.length, 1);
    });
    return counts;
  });

  const getHour = (dayIndex: number) => existingHours.find(h => h.dayOfWeek === dayIndex);

  const addShift = (dayIndex: number) => {
    setShiftCounts(prev => ({
      ...prev,
      [dayIndex]: (prev[dayIndex] || 1) + 1
    }));
  };

  const removeShift = (dayIndex: number) => {
    if ((shiftCounts[dayIndex] || 1) > 1) {
      setShiftCounts(prev => ({
        ...prev,
        [dayIndex]: prev[dayIndex] - 1
      }));
    }
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    
    // Her gün için vardiya sayısını ekle
    Object.keys(shiftCounts).forEach(dayIndex => {
      formData.append(`shiftCount-${dayIndex}`, shiftCounts[parseInt(dayIndex)].toString());
    });
    
    const result = await saveWorkingHours(formData);
    setLoading(false);
    
    if (result.success) {
      alert("Çalışma saatleri güncellendi.");
      router.refresh();
    } else {
      alert(result.error || "Bir hata oluştu.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {DAYS.map((day, index) => {
        const current = getHour(index);
        const isClosed = closedDays[index] ?? (index === 0);
        const shifts = current?.shifts || [{ startTime: "09:00", endTime: "17:00" }];
        const count = shiftCounts[index] || (isClosed ? 0 : shifts.length || 1);

        return (
          <div 
            key={index} 
            className={`border rounded-2xl p-5 transition-all duration-200 ${
              isClosed 
                ? 'border-slate-200 bg-slate-50/80 opacity-75' 
                : 'border-slate-200 bg-gradient-to-r from-white to-slate-50/50 hover:shadow-md hover:border-slate-300'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-5">
                <div className={`w-36 font-bold text-base tracking-wide ${
                  isClosed ? 'text-slate-500' : 'text-slate-900'
                }`}>
                  {day}
                </div>
                <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer select-none group">
                  <input 
                    type="checkbox" 
                    name={`closed-${index}`} 
                    checked={isClosed}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900 focus:ring-offset-0 cursor-pointer" 
                    onChange={(e) => {
                      const newClosed = e.target.checked;
                      setClosedDays(prev => ({ ...prev, [index]: newClosed }));
                      // Kapalıysa vardiya sayısını 0 yap
                      if (newClosed) {
                        setShiftCounts(prev => ({ ...prev, [index]: 0 }));
                      } else {
                        setShiftCounts(prev => ({ ...prev, [index]: 1 }));
                      }
                    }}
                  />
                  <span className={`group-hover:text-slate-900 transition-colors font-medium ${
                    isClosed ? 'text-slate-500' : ''
                  }`}>
                    Kapalı
                  </span>
                </label>
                {isClosed && (
                  <span className="px-3 py-1 text-xs font-semibold text-slate-600 bg-slate-200/60 rounded-full">
                    Kapalı
                  </span>
                )}
              </div>
              
              {!isClosed && (
                <button
                  type="button"
                  onClick={() => addShift(index)}
                  className="flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 px-4 py-2 rounded-xl border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 transition-all duration-200 shadow-sm hover:shadow"
                >
                  <Plus size={16} className="stroke-[2.5]" />
                  Vardiya Ekle
                </button>
              )}
            </div>

            {!isClosed && (
              <div className="space-y-3 ml-40">
                {Array.from({ length: count }).map((_, shiftIndex) => {
                  const shift = shifts[shiftIndex] || { startTime: "09:00", endTime: "17:00", staffId: null };
                  
                  return (
                    <div key={shiftIndex} className="flex items-center gap-3 bg-white/60 rounded-xl p-3 border border-slate-200/60">
                      <div className="flex items-center gap-3 flex-1">
                        <input 
                          type="time" 
                          name={`shift-${index}-${shiftIndex}-start`} 
                          defaultValue={shift.startTime} 
                          className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-all bg-white shadow-sm hover:shadow"
                          required
                        />
                        <span className="text-slate-400 font-semibold text-lg">-</span>
                        <input 
                          type="time" 
                          name={`shift-${index}-${shiftIndex}-end`} 
                          defaultValue={shift.endTime} 
                          className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-all bg-white shadow-sm hover:shadow"
                          required
                        />
                        {staffList.length > 0 && (
                          <select
                            name={`shift-${index}-${shiftIndex}-staff`}
                            defaultValue={shift.staffId || ""}
                            className="border border-slate-300 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 focus:border-slate-900 focus:outline-none transition-all bg-white shadow-sm hover:shadow min-w-[150px]"
                          >
                            <option value="">Personel Seçin</option>
                            {staffList.map(staff => (
                              <option key={staff.id} value={staff.id}>
                                {staff.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      {count > 1 && (
                        <button
                          type="button"
                          onClick={() => removeShift(index)}
                          className="p-2.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 border border-transparent hover:border-red-200"
                          title="Vardiyayı Kaldır"
                        >
                          <X size={18} className="stroke-[2.5]" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <div className="pt-6 mt-8 border-t border-slate-200">
        <button 
          type="submit"
          disabled={loading} 
          className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-8 py-3.5 rounded-xl font-bold text-base hover:from-slate-800 hover:to-slate-700 transition-all duration-200 flex items-center gap-2.5 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          <span>Kaydet</span>
        </button>
      </div>
    </form>
  );
}
