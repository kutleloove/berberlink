"use client";

import { isDateAvailable, getStaffForService } from "@/actions/availability";
import { createAppointment } from "@/actions/appointment";
import { getBarberSubscriptionSettings, hasActiveSubscriptionAppointment, createSubscriptionAppointment } from "@/actions/subscription-appointment";
import { CheckCircle, Loader2, ArrowLeft, Repeat } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: string;
}

interface Staff {
  id: string;
  name: string;
  role?: { name: string } | null;
}

interface BookingWizardProps {
  barberId: string;
  services: Service[];
}

export function BookingWizard({ barberId, services }: BookingWizardProps) {
  const router = useRouter();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [availableStaff, setAvailableStaff] = useState<Staff[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [unavailableSlots, setUnavailableSlots] = useState<Date[]>([]);
  const [mySubscriptionSlots, setMySubscriptionSlots] = useState<Date[]>([]); // Kullanıcının kendi abonelik randevuları
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());

  const [step, setStep] = useState(1); // 1: Service, 2: Staff, 3: Date, 4: Time, 5: Recurrence
  const [loading, setLoading] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [checkingDates, setCheckingDates] = useState(false);
  const [fetchingStaff, setFetchingStaff] = useState(false);
  const [subscriptionSettings, setSubscriptionSettings] = useState<{
    allowSubscriptionAppointments: boolean;
    allowedRecurrenceTypes: string[];
    allowTimeChanges: boolean;
  } | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Berberin abonelik ayarlarını çek
  useEffect(() => {
    getBarberSubscriptionSettings(barberId).then(settings => {
      setSubscriptionSettings(settings);
    });
    hasActiveSubscriptionAppointment(barberId).then(hasActive => {
      setHasActiveSubscription(hasActive);
    });
  }, [barberId]);

  // Personel seçildiğinde otomatik olarak step 3'e geç (Step 2 logic)
  useEffect(() => {
    if (step === 2 && selectedStaffId && !fetchingStaff) {
      const timer = setTimeout(() => {
        setStep(3);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, selectedStaffId, fetchingStaff]);

  // Tarih seçildiğinde otomatik olarak step 4'e geç (Step 3 logic)
  useEffect(() => {
    if (step === 3 && selectedDate && !isDateDisabled(selectedDate) && !checkingDates) {
      const timer = setTimeout(() => {
        setStep(4);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, selectedDate, checkingDates]);

  // Hizmet seçimi toggle
  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  // Hizmet seçildiğinde personelleri çek
  useEffect(() => {
    if (step === 2 && selectedServices.length > 0) {
      setFetchingStaff(true);
      // Tüm seçili hizmetlere atanmış personelleri birleştir
      Promise.all(
        selectedServices.map(serviceId => getStaffForService(barberId, serviceId))
      ).then(staffArrays => {
        // Tüm personelleri birleştir ve tekrarları kaldır
        const allStaff = staffArrays.flat();
        const uniqueStaff = allStaff.filter((staff, index, self) =>
          index === self.findIndex(s => s.id === staff.id)
        );
        setAvailableStaff(uniqueStaff);
        setFetchingStaff(false);

        // Eğer sadece bir personel varsa, otomatik seç
        if (uniqueStaff.length === 1) {
          setSelectedStaffId(uniqueStaff[0].id);
        } else {
          setSelectedStaffId(""); // Birden fazla personel varsa seçimi sıfırla
        }
      });
    }
  }, [step, selectedServices, barberId]);

  // Önümüzdeki 30 günün müsaitlik durumunu kontrol et - tek API çağrısı ile
  const datesCacheRef = useRef<{ staffId: string; dates: Set<string> } | null>(null);
  const datesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (step === 3 && selectedStaffId) {
      // Cache kontrolü
      if (datesCacheRef.current && datesCacheRef.current.staffId === selectedStaffId && datesCacheRef.current.dates.size > 0) {
        setAvailableDates(datesCacheRef.current.dates);
        setCheckingDates(false);
        return;
      }

      // Önceki timeout'u iptal et
      if (datesTimeoutRef.current) {
        clearTimeout(datesTimeoutRef.current);
      }

      setCheckingDates(true);

      // Debounce: 300ms bekle
      datesTimeoutRef.current = setTimeout(async () => {
        try {
          // Tek bir API çağrısı ile tüm ayın müsaitlik durumunu al
          const today = new Date();
          const month = today.getMonth();
          const year = today.getFullYear();
          const url = `/api/barber/${barberId}/availability?month=${month}&year=${year}&staffId=${selectedStaffId}`;
          const response = await fetch(url);
          const data = await response.json();

          // Sadece önümüzdeki 30 günü filtrele
          const dates = new Set<string>();
          const todayStr = today.toISOString().split('T')[0];
          const futureDates = (data.availableDates || []).filter((dateStr: string) => {
            return dateStr >= todayStr;
          }).slice(0, 30);

          futureDates.forEach((dateStr: string) => dates.add(dateStr));

          setAvailableDates(dates);
          datesCacheRef.current = { staffId: selectedStaffId, dates };
        } catch (error) {
          console.error("Error fetching dates:", error);
        } finally {
          setCheckingDates(false);
        }
      }, 300);
    }

    return () => {
      if (datesTimeoutRef.current) {
        clearTimeout(datesTimeoutRef.current);
      }
    };
  }, [step, barberId, selectedStaffId]);

  // Müsaitlikleri çek - debounce ile
  const slotsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (step === 4 && selectedDate && selectedStaffId) {
      // Önceki timeout'u iptal et
      if (slotsTimeoutRef.current) {
        clearTimeout(slotsTimeoutRef.current);
      }

      // Debounce: 200ms bekle
      slotsTimeoutRef.current = setTimeout(async () => {
        setFetchingSlots(true);
        try {
          // API endpoint kullanarak saatleri çek
          const url = `/api/barber/${barberId}/availability?date=${selectedDate}${selectedStaffId ? `&staffId=${selectedStaffId}` : ''}`;
          const response = await fetch(url);
          const data = await response.json();

          // Saat string'lerini Date objelerine çevir
          const slots = (data.availableHours || []).map((timeStr: string) => {
            const [hours, minutes] = timeStr.split(":").map(Number);
            const slotDate = new Date(selectedDate);
            slotDate.setHours(hours, minutes, 0, 0);
            return slotDate;
          });

          const unavailableSlots = (data.unavailableHours || []).map((timeStr: string) => {
            const [hours, minutes] = timeStr.split(":").map(Number);
            const slotDate = new Date(selectedDate);
            slotDate.setHours(hours, minutes, 0, 0);
            return slotDate;
          });

          const mySubscriptionSlots = (data.mySubscriptionHours || []).map((timeStr: string) => {
            const [hours, minutes] = timeStr.split(":").map(Number);
            const slotDate = new Date(selectedDate);
            slotDate.setHours(hours, minutes, 0, 0);
            return slotDate;
          });

          setAvailableSlots(slots);
          setUnavailableSlots(unavailableSlots);
          setMySubscriptionSlots(mySubscriptionSlots);
          setSelectedSlot(null); // Tarih değişince saati sıfırla
        } catch (error) {
          console.error("Error fetching slots:", error);
        } finally {
          setFetchingSlots(false);
        }
      }, 200);
    }

    return () => {
      if (slotsTimeoutRef.current) {
        clearTimeout(slotsTimeoutRef.current);
      }
    };
  }, [step, selectedDate, selectedStaffId, barberId]);

  // Tarih seçildiğinde otomatik olarak step 4'e geç (Duplicate logic removed as it's now top-level)
  /* 
  useEffect(() => {
    if (step === 3 && selectedDate && !isDateDisabled(selectedDate)) {
      const timer = setTimeout(() => {
        setStep(4);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, selectedDate]);
  */

  // Saat seçildiğinde, eğer abonelik randevularına izin veriliyorsa step 5'e geç
  useEffect(() => {
    if (
      step === 4 &&
      selectedSlot &&
      subscriptionSettings?.allowSubscriptionAppointments &&
      (!hasActiveSubscription || subscriptionSettings.allowedRecurrenceTypes.includes("MONTHLY"))
    ) {
      const timer = setTimeout(() => {
        setStep(5);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [step, selectedSlot, subscriptionSettings, hasActiveSubscription]);

  // Randevuyu oluştur
  const handleBooking = async () => {
    if (!selectedSlot) return;

    // Seçilen slot'un dolu olup olmadığını kontrol et
    const isUnavailable = unavailableSlots.some(slot => slot.getTime() === selectedSlot.getTime());
    if (isUnavailable) {
      alert("Bu saat dolu. Lütfen başka bir saat seçin.");
      return;
    }

    setLoading(true);

    // Eğer abonelik randevusu seçildiyse
    if (recurrenceType && subscriptionSettings?.allowSubscriptionAppointments) {
      const [hours, minutes] = selectedSlot.toTimeString().split(":").slice(0, 2);
      const time = `${hours}:${minutes}`;
      const startDate = selectedSlot;

      // Haftalık için dayOfWeek, aylık için dayOfMonth hesapla
      let dayOfWeek: number | undefined;
      let dayOfMonth: number | undefined;

      if (recurrenceType === "WEEKLY") {
        dayOfWeek = startDate.getDay();
      } else if (recurrenceType === "MONTHLY") {
        dayOfMonth = startDate.getDate();
      }

      const result = await createSubscriptionAppointment(
        barberId,
        selectedServices,
        startDate,
        time,
        recurrenceType,
        selectedStaffId || undefined,
        endDate ? new Date(endDate) : undefined,
        dayOfWeek,
        dayOfMonth
      );

      setLoading(false);

      if (result.success) {
        alert("Abonelik randevunuz başarıyla oluşturuldu!");
        router.push("/customer");
      } else {
        alert(result.error);
      }
    } else {
      // Normal randevu
      const result = await createAppointment(
        barberId,
        selectedServices,
        selectedSlot,
        selectedStaffId || undefined
      );
      setLoading(false);

      if (result.success) {
        alert("Randevunuz başarıyla oluşturuldu!");
        router.push("/customer");
      } else {
        alert(result.error);
      }
    }
  };

  const totalPrice = services
    .filter(s => selectedServices.includes(s.id))
    .reduce((acc, s) => acc + Number(s.price), 0);

  const totalDuration = services
    .filter(s => selectedServices.includes(s.id))
    .reduce((acc, s) => acc + s.duration, 0);

  // Tarih seçiminde kapalı günleri kontrol et
  const isDateDisabled = (dateStr: string) => {
    if (checkingDates) return true;
    return !availableDates.has(dateStr);
  };

  // STEP 1: Hizmet Seçimi
  if (step === 1) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-black/20 border border-white/10">
        <h2 className="text-xl font-bold text-white mb-4">Hizmet Seçimi</h2>
        <div className="space-y-3 mb-6">
          {services.map(service => (
            <div
              key={service.id}
              onClick={() => toggleService(service.id)}
              className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-300 ${selectedServices.includes(service.id)
                  ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30"
                  : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10"
                }`}
            >
              <div>
                <h3 className="font-semibold text-white">{service.name}</h3>
                <p className="text-sm text-slate-400">{service.duration} dk</p>
              </div>
              <div className="font-bold text-amber-400">{service.price} ₺</div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <div>
            <p className="text-sm text-slate-400">Toplam</p>
            <p className="text-lg font-bold text-white">{totalPrice} ₺ <span className="text-sm font-normal text-slate-500">/ {totalDuration} dk</span></p>
          </div>
          <div className="flex items-center justify-end gap-3">
            <button
              disabled={selectedServices.length === 0}
              onClick={() => setStep(2)}
              className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-indigo-500 transition flex items-center gap-2 shadow-lg shadow-indigo-500/20"
            >
              Devam Et
              <ArrowLeft className="rotate-180" size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // STEP 2: Personel Seçimi
  if (step === 2) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-black/20 border border-white/10 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Personel Seçimi</h2>
          <button onClick={() => setStep(1)} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft size={16} />
            Geri Dön
          </button>
        </div>

        {fetchingStaff ? (
          <div className="flex justify-center py-8 text-slate-400">
            <Loader2 className="animate-spin mr-2" /> Personeller yükleniyor...
          </div>
        ) : availableStaff.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-white/5 rounded-lg border border-dashed border-white/10 mb-6">
            Seçili hizmetlere atanmış personel bulunmuyor.
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {availableStaff.map(staff => (
              <div
                key={staff.id}
                onClick={() => setSelectedStaffId(staff.id)}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all duration-200 ${selectedStaffId === staff.id
                    ? "border-amber-500/50 bg-amber-500/10 ring-1 ring-amber-500/30 scale-[1.02]"
                    : "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/10 hover:scale-[1.01]"
                  }`}
              >
                <div>
                  <h3 className="font-semibold text-white">{staff.name}</h3>
                  {staff.role && (
                    <p className="text-sm text-slate-400">{staff.role.name}</p>
                  )}
                </div>
                {selectedStaffId === staff.id && (
                  <CheckCircle className="text-amber-400 animate-scale-in" size={20} />
                )}
              </div>
            ))}
          </div>
        )}

        {selectedStaffId && !fetchingStaff && (
          <div className="text-sm text-slate-400 text-center animate-pulse">
            Tarih seçimine geçiliyor...
          </div>
        )}

        <div className="flex items-center justify-start gap-3 border-t border-white/10 pt-4 mt-6">
          <button
            onClick={() => setStep(1)}
            className="px-6 py-3 rounded-xl font-semibold text-slate-300 hover:bg-white/5 transition"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // STEP 3: Tarih Seçimi
  if (step === 3) {
    return (
      <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-black/20 border border-white/10 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Tarih Seçimi</h2>
          <button onClick={() => setStep(2)} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft size={16} />
            Geri Dön
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-slate-400 mb-2">Tarih</label>
          <input
            type="date"
            value={selectedDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => {
              const dateStr = e.target.value;
              if (!isDateDisabled(dateStr)) {
                setSelectedDate(dateStr);
                setSelectedSlot(null);
              }
            }}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-200 text-white placeholder-slate-500"
          />
          {isDateDisabled(selectedDate) && (
            <p className="text-xs text-red-400 mt-2">Bu tarihte randevu alınamaz (kapalı veya tatil)</p>
          )}
          {checkingDates && (
            <p className="text-xs text-slate-400 mt-2">Müsait tarihler kontrol ediliyor...</p>
          )}
          {selectedDate && !isDateDisabled(selectedDate) && !checkingDates && (
            <p className="text-xs text-slate-400 mt-2 animate-pulse">Saat seçimine geçiliyor...</p>
          )}
        </div>

        <div className="flex items-center justify-start gap-3 border-t border-white/10 pt-4">
          <button
            onClick={() => setStep(2)}
            className="px-6 py-3 rounded-xl font-semibold text-slate-300 hover:bg-white/5 transition"
          >
            Geri Dön
          </button>
        </div>
      </div>
    );
  }

  // STEP 5: Abonelik Seçimi (Recurrence)
  if (step === 5 && subscriptionSettings?.allowSubscriptionAppointments) {
    const showRecurrenceOption = !hasActiveSubscription || subscriptionSettings.allowedRecurrenceTypes.includes("MONTHLY");

    if (!showRecurrenceOption) {
      // Eğer aktif abonelik varsa ve aylık değilse, normal randevu oluştur
      handleBooking();
      return null;
    }

    return (
      <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-black/20 border border-white/10 animate-fade-in">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Repeat className="w-5 h-5 text-indigo-400" />
            Tekrarlayan Randevu
          </h2>
          <button onClick={() => setStep(4)} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
            <ArrowLeft size={16} />
            Geri Dön
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-slate-400 mb-4">
            Bu randevuyu tekrarlayan bir abonelik olarak oluşturmak ister misiniz?
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setRecurrenceType(null);
                handleBooking();
              }}
              className="w-full p-4 rounded-xl border-2 border-white/5 hover:border-white/10 bg-white/5 text-left transition hover:bg-white/10"
            >
              <div className="font-semibold text-white">Tek Seferlik Randevu</div>
              <div className="text-sm text-slate-400">Sadece bu randevu için</div>
            </button>

            {subscriptionSettings.allowedRecurrenceTypes.map((type) => {
              const labels: Record<string, string> = {
                DAILY: "Günlük Tekrar",
                WEEKLY: "Haftalık Tekrar",
                MONTHLY: "Aylık Tekrar",
              };

              const dayNames = ["Pazar", "Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi"];
              const descriptions: Record<string, string> = {
                DAILY: "Her gün aynı saatte",
                WEEKLY: selectedSlot ? `Her ${dayNames[new Date(selectedSlot).getDay()]} aynı saatte` : "Her hafta aynı gün ve saatte",
                MONTHLY: selectedSlot ? `Her ayın ${new Date(selectedSlot).getDate()} günü aynı saatte` : "Her ay aynı gün ve saatte",
              };

              return (
                <button
                  key={type}
                  onClick={() => setRecurrenceType(type as "DAILY" | "WEEKLY" | "MONTHLY")}
                  className={`w-full p-4 rounded-xl border-2 text-left transition ${recurrenceType === type
                      ? "border-indigo-500 bg-indigo-500/10"
                      : "border-white/5 hover:border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                >
                  <div className="font-semibold text-white">{labels[type]}</div>
                  <div className="text-sm text-slate-400">{descriptions[type]}</div>
                </button>
              );
            })}
          </div>

          {recurrenceType && (
            <div className="mt-4 p-4 bg-white/5 rounded-xl border border-white/5">
              <label className="block text-sm font-medium text-slate-400 mb-2">
                Bitiş Tarihi (Opsiyonel)
              </label>
              <input
                type="date"
                value={endDate || ""}
                min={selectedDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white"
              />
              <p className="text-xs text-slate-500 mt-1">
                Boş bırakırsanız süresiz devam eder
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <button
            onClick={() => setStep(4)}
            className="px-6 py-3 rounded-xl font-semibold text-slate-300 hover:bg-white/5 transition"
          >
            Geri Dön
          </button>
          <button
            onClick={handleBooking}
            disabled={loading || !selectedSlot}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-indigo-500 transition flex items-center gap-2 shadow-lg shadow-indigo-500/20"
          >
            {loading && <Loader2 className="animate-spin" size={18} />}
            {recurrenceType ? "Abonelik Randevusu Oluştur" : "Randevu Oluştur"}
          </button>
        </div>
      </div>
    );
  }

  // STEP 4: Saat Seçimi
  return (
    <div className="bg-slate-900/80 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-black/20 border border-white/10 animate-fade-in">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white">Saat Seçimi</h2>
        <button onClick={() => setStep(3)} className="text-sm text-slate-400 hover:text-white flex items-center gap-1 transition-colors">
          <ArrowLeft size={16} />
          Geri Dön
        </button>
      </div>

      {/* Tarih Seçici */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-400 mb-2">Tarih</label>
        <input
          type="date"
          value={selectedDate}
          min={new Date().toISOString().split('T')[0]}
          onChange={(e) => {
            const dateStr = e.target.value;
            if (!isDateDisabled(dateStr)) {
              setSelectedDate(dateStr);
              setSelectedSlot(null);
            }
          }}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700/50 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all duration-200 text-white"
        />
        {isDateDisabled(selectedDate) && (
          <p className="text-xs text-red-400 mt-2">Bu tarihte randevu alınamaz (kapalı veya tatil)</p>
        )}
        {checkingDates && (
          <p className="text-xs text-slate-400 mt-2">Müsait tarihler kontrol ediliyor...</p>
        )}
      </div>

      {/* Saat Slotları */}
      <div className="mb-8">
        <label className="block text-sm font-medium text-slate-400 mb-2">Müsait Saatler</label>
        {fetchingSlots ? (
          <div className="flex justify-center py-8 text-slate-400">
            <Loader2 className="animate-spin mr-2" /> Yükleniyor...
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-8 text-slate-500 bg-white/5 rounded-lg border border-dashed border-white/10">
            {isDateDisabled(selectedDate)
              ? "Bu tarihte randevu alınamaz."
              : "Bu tarihte müsait saat bulunmuyor."}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            {/* Müsait saatler */}
            {availableSlots.map((slot, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedSlot(slot)}
                className={`py-2 px-1 rounded-lg text-sm font-medium transition ${selectedSlot === slot
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/20"
                    : "bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
              >
                {new Date(slot).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </button>
            ))}

            {/* Kullanıcının kendi abonelik randevuları - Farklı renkte göster */}
            {mySubscriptionSlots.map((slot, idx) => (
              <button
                key={`my-sub-${idx}`}
                onClick={() => setSelectedSlot(slot)}
                className={`py-2 px-1 rounded-lg text-sm font-medium transition relative ${selectedSlot === slot
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                  }`}
                title="Sizin abonelik randevunuz"
              >
                {new Date(slot).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                <span className="absolute top-0 right-0 text-xs text-emerald-400">⭐</span>
              </button>
            ))}

            {/* Dolu saatler - Tıklanamaz */}
            {unavailableSlots.map((slot, idx) => (
              <button
                key={`unavailable-${idx}`}
                disabled
                className="py-2 px-1 rounded-lg text-sm font-medium bg-white/5 text-slate-600 line-through cursor-not-allowed opacity-40 border border-white/5"
                title="Bu saat dolu"
              >
                {new Date(slot).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
              </button>
            ))}
          </div>
        )}
      </div>

      {subscriptionSettings?.allowSubscriptionAppointments &&
        (!hasActiveSubscription || subscriptionSettings.allowedRecurrenceTypes.includes("MONTHLY")) ? (
        <button
          disabled={!selectedSlot || loading || isDateDisabled(selectedDate)}
          onClick={() => setStep(5)}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-indigo-500 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          Devam Et
          <ArrowLeft className="rotate-180" size={18} />
        </button>
      ) : (
        <button
          disabled={!selectedSlot || loading || isDateDisabled(selectedDate)}
          onClick={handleBooking}
          className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-indigo-500 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
        >
          {loading ? <Loader2 className="animate-spin" /> : <CheckCircle size={18} />}
          Randevuyu Onayla
        </button>
      )}
    </div>
  );
}
