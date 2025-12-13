"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function toggleFavorite(barberId: string) {
  try {
    const user = await currentUser();
    if (!user) {
      return { error: "Giriş yapmanız gerekiyor" };
    }

    const dbUser = await db.user.findUnique({
      where: { email: user.emailAddresses[0].emailAddress },
    });

    if (!dbUser) {
      return { error: "Kullanıcı bulunamadı" };
    }

    // Favori var mı kontrol et
    const existingFavorite = await db.favorite.findUnique({
      where: {
        customerId_barberId: {
          customerId: dbUser.id,
          barberId: barberId,
        },
      },
    });

    if (existingFavorite) {
      // Favoriden çıkar
      await db.favorite.delete({
        where: { id: existingFavorite.id },
      });
      revalidatePath("/map");
      return { isFavorite: false };
    } else {
      // Favoriye ekle
      await db.favorite.create({
        data: {
          customerId: dbUser.id,
          barberId: barberId,
        },
      });
      revalidatePath("/map");
      return { isFavorite: true };
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    return { error: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }
}

export async function getFavoriteStatus(barberId: string): Promise<boolean> {
  try {
    const user = await currentUser();
    if (!user) {
      return false;
    }

    const dbUser = await db.user.findUnique({
      where: { email: user.emailAddresses[0].emailAddress },
    });

    if (!dbUser) {
      return false;
    }

    const favorite = await db.favorite.findUnique({
      where: {
        customerId_barberId: {
          customerId: dbUser.id,
          barberId: barberId,
        },
      },
    });

    return !!favorite;
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }
}

export async function getFavoriteBarbers() {
  try {
    const user = await currentUser();
    if (!user) {
      return [];
    }

    const dbUser = await db.user.findUnique({
      where: { email: user.emailAddresses[0].emailAddress },
      include: {
        favorites: {
          include: {
            barber: {
              include: {
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
              },
            },
          },
        },
      },
    });

    if (!dbUser) {
      return [];
    }

    return dbUser.favorites.map((f) => f.barber);
  } catch (error) {
    console.error("Error getting favorite barbers:", error);
    return [];
  }
}

