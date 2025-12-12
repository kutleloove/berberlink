"use client";

import dynamic from "next/dynamic";

const FullScreenMap = dynamic(() => import("@/components/ui/fullscreen-map"), { 
  ssr: false,
  loading: () => <div className="h-full w-full bg-slate-100 rounded-xl animate-pulse flex items-center justify-center text-slate-400">Harita yükleniyor...</div>
});

interface Barber {
  id: string;
  shopName: string;
  slug: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
}

export default function MiniMap({ barbers }: { barbers: Barber[] }) {
  // İlk berberin konumunu merkez olarak kullan, yoksa İstanbul
  const center: [number, number] = barbers.length > 0 && barbers[0].latitude && barbers[0].longitude
    ? [barbers[0].latitude, barbers[0].longitude]
    : [41.0082, 28.9784]; // İstanbul

  return (
    <div className="h-full w-full">
      <FullScreenMap barbers={barbers} center={center} />
    </div>
  );
}


