"use client";

import { Map, Marker, Popup } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";

const BarberPopup = dynamic(() => import("./barber-popup"), { ssr: false });

interface Barber {
  id: string;
  shopName: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  logoUrl?: string | null;
  averageRating: number | null;
}

export default function FullScreenMap({ 
  barbers, 
  center, 
  selectedBarberId,
  onMarkerClick,
  darkMode = false,
}: { 
  barbers: Barber[], 
  center: [number, number],
  selectedBarberId?: string,
  onMarkerClick?: (barber: Barber) => void,
  darkMode?: boolean,
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(12);
  const [viewState, setViewState] = useState({
    longitude: center[1],
    latitude: center[0],
    zoom: barbers.length === 1 ? 15 : 12,
  });
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Center değiştiğinde viewState'i güncelle
  useEffect(() => {
    setViewState(prev => ({
      ...prev,
      longitude: center[1],
      latitude: center[0],
    }));
  }, [center]);

  // Zoom seviyesine göre marker tipi belirleme
  // Zoom >= 15: Berber ismi (detaylı marker) - çok yakın, sadece birkaç sokak görünürken
  // Zoom < 15: Yer imi (pin şekli) - şehrin tamamı veya mahalle görünürken
  const showDetailedMarkers = currentZoom >= 15;

  const handleMarkerClick = useCallback((barber: Barber) => {
    setSelectedBarber(barber);
    if (onMarkerClick) {
      onMarkerClick(barber);
    }
  }, [onMarkerClick]);

  const handleMoveEnd = useCallback(() => {
    setCurrentZoom(viewState.zoom);
  }, [viewState.zoom]);

  // MapLibre için raster tiles kullanımı
  // Vektör tiles hazır olduğunda bu değiştirilecek
  const mapStyle = useMemo(() => ({
    version: 8,
    sources: {
      "osm-tiles": {
        type: "raster",
        tiles: darkMode
          ? [
              "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
              "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
            ]
          : [
              "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
              "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
            ],
        tileSize: 256,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
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
  }), [darkMode]);

  if (!isMounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-500">
        Harita yükleniyor...
      </div>
    );
  }

  return (
    <Map
      {...viewState}
      onMove={(evt) => {
        setViewState(evt.viewState);
        setCurrentZoom(evt.viewState.zoom);
      }}
      onMoveEnd={handleMoveEnd}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle}
      attributionControl={true}
      minZoom={2}
      maxZoom={19}
    >
      {barbers.map(barber => {
        if (!barber.latitude || !barber.longitude) return null;
        
        const isSelected = selectedBarberId === barber.id;

        // Detaylı marker (yakın zoom)
        if (showDetailedMarkers) {
          return (
            <Marker
              key={barber.id}
              longitude={barber.longitude}
              latitude={barber.latitude}
              anchor="bottom"
            >
              <div
                style={{
                  position: "relative",
                  display: "inline-block",
                  cursor: "pointer",
                }}
                onClick={() => handleMarkerClick(barber)}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 10px",
                    background: isSelected ? "#111827" : "white",
                    color: isSelected ? "white" : "#111827",
                    border: `2px solid ${isSelected ? "#2563eb" : "#e5e7eb"}`,
                    borderRadius: "9999px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "9999px",
                      background: isSelected ? "#2563eb" : "#e5e7eb",
                      color: isSelected ? "white" : "#111827",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {barber.logoUrl ? (
                      <img 
                        src={barber.logoUrl} 
                        alt={barber.shopName || "Berber"} 
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      (barber.shopName?.[0]?.toUpperCase() || "B")
                    )}
                  </span>
                  <span
                    style={{
                      whiteSpace: "nowrap",
                      maxWidth: "180px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {barber.shopName || "Berber"}
                  </span>
                </div>
                {/* Ok işareti (üçgen) - altında konuma işaret etmeli */}
                <div
                  style={{
                    position: "absolute",
                    bottom: "-8px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: 0,
                    height: 0,
                    borderLeft: "8px solid transparent",
                    borderRight: "8px solid transparent",
                    borderTop: `8px solid ${isSelected ? "#111827" : "white"}`,
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                  }}
                />
              </div>
            </Marker>
          );
        }

        // Pin marker (uzak zoom)
        return (
          <Marker
            key={barber.id}
            longitude={barber.longitude}
            latitude={barber.latitude}
            anchor="bottom"
          >
            <div
              style={{
                width: "32px",
                height: "40px",
                position: "relative",
                cursor: "pointer",
                margin: 0,
                padding: 0,
                display: "block",
                boxSizing: "border-box",
              }}
              onClick={() => handleMarkerClick(barber)}
            >
              {/* Pin gövdesi */}
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  background: isSelected ? "#111827" : "white",
                  border: `3px solid ${isSelected ? "#2563eb" : "#dc2626"}`,
                  borderRadius: "50% 50% 50% 0",
                  transform: "rotate(-45deg)",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  margin: 0,
                  padding: 0,
                  boxSizing: "border-box",
                }}
              >
                <div
                  style={{
                    transform: "rotate(45deg)",
                    color: isSelected ? "white" : "#111827",
                    fontSize: "16px",
                    fontWeight: "bold",
                    lineHeight: 1,
                    margin: 0,
                    padding: 0,
                  }}
                >
                  ✂
                </div>
              </div>
              {/* Pin ucu (alt kısım) - tam konuma işaret etmeli */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: "6px solid transparent",
                  borderRight: "6px solid transparent",
                  borderTop: `12px solid ${isSelected ? "#2563eb" : "#dc2626"}`,
                  position: "absolute",
                  bottom: 0,
                  left: "50%",
                  transform: "translateX(-50%)",
                  filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))",
                  margin: 0,
                  padding: 0,
                  boxSizing: "border-box",
                  pointerEvents: "none",
                }}
              />
            </div>
          </Marker>
        );
      })}

      {/* Popup */}
      {selectedBarber && selectedBarber.latitude && selectedBarber.longitude && (
        <Popup
          longitude={selectedBarber.longitude}
          latitude={selectedBarber.latitude}
          anchor="bottom"
          onClose={() => setSelectedBarber(null)}
          closeButton={true}
          closeOnClick={false}
          className="barber-popup"
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <BarberPopup barber={selectedBarber} />
          </div>
        </Popup>
      )}
    </Map>
  );
}
