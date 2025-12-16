"use client";

import { Map, Marker, NavigationControl, GeolocateControl, MapRef } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import maplibregl from "maplibre-gl";
import { useEffect, useState, useRef, useMemo } from "react";
import { MapPin } from "lucide-react";

export default function MapPicker({
  position,
  onPositionChange
}: {
  position: [number, number] | null,
  onPositionChange: (pos: [number, number]) => void
}) {
  // Varsayılan: İstanbul
  const defaultCenter: [number, number] = [41.0082, 28.9784];
  const mapRef = useRef<MapRef>(null);

  const initialViewState = useMemo(() => ({
    longitude: position ? position[1] : defaultCenter[1],
    latitude: position ? position[0] : defaultCenter[0],
    zoom: 13
  }), []); // Sadece ilk yüklemede

  // Harita Stili (FullScreenMap ile aynı)
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

  // Haritaya tıklanınca
  const handleClick = (event: maplibregl.MapMouseEvent) => {
    const { lng, lat } = event.lngLat;
    onPositionChange([lat, lng]);
  };

  // Eğer dışarıdan position değişirse haritayı oraya uçur
  useEffect(() => {
    if (position && mapRef.current) {
      mapRef.current.flyTo({
        center: [position[1], position[0]],
        zoom: 15, // Biraz daha detaylı zoom
        essential: true
      });
    }
  }, [position]);

  return (
    <div className="relative w-full h-[400px] rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
      <Map
        ref={mapRef}
        initialViewState={initialViewState}
        style={{ width: "100%", height: "100%" }}
        mapStyle={mapStyle as any}
        onClick={handleClick}
        cursor="crosshair"
      >
        <NavigationControl position="bottom-right" />
        <GeolocateControl
          position="top-right"
          trackUserLocation={true}
          positionOptions={{ enableHighAccuracy: true }}
        />

        {position && (
          <Marker
            longitude={position[1]}
            latitude={position[0]}
            anchor="bottom"
            draggable
            onDragEnd={(e) => {
              const { lng, lat } = e.lngLat;
              onPositionChange([lat, lng]);
            }}
          >
            <div className="relative">
              <MapPin size={48} className="text-red-600 fill-white drop-shadow-md" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full" />
            </div>
          </Marker>
        )}
      </Map>

      {/* Helper Text Overlay */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-xs font-medium text-slate-700 shadow-sm z-10 border border-slate-200">
        Dükkanınızın tam yerini haritada işaretleyin
      </div>
    </div>
  );
}
