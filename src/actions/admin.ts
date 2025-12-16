"use server";

import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/session";
import { revalidatePath } from "next/cache";

// Admin yetkisi kontrolü
async function checkAdmin() {
  const user = await getCurrentUser();
  if (!user) return false;
  return user.role === "ADMIN";
}

export async function toggleBarberStatus(profileId: string, isActive: boolean) {
  if (!await checkAdmin()) return { error: "Yetkisiz işlem." };

  try {
    await db.profile.update({
      where: { id: profileId },
      data: { isActive }
    });
    revalidatePath("/sys-panel-x9z");
    return { success: true };
  } catch (error) {
    return { error: "İşlem başarısız." };
  }
}

export async function addSubscription(profileId: string, months: number) {
  if (!await checkAdmin()) return { error: "Yetkisiz işlem." };

  try {
    const profile = await db.profile.findUnique({ where: { id: profileId } });
    if (!profile) return { error: "Berber bulunamadı." };

    const currentEnd = profile.subscriptionEndsAt && profile.subscriptionEndsAt > new Date()
      ? profile.subscriptionEndsAt
      : new Date();

    const newEnd = new Date(currentEnd);
    newEnd.setMonth(newEnd.getMonth() + months);

    await db.profile.update({
      where: { id: profileId },
      data: {
        subscriptionEndsAt: newEnd,
        isActive: true // Abonelik eklenince otomatik aktif olsun
      }
    });

    revalidatePath("/sys-panel-x9z");
    return { success: true };
  } catch (error) {
    return { error: "Abonelik eklenemedi." };
  }
}

// --- Package Management ---
export async function createPackage(formData: FormData) {
  if (!await checkAdmin()) return { error: "Yetkisiz işlem." };

  try {
    const name = formData.get("name") as string;
    const price = parseFloat(formData.get("price") as string);
    const durationDays = parseInt(formData.get("durationDays") as string);
    const description = formData.get("description") as string;
    const features = (formData.get("features") as string).split("\n").filter(f => f.trim() !== "");
    const taxRate = parseInt(formData.get("taxRate") as string) || 20;
    const isTaxIncluded = formData.get("isTaxIncluded") === "true";

    await db.package.create({
      data: {
        name,
        price,
        durationDays,
        description,
        features,
        taxRate,
        isTaxIncluded
      }
    });
    revalidatePath("/sys-panel-x9z/packages");
    return { success: true };
  } catch (error) {
    return { error: "Paket oluşturulamadı." };
  }
}

export async function deletePackage(id: string) {
  if (!await checkAdmin()) return { error: "Yetkisiz işlem." };
  try {
    await db.package.delete({ where: { id } });
    revalidatePath("/sys-panel-x9z/packages");
    return { success: true };
  } catch (error) {
    return { error: "Silinemedi." };
  }
}

// --- Promo Code Management ---
export async function createPromoCode(formData: FormData) {
  if (!await checkAdmin()) return { error: "Yetkisiz işlem." };

  try {
    const code = formData.get("code") as string;
    const discountPercent = formData.get("discountPercent") ? parseInt(formData.get("discountPercent") as string) : null;
    const durationDays = formData.get("durationDays") ? parseInt(formData.get("durationDays") as string) : null;
    const maxUses = formData.get("maxUses") ? parseInt(formData.get("maxUses") as string) : null;
    const expiresAt = formData.get("expiresAt") ? new Date(formData.get("expiresAt") as string) : null;
    const validPackageId = formData.get("validPackageId") as string || null;

    await db.promoCode.create({
      data: {
        code,
        discountPercent,
        durationDays, // e.g., 90 days for "3 ay deneme"
        maxUses,
        expiresAt,
        validPackageId
      }
    });
    revalidatePath("/sys-panel-x9z/promocodes");
    return { success: true };
  } catch (error) {
    return { error: "Promosyon kodu oluşturulamadı. Kod benzersiz olmalı." };
  }
}

export async function deletePromoCode(id: string) {
  if (!await checkAdmin()) return { error: "Yetkisiz işlem." };
  try {
    await db.promoCode.delete({ where: { id } });
    revalidatePath("/sys-panel-x9z/promocodes");
    return { success: true };
  } catch (error) {
    return { error: "Silinemedi." };
  }
}

export async function verifyBarber(id: string) {
  if (!await checkAdmin()) return { error: "Yetkisiz işlem." };
  try {
    await db.profile.update({
      where: { id },
      data: { isVerified: true }
    });
    revalidatePath("/sys-panel-x9z/verifications");
    return { success: true };
  } catch (error) {
    return { error: "Onaylanamadı." };
  }
}
