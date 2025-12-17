"use client";

import { X, ChevronLeft, ChevronRight, Calendar, Clock, ArrowLeft, CheckCircle, Repeat } from "lucide-react";
import { useEffect, useState, useCallback, useRef } from "react";
import { createAppointment } from "@/actions/appointment";
import { getStaffForService } from "@/actions/availability";
import { getBarberSubscriptionSettings, hasActiveSubscriptionAppointment, createSubscriptionAppointment } from "@/actions/subscription-appointment";

interface Service {
  id: string;
  name: string;
  duration: number;
  price: string;
}

interface QuickAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  barberId: string;
  barberName: string;
  services: Service[];
}

const DAY_NAMES = ["Pzt", "Sal", "Çrş", "Prş", "Cuma", "Ctz", "Pzr"];
const MONTH_NAMES = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık",
  "Ocak", "Şubat"
];

export default function QuickAppointmentModal({
  isOpen,
  onClose,
  barberId,
  barberName,
  services,
}: QuickAppointmentModalProps) {
  // Debug
  useEffect(() => {
    if (isOpen) {
      console.log("QuickAppointmentModal opened", { barberId, barberName, servicesCount: services.length });
    }
  }, [isOpen, barberId, barberName, services.length]);

  // Berberin abonelik ayarlarını çek
  useEffect(() => {
    if (isOpen) {
      getBarberSubscriptionSettings(barberId).then(settings => {
        setSubscriptionSettings(settings);
      });
      hasActiveSubscriptionAppointment(barberId).then(hasActive => {
        setHasActiveSubscription(hasActive);
      });
    }
  }, [isOpen, barberId]);
  const [step, setStep] = useState(1); // 1: Service, 2: Staff, 3: Date, 4: Time, 5: Recurrence
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: string; name: string; role?: { name: string } | null }>>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [unavailableSlots, setUnavailableSlots] = useState<Date[]>([]);
  const [mySubscriptionSlots, setMySubscriptionSlots] = useState<Date[]>([]); // Kullanıcının kendi abonelik randevuları
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDates, setFetchingDates] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [fetchingStaff, setFetchingStaff] = useState(false);
  const [subscriptionSettings, setSubscriptionSettings] = useState<{
    allowSubscriptionAppointments: boolean;
    allowedRecurrenceTypes: string[];
    allowTimeChanges: boolean;
  } | null>(null);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [recurrenceType, setRecurrenceType] = useState<"DAILY" | "WEEKLY" | "MONTHLY" | null>(null);
  const [endDate, setEndDate] = useState<string | null>(null);

  // Hizmet seçildiğinde personelleri çek
  useEffect(() => {
    if (step === 2 && selectedServices.length > 0 && isOpen) {
      setFetchingStaff(true);
      Promise.all(
        selectedServices.map(serviceId => getStaffForService(barberId, serviceId))
      ).then(staffArrays => {
        const allStaff = staffArrays.flat();
        const uniqueStaff = allStaff.filter((staff, index, self) =>
          index === self.findIndex(s => s.id === staff.id)
        );
        setAvailableStaff(uniqueStaff);
        setFetchingStaff(false);

        if (uniqueStaff.length === 1) {
          setSelectedStaffId(uniqueStaff[0].id);
          // Tek personel varsa otomatik olarak step 3'e geç
          setTimeout(() => {
            setStep(3);
          }, 300);
        } else {
          setSelectedStaffId("");
        }
      });
    }
  }, [step, selectedServices, barberId, isOpen]);

  // Personel seçildiğinde otomatik olarak step 3'e geç
  useEffect(() => {
    if (step === 2 && selectedStaffId && !fetchingStaff && availableStaff.length > 1) {
      const timer = setTimeout(() => {
        setStep(3);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedStaffId, fetchingStaff, step, availableStaff.length]);

  // Modal açıldığında step'i sıfırla ve cache'i temizle
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedServices([]);
      setSelectedStaffId("");
      setSelectedDate(null);
      setSelectedSlot(null);
      setAvailableDates(new Set());
      setAvailableSlots([]);
      setUnavailableSlots([]);
      setMySubscriptionSlots([]);
      fetchDatesRef.current = null; // Cache'i temizle
    }
  }, [isOpen]);

  // fetchDates fonksiyonunu memoize et ve debounce ekle
  const fetchDatesRef = useRef<{ month: number; year: number; staffId: string } | null>(null);
  const fetchDatesTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDates = useCallback(async () => {
    // Eğer aynı ay/yıl/personel için zaten çekildiyse, tekrar çekme
    if (fetchDatesRef.current &&
      fetchDatesRef.current.month === currentMonth &&
      fetchDatesRef.current.year === currentYear &&
      fetchDatesRef.current.staffId === selectedStaffId &&
      availableDates.size > 0) {
      return; // Cache'den kullan
    }

    // Önceki timeout'u iptal et
    if (fetchDatesTimeoutRef.current) {
      clearTimeout(fetchDatesTimeoutRef.current);
    }

    // Debounce: 300ms bekle
    fetchDatesTimeoutRef.current = setTimeout(async () => {
      setFetchingDates(true);
      try {
        // Tek bir API çağrısı ile tüm ayın müsaitlik durumunu al
        const url = `/api/barber/${barberId}/availability?month=${currentMonth}&year=${currentYear}${selectedStaffId ? `&staffId=${selectedStaffId}` : ''}`;
        const response = await fetch(url);
        const data = await response.json();

        setAvailableDates(new Set(data.availableDates || []));
        setUnavailableDates(new Set(data.unavailableDates || []));
        fetchDatesRef.current = { month: currentMonth, year: currentYear, staffId: selectedStaffId };
      } catch (error) {
        console.error("Error fetching dates:", error);
      } finally {
        setFetchingDates(false);
      }
    }, 300);
  }, [currentMonth, currentYear, selectedStaffId, barberId]);

  // Modal açıldığında veya ay değiştiğinde tarihleri çek (Step 3) - sadece bir kez
  useEffect(() => {
    if (isOpen && step === 3 && selectedStaffId) {
      // Cache kontrolü: Eğer aynı ay/yıl/personel için zaten çekildiyse, tekrar çekme
      const cacheKey = `${currentMonth}-${currentYear}-${selectedStaffId}`;
      if (!fetchDatesRef.current ||
        fetchDatesRef.current.month !== currentMonth ||
        fetchDatesRef.current.year !== currentYear ||
        fetchDatesRef.current.staffId !== selectedStaffId) {
        fetchDates();
      }
    }
  }, [isOpen, step, selectedStaffId, fetchDates]);

  // Tarih seçildiğinde saatleri çek (Step 4) - API endpoint kullanarak
  const fetchSlotsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (step === 4 && selectedDate && selectedStaffId) {
      // Önceki timeout'u iptal et
      if (fetchSlotsTimeoutRef.current) {
        clearTimeout(fetchSlotsTimeoutRef.current);
      }

      // Debounce: 200ms bekle
      fetchSlotsTimeoutRef.current = setTimeout(async () => {
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
          setSelectedSlot(null);
        } catch (error) {
          console.error("Error fetching slots:", error);
        } finally {
          setFetchingSlots(false);
        }
      }, 200);
    }

    return () => {
      if (fetchSlotsTimeoutRef.current) {
        clearTimeout(fetchSlotsTimeoutRef.current);
      }
    };
  }, [step, selectedDate, selectedStaffId, barberId]);


  const toggleService = (id: string) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handlePreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

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

  const handleBooking = async () => {
    if (!selectedSlot || selectedServices.length === 0) return;

    // Seçilen slot'un dolu olup olmadığını kontrol et
    const isUnavailable = unavailableSlots.some(slot => slot.getTime() === selectedSlot.getTime());
    if (isUnavailable) {
      alert("Bu saat dolu. Lütfen başka bir saat seçin.");
      return;
    }

    setLoading(true);
    try {
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

        if (result.success) {
          alert("Abonelik randevunuz başarıyla oluşturuldu!");
          onClose();
          window.location.reload();
        } else {
          alert(result.error || "Abonelik randevusu oluşturulamadı");
        }
      } else {
        // Normal randevu
        const result = await createAppointment(
          barberId,
          selectedServices,
          selectedSlot,
          selectedStaffId || undefined
        );

        if (result.success) {
          alert("Randevunuz başarıyla oluşturuldu!");
          onClose();
          window.location.reload();
        } else {
          alert(result.error || "Randevu oluşturulamadı");
        }
      }
    } catch (error) {
      console.error("Error creating appointment:", error);
      alert("Randevu oluşturulurken bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  // Takvim günlerini oluştur
  const getCalendarDays = () => {
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Pazartesi = 0

    const days: Array<{ date: number; dateStr: string; isAvailable: boolean; isUnavailable: boolean }> = [];

    // Boş günler (ayın başından önce)
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ date: 0, dateStr: "", isAvailable: false, isUnavailable: false });
    }

    // Ayın günleri
    for (let date = 1; date <= daysInMonth; date++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(date).padStart(2, "0")}`;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const checkDate = new Date(currentYear, currentMonth, date);
      checkDate.setHours(0, 0, 0, 0);

      days.push({
        date,
        dateStr,
        isAvailable: availableDates.has(dateStr) && checkDate >= today,
        isUnavailable: false, // Artık unavailableDates kullanmıyoruz, sadece availableDates kontrol ediyoruz
      });
    }

    return days;
  };

  const totalPrice = services
    .filter((s) => selectedServices.includes(s.id))
    .reduce((acc, s) => acc + Number(s.price), 0);

  // Debug: Modal render kontrolü
  console.log("QuickAppointmentModal render check", { isOpen, barberId, barberName });

  if (!isOpen) {
    console.log("Modal is closed, not rendering");
    return null;
  }

  console.log("Modal is open, rendering...");

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      {/* Modal/Panel */}
      <div
        className={`fixed inset-y-0 right-0 bg-slate-900 shadow-2xl pointer-events-auto border-l border-white/5 ${
          // Mobilde: sağdan açılan tam ekran panel
          // Desktop'ta: ortalanmış modal
          "w-full md:w-[600px] md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-3xl md:max-h-[85vh] md:inset-y-auto"
          } flex flex-col animate-slide-in-right md:animate-fade-in-modal`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-white/5 sticky top-0 bg-slate-900 z-10 rounded-t-3xl">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white">
              Hızlı Randevu
            </h2>
            <p className="text-sm text-slate-400 mt-1">{barberName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar">
          {/* Step 1: Hizmet Seçimi */}
          {step === 1 && (
            <div>
              <h3 className="text-sm font-semibold text-white mb-3">
                Hizmet Seçin
              </h3>
              <div className="space-y-2">
                {services.length === 0 ? (
                  <p className="text-sm text-slate-500">Henüz hizmet eklenmemiş.</p>
                ) : (
                  services.map((service) => (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all ${selectedServices.includes(service.id)
                          ? "border-amber-500/50 bg-amber-500/10"
                          : "border-white/5 hover:border-white/10 bg-white/5"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{service.name}</p>
                          <p className="text-xs text-slate-400 mt-1">
                            {service.duration} dakika • {Number(service.price).toFixed(2)} ₺
                          </p>
                        </div>
                        {selectedServices.includes(service.id) && (
                          <div className="w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                            <CheckCircle size={14} className="text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
              {selectedServices.length > 0 && (
                <div className="mt-3 p-3 bg-white/5 rounded-xl border border-white/5">
                  <p className="text-sm text-slate-300">
                    Toplam: <span className="font-bold text-white">{totalPrice.toFixed(2)} ₺</span>
                  </p>
                </div>
              )}
              <div className="flex items-center justify-end gap-3 mt-6 border-t border-white/10 pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={selectedServices.length === 0}
                  className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-indigo-500 transition flex items-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  Devam Et
                  <ArrowLeft className="rotate-180" size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Personel Seçimi */}
          {step === 2 && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white">
                  Personel Seçin
                </h3>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Geri Dön
                </button>
              </div>
              {fetchingStaff ? (
                <div className="flex justify-center py-8 text-slate-400">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
                </div>
              ) : availableStaff.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-white/5 rounded-lg border border-dashed border-white/10">
                  Seçili hizmetlere atanmış personel bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableStaff.map(staff => (
                    <button
                      key={staff.id}
                      onClick={() => setSelectedStaffId(staff.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${selectedStaffId === staff.id
                          ? "border-amber-500/50 bg-amber-500/10 scale-[1.02]"
                          : "border-white/5 bg-white/5 hover:border-white/10 hover:scale-[1.01]"
                        }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-white">{staff.name}</p>
                          {staff.role && (
                            <p className="text-xs text-slate-400 mt-1">{staff.role.name}</p>
                          )}
                        </div>
                        {selectedStaffId === staff.id && (
                          <CheckCircle className="text-amber-500 animate-scale-in" size={20} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedStaffId && !fetchingStaff && (
                <div className="text-sm text-slate-400 text-center mt-6 animate-pulse">
                  Tarih seçimine geçiliyor...
                </div>
              )}
              <div className="flex items-center justify-start gap-3 mt-6 border-t border-white/10 pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl font-semibold text-slate-300 hover:bg-white/5 transition"
                >
                  Geri Dön
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Tarih Seçimi */}
          {step === 3 && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Tarih Seçin
                </h3>
                <button
                  onClick={() => setStep(2)}
                  className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Geri Dön
                </button>
              </div>

              {/* Ay Navigasyonu */}
              <div className="flex items-center justify-between mb-4">
                <button
                  onClick={handlePreviousMonth}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-300 hover:text-white"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h4 className="text-lg font-bold text-white">
                  {MONTH_NAMES[currentMonth]} {currentYear}
                </h4>
                <button
                  onClick={handleNextMonth}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors text-slate-300 hover:text-white"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Takvim */}
              {fetchingDates ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {/* Gün Başlıkları */}
                  {DAY_NAMES.map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs font-semibold text-slate-500 py-2"
                    >
                      {day}
                    </div>
                  ))}

                  {/* Günler */}
                  {getCalendarDays().map((day, index) => {
                    if (day.date === 0) {
                      return <div key={`empty-${index}`} className="h-12" />;
                    }

                    const isSelected = selectedDate === day.dateStr;
                    const isToday =
                      day.dateStr ===
                      new Date().toISOString().split("T")[0];

                    return (
                      <button
                        key={day.dateStr}
                        onClick={() => {
                          if (day.isAvailable) {
                            setSelectedDate(day.dateStr);
                            // Tarih seçildiğinde otomatik olarak step 4'e geç
                            setTimeout(() => {
                              setStep(4);
                            }, 300);
                          }
                        }}
                        disabled={!day.isAvailable}
                        className={`h-12 rounded-lg text-sm font-medium transition-all duration-200 relative ${day.isUnavailable
                            ? "text-red-400/50 line-through bg-red-500/5 cursor-not-allowed border border-red-500/10"
                            : day.isAvailable
                              ? isSelected
                                ? "bg-indigo-600 text-white scale-105 shadow-lg shadow-indigo-500/30"
                                : isToday
                                  ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30 hover:scale-105"
                                  : "bg-white/5 text-slate-200 hover:bg-white/10 hover:scale-105 border border-white/5"
                              : "text-slate-600 bg-white/5 cursor-not-allowed"
                          }`}
                      >
                        {day.date}
                      </button>
                    );
                  })}
                </div>
              )}
              {selectedDate && !fetchingDates && (
                <div className="text-sm text-slate-400 text-center mt-6 animate-pulse">
                  Saat seçimine geçiliyor...
                </div>
              )}
              <div className="flex items-center justify-start gap-3 mt-6 border-t border-white/10 pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl font-semibold text-slate-300 hover:bg-white/5 transition"
                >
                  Geri Dön
                </button>
              </div>
            </div>
          )}

          {/* Step 5: Abonelik Seçimi (Recurrence) */}
          {step === 5 && subscriptionSettings?.allowSubscriptionAppointments && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Repeat className="w-4 h-4" />
                  Tekrarlayan Randevu
                </h3>
                <button
                  onClick={() => setStep(4)}
                  className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                >
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
                    className="w-full p-4 rounded-xl border-2 border-white/5 hover:border-white/10 bg-white/5 text-left transition"
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
                            : "border-white/5 bg-white/5 hover:border-white/10"
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
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Bitiş Tarihi (Opsiyonel)
                    </label>
                    <input
                      type="date"
                      value={endDate || ""}
                      min={selectedDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full px-4 py-2 bg-slate-800 border border-slate-700/50 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-white"
                    />
                    <p className="text-xs text-slate-500 mt-1">
                      Boş bırakırsanız süresiz devam eder
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Step 4: Saat Seçimi */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Saat Seçin
                </h3>
                <button
                  onClick={() => setStep(3)}
                  className="text-sm text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Geri Dön
                </button>
              </div>

              {fetchingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-500"></div>
                </div>
              ) : availableSlots.length === 0 && mySubscriptionSlots.length === 0 && unavailableSlots.length === 0 ? (
                <p className="text-sm text-slate-500">Bu tarih için müsait saat bulunamadı.</p>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {/* Müsait saatler */}
                  {availableSlots.map((slot, idx) => {
                    const timeStr = new Date(slot).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                    const isSelected = selectedSlot && selectedSlot.getTime() === slot.getTime();

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-1 rounded-lg text-sm font-medium transition ${isSelected
                            ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30"
                            : "bg-white/5 text-slate-300 hover:bg-white/10"
                          }`}
                      >
                        {timeStr}
                      </button>
                    );
                  })}

                  {/* Kullanıcının kendi abonelik randevuları */}
                  {mySubscriptionSlots.map((slot, idx) => (
                    <button
                      key={`my-sub-${idx}`}
                      onClick={() => setSelectedSlot(slot)}
                      className={`py-2 px-1 rounded-lg text-sm font-medium transition relative ${selectedSlot && selectedSlot.getTime() === slot.getTime()
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20"
                        }`}
                      title="Sizin abonelik randevunuz"
                    >
                      {new Date(slot).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                      <span className="absolute top-0 right-0 text-xs text-emerald-400">⭐</span>
                    </button>
                  ))}

                  {/* Dolu saatler */}
                  {unavailableSlots.map((slot, idx) => (
                    <button
                      key={`unavailable-${idx}`}
                      disabled
                      className="py-2 px-1 rounded-lg text-sm font-medium bg-white/5 text-slate-600 line-through cursor-not-allowed border border-white/5 opacity-50"
                    >
                      {new Date(slot).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                    </button>
                  ))}
                </div>
              )}

              {subscriptionSettings?.allowSubscriptionAppointments &&
                (!hasActiveSubscription || subscriptionSettings.allowedRecurrenceTypes.includes("MONTHLY")) ? (
                <button
                  disabled={!selectedSlot || loading}
                  onClick={() => setStep(5)}
                  className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-indigo-500 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  Devam Et
                  <ArrowLeft className="rotate-180" size={18} />
                </button>
              ) : (
                <button
                  disabled={!selectedSlot || loading}
                  onClick={handleBooking}
                  className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-indigo-500 transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20"
                >
                  {loading ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : <CheckCircle size={18} />}
                  Randevuyu Onayla
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
