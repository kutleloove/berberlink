"use client";

import { X, ChevronLeft, ChevronRight, Calendar, Clock, ArrowLeft, CheckCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { createAppointment } from "@/actions/appointment";
import { getStaffForService, getAvailableSlots, isDateAvailable } from "@/actions/availability";

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
  const [step, setStep] = useState(1); // 1: Service, 2: Staff, 3: Date, 4: Time
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>("");
  const [availableStaff, setAvailableStaff] = useState<Array<{ id: string; name: string; role?: { name: string } | null }>>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDates, setFetchingDates] = useState(false);
  const [fetchingSlots, setFetchingSlots] = useState(false);
  const [fetchingStaff, setFetchingStaff] = useState(false);

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

  // Modal açıldığında step'i sıfırla
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setSelectedServices([]);
      setSelectedStaffId("");
      setSelectedDate(null);
      setSelectedSlot(null);
    }
  }, [isOpen]);

  // Modal açıldığında veya ay değiştiğinde tarihleri çek (Step 3)
  useEffect(() => {
    if (isOpen && step === 3 && selectedStaffId) {
      fetchDates();
    }
  }, [isOpen, currentMonth, currentYear, barberId, step, selectedStaffId]);


  // Tarih seçildiğinde saatleri çek (Step 4)
  useEffect(() => {
    if (step === 4 && selectedDate && selectedStaffId) {
      setFetchingSlots(true);
      getAvailableSlots(barberId, new Date(selectedDate), selectedStaffId)
        .then(slots => {
          setAvailableSlots(slots);
          setSelectedSlot(null);
        })
        .finally(() => setFetchingSlots(false));
    }
  }, [step, selectedDate, selectedStaffId, barberId]);

  const fetchDates = async () => {
    setFetchingDates(true);
    try {
      const today = new Date();
      const dates = new Set<string>();
      
      // 30 gün ileriye bak
      await Promise.all(
        Array.from({ length: 30 }).map(async (_, i) => {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          
          const available = await isDateAvailable(barberId, date, selectedStaffId);
          if (available) {
            dates.add(dateStr);
          }
        })
      );
      
      setAvailableDates(dates);
    } catch (error) {
      console.error("Error fetching dates:", error);
    } finally {
      setFetchingDates(false);
    }
  };


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

  const handleBooking = async () => {
    if (!selectedSlot || selectedServices.length === 0) return;

    setLoading(true);
    try {
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
        className="fixed inset-0 bg-black/50 pointer-events-auto"
        onClick={onClose}
      />

      {/* Modal/Panel */}
      <div
        className={`fixed inset-y-0 right-0 bg-white shadow-2xl pointer-events-auto ${
          // Mobilde: sağdan açılan tam ekran panel
          // Desktop'ta: ortalanmış modal
          "w-full md:w-[600px] md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:rounded-2xl md:max-h-[90vh] md:inset-y-auto"
        } flex flex-col animate-slide-in-right md:animate-fade-in-modal`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-slate-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900">
              Hızlı Randevu
            </h2>
            <p className="text-sm text-slate-600 mt-1">{barberName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* Step 1: Hizmet Seçimi */}
          {step === 1 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
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
                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                      selectedServices.includes(service.id)
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{service.name}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {service.duration} dakika • {Number(service.price).toFixed(2)} ₺
                        </p>
                      </div>
                      {selectedServices.includes(service.id) && (
                        <div className="w-5 h-5 rounded-full bg-slate-900 flex items-center justify-center">
                          <div className="w-2 h-2 rounded-full bg-white" />
                        </div>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
            {selectedServices.length > 0 && (
              <div className="mt-3 p-3 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-600">
                  Toplam: <span className="font-bold text-slate-900">{totalPrice.toFixed(2)} ₺</span>
                </p>
              </div>
              )}
              <div className="flex items-center justify-end gap-3 mt-6 border-t pt-4">
                <button
                  onClick={() => setStep(2)}
                  disabled={selectedServices.length === 0}
                  className="bg-slate-900 text-white px-6 py-3 rounded-xl font-semibold disabled:opacity-50 hover:bg-slate-800 transition flex items-center gap-2"
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
                <h3 className="text-sm font-semibold text-slate-900">
                  Personel Seçin
                </h3>
                <button 
                  onClick={() => setStep(1)} 
                  className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Geri Dön
                </button>
              </div>
              {fetchingStaff ? (
                <div className="flex justify-center py-8 text-slate-500">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                </div>
              ) : availableStaff.length === 0 ? (
                <div className="text-center py-8 text-slate-500 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                  Seçili hizmetlere atanmış personel bulunmuyor.
                </div>
              ) : (
                <div className="space-y-2">
                  {availableStaff.map(staff => (
                    <button
                      key={staff.id}
                      onClick={() => setSelectedStaffId(staff.id)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                        selectedStaffId === staff.id
                          ? "border-slate-900 bg-slate-50 scale-[1.02]"
                          : "border-slate-200 hover:border-slate-300 hover:scale-[1.01]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-900">{staff.name}</p>
                          {staff.role && (
                            <p className="text-xs text-slate-500 mt-1">{staff.role.name}</p>
                          )}
                        </div>
                        {selectedStaffId === staff.id && (
                          <CheckCircle className="text-slate-900 animate-scale-in" size={20} />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {selectedStaffId && !fetchingStaff && (
                <div className="text-sm text-slate-500 text-center mt-6 animate-pulse">
                  Tarih seçimine geçiliyor...
                </div>
              )}
              <div className="flex items-center justify-start gap-3 mt-6 border-t pt-4">
                <button
                  onClick={() => setStep(1)}
                  className="px-6 py-3 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition"
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
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Tarih Seçin
                </h3>
                <button 
                  onClick={() => setStep(2)} 
                  className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Geri Dön
                </button>
              </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Tarih Seçin
            </h3>

            {/* Ay Navigasyonu */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePreviousMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </button>
              <h4 className="text-lg font-bold text-slate-900">
                {MONTH_NAMES[currentMonth]} {currentYear}
              </h4>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* Takvim */}
            {fetchingDates ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
              </div>
            ) : (
              <div className="grid grid-cols-7 gap-2">
                {/* Gün Başlıkları */}
                {DAY_NAMES.map((day) => (
                  <div
                    key={day}
                    className="text-center text-xs font-semibold text-slate-600 py-2"
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
                      className={`h-12 rounded-lg text-sm font-medium transition-all duration-200 relative ${
                        day.isUnavailable
                          ? "text-red-400 line-through bg-red-50 cursor-not-allowed"
                          : day.isAvailable
                          ? isSelected
                            ? "bg-slate-900 text-white scale-105"
                            : isToday
                            ? "bg-blue-100 text-blue-900 hover:bg-blue-200 hover:scale-105"
                            : "bg-slate-50 text-slate-900 hover:bg-slate-100 hover:scale-105"
                          : "text-slate-300 bg-slate-50 cursor-not-allowed"
                      }`}
                    >
                      {day.date}
                    </button>
                  );
                })}
              </div>
            )}
              {selectedDate && !fetchingDates && (
                <div className="text-sm text-slate-500 text-center mt-6 animate-pulse">
                  Saat seçimine geçiliyor...
                </div>
              )}
              <div className="flex items-center justify-start gap-3 mt-6 border-t pt-4">
                <button
                  onClick={() => setStep(2)}
                  className="px-6 py-3 rounded-xl font-semibold text-slate-700 hover:bg-slate-100 transition"
                >
                  Geri Dön
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Saat Seçimi */}
          {step === 4 && (
            <div className="animate-fade-in">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Saat Seçin
                </h3>
                <button 
                  onClick={() => setStep(3)} 
                  className="text-sm text-slate-500 hover:text-slate-900 flex items-center gap-1"
                >
                  <ArrowLeft size={16} />
                  Geri Dön
                </button>
              </div>

              {fetchingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                </div>
              ) : availableSlots.length === 0 ? (
                <p className="text-sm text-slate-500">Bu tarih için müsait saat bulunamadı.</p>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {availableSlots.map((slot, idx) => {
                    const timeStr = new Date(slot).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
                    const isSelected = selectedSlot && selectedSlot.getTime() === slot.getTime();

                    return (
                      <button
                        key={idx}
                        onClick={() => setSelectedSlot(slot)}
                        className={`p-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? "bg-slate-900 text-white scale-105"
                            : "bg-slate-50 text-slate-900 hover:bg-slate-100 hover:scale-105"
                        }`}
                      >
                        {timeStr}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer - Modal'ın altında sabit */}
        <div className="p-4 md:p-6 border-t border-slate-200 bg-white mt-auto flex-shrink-0">
          <button
            onClick={handleBooking}
            disabled={
              loading ||
              step !== 4 ||
              selectedServices.length === 0 ||
              !selectedDate ||
              !selectedSlot
            }
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-semibold hover:bg-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Oluşturuluyor...</span>
              </>
            ) : (
              "Randevu Oluştur"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

