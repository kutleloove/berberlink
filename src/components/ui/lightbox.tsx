"use client";

import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface LightboxProps {
    images: string[];
    isOpen: boolean;
    onClose: () => void;
    initialIndex?: number;
}

export function Lightbox({ images, isOpen, onClose, initialIndex = 0 }: LightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex);

    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex);
        }
    }, [isOpen, initialIndex]);

    const handleNext = useCallback(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
    }, [images.length]);

    const handlePrev = useCallback(() => {
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    }, [images.length]);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === "ArrowRight") handleNext();
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "Escape") onClose();
    }, [handleNext, handlePrev, onClose]);

    useEffect(() => {
        if (isOpen) {
            window.addEventListener("keydown", handleKeyDown);
        }
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, handleKeyDown]);

    if (!images.length) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-[95vw] max-h-[95vh] w-full h-full md:w-auto md:h-auto border-none bg-transparent shadow-none p-0 flex items-center justify-center overflow-hidden z-[9999]">
                <div className="relative w-full h-full flex items-center justify-center">

                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 md:-top-12 md:-right-12 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition"
                    >
                        <X size={24} />
                    </button>

                    {/* Navigation */}
                    {images.length > 1 && (
                        <>
                            <button
                                onClick={(e) => { e.stopPropagation(); handlePrev(); }}
                                className="absolute left-2 md:-left-16 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition"
                            >
                                <ChevronLeft size={32} />
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                className="absolute right-2 md:-right-16 top-1/2 -translate-y-1/2 z-50 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full transition"
                            >
                                <ChevronRight size={32} />
                            </button>
                        </>
                    )}

                    {/* Image */}
                    <div
                        className="relative w-full h-full flex items-center justify-center"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={images[currentIndex]}
                            alt={`Gallery Image ${currentIndex + 1}`}
                            className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
                        />
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
                            {currentIndex + 1} / {images.length}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
