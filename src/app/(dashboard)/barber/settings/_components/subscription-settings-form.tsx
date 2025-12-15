"use client";

import { saveSubscriptionSettings } from "@/actions/subscription-settings";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface SubscriptionSettingsFormProps {
  allowSubscriptionAppointments: boolean;
  allowedRecurrenceTypes: string[] | null;
  allowTimeChanges: boolean;
}

export function SubscriptionSettingsForm({
  allowSubscriptionAppointments: initialAllow,
  allowedRecurrenceTypes: initialTypes,
  allowTimeChanges: initialAllowTimeChanges,
}: SubscriptionSettingsFormProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const [allowSubscriptionAppointments, setAllowSubscriptionAppointments] = useState(initialAllow);
  const [allowedRecurrenceTypes, setAllowedRecurrenceTypes] = useState<string[]>(
    initialTypes || []
  );
  const [allowTimeChanges, setAllowTimeChanges] = useState(initialAllowTimeChanges);

  const toggleRecurrenceType = (type: string) => {
    setAllowedRecurrenceTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    const formData = new FormData(event.currentTarget);
    
    const result = await saveSubscriptionSettings(formData);
    setLoading(false);
    
    if (result.success) {
      alert("Abonelik ayarları güncellendi.");
      router.refresh();
    } else {
      alert(result.error || "Bir hata oluştu.");
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Abonelik Randevularına İzin Ver */}
      <div className="flex items-center justify-between p-4 border rounded-xl bg-white">
        <div>
          <label className="text-sm font-semibold text-slate-900 block mb-1">
            Abonelik Randevularına İzin Ver
          </label>
          <p className="text-xs text-slate-500">
            Müşterilerin tekrarlayan randevu almasına izin ver
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            name="allowSubscriptionAppointments"
            checked={allowSubscriptionAppointments}
            onChange={(e) => setAllowSubscriptionAppointments(e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
        </label>
      </div>

      {/* Tekrar Türleri */}
      {allowSubscriptionAppointments && (
        <div className="p-4 border rounded-xl bg-white">
          <label className="text-sm font-semibold text-slate-900 block mb-3">
            İzin Verilen Tekrar Türleri
          </label>
          <div className="space-y-2">
            {["DAILY", "WEEKLY", "MONTHLY"].map((type) => {
              const labels: Record<string, string> = {
                DAILY: "Günlük Tekrar Edenler",
                WEEKLY: "Haftalık Tekrar Edenler",
                MONTHLY: "Aylık Tekrar Edenler",
              };
              return (
                <label
                  key={type}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    name={`recurrenceType-${type}`}
                    checked={allowedRecurrenceTypes.includes(type)}
                    onChange={() => toggleRecurrenceType(type)}
                    className="w-4 h-4 rounded border-slate-300 text-slate-900 focus:ring-2 focus:ring-slate-900"
                  />
                  <span className="text-sm font-medium text-slate-700">
                    {labels[type]}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Randevu Saatini Değiştirmeye İzin Ver */}
      {allowSubscriptionAppointments && (
        <div className="flex items-center justify-between p-4 border rounded-xl bg-white">
          <div>
            <label className="text-sm font-semibold text-slate-900 block mb-1">
              Randevu Saatini Değiştirmeye İzin Ver
            </label>
            <p className="text-xs text-slate-500">
              Müşterilerin abonelik randevularının saatini değiştirmesine izin ver
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              name="allowTimeChanges"
              checked={allowTimeChanges}
              onChange={(e) => setAllowTimeChanges(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-slate-900 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-slate-900"></div>
          </label>
        </div>
      )}

      <div className="pt-4 border-t">
        <button
          type="submit"
          disabled={loading}
          className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-8 py-3 rounded-xl font-bold text-base hover:from-slate-800 hover:to-slate-700 transition-all duration-200 flex items-center gap-2.5 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading && <Loader2 className="animate-spin" size={18} />}
          <span>Kaydet</span>
        </button>
      </div>
    </form>
  );
}


