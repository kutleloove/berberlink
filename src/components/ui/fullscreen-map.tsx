"use client";

import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useState, useRef } from "react";
import dynamic from "next/dynamic";

const BarberPopup = dynamic(() => import("./barber-popup"), { ssr: false });

// Leaflet ikon fix
// @ts-ignore
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});


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

// Harita merkezini güncellemek için component
function MapController({ 
  center, 
  zoom
}: { 
  center: [number, number], 
  zoom?: number
}) {
  const map = useMap();
  
  useEffect(() => {
    if (!map || !map.setView) return;
    
    try {
      const currentZoom = map.getZoom ? map.getZoom() : zoom || 12;
      map.setView(center, currentZoom);
    } catch (error) {
      console.error("MapController error:", error);
    }
  }, [center, zoom, map]);
  
  return null;
}

// Zoom seviyesini dinleyen component
function ZoomListener({ onZoomChange }: { onZoomChange: (zoom: number) => void }) {
  const map = useMapEvents({
    zoomend: () => {
      onZoomChange(map.getZoom());
    },
    zoom: () => {
      onZoomChange(map.getZoom());
    }
  });
  
  useEffect(() => {
    onZoomChange(map.getZoom());
  }, [map, onZoomChange]);
  
  return null;
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

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Zoom seviyesi: Eğer tek berber varsa yakınlaştır, yoksa geniş açı
  const zoom = barbers.length === 1 ? 15 : 12;
  
  // Zoom seviyesine göre marker tipi belirleme
  // Zoom >= 15: Berber ismi (detaylı marker) - çok yakın, sadece birkaç sokak görünürken
  // Zoom < 15: Yer imi (pin şekli) - şehrin tamamı veya mahalle görünürken
  const showDetailedMarkers = currentZoom >= 15;

  if (!isMounted) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-100 text-slate-500">
        Harita yükleniyor...
      </div>
    );
  }

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: "100%", width: "100%" }}
      scrollWheelZoom={true}
      className={darkMode ? "map-dark" : ""}
    >
      <MapController center={center} zoom={zoom} />
      <ZoomListener onZoomChange={setCurrentZoom} />
      
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url={darkMode 
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" 
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
        maxZoom={19}
      />
      
      {barbers.map(barber => {
        if (!barber.latitude || !barber.longitude) return null;
        
        const isSelected = selectedBarberId === barber.id;

        let markerHtml: string;
        let iconSize: [number, number];
        let iconAnchor: [number, number];
        let popupAnchor: [number, number];

        if (showDetailedMarkers) {
          // Yakın zoom: Berber adı ve logo ile tam marker
          // Altında ok işareti olmalı ki hangi noktayı gösterdiği belli olsun
          markerHtml = `
            <div style="
              position:relative;
              display:inline-block;
            ">
              <div style="
                display:flex;
                align-items:center;
                gap:6px;
                padding:6px 10px;
                background:${isSelected ? '#111827' : 'white'};
                color:${isSelected ? 'white' : '#111827'};
                border:2px solid ${isSelected ? '#2563eb' : '#e5e7eb'};
                border-radius:9999px;
                box-shadow:0 4px 12px rgba(0,0,0,0.2);
                font-family:Inter, system-ui, -apple-system, sans-serif;
                font-size:12px;
                font-weight:700;
                cursor:pointer;
                position:relative;
              ">
                <span style="
                  width:32px;height:32px;
                  border-radius:9999px;
                  background:${isSelected ? '#2563eb' : '#e5e7eb'};
                  color:${isSelected ? 'white' : '#111827'};
                  display:inline-flex;
                  align-items:center;
                  justify-content:center;
                  overflow:hidden;
                  font-weight:700;
                  flex-shrink:0;
                ">
                  ${barber.logoUrl ? `<img src="${barber.logoUrl}" style="width:100%;height:100%;object-fit:cover;" />` : (barber.shopName?.[0]?.toUpperCase() || 'B')}
                </span>
                <span style="white-space:nowrap; max-width:180px; overflow:hidden; text-overflow:ellipsis;">
                  ${barber.shopName || 'Berber'}
                </span>
              </div>
              <!-- Ok işareti (üçgen) - altında konuma işaret etmeli -->
              <div style="
                position:absolute;
                bottom:-8px;
                left:50%;
                transform:translateX(-50%);
                width:0;
                height:0;
                border-left:8px solid transparent;
                border-right:8px solid transparent;
                border-top:8px solid ${isSelected ? '#111827' : 'white'};
                filter:drop-shadow(0 2px 4px rgba(0,0,0,0.2));
              "></div>
            </div>
          `;
          // iconSize: Genişlik değişken olduğu için max-width kullanıyoruz
          // Yükseklik: pill yüksekliği (44px) + ok yüksekliği (8px) = 52px
          // Genişlik: max 180px ama gerçek genişlik değişken, bu yüzden ortalama değer kullanıyoruz
          iconSize = [120, 52];
          // iconAnchor: Okun ucunun tam konuma işaret etmesi için
          // X: Genişliğin yarısı (ortada), Y: Yüksekliğin tamamı (okun ucu)
          iconAnchor = [60, 52]; // [genişlik/2, yükseklik] - Okun ucu tam konum
          popupAnchor = [0, -52];
        } else {
          // Uzak zoom: Sadece makas ikonu (standart yer işareti - pin şekli)
           // Pin'in alt ucu tam konuma işaret etmeli
           markerHtml = `
             <div style="
               width:32px;
               height:40px;
               position:relative;
               cursor:pointer;
               margin:0;
               padding:0;
               display:block;
               box-sizing:border-box;
             ">
               <!-- Pin gövdesi -->
               <div style="
                 width:32px;
                 height:32px;
                 background:${isSelected ? '#111827' : 'white'};
                 border:3px solid ${isSelected ? '#2563eb' : '#dc2626'};
                 border-radius:50% 50% 50% 0;
                 transform:rotate(-45deg);
                 box-shadow:0 4px 12px rgba(0,0,0,0.25);
                 display:flex;
                 align-items:center;
                 justify-content:center;
                 position:absolute;
                 top:0;
                 left:0;
                 margin:0;
                 padding:0;
                 box-sizing:border-box;
               ">
                 <div style="
                   transform:rotate(45deg);
                   color:${isSelected ? 'white' : '#111827'};
                   font-size:16px;
                   font-weight:bold;
                   line-height:1;
                   margin:0;
                   padding:0;
                 ">✂</div>
               </div>
               <!-- Pin ucu (alt kısım) - tam konuma işaret etmeli -->
               <!-- Üçgenin alt ucu tam olarak container'ın alt ucunda (40px) olmalı -->
               <div style="
                 width:0;
                 height:0;
                 border-left:6px solid transparent;
                 border-right:6px solid transparent;
                 border-top:12px solid ${isSelected ? '#2563eb' : '#dc2626'};
                 position:absolute;
                 bottom:0;
                 left:50%;
                 transform:translateX(-50%);
                 filter:drop-shadow(0 2px 4px rgba(0,0,0,0.3));
                 margin:0;
                 padding:0;
                 box-sizing:border-box;
                 pointer-events:none;
               "></div>
             </div>
           `;
           // iconAnchor: [W / 2, H]
           // W = 32px (genişlik), H = 40px (yükseklik)
           // iconAnchor = [32/2, 40] = [16, 40]
           // Bu değer pin'in alt ucunun (üçgenin alt ucu) tam konuma işaret etmesini sağlar
           iconSize = [32, 40];
           iconAnchor = [16, 40]; // [W/2, H] - Pin'in alt ucu tam konum
           popupAnchor = [0, -40];
         }

        // iconAnchor: [W / 2, H]
        // W = iconSize[0] (genişlik), H = iconSize[1] (yükseklik)
        // Bu değer marker'ın alt ucunun tam konuma işaret etmesini sağlar
        const icon = L.divIcon({
          html: markerHtml,
          className: showDetailedMarkers ? "barber-marker-detailed" : "barber-marker-pin",
          iconSize: iconSize,
          iconAnchor: iconAnchor, // [W/2, H] - Marker'ın alt ucu tam konum
          popupAnchor: popupAnchor,
        });
        
        return (
          <Marker 
            key={barber.id} 
            position={[barber.latitude, barber.longitude]}
            icon={icon}
            eventHandlers={{
              click: () => {
                if (onMarkerClick) {
                  onMarkerClick(barber);
                }
              }
            }}
          >
            <Popup 
              maxWidth={300} 
              minWidth={280}
              className="barber-popup"
              autoPan={true}
              closeButton={true}
              keepInView={true}
            >
              <div 
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
              >
                <BarberPopup barber={barber} />
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
