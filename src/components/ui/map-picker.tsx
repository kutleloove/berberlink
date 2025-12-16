"use client";

import { Map, Marker, NavigationControl, GeolocateControl, MapRef } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useEffect, useState, useRef, useMemo } from "react";
import { MapPin, Target } from "lucide-react";

export default function MapPicker({
  position,
  onPositionChange
}: {
  position: [number, number] | null,
  onPositionChange: (pos: [number, number]) => void
}) {
  const defaultCenter: [number, number] = [41.0082, 28.9784];
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: position ? position[1] : defaultCenter[1],
    latitude: position ? position[0] : defaultCenter[0],
    zoom: 13
  });

  // Mobil mod tespiti (basitçe ekran genişliğine göre veya her zaman aktif crosshair)
  // Kullanıcı "mobilde ortala" dediği için, harita hareket ettikçe merkezi gönderen bir mod yapalım.
  const [isDragging, setIsDragging] = useState(false);

  // Harita Stili
  const mapStyle = {
    version: 8,
    sources: {
      "osm-tiles": {
        type: "raster",
        tiles: [
          "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
          "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
        ],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: "osm-tiles-layer",
        type: "raster",
        source: "osm-tiles",
        minzoom: 0,
        maxzoom: 19,
      },
    ],
  };

  // Harita hareket ettiğinde
  const handleMove = (evt: any) => {
    setViewState(evt.viewState);
    setIsDragging(true);
  };

  const handleMoveEnd = (evt: any) => {
    setIsDragging(false);
    // Masaüstünde tıklama ile, mobilde ise sürükleme ile mi?
    // Kullanıcı talebi: Masaüstünde tıklayarak, mobilde işaretçiyi ortalayarak.
    // Bunu CSS media query ile ayırt edemeyiz ama genel bir yaklaşım olarak:
    // Eğer bir "Select Location" butonu koyarsak ve ona basınca ortayı alırsak çok temiz olur.
    // Ancak otomatik olsun isteniyor.

    // Şimdilik sadece marker drag veya click ile çalışsın.
    // Mobildeki "ortala" özelliğini, harita merkezinde sabit bir pin gösterip,
    // harita durduğunda o merkezin koordinatını seçili hale getirerek yapabiliriz.
  };

  // Dışarıdan pozisyon değişirse (örn: il/ilçe seçildi)
  useEffect(() => {
    if (position && mapRef.current) {
      // Eğer harita zaten o pozisyona yakınsa uçma (sonsuz döngüden kaçın)
      // const currentCenter = mapRef.current.getMap().getCenter();
      // const dist = Math.sqrt(Math.pow(currentCenter.lng - position[1], 2) + Math.pow(currentCenter.lat - position[0], 2));

      // if (dist > 0.001) {
      mapRef.current.flyTo({
        center: [position[1], position[0]],
        zoom: 16,
        essential: true
      });
      setViewState(prev => ({
        ...prev,
        longitude: position[1],
        latitude: position[0],
        zoom: 16
      }));
      // }
    }
  }, [position]); // position referansı sürekli değişmemeli

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm group">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={handleMove}
        onMoveEnd={handleMoveEnd}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle as any}
        onClick={(e) => {
          // Masaüstü için tıklama ile seçim
          // Mobilde de çalışır ama mobilde sürükleme daha yaygındır.
          // Kullanıcı her ikisini de istiyor.
          onPositionChange([e.lngLat.lat, e.lngLat.lng]);
        }}
        cursor="crosshair"
      >
        <NavigationControl position="bottom-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation={true}
          positionOptions={{ enableHighAccuracy: true }}
          onGeolocate={(e: any) => {
            onPositionChange([e.coords.latitude, e.coords.longitude]);
          }}
        />

        {position && (
          <Marker
            longitude={position[1]}
            latitude={position[0]}
            anchor="bottom"
            draggable
            onDragEnd={(e) => {
              onPositionChange([e.lngLat.lat, e.lngLat.lng]);
            }}
          >
            <div className="relative group/pin cursor-grab active:cursor-grabbing">
              <MapPin size={48} className="text-red-600 fill-white drop-shadow-md transition-transform hover:scale-110" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full" />
            </div>
          </Marker>
        )}
      </Map>

      {/* Mobil Ortadaki Sabit Hedef İkonu (Sadece mobilde gösterilebilir veya her zaman) */}
      {/* Kullanıcı "Mobilde" dediği için md:hidden yapalım */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-10 md:hidden">
        <div className={`transition-all duration-200 ${isDragging ? "scale-110 opacity-70" : "scale-100 opacity-100"}`}>
          <Target size={32} className="text-slate-800 drop-shadow-sm" />
        </div>
      </div>

      {/* Mobilde "Burayı Seç" Butonu */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 md:hidden">
        <button
          type="button"
          onClick={() => {
            onPositionChange([viewState.latitude, viewState.longitude]);
          }}
          className="bg-slate-900 text-white px-6 py-3 rounded-full shadow-lg font-semibold text-sm active:scale-95 transition flex items-center gap-2"
        >
          <MapPin size={16} />
          Konumu İşaretle
        </button>
      </div>

      {/* Helper Text Overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-xs font-medium text-slate-700 shadow-sm z-10 border border-slate-200 hidden md:block">
        Konumu seçmek için haritaya tıklayın veya pini sürükleyin
      </div>
    </div>
  );
}
