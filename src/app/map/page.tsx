import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import MapPageClient from "./_components/map-page-client";

export default async function MapPage() {
  // Kullanıcı bilgisini al (favorite status için)
  const user = await currentUser();
  let favoriteBarberIds: string[] = [];
  
  if (user) {
    const dbUser = await db.user.findUnique({
      where: { email: user.emailAddresses[0]?.emailAddress },
      include: {
        favorites: {
          select: {
            barberId: true,
          },
        },
      },
    });
    
    if (dbUser) {
      favoriteBarberIds = dbUser.favorites.map((f) => f.barberId);
    }
  }

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
      services: {
        select: {
          id: true,
          name: true,
          duration: true,
          price: true,
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
      }
    }
  });

  // Harita merkezini belirle: Eğer berberler varsa, ilk berberin konumunu kullan
  // Yoksa İstanbul (default)
  const mapCenter: [number, number] = allBarbers.length > 0 && allBarbers[0].latitude && allBarbers[0].longitude
    ? [allBarbers[0].latitude, allBarbers[0].longitude]
    : [41.0082, 28.9784]; // İstanbul

  // Veriyi dönüştür: logoUrl'i user.image'den al ve user field'ını kaldır
  // Decimal price'ı string'e çevir (Prisma Decimal tipini serialize etmek için)
  const barbersWithLogo = allBarbers.map(({ user, services, ...barber }) => ({
    ...barber,
    logoUrl: user?.image || null,
    isFavorite: favoriteBarberIds.includes(barber.id), // Favorite status ekle
    services: services?.map(service => ({
      id: service.id,
      name: service.name,
      duration: service.duration,
      price: service.price.toString(), // Prisma Decimal'ı string'e çevir
    })) || [],
  }));

  return <MapPageClient barbers={barbersWithLogo} mapCenter={mapCenter} />;
}
