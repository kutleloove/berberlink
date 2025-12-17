"use client";

import { useState, useRef } from "react";
import { X, Image as ImageIcon, Plus, Loader2, UploadCloud, Trash2, GripVertical, AlertCircle } from "lucide-react";
import { updateBarberPhotos, updateBarberLogo } from "@/actions/barber";
import { useRouter } from "next/navigation";

interface PhotoUploadProps {
    initialPhotos?: string[];
    initialLogo?: string | null;
    slug: string;
}

export function PhotoUpload({ initialPhotos = [], initialLogo = null, slug }: PhotoUploadProps) {
    const router = useRouter();
    const [photos, setPhotos] = useState<string[]>(initialPhotos);
    const [logo, setLogo] = useState<string | null>(initialLogo);

    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const [isUploadingLogo, setIsUploadingLogo] = useState(false);

    const [error, setError] = useState("");

    // Refs
    const photoInputRef = useRef<HTMLInputElement>(null);
    const logoInputRef = useRef<HTMLInputElement>(null);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);

    // --- LOGO UPLOAD LOGIC ---
    const handleLogoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await handleLogoUpload(e.target.files[0]);
        }
    };

    const handleLogoUpload = async (file: File) => {
        if (!validateFile(file)) return;

        setIsUploadingLogo(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("slug", slug);

            const response = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Logo yüklenemedi");

            setLogo(data.url);
            await updateBarberLogo(data.url);
            router.refresh();
        } catch (err: any) {
            setError(err.message || "Logo yüklenirken hata oluştu.");
        } finally {
            setIsUploadingLogo(false);
        }
    };

    const handleRemoveLogo = async () => {
        if (!logo) return;
        const oldLogo = logo;
        setLogo(null); // Optimistic

        try {
            await updateBarberLogo(null);
            // Optionally delete file from server
            await fetch("/api/upload", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: oldLogo }),
            });
            router.refresh();
        } catch (err) {
            console.error(err);
            setLogo(oldLogo); // Revert
            setError("Logo silinirken hata oluştu.");
        }
    };

    // --- PHOTO GALLERY LOGIC ---
    const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            await handlePhotoUpload(e.target.files[0]);
        }
    };

    const handleDropPhoto = async (e: React.DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            await handlePhotoUpload(e.dataTransfer.files[0]);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const handlePhotoUpload = async (file: File) => {
        if (photos.length >= 6) {
            setError("En fazla 6 fotoğraf.");
            return;
        }
        if (!validateFile(file)) return;

        setIsUploadingPhoto(true);
        setError("");

        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("slug", slug);

            const response = await fetch("/api/upload", { method: "POST", body: formData });
            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Fotoğraf yüklenemedi");

            const newPhotos = [...photos, data.url];
            setPhotos(newPhotos);
            await updateBarberPhotos(newPhotos);
            router.refresh();

        } catch (err: any) {
            setError(err.message || "Yükleme hatası.");
        } finally {
            setIsUploadingPhoto(false);
        }
    };

    const handleRemovePhoto = async (index: number) => {
        const photoUrl = photos[index];
        const newPhotos = [...photos];
        newPhotos.splice(index, 1);
        setPhotos(newPhotos); // Optimistic

        try {
            await updateBarberPhotos(newPhotos);
            await fetch("/api/upload", {
                method: "DELETE",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ url: photoUrl }),
            });
            router.refresh();
        } catch (err) {
            console.error(err);
            setError("Fotoğraf silinemedi.");
        }
    };

    // --- REORDERING LOGIC (Native DnD) ---
    const handleSortStart = (e: React.DragEvent, position: number) => {
        dragItem.current = position;
        // Effect for drag ghost if needed
    };

    const handleSortEnter = (e: React.DragEvent, position: number) => {
        dragOverItem.current = position;
    };

    const handleSortEnd = async (e: React.DragEvent) => {
        if (dragItem.current === null || dragOverItem.current === null) return;

        const copyListItems = [...photos];
        const dragItemContent = copyListItems[dragItem.current];

        copyListItems.splice(dragItem.current, 1);
        copyListItems.splice(dragOverItem.current, 0, dragItemContent);

        dragItem.current = null;
        dragOverItem.current = null;

        setPhotos(copyListItems);

        try {
            await updateBarberPhotos(copyListItems);
            router.refresh();
        } catch (err) {
            setError("Sıralama kaydedilemedi.");
        }
    };


    const validateFile = (file: File) => {
        if (!file.type.startsWith("image/")) {
            setError("Geçerli bir resim seçin.");
            return false;
        }
        if (file.size > 5 * 1024 * 1024) {
            setError("Dosya 5MB'dan küçük olmalı.");
            return false;
        }
        return true;
    };

    return (
        <div className="space-y-8">
            {/* LOGO SECTION */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-dashed border-slate-200">
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <ImageIcon size={16} /> İşletme Logosu
                </h3>

                <div className="flex items-center gap-4">
                    {logo ? (
                        <div className="relative group w-24 h-24 rounded-full border-2 border-white shadow-md overflow-hidden bg-white">
                            <img src={logo} alt="Logo" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                    onClick={handleRemoveLogo}
                                    className="p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 gap-1 hover:bg-slate-50 transition cursor-pointer" onClick={() => logoInputRef.current?.click()}>
                            {isUploadingLogo ? <Loader2 className="animate-spin" size={20} /> : <UploadCloud size={20} />}
                            <span className="text-[10px] font-medium">Yükle</span>
                        </div>
                    )}

                    <div className="flex-1">
                        <p className="text-sm text-slate-600 mb-2">
                            İşletmenizin logosunu yükleyin. Bu logo harita işaretçilerinde ve profilinizde görünecektir.
                        </p>
                        {!logo && (
                            <button
                                onClick={() => logoInputRef.current?.click()}
                                disabled={isUploadingLogo}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 transition"
                            >
                                {isUploadingLogo ? "Yükleniyor..." : "Logo Seç"}
                            </button>
                        )}
                        <input
                            ref={logoInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleLogoSelect}
                        />
                    </div>
                </div>
            </div>

            {/* GALLERY SECTION */}
            <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                    <GripVertical size={16} /> Galeri (Sürükleyip Sıralayabilirsiniz)
                </h3>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {photos.map((photo, index) => (
                        <div
                            key={index}
                            draggable
                            onDragStart={(e) => handleSortStart(e, index)}
                            onDragEnter={(e) => handleSortEnter(e, index)}
                            onDragEnd={handleSortEnd}
                            onDragOver={(e) => e.preventDefault()}
                            className="relative group aspect-square rounded-xl overflow-hidden border border-slate-200 bg-slate-50 shadow-sm transition hover:shadow-md cursor-grab active:cursor-grabbing"
                        >
                            <img src={photo} alt={`Fotoğraf ${index + 1}`} className="w-full h-full object-cover pointer-events-none" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                <button
                                    onClick={() => handleRemovePhoto(index)}
                                    className="p-2.5 bg-red-500/80 text-white rounded-full hover:bg-red-600 transition backdrop-blur-sm"
                                    title="Fotoğrafı Sil"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                            <div className="absolute top-2 left-2 bg-black/30 text-white p-1 rounded backdrop-blur-sm opacity-0 group-hover:opacity-100 transition">
                                <GripVertical size={14} />
                            </div>
                        </div>
                    ))}

                    {photos.length < 6 && (
                        <div
                            onClick={() => photoInputRef.current?.click()}
                            onDrop={handleDropPhoto}
                            onDragOver={handleDragOver}
                            className={`aspect-square rounded-xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 gap-3 text-center group
                            ${isUploadingPhoto ? 'bg-slate-50 border-slate-300 opacity-50 pointer-events-none' : 'bg-slate-50/50 border-slate-300 hover:border-indigo-500 hover:bg-indigo-50/10'}
                            `}
                        >
                            <input
                                type="file"
                                ref={photoInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handlePhotoSelect}
                                disabled={isUploadingPhoto}
                            />

                            {isUploadingPhoto ? (
                                <>
                                    <Loader2 size={24} className="animate-spin text-indigo-600" />
                                    <span className="text-xs font-medium text-slate-500">Yükleniyor...</span>
                                </>
                            ) : (
                                <>
                                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
                                        <Plus size={20} />
                                    </div>
                                    <div>
                                        <span className="text-sm font-semibold text-slate-700 block mb-1">Fotoğraf Ekle</span>
                                        <span className="text-[10px] text-slate-400 px-2 leading-tight block">Tıkla veya buraya sürükle</span>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {error && (
                <div className="text-sm text-red-500 bg-red-50/50 border border-red-100 p-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={16} className="text-red-600" />
                    {error}
                </div>
            )}
        </div>
    );
}

