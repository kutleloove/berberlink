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
            <div className="border-b border-white/5 pb-6">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <ImageIcon size={14} /> Fotoğraflar
                </h3>
                <div className="grid grid-cols-3 gap-2">
                    {photos.map((photo, index) => (
                        <div
                            key={index}
                            className="aspect-square rounded-lg overflow-hidden bg-slate-800 border border-white/5 cursor-pointer hover:opacity-90 hover:ring-2 hover:ring-indigo-500/50 transition duration-300"
                            onClick={() => {
                                setLightboxIndex(index);
                                setIsLightboxOpen(true);
                            }}
                        >
                            <img src={photo} alt={`${shopName} - Fotoğraf ${index + 1}`} className="w-full h-full object-cover transition-transform hover:scale-110 duration-500" />
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
