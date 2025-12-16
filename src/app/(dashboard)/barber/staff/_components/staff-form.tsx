"use client";

import { createStaff, updateStaff } from "@/actions/staff";
import { StaffRole, Service } from "@prisma/client";
import { Loader2, Save } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

interface StaffFormProps {
  roles: StaffRole[];
  services: (Omit<Service, "price"> & { price: number | any })[];
  staff?: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    roleId: string | null;
    isActive: boolean;
    serviceAssignments: { serviceId: string }[];
  };
}

export function StaffForm({ roles, services, staff }: StaffFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const isEdit = !!staff;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);

    const result = isEdit
      ? await updateStaff(staff.id, formData)
      : await createStaff(formData);

    setLoading(false);

    if (result.success) {
      router.push("/barber/staff");
      router.refresh();
    } else {
      alert(result.error);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Temel Bilgiler */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Temel Bilgiler</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Ad Soyad *
              </label>
              <input
                type="text"
                name="name"
                required
                defaultValue={staff?.name}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                E-posta
              </label>
              <input
                type="email"
                name="email"
                defaultValue={staff?.email || ""}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Telefon
              </label>
              <input
                type="tel"
                name="phone"
                defaultValue={staff?.phone || ""}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-slate-700">
                  Rol
                </label>
                <Link
                  href="/barber/staff/roles"
                  className="text-xs text-slate-500 hover:text-slate-900 underline"
                >
                  Rol yönetimi
                </Link>
              </div>
              <select
                name="roleId"
                defaultValue={staff?.roleId || ""}
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:outline-none"
              >
                <option value="">Rol seçin</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {roles.length === 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  Henüz rol eklenmemiş.{" "}
                  <Link
                    href="/barber/staff/roles/new"
                    className="underline hover:text-amber-700"
                  >
                    İlk rolü ekleyin
                  </Link>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Hizmet Atamaları */}
        <div>
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Hizmet Atamaları</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {services.map((service) => (
              <label
                key={service.id}
                className="flex items-center gap-2 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50"
              >
                <input
                  type="checkbox"
                  name="serviceIds"
                  value={service.id}
                  defaultChecked={staff?.serviceAssignments.some(
                    sa => sa.serviceId === service.id
                  )}
                  className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
                />
                <span className="text-sm text-slate-700">{service.name}</span>
              </label>
            ))}
          </div>
          {services.length === 0 && (
            <p className="text-sm text-slate-500">Önce hizmet eklemeniz gerekiyor.</p>
          )}
        </div>


        {/* Durum (Sadece düzenlemede) */}
        {isEdit && (
          <div>
            <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={staff?.isActive}
                className="w-4 h-4 text-slate-900 border-slate-300 rounded focus:ring-slate-900"
              />
              <span className="text-sm font-medium text-slate-700">Aktif</span>
            </label>
          </div>
        )}

        {/* Butonlar */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t">
          <Link
            href="/barber/staff"
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

