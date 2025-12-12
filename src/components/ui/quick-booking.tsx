"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock, X } from "lucide-react";
import { getAvailableSlots } from "@/actions/availability";
import { createAppointment } from "@/actions/appointment";
import { getFirstService } from "@/actions/service";
import { useRouter } from "next/navigation";

interface Barber {
  id: string;
  shopName: string;
  slug: string;
  logoUrl?: string | null;
}

interface QuickBookingProps {
  hasUpcomingAppointments: boolean;
  lastAppointmentBarberId?: string | null;
  favoriteBarbers: Barber[];
}

export default function QuickBooking({ hasUpcomingAppointments, lastAppointmentBarberId, favoriteBarbers: initialFavoriteBarbers }: QuickBookingProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedBarberId, setSelectedBarberId] = useState<string>("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());

  // Son randevu alınan berberi en üste al
  const favoriteBarbers = [...initialFavoriteBarbers].sort((a, b) => {
    if (lastAppointmentBarberId === a.id) return -1;
    if (lastAppointmentBarberId === b.id) return 1;
    return 0;
  });

  // Tek favori varsa otomatik seç
  useEffect(() => {
    if (favoriteBarbers.length === 1 && isOpen) {
      setSelectedBarberId(favoriteBarbers[0].id);
    }
  }, [isOpen, favoriteBarbers]);

  // Berber seçildiğinde dolu günleri çek
  useEffect(() => {
    if (selectedBarberId) {
      setLoadingSlots(true);
      const booked = new Set<string>();
      const today = new Date();
      
      // 30 gün için müsaitlik kontrolü - eğer hiç müsait slot yoksa dolu kabul et
      const checkDates = async () => {
        for (let i = 0; i < 30; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() + i);
          const dateStr = date.toISOString().split('T')[0];
          
          // Geçmiş tarihleri atla
          const dateOnly = new Date(date);
          dateOnly.setHours(0, 0, 0, 0);
          const todayOnly = new Date(today);
          todayOnly.setHours(0, 0, 0, 0);
          if (dateOnly < todayOnly) {
            continue;
          }
          
          // O gün için müsait slot var mı kontrol et
          const slots = await getAvailableSlots(selectedBarberId, date);
          if (slots.length === 0) {
            booked.add(dateStr);
          }
        }
        setBookedDates(booked);
        setLoadingSlots(false);
      };
      
      checkDates();
    } else {
      setBookedDates(new Set());
    }
  }, [selectedBarberId]);

  // Tarih seçildiğinde müsait saatleri çek
  useEffect(() => {
    if (selectedBarberId && selectedDate) {
      setLoadingSlots(true);
      getAvailableSlots(selectedBarberId, new Date(selectedDate))
        .then((slots) => {
          setAvailableSlots(slots.map(slot => {
            const date = new Date(slot);
            return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
          }));
        })
        .finally(() => setLoadingSlots(false));
    }
  }, [selectedBarberId, selectedDate]);

  const handleBook = async () => {
    if (!selectedBarberId || !selectedDate || !selectedTime) return;

    setLoading(true);
    const appointmentDateTime = new Date(`${selectedDate}T${selectedTime}`);
    
    // Berberin ilk hizmetini al (varsayılan)
    const firstServiceId = await getFirstService(selectedBarberId);
    const serviceIds = firstServiceId ? [firstServiceId] : [];
    
    const result = await createAppointment(
      selectedBarberId,
      serviceIds,
      appointmentDateTime
    );

    setLoading(false);

    if (result.success) {
      alert("Randevunuz başarıyla oluşturuldu!");
      router.refresh();
      setIsOpen(false);
      // Formu sıfırla
      setSelectedBarberId("");
      setSelectedDate("");
      setSelectedTime("");
    } else {
      alert(result.error || "Randevu alınamadı");
    }
  };

  // Takvim günlerini oluştur
  const getCalendarDays = () => {
    const today = new Date();
    const days: { date: Date; dateStr: string; isBooked: boolean; isPast: boolean }[] = [];
    
    // İlk günün haftanın hangi günü olduğunu bul (0: Pazar, 1: Pazartesi, ...)
    const firstDay = new Date(today);
    firstDay.setDate(today.getDate());
    const firstDayOfWeek = firstDay.getDay(); // 0: Pazar, 1: Pazartesi, ...
    
    // Pazartesi'yi 0 yapmak için (Pazartesi: 0, Salı: 1, ..., Pazar: 6)
    const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // İlk günden önce boş hücreler ekle
    for (let i = 0; i < adjustedFirstDay; i++) {
      days.push({ date: new Date(), dateStr: '', isBooked: false, isPast: true });
    }
    
    // 30 gün ekle
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateStr = date.toISOString().split('T')[0];
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      const todayOnly = new Date(today);
      todayOnly.setHours(0, 0, 0, 0);
      const isPast = dateOnly < todayOnly;
      const isBooked = bookedDates.has(dateStr);
      
      days.push({ date, dateStr, isBooked, isPast });
    }
    
    return days;
  };

  if (hasUpcomingAppointments || favoriteBarbers.length === 0) {
    return null;
  }

  if (!isOpen) {
    return (
      <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm mb-6">
        <button
          onClick={() => setIsOpen(true)}
          className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition flex items-center justify-center gap-2"
        >
          <Calendar size={20} />
          Hızlı Randevu Al
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-100 shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-lg text-slate-900">Hızlı Randevu</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-slate-400 hover:text-slate-900 transition"
        >
          <X size={20} />
        </button>
      </div>

      {/* Berber Seçimi */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Berber Seçin
        </label>
        <select
          value={selectedBarberId}
          onChange={(e) => setSelectedBarberId(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-slate-900 outline-none text-slate-900"
        >
          <option value="">Berber seçin...</option>
          {favoriteBarbers.map((barber) => (
            <option key={barber.id} value={barber.id}>
              {barber.shopName}
            </option>
          ))}
        </select>
      </div>

      {selectedBarberId && (
        <>
          {/* Takvim */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Tarih Seçin
            </label>
            {/* Haftanın günleri */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day, index) => (
                <div key={index} className="text-center text-xs font-semibold text-slate-500 py-1">
                  {day}
                </div>
              ))}
            </div>
            {/* Takvim günleri */}
            <div className="grid grid-cols-7 gap-2">
              {getCalendarDays().map((day, index) => (
                day.dateStr ? (
                  <button
                    key={day.dateStr}
                    onClick={() => !day.isPast && !day.isBooked && setSelectedDate(day.dateStr)}
                    disabled={day.isPast || day.isBooked}
                    className={`
                      p-2 rounded-lg text-sm font-medium transition
                      ${day.isPast 
                        ? 'bg-slate-50 text-slate-300 cursor-not-allowed' 
                        : day.isBooked
                        ? 'bg-red-50 text-red-400 line-through cursor-not-allowed'
                        : selectedDate === day.dateStr
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                      }
                    `}
                  >
                    {day.date.getDate()}
                  </button>
                ) : (
                  <div key={`empty-${index}`} className="p-2"></div>
                )
              ))}
            </div>
          </div>

          {/* Saat Seçimi */}
          {selectedDate && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Saat Seçin
              </label>
              {loadingSlots ? (
                <div className="text-center py-4 text-slate-500">Yükleniyor...</div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((time) => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`
                        px-4 py-2 rounded-lg text-sm font-medium transition
                        ${selectedTime === time
                          ? 'bg-slate-900 text-white'
                          : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                        }
                      `}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-slate-500">
                  Bu tarihte müsait saat bulunmuyor
                </div>
              )}
            </div>
          )}

          {/* Randevu Al Butonu */}
          {selectedDate && selectedTime && (
            <button
              onClick={handleBook}
              disabled={loading}
              className="w-full bg-slate-900 text-white py-3 rounded-lg font-semibold hover:bg-slate-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? "İşleniyor..." : "Randevu Al"}
            </button>
          )}
        </>
      )}
    </div>
  );
}

