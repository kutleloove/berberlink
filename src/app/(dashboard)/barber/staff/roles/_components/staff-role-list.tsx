"use client";

import { StaffRole } from "@prisma/client";
import { Trash2, Edit } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { deleteStaffRole } from "@/actions/staff-role";

interface StaffRoleListProps {
  roles: StaffRole[];
}

export function StaffRoleList({ roles }: StaffRoleListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Bu rolü silmek istediğinize emin misiniz? Bu role sahip personeller etkilenebilir.")) return;
    
    setDeletingId(id);
    const result = await deleteStaffRole(id);
    setDeletingId(null);
    
    if (result.success) {
      window.location.reload();
    } else {
      alert(result.error);
    }
  };

  if (roles.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <p className="text-slate-500 mb-4">Henüz rol eklenmemiş.</p>
        <Link
          href="/barber/staff/roles/new"
          className="inline-block bg-slate-900 text-white px-6 py-2 rounded-lg font-medium hover:bg-slate-800 transition"
        >
          İlk Rolü Ekle
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
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Rol Adı</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Açıklama</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {roles.map((role) => (
              <tr key={role.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-900">{role.name}</div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-slate-600">{role.description || "-"}</div>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/barber/staff/roles/${role.id}/edit`}
                      className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                    >
                      <Edit size={18} />
                    </Link>
                    <button
                      onClick={() => handleDelete(role.id)}
                      disabled={deletingId === role.id}
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


