import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import MapPageClient from "./_components/map-page-client";
import { getFavoriteBarbers } from "@/actions/favorite";

export default async function MapPage() {
  // Tüm berberleri çek (konum bilgisi olanlar)
  const allBarbers = await db.profile.findMany({
    where: {
      latitude: { not: null },
      longitude: { not: null },
    },
    select: {
      id: true,
      shopName: true,
      slug: true,
      latitude: true,
      longitude: true,
      address: true,
      isActive: true,
      averageRating: true,
      user: {
        select: {
          image: true,
        },
      },
      workingHours: {
        select: {
          dayOfWeek: true,
          isClosed: true,
          shifts: {
            select: {
              startTime: true,
              endTime: true,
            },
          },
        },
        orderBy: { dayOfWeek: "asc" }
      },
      services: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
        },
      },
    }
  });

  // Harita merkezini belirle: Eğer berberler varsa, ilk berberin konumunu kullan
  // Yoksa İstanbul (default)
  const mapCenter: [number, number] = allBarbers.length > 0 && allBarbers[0].latitude && allBarbers[0].longitude
    ? [allBarbers[0].latitude, allBarbers[0].longitude]
    : [41.0082, 28.9784]; // İstanbul

  // Veriyi dönüştür: logoUrl'i user.image'den al ve user field'ını kaldır
  // Decimal price'ı string'e çevir
  const barbersWithLogo = allBarbers.map(({ user, services, ...barber }) => ({
    ...barber,
    logoUrl: user?.image || null,
    services: services?.map(service => {
      let priceValue: string;
      if (service.price === null || service.price === undefined) {
        priceValue = "0";
      } else if (typeof service.price === 'object' && 'toNumber' in service.price) {
        priceValue = service.price.toNumber().toString();
      } else {
        priceValue = String(service.price);
      }
      
      return {
        id: service.id,
        name: service.name,
        duration: service.duration,
        price: priceValue,
      };
    }) || [],
  }));

  // Favori berberleri çek
  const favoriteBarbersData = await getFavoriteBarbers();
  
  // Favori berber ID'lerini çıkar
  const favoriteBarberIds = new Set(favoriteBarbersData.map(b => b.id));
  
  // Tüm berberlere isFavorite bilgisini ekle
  const barbersWithFavorite = barbersWithLogo.map(barber => ({
    ...barber,
    isFavorite: favoriteBarberIds.has(barber.id),
  }));
  
  // Favori berberleri aynı formata dönüştür
  const favoriteBarbers = favoriteBarbersData
    .filter(barber => barber.latitude && barber.longitude)
    .map(({ user, services, workingHours, ...barber }) => ({
      ...barber,
      logoUrl: user?.image || null,
      isFavorite: true, // Favori berberler listesindeki tüm berberler favori
      services: services?.map(service => {
        let priceValue: string;
        if (service.price === null || service.price === undefined) {
          priceValue = "0";
        } else if (typeof service.price === 'object' && 'toNumber' in service.price) {
          priceValue = service.price.toNumber().toString();
        } else {
          priceValue = String(service.price);
        }
        
        return {
          id: service.id,
          name: service.name,
          duration: service.duration,
          price: priceValue,
        };
      }) || [],
      workingHours: workingHours?.map(wh => ({
        dayOfWeek: wh.dayOfWeek,
        isClosed: wh.isClosed,
        startTime: wh.shifts[0]?.startTime || "",
        endTime: wh.shifts[0]?.endTime || "",
      })) || [],
    }));

  return <MapPageClient barbers={barbersWithFavorite} favoriteBarbers={favoriteBarbers} mapCenter={mapCenter} />;
}
