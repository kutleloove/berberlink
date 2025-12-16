"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateUserStatus } from "@/actions/admin";
import { Loader2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

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

export function EditUserDialog({ user }: { user: User }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [role, setRole] = useState(user.role);
    const [isActive, setIsActive] = useState(user.profile?.isActive ?? true);
    const [subscriptionDate, setSubscriptionDate] = useState(
        user.profile?.subscriptionEndsAt
            ? format(new Date(user.profile.subscriptionEndsAt), "yyyy-MM-dd")
            : ""
    );

    const handleSave = async () => {
        setLoading(true);
        try {
            const result = await updateUserStatus(user.id, {
                role: role,
                isActive: isActive,
                subscriptionEndsAt: subscriptionDate ? new Date(subscriptionDate) : null
            });

            if (result.success) {
                setOpen(false);
                router.refresh();
            } else {
                alert("Güncelleme başarısız.");
            }
        } catch (e) {
            alert("Hata oluştu.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2">
                    <Pencil size={14} /> Düzenle
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Kullanıcı Düzenle: {user.name}</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-4">

                    <div className="space-y-2">
                        <Label>Kullanıcı Rolü</Label>
                        <Select value={role} onValueChange={(v: any) => setRole(v)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="CUSTOMER">Müşteri (Customer)</SelectItem>
                                <SelectItem value="BARBER">Berber (Barber)</SelectItem>
                                <SelectItem value="ADMIN">Yönetici (Admin)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-slate-500">
                            * Berber rolünü alırsanız paneline giremez.
                        </p>
                    </div>

                    {role === "BARBER" && (
                        <>
                            <div className="flex items-center justify-between border p-3 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label>Hesap Durumu</Label>
                                    <p className="text-xs text-slate-500">
                                        Pasif yaparsanız randevu alamaz/veremez
                                    </p>
                                </div>
                                <Switch checked={isActive} onCheckedChange={setIsActive} />
                            </div>

                            <div className="space-y-2">
                                <Label>Abonelik Bitiş Tarihi</Label>
                                <Input
                                    type="date"
                                    value={subscriptionDate}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubscriptionDate(e.target.value)}
                                />
                                <div className="flex gap-2 mt-2">
                                    <Button type="button" variant="outline" size="xs" onClick={() => {
                                        const d = new Date(); // Bugün bitsin (İptal etkisi)
                                        setSubscriptionDate(format(d, "yyyy-MM-dd"));
                                    }}>Sona Erdir</Button>
                                    <Button type="button" variant="outline" size="xs" onClick={() => {
                                        const d = new Date();
                                        d.setMonth(d.getMonth() + 1);
                                        setSubscriptionDate(format(d, "yyyy-MM-dd"));
                                    }}>+1 Ay</Button>
                                    <Button type="button" variant="outline" size="xs" onClick={() => {
                                        const d = new Date();
                                        d.setFullYear(d.getFullYear() + 1);
                                        setSubscriptionDate(format(d, "yyyy-MM-dd"));
                                    }}>+1 Yıl</Button>
                                </div>
                            </div>
                        </>
                    )}

                </div>

                <div className="flex justify-end gap-2">
                    <Button variant="ghost" onClick={() => setOpen(false)}>İptal</Button>
                    <Button onClick={handleSave} disabled={loading}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Kaydet
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
