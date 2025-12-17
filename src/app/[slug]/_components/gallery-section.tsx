"use client";

import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";
import { Lightbox } from "@/components/ui/lightbox";

interface GallerySectionProps {
    photos: string[];
    shopName: string;
}

export function GallerySection({ photos, shopName }: GallerySectionProps) {
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    if (!photos || photos.length === 0) return null;

    return (
        <>
            <div className="border-b border-slate-50 pb-6">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ImageIcon size={14} /> Fotoğraflar
                </h3>
                <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                        <div
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden bg-slate-100 border border-slate-200 cursor-pointer hover:opacity-90 transition"
                            onClick={() => {
                                setLightboxIndex(index);
                                setIsLightboxOpen(true);
                            }}
                        >
                            <img src={photo} alt={`${shopName} - Fotoğraf ${index + 1}`} className="w-full h-full object-cover" />
                        </div>
                    ))}
                </div>
            </div>

            <Lightbox
                images={photos}
                isOpen={isLightboxOpen}
                onClose={() => setIsLightboxOpen(false)}
                initialIndex={lightboxIndex}
            />
        </>
    );
}
