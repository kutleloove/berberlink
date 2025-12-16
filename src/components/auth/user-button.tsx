"use client";

import { LogOut, User } from "lucide-react";
import { logout } from "@/actions/auth";
import { useState } from "react";

export function UserButton() {
    const [open, setOpen] = useState(false);

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 transition-colors"
            >
                <User className="w-5 h-5 text-slate-600" />
            </button>

            {open && (
                <div className="absolute right-0 top-12 w-48 bg-white rounded-lg shadow-lg border border-slate-100 py-1 overflow-hidden z-50">
                    <div className="px-4 py-2 border-b border-slate-50 text-xs text-slate-500 font-medium">
                        Account
                    </div>
                    <button
                        onClick={() => logout()}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-slate-50 flex items-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                    </button>
                </div>
            )}
        </div>
    )
}
