"use client";

import { createStaffRole, updateStaffRole } from "@/actions/staff-role";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface StaffRoleFormProps {
  role?: {
    id: string;
    name: string;
    description: string | null;
    canCreateAppointments: boolean;
    canEditAppointments: boolean;
    canManageMessages: boolean;
    canUpdateProfile: boolean;
    canManageStaff: boolean;
  };
}

export function StaffRoleForm({ role }: StaffRoleFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isEdit = !!role;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = isEdit
      ? await updateStaffRole(role.id, formData)
      : await createStaffRole(formData);

    setLoading(false);

    if (result.success) {
      router.push("/barber/staff/roles");
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Rol Adı *
          </label>
          <input
            type="text"
            name="name"
            required
            defaultValue={role?.name}
            placeholder="Örn: Çırak, Kalfa, Usta"
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Açıklama
          </label>
          <textarea
            name="description"
            defaultValue={role?.description || ""}
            rows={3}
            placeholder="Rol hakkında açıklama..."
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
          />
        </div>

        {/* Yetkiler */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Yetkiler</h2>
          <div className="space-y-3">
            {[
              { key: "canCreateAppointments", label: "Randevu Oluşturma" },
              { key: "canEditAppointments", label: "Randevu Düzenleme" },
              { key: "canManageMessages", label: "Mesaj Yönetimi" },
              { key: "canUpdateProfile", label: "Profil Güncelleme" },
              { key: "canManageStaff", label: "Personel Yönetimi" },
            ].map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={role?.[key as keyof typeof role] as boolean}
                  className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                />
                <span className="text-sm text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Link
            href="/barber/staff/roles"
            className="px-4 py-2 text-slate-700 hover:text-slate-900 font-medium"
          >
            İptal
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex items-center gap-2 bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {isEdit ? "Güncelle" : "Kaydet"}
          </button>
        </div>
      </form>
    </div>
  );
}

