"use client";

import { User } from "@prisma/client";
import { Calendar, Mail, User as UserIcon } from "lucide-react";
import Link from "next/link";

interface CustomerListProps {
  customers: (User & {
    appointmentsAsCustomer: {
      startTime: Date;
    }[];
  })[];
}

export function CustomerList({ customers }: CustomerListProps) {
  if (customers.length === 0) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200">
        <p className="text-slate-500 mb-4">Henüz müşteri bulunmuyor.</p>
        <p className="text-sm text-slate-400">Müşteriler randevu aldıktan sonra burada görünecek.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Müşteri</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">İletişim</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Son Randevu</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 uppercase">Kayıt Tarihi</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 uppercase">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {customers.map((customer) => (
              <tr key={customer.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {customer.image ? (
                      <img
                        src={customer.image}
                        alt={customer.name || "Müşteri"}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center">
                        <UserIcon size={20} className="text-slate-400" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-slate-900">
                        {customer.name || "İsimsiz Müşteri"}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Mail size={16} />
                    {customer.email}
                  </div>
                </td>
                <td className="px-6 py-4">
                  {customer.appointmentsAsCustomer.length > 0 ? (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Calendar size={16} />
                      {new Date(customer.appointmentsAsCustomer[0].startTime).toLocaleDateString('tr-TR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">Randevu yok</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className="text-sm text-slate-600">
                    {new Date(customer.createdAt).toLocaleDateString('tr-TR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/barber/customers/${customer.id}`}
                    className="text-sm text-slate-600 hover:text-slate-900 font-medium"
                  >
                    Detaylar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

