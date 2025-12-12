"use client";

import { Staff } from "@prisma/client";
import { StaffRole, Service } from "@prisma/client";
import { Trash2, Edit, UserCheck, UserX } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteStaff } from "@/actions/staff";

interface StaffListProps {
  staffList: (Staff & {
    role: StaffRole | null;
    serviceAssignments: {
      service: Service;
    }[];
  })[];
  roles: StaffRole[];
  services: Service[];
}

export function StaffList({ staffList, roles, services }: StaffListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu personeli silmek istediğinize emin misiniz?")) return;
    
    setDeletingId(id);
    const result = await deleteStaff(id);
    setDeletingId(null);
    
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
  };

  if (staffList.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <p className="text-slate-500 mb-4">Henüz personel eklenmemiş.</p>
        <Link
          href="/barber/staff/new"
          className="inline-block bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
        >
          İlk Personeli Ekle
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Personel</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Rol</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Hizmetler</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Durum</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {staffList.map((staff) => (
              <tr key={staff.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-medium text-slate-900">{staff.name}</div>
                    {staff.email && (
                      <div className="text-sm text-slate-500">{staff.email}</div>
                    )}
                    {staff.phone && (
                      <div className="text-sm text-slate-500">{staff.phone}</div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {staff.role ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {staff.role.name}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400">Rol yok</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {staff.serviceAssignments.length > 0 ? (
                      staff.serviceAssignments.map((sa) => (
                        <span
                          key={sa.service.id}
                          className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700"
                        >
                          {sa.service.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-sm text-slate-400">Hizmet atanmamış</span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {staff.isActive ? (
                    <span className="inline-flex items-center gap-1 text-green-600">
                      <UserCheck size={16} />
                      <span className="text-sm font-medium">Aktif</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-red-600">
                      <UserX size={16} />
                      <span className="text-sm font-medium">Pasif</span>
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/barber/staff/${staff.id}/edit`}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(staff.id)}
                      disabled={deletingId === staff.id}
                      className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

