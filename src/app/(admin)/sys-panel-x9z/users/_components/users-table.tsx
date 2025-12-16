"use client";

import { useState } from "react";
import { EditUserDialog } from "./edit-user-dialog";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { tr } from "date-fns/locale";

interface User {
    id: string;
    name: string | null;
    email: string;
    role: "ADMIN" | "BARBER" | "CUSTOMER";
    createdAt: Date;
    profile?: {
        isActive: boolean;
        subscriptionEndsAt: Date | null;
        shopName: string;
    } | null;
}

export function UsersTable({ users }: { users: User[] }) {
    const [search, setSearch] = useState("");

    const filteredUsers = users.filter(user =>
        user.name?.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase()) ||
        user.profile?.shopName?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="İsim, e-posta veya dükkan ara..."
                    className="pl-9"
                    value={search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
                />
            </div>

            <div className="rounded-md border bg-white">
                <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50 border-b text-slate-500 font-medium">
                        <tr>
                            <th className="px-4 py-3">Kullanıcı / Dükkan</th>
                            <th className="px-4 py-3">Rol</th>
                            <th className="px-4 py-3">Durum</th>
                            <th className="px-4 py-3">Abonelik Bitişi</th>
                            <th className="px-4 py-3 text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredUsers.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-slate-500">Kullanıcı bulunamadı.</td>
                            </tr>
                        ) : (
                            filteredUsers.map(user => (
                                <tr key={user.id} className="border-b last:border-0 hover:bg-slate-50/50">
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-slate-900">{user.name || "İsimsiz"}</div>
                                        <div className="text-slate-500 text-xs">{user.email}</div>
                                        {user.profile?.shopName && (
                                            <div className="text-indigo-600 text-xs font-semibold mt-0.5">{user.profile.shopName}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium 
                                ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                                                user.role === 'BARBER' ? 'bg-blue-100 text-blue-700' :
                                                    'bg-slate-100 text-slate-700'}`}>
                                            {user.role === 'ADMIN' ? 'Yönetici' : user.role === 'BARBER' ? 'Berber' : 'Müşteri'}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        {user.role === 'BARBER' && user.profile ? (
                                            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium border ${user.profile.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${user.profile.isActive ? 'bg-green-600' : 'bg-red-600'}`}></span>
                                                {user.profile.isActive ? 'Aktif' : 'Pasif'}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">
                                        {user.role === 'BARBER' && user.profile?.subscriptionEndsAt ? (
                                            <div className="flex flex-col">
                                                <span>{new Date(user.profile.subscriptionEndsAt).toLocaleDateString('tr-TR')}</span>
                                                <span className="text-xs text-slate-400">
                                                    {formatDistanceToNow(new Date(user.profile.subscriptionEndsAt), { addSuffix: true, locale: tr })}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400 text-xs">-</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <EditUserDialog user={user} />
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
