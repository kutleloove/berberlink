import { db } from "@/lib/db";
import MapPageClient from "./_components/map-page-client";

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
          startTime: true,
          endTime: true,
          isClosed: true,
        },
        orderBy: { dayOfWeek: "asc" }
      }
    }
  });

  // Harita merkezini belirle: Eğer berberler varsa, ilk berberin konumunu kullan
  // Yoksa İstanbul (default)
  const mapCenter: [number, number] = allBarbers.length > 0 && allBarbers[0].latitude && allBarbers[0].longitude
    ? [allBarbers[0].latitude, allBarbers[0].longitude]
    : [41.0082, 28.9784]; // İstanbul

  // Veriyi dönüştür: logoUrl'i user.image'den al ve user field'ını kaldır
  const barbersWithLogo = allBarbers.map(({ user, ...barber }) => ({
    ...barber,
    logoUrl: user?.image || null,
  }));

  return <MapPageClient barbers={barbersWithLogo} mapCenter={mapCenter} />;
}
