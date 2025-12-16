"use client";

import { useState } from "react";
import { MessageSquare, AlertCircle } from "lucide-react";

// Mock types since we might expand this later
interface Ticket {
    id: string;
    subject: string;
    status: string;
    priority: string;
    user: {
        name: string | null;
        email: string;
    };
    createdAt: Date;
}

export function SupportTicketList({ tickets }: { tickets: Ticket[] }) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Konu</th>
                            <th className="px-6 py-4 font-semibold">Gönderen</th>
                            <th className="px-6 py-4 font-semibold">Öncelik</th>
                            <th className="px-6 py-4 font-semibold">Durum</th>
                            <th className="px-6 py-4 font-semibold">Tarih</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {tickets.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                                    Henüz bir destek talebi bulunmuyor.
                                </td>
                            </tr>
                        ) : (
                            tickets.map((ticket) => (
                                <tr key={ticket.id} className="hover:bg-slate-50 transition cursor-pointer">
                                    <td className="px-6 py-4">
                                        <div className="font-medium text-slate-900">{ticket.subject}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-slate-900">{ticket.user.name}</div>
                                        <div className="text-xs text-slate-500">{ticket.user.email}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium 
                      ${ticket.priority === 'HIGH' || ticket.priority === 'URGENT' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-700'}`}>
                                            {ticket.priority}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium 
                      ${ticket.status === 'OPEN' ? 'bg-blue-50 text-blue-700' : 'bg-green-50 text-green-700'}`}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-slate-600">
                                        {new Date(ticket.createdAt).toLocaleDateString('tr-TR')}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
