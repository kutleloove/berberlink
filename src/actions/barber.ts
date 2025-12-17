"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { revalidatePath } from "next/cache";

export async function createBarberProfile(formData: FormData) {
  const session = await getSession();
  const userId = session?.userId;

  if (!userId) {
    return { error: "Oturum açmanız gerekiyor." };
  }

  const shopName = formData.get("shopName") as string;
  const slug = formData.get("slug") as string;
  const dbUserId = formData.get("dbUserId") as string;

  if (!shopName || !slug) {
    return { error: "Lütfen tüm alanları doldurun." };
  }

  // Slug kontrolü (Benzersiz olmalı)
  const existingSlug = await db.profile.findUnique({
    where: { slug },
  });

  // Kullanıcının hali hazırda profili var mı?
  const existingProfile = await db.profile.findUnique({
    where: { userId: dbUserId },
  });

  if (existingSlug) {
    // Eğer slug başkasına aitse hata ver
    if (!existingProfile || existingSlug.id !== existingProfile.id) {
      return { error: "Bu URL adresi kullanımda. Lütfen başka bir tane seçiniz." };
    }
  }

  try {
    if (existingProfile) {
      // Profil varsa güncelle
      await db.profile.update({
        where: { id: existingProfile.id },
        data: {
          shopName,
          slug,
        }
      });

      // Kullanıcı rolünü de garantiye alalım
      await db.user.update({
        where: { id: dbUserId },
        data: { role: "BARBER" }
      });

    } else {
      // Profil yoksa oluştur
      await db.$transaction([
        db.user.update({
          where: { id: dbUserId },
          data: { role: "BARBER" },
        }),
        db.profile.create({
          data: {
            userId: dbUserId,
            shopName,
            slug,
            // Varsayılan tema ayarları
            themeConfig: {
              color: "slate",
              font: "inter"
            }
          },
        }),
      ]);
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Bir hata oluştu. Lütfen tekrar deneyin." };
  }
}


export async function updateBarberPhotos(photos: string[]) {
  const session = await getSession();
  const userId = session?.userId;

  if (!userId) {
    return { error: "Oturum açmanız gerekiyor." };
  }

  try {
    const profile = await db.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return { error: "Profil bulunamadı." };
    }

    if (photos.length > 6) {
      return { error: "En fazla 6 fotoğraf yükleyebilirsiniz." };
    }

    await db.profile.update({
      where: { id: profile.id },
      data: { photos },
    });

    revalidatePath("/barber/settings");
    revalidatePath(`/${profile.slug}`); // Public sayfayı da yenile
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Fotoğraflar güncellenirken bir hata oluştu." };
  }
}

export async function updateBarberLogo(logo: string | null) {
  const session = await getSession();
  const userId = session?.userId;

  if (!userId) {
    return { error: "Oturum açmanız gerekiyor." };
  }

  try {
    const profile = await db.profile.findUnique({
      where: { userId },
    });

    if (!profile) {
      return { error: "Profil bulunamadı." };
    }

    await db.profile.update({
      where: { id: profile.id },
      data: { logo },
    });

    revalidatePath("/barber/settings");
    revalidatePath(`/${profile.slug}`);
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Logo güncellenirken bir hata oluştu." };
  }
}
