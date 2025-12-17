"use client";

import { Map, Marker, Popup } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import dynamic from "next/dynamic";
import type { MapRef } from "@vis.gl/react-maplibre";
import { Star } from "lucide-react";

const BarberPopup = dynamic(() => import("./barber-popup"), { ssr: false });

interface Service {
  id: string;
  name: string;
  duration: number;
  price: string;
}

interface Barber {
  id: string;
  shopName: string;
  slug: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  logoUrl?: string | null;
  averageRating: number | null;
  isFavorite?: boolean;
  isActive?: boolean;
  services?: Service[];
  photos?: string[];
}

export default function FullScreenMap({
  barbers,
  center,
  selectedBarberId,
  onMarkerClick,
  onBookAppointment,
  darkMode = false,
  userLocation,
}: {
  barbers: Barber[],
  center: [number, number],
  selectedBarberId?: string,
  onMarkerClick?: (barber: Barber) => void,
  onBookAppointment?: (barber: Barber) => void,
  darkMode?: boolean,
  userLocation?: [number, number],
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(12);
  const mapRef = useRef<MapRef>(null);
  const [viewState, setViewState] = useState({
    longitude: center[1],
    latitude: center[0],
    zoom: barbers.length === 1 ? 15 : 12,
  });
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Center değiştiğinde viewState'i güncelle (sadece ilk yüklemede veya center prop değiştiğinde)
  // Popup kapatıldığında viewState'i değiştirme - harita olduğu yerde kalsın
  // Kullanıcı manuel hareket ettirdiğinde viewState'i override etme
  const prevCenterRef = useRef<[number, number]>(center);
  const prevSelectedBarberIdRef = useRef<string | undefined>(selectedBarberId);

  useEffect(() => {
    // Popup açıkken center değişikliklerini ignore et
    if (selectedBarber) {
      return;
    }

    // Center prop'u gerçekten değişti mi kontrol et
    const centerChanged =
      Math.abs(prevCenterRef.current[1] - center[1]) > 0.0001 ||
      Math.abs(prevCenterRef.current[0] - center[0]) > 0.0001;

    if (centerChanged) {
      // Center prop'u değişti, viewState'i güncelle
      prevCenterRef.current = center;
      setViewState(prev => ({
        ...prev,
        longitude: center[1],
        latitude: center[0],
      }));
    }
  }, [center, selectedBarber]);

  // selectedBarberId değiştiğinde (sidebar'dan seçildiğinde) haritayı o konuma kaydır
  useEffect(() => {
    if (selectedBarberId && selectedBarberId !== prevSelectedBarberIdRef.current && mapRef.current && !selectedBarber) {
      const barber = barbers.find(b => b.id === selectedBarberId);
      if (barber && barber.latitude && barber.longitude) {
        const map = mapRef.current.getMap();
        if (map) {
          map.flyTo({
            center: [barber.longitude, barber.latitude],
            duration: 500,
            essential: true,
          });
        }
      }
      prevSelectedBarberIdRef.current = selectedBarberId;
    } else if (!selectedBarberId) {
      prevSelectedBarberIdRef.current = undefined;
    }
  }, [selectedBarberId, barbers, selectedBarber]);

  // Popup açıldığında haritayı kaydır - popup görünür olsun
  useEffect(() => {
    if (selectedBarber && selectedBarber.latitude && selectedBarber.longitude && mapRef.current) {
      const map = mapRef.current.getMap();
      if (map) {
        // Popup'ın gerçek boyutlarını DOM'dan al (eğer render edilmişse)
        // Yoksa varsayılan değerleri kullan
        const popupElement = document.querySelector('.maplibregl-popup-content') as HTMLElement;
        const popupWidth = popupElement ? popupElement.offsetWidth : 300;
        const popupHeight = popupElement ? popupElement.offsetHeight : 350;
        const padding = 20; // Ekran kenarlarından boşluk
        const markerHeight = 40; // Marker yüksekliği

        // Marker'ın mevcut ekrandaki piksel konumunu hesapla
        const markerPoint = map.project([selectedBarber.longitude!, selectedBarber.latitude!]);
        const mapContainer = map.getContainer();
        const mapWidth = mapContainer.clientWidth;
        const mapHeight = mapContainer.clientHeight;

        // Offset hesapla: popup'ın ekranın dışına taşmaması için
        let offsetX = 0;
        let offsetY = 0;

        // X ekseni: Popup'ın sağ/sol kenarlardan taşmaması için
        // Popup anchor="bottom" olduğu için marker'ın tam üstünde ortalanmış olacak
        const popupLeftX = markerPoint.x - popupWidth / 2;
        const popupRightX = markerPoint.x + popupWidth / 2;

        if (popupRightX + padding > mapWidth) {
          // Sağ kenardan taşıyorsa, sola kaydır
          offsetX = -(popupRightX + padding - mapWidth);
        } else if (popupLeftX - padding < 0) {
          // Sol kenardan taşıyorsa, sağa kaydır
          offsetX = padding - popupLeftX;
        }

        // Y ekseni: Popup marker'ın üstünde görünecek (anchor="bottom")
        // Popup'ın tamamen görünür olması için marker'ın yukarısına popup yüksekliği + padding ekle
        const popupTopY = markerPoint.y - popupHeight - padding;
        const popupBottomY = markerPoint.y; // Marker'ın konumu popup'ın alt kenarı

        if (popupTopY < 0) {
          // Üst kenardan taşıyorsa, aşağı kaydır (popup'ı ekran içinde tut)
          offsetY = -popupTopY + padding;
        } else if (popupBottomY > mapHeight) {
          // Alt kenardan taşıyorsa, yukarı kaydır
          offsetY = mapHeight - popupBottomY - padding;
        } else {
          // Normal durum: popup marker'ın üstünde, ekranda görünür
          // Marker'ın üstünde popup için biraz aşağı kaydır (popup'ın tam görünmesi için)
          offsetY = -(popupHeight / 2 + markerHeight / 2 + padding);
        }

        const timeoutId = setTimeout(() => {
          map.flyTo({
            center: [selectedBarber.longitude!, selectedBarber.latitude!],
            offset: [offsetX, offsetY],
            duration: 500,
            essential: true,
          });
        }, 150); // Popup'ın render edilmesi için biraz daha fazla bekle

        return () => clearTimeout(timeoutId);
      }
    }
  }, [selectedBarber]);

  // Zoom seviyesine göre marker tipi belirleme
  const showDetailedMarkers = currentZoom >= 15;

  const handleMarkerClick = useCallback((barber: Barber) => {
    setSelectedBarber(barber);
    if (onMarkerClick) {
      onMarkerClick(barber);
    }
  }, [onMarkerClick]);

  const handleBookAppointment = useCallback((barber: Barber) => {
    setSelectedBarber(null);
    if (onBookAppointment) {
      onBookAppointment(barber);
    }
  }, [onBookAppointment]);

  const handleMoveEnd = useCallback(() => {
    setCurrentZoom(viewState.zoom);
  }, [viewState.zoom]);

  // Harita stil yapılandırması
  // Raster tiles kullanıyoruz (OpenStreetMap veya CartoDB)
  const mapStyle = useMemo(() => {
    if (typeof window !== 'undefined') {
      // Yerel vektör tiles (şimdilik kullanılmıyor)
      // Shortbread schema (mbtiles-server) - Geofabrik'ten indirilen dosya için
      if (process.env.NEXT_PUBLIC_MBTILES_SERVER_URL) {
        return {
          version: 8,
          name: "Shortbread",
          sources: {
            "shortbread": {
              type: "vector",
              tiles: [`${process.env.NEXT_PUBLIC_MBTILES_SERVER_URL}/{z}/{x}/{y}.pbf`],
              minzoom: 0,
              maxzoom: 14,
            },
          },
          layers: [
            {
              id: "background",
              type: "background",
              paint: { "background-color": darkMode ? "#1a1a1a" : "#f8f9fa" },
            },
            {
              id: "water",
              type: "fill",
              source: "shortbread",
              "source-layer": "water",
              paint: { "fill-color": darkMode ? "#2a4a6a" : "#aadaff" },
            },
            {
              id: "landcover",
              type: "fill",
              source: "shortbread",
              "source-layer": "landcover",
              paint: { "fill-color": darkMode ? "#2a2a2a" : "#e8e8e8" },
            },
            {
              id: "landuse",
              type: "fill",
              source: "shortbread",
              "source-layer": "landuse",
              paint: { "fill-color": darkMode ? "#2a2a2a" : "#f0f0f0" },
            },
            {
              id: "roads",
              type: "line",
              source: "shortbread",
              "source-layer": "roads",
              paint: {
                "line-color": darkMode ? "#4a4a4a" : "#ffffff",
                "line-width": {
                  base: 1.2,
                  stops: [[10, 0.5], [20, 8]],
                },
              },
            },
            {
              id: "buildings",
              type: "fill",
              source: "shortbread",
              "source-layer": "buildings",
              paint: { "fill-color": darkMode ? "#3a3a3a" : "#e0e0e0" },
            },
          ],
        };
      }

      // TileServer GL (OpenMapTiles formatı) - Şimdilik kullanılmıyor
      // if (process.env.NEXT_PUBLIC_TILESERVER_URL) {
      //   return `${process.env.NEXT_PUBLIC_TILESERVER_URL}/styles/basic-preview/style.json`;
      // }

      // Raster tiles (OpenStreetMap veya CartoDB)
      return darkMode
        ? {
          version: 8,
          sources: {
            "osm-tiles": {
              type: "raster",
              tiles: [
                "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                "https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
                "https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
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
        }
        : {
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
    }
    return undefined;
  }, [darkMode]);

  if (!isMounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-500">
        Harita yükleniyor...
      </div>
    );
  }

  return (
    <Map
      ref={mapRef}
      {...viewState}
      onMove={(evt) => {
        setViewState(evt.viewState);
        setCurrentZoom(evt.viewState.zoom);
      }}
      onMoveEnd={handleMoveEnd}
      style={{ width: "100%", height: "100%" }}
      mapStyle={mapStyle as any}
      // attributionControl={true} // Removed as true is not allowed, default is enabled usually or use object
      minZoom={2}
      maxZoom={19}
    >
      {/* Kullanıcının konumu */}
      {userLocation && (
        <Marker
          longitude={userLocation[1]}
          latitude={userLocation[0]}
          anchor="center"
        >
          <div
            style={{
              width: 18,
              height: 18,
              borderRadius: "9999px",
              background: "#2563eb",
              border: "3px solid white",
              boxShadow: "0 0 0 4px rgba(37, 99, 235, 0.4)",
            }}
          />
        </Marker>
      )}

      {barbers.map((barber) => {
        if (!barber.latitude || !barber.longitude) return null;

        // Eğer bu marker'ın popup'ı açıksa, marker'ı gizle
        if (selectedBarber && selectedBarber.id === barber.id) return null;

        const isSelected = selectedBarberId === barber.id;
        const isFavorite = barber.isFavorite || false;

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
                onClick={(e) => {
                  e.stopPropagation();
                  handleMarkerClick(barber);
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: isFavorite ? "8px" : "6px",
                    padding: isFavorite ? "8px 14px" : "6px 10px",
                    background: isFavorite
                      ? (isSelected ? "#fbbf24" : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)")
                      : (isSelected ? "#111827" : "white"),
                    color: isFavorite ? "#ffffff" : (isSelected ? "white" : "#111827"),
                    border: isFavorite
                      ? `2px solid ${isSelected ? "#f59e0b" : "#fbbf24"}`
                      : `2px solid ${isSelected ? "#2563eb" : "#e5e7eb"}`,
                    borderRadius: "9999px",
                    boxShadow: isFavorite
                      ? "0 4px 16px rgba(251, 191, 36, 0.4), 0 2px 8px rgba(0,0,0,0.2)"
                      : "0 4px 12px rgba(0,0,0,0.2)",
                    fontFamily: "Inter, system-ui, -apple-system, sans-serif",
                    fontSize: isFavorite ? "13px" : "12px",
                    fontWeight: 700,
                    position: "relative",
                  }}
                >
                  <span
                    style={{
                      width: isFavorite ? "40px" : "32px",
                      height: isFavorite ? "40px" : "32px",
                      borderRadius: "9999px",
                      background: isFavorite
                        ? "#ffffff"
                        : (isSelected ? "#2563eb" : "#e5e7eb"),
                      color: isFavorite
                        ? "#f59e0b"
                        : (isSelected ? "white" : "#111827"),
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                      fontWeight: 700,
                      flexShrink: 0,
                      border: isFavorite ? "2px solid #fbbf24" : "none",
                      position: "relative",
                      fontSize: isFavorite ? "18px" : "14px",
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
                    {isFavorite && (
                      <Star
                        size={14}
                        style={{
                          fill: "#fbbf24",
                          color: "#fbbf24",
                          position: "absolute",
                          bottom: "-3px",
                          right: "-3px",
                          background: "#ffffff",
                          borderRadius: "50%",
                          padding: "2px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                        }}
                      />
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
                width: isFavorite ? "48px" : "32px",
                height: isFavorite ? "56px" : "40px",
                position: "relative",
                cursor: "pointer",
                margin: 0,
                padding: 0,
                display: "block",
                boxSizing: "border-box",
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleMarkerClick(barber);
              }}
            >
              <div
                style={{
                  width: isFavorite ? "48px" : "32px",
                  height: isFavorite ? "48px" : "32px",
                  background: isFavorite
                    ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                    : (isSelected ? "#111827" : "white"),
                  border: isFavorite
                    ? `4px solid #f59e0b`
                    : `3px solid ${isSelected ? "#2563eb" : "#dc2626"}`,
                  borderRadius: "50% 50% 50% 0",
                  transform: "rotate(-45deg)",
                  boxShadow: isFavorite
                    ? "0 6px 20px rgba(251, 191, 36, 0.6), 0 3px 10px rgba(0,0,0,0.3)"
                    : "0 4px 12px rgba(0,0,0,0.25)",
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
                    color: isFavorite ? "#ffffff" : (isSelected ? "white" : "#111827"),
                    fontSize: isFavorite ? "18px" : "16px",
                    fontWeight: "bold",
                    lineHeight: 1,
                    margin: 0,
                    padding: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "column",
                    gap: "3px",
                  }}
                >
                  {isFavorite ? (
                    <>
                      {barber.logoUrl ? (
                        <img
                          src={barber.logoUrl}
                          alt={barber.shopName || "Berber"}
                          style={{
                            width: "28px",
                            height: "28px",
                            objectFit: "cover",
                            borderRadius: "50%",
                            border: "2px solid rgba(255,255,255,0.4)",
                          }}
                        />
                      ) : (
                        <span style={{ fontSize: "18px", fontWeight: "bold" }}>
                          {barber.shopName?.[0]?.toUpperCase() || "B"}
                        </span>
                      )}
                      <Star size={14} style={{ fill: "#ffffff", color: "#ffffff", marginTop: "-1px" }} />
                    </>
                  ) : (
                    "✂"
                  )}
                </div>
              </div>
              {/* Pin ucu (alt kısım) - tam konuma işaret etmeli */}
              <div
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: isFavorite ? "9px solid transparent" : "6px solid transparent",
                  borderRight: isFavorite ? "9px solid transparent" : "6px solid transparent",
                  borderTop: isFavorite
                    ? `16px solid #f59e0b`
                    : `12px solid ${isSelected ? "#2563eb" : "#dc2626"}`,
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
          onClose={() => {
            setSelectedBarber(null);
            // Infobox kapatıldığında sidebar'daki "geri dön" butonuna basılmış gibi davran
            if (onMarkerClick) {
              onMarkerClick(null as any);
            }
          }}
          closeButton={false}
          className="barber-popup"
        >
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            onMouseUp={(e) => e.stopPropagation()}
          >
            <BarberPopup
              barber={selectedBarber}
              onBookAppointment={handleBookAppointment}
              isFavorite={selectedBarber.isFavorite}
              onClose={() => {
                setSelectedBarber(null);
                if (onMarkerClick) {
                  onMarkerClick(null as any);
                }
              }}
            />
          </div>
        </Popup>
      )}
    </Map>
  );
}
