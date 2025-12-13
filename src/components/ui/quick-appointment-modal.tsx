"use client";

import { X, ChevronLeft, ChevronRight, Calendar, Clock } from "lucide-react";
import { useEffect, useState } from "react";
import { createAppointment } from "@/actions/appointment";

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
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availableDates, setAvailableDates] = useState<Set<string>>(new Set());
  const [unavailableDates, setUnavailableDates] = useState<Set<string>>(new Set());
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [unavailableHours, setUnavailableHours] = useState<string[]>([]);
  const [selectedHour, setSelectedHour] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingDates, setFetchingDates] = useState(false);
  const [fetchingHours, setFetchingHours] = useState(false);

  // Modal açıldığında veya ay değiştiğinde tarihleri çek
  useEffect(() => {
    if (isOpen) {
      fetchDates();
    }
  }, [isOpen, currentMonth, currentYear, barberId]);

  // Tarihler yüklendiğinde en yakın müsait tarihi seç (gerçekten müsait saat olan)
  useEffect(() => {
    if (isOpen && availableDates.size > 0 && !selectedDate && !fetchingDates) {
      findAndSelectNextAvailableDate();
    }
  }, [isOpen, availableDates, unavailableDates, currentMonth, currentYear, fetchingDates]);

  // Tarih seçildiğinde saatleri çek
  useEffect(() => {
    if (selectedDate) {
      fetchHours(selectedDate);
    } else {
      setAvailableHours([]);
      setUnavailableHours([]);
      setSelectedHour(null);
    }
  }, [selectedDate, barberId]);

  const fetchDates = async () => {
    setFetchingDates(true);
    try {
      const response = await fetch(
        `/api/barber/${barberId}/availability?month=${currentMonth}&year=${currentYear}`
      );
      const data = await response.json();
      setAvailableDates(new Set(data.availableDates || []));
      setUnavailableDates(new Set(data.unavailableDates || []));
    } catch (error) {
      console.error("Error fetching dates:", error);
    } finally {
      setFetchingDates(false);
    }
  };

  const fetchHours = async (date: string) => {
    setFetchingHours(true);
    try {
      const response = await fetch(
        `/api/barber/${barberId}/availability?date=${date}`
      );
      const data = await response.json();
      const hours = data.availableHours || [];
      const unavailable = data.unavailableHours || [];
      
      setAvailableHours(hours);
      setUnavailableHours(unavailable);
      
      // Eğer müsait saat yoksa, bu tarihi unavailable olarak işaretle
      if (hours.length === 0) {
        setUnavailableDates(prev => {
          const newSet = new Set(prev);
          newSet.add(date);
          return newSet;
        });
        setAvailableDates(prev => {
          const newSet = new Set(prev);
          newSet.delete(date);
          return newSet;
        });
        
        // En yakın müsait tarihi bul ve seç
        findAndSelectNextAvailableDate();
      }
    } catch (error) {
      console.error("Error fetching hours:", error);
    } finally {
      setFetchingHours(false);
    }
  };

  // En yakın müsait tarihi bul ve seç (gerçekten müsait saat olan)
  const findAndSelectNextAvailableDate = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Önce mevcut ay içinde ara
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const datesToCheck: string[] = [];
    
    for (let day = 1; day <= lastDayOfMonth; day++) {
      const checkDate = new Date(currentYear, currentMonth, day);
      const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
      
      // Geçmiş tarihleri atla (bugün dahil değil, bugünü de kontrol etmeliyiz)
      if (checkDate < today) {
        continue;
      }
      
      // Eğer bu tarih available ise ve unavailable değilse
      if (availableDates.has(checkDateStr) && !unavailableDates.has(checkDateStr)) {
        datesToCheck.push(checkDateStr);
      }
    }
    
    // Mevcut ay içinde bulunamadı, sonraki ayın ilk günlerine bak
    if (datesToCheck.length === 0) {
      const nextMonth = currentMonth === 11 ? 0 : currentMonth + 1;
      const nextYear = currentMonth === 11 ? currentYear + 1 : currentYear;
      
      for (let day = 1; day <= 31; day++) {
        const checkDate = new Date(nextYear, nextMonth, day);
        
        // Eğer ay değiştiyse dur
        if (checkDate.getMonth() !== nextMonth) {
          break;
        }
        
        const checkDateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
        
        // Eğer bu tarih available ise ve unavailable değilse
        if (availableDates.has(checkDateStr) && !unavailableDates.has(checkDateStr)) {
          datesToCheck.push(checkDateStr);
        }
      }
      
      // Sonraki ay için tarihleri çek
      if (datesToCheck.length > 0) {
        setCurrentMonth(nextMonth);
        setCurrentYear(nextYear);
        // Ay değişti, tarihler yeniden yüklenecek, bu fonksiyon tekrar çağrılacak
        return;
      }
    }
    
    // Tarihleri sırayla kontrol et, ilk müsait saati olan tarihi seç
    for (const dateStr of datesToCheck) {
      try {
        const response = await fetch(
          `/api/barber/${barberId}/availability?date=${dateStr}`
        );
        const data = await response.json();
        const hours = data.availableHours || [];
        
        // Eğer bu tarih için müsait saat varsa, seç
        if (hours.length > 0) {
          setSelectedDate(dateStr);
          return;
        } else {
          // Müsait saat yok, bu tarihi unavailable olarak işaretle
          setUnavailableDates(prev => {
            const newSet = new Set(prev);
            newSet.add(dateStr);
            return newSet;
          });
          setAvailableDates(prev => {
            const newSet = new Set(prev);
            newSet.delete(dateStr);
            return newSet;
          });
        }
      } catch (error) {
        console.error(`Error checking hours for ${dateStr}:`, error);
      }
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
    if (!selectedDate || !selectedHour || selectedServices.length === 0) return;

    setLoading(true);
    try {
      const [hours, minutes] = selectedHour.split(":").map(Number);
      const appointmentDate = new Date(selectedDate);
      appointmentDate.setHours(hours, minutes, 0, 0);

      const result = await createAppointment(barberId, selectedServices, appointmentDate);
      
      if (result.success) {
        alert("Randevunuz başarıyla oluşturuldu!");
        onClose();
        // Sayfayı yenile veya state'i güncelle
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
      days.push({
        date,
        dateStr,
        isAvailable: availableDates.has(dateStr),
        isUnavailable: unavailableDates.has(dateStr),
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
        } flex flex-col animate-slide-in-right md:animate-fade-in`}
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
          {/* Hizmet Seçimi */}
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
          </div>

          {/* Tarih Seçimi */}
          <div>
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
                        }
                      }}
                      disabled={!day.isAvailable}
                      className={`h-12 rounded-lg text-sm font-medium transition-all relative ${
                        day.isUnavailable
                          ? "text-red-400 line-through bg-red-50 cursor-not-allowed"
                          : day.isAvailable
                          ? isSelected
                            ? "bg-slate-900 text-white"
                            : isToday
                            ? "bg-blue-100 text-blue-900 hover:bg-blue-200"
                            : "bg-slate-50 text-slate-900 hover:bg-slate-100"
                          : "text-slate-300 bg-slate-50 cursor-not-allowed"
                      }`}
                    >
                      {day.date}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Saat Seçimi */}
          {selectedDate && (
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Saat Seçin
              </h3>

              {fetchingHours ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
                </div>
              ) : availableHours.length === 0 && unavailableHours.length === 0 ? (
                <p className="text-sm text-slate-500">Bu tarih için müsait saat bulunamadı.</p>
              ) : (
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {[...availableHours, ...unavailableHours]
                    .sort()
                    .map((hour) => {
                      const isAvailable = availableHours.includes(hour);
                      const isSelected = selectedHour === hour;

                      return (
                        <button
                          key={hour}
                          onClick={() => {
                            if (isAvailable) {
                              setSelectedHour(hour);
                            }
                          }}
                          disabled={!isAvailable}
                          className={`p-3 rounded-lg text-sm font-medium transition-all ${
                            !isAvailable
                              ? "text-red-400 line-through bg-red-50 cursor-not-allowed"
                              : isSelected
                              ? "bg-slate-900 text-white"
                              : "bg-slate-50 text-slate-900 hover:bg-slate-100"
                          }`}
                        >
                          {hour}
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
              selectedServices.length === 0 ||
              !selectedDate ||
              !selectedHour
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

