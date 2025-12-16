"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { webdetek } from "@/lib/webdetek";
import { revalidatePath } from "next/cache";

interface CreditCardInput {
    cardHolderName: string;
    cardNumber: string;
    expireMonth: string;
    expireYear: string;
    cvc: string;
}

export async function validatePromoCode(code: string, packageId: string) {
    const promo = await db.promoCode.findUnique({
        where: { code },
        include: { validPackage: true }
    });

    if (!promo) return { error: "Geçersiz promosyon kodu." };
    if (!promo.isActive) return { error: "Bu kod pasif durumda." };
    if (promo.expiresAt && new Date() > promo.expiresAt) return { error: "Kodun süresi dolmuş." };
    if (promo.maxUses && promo.usedCount >= promo.maxUses) return { error: "Kod kullanım limitine ulaşmış." };
    if (promo.validPackageId && promo.validPackageId !== packageId) {
        return { error: `Bu kod sadece ${promo.validPackage?.name} paketi için geçerlidir.` };
    }

    return {
        success: true,
        discountPercent: promo.discountPercent,
        promo: {
            ...promo,
            discountAmount: promo.discountAmount ? Number(promo.discountAmount) : null,
            validPackage: promo.validPackage ? {
                ...promo.validPackage,
                price: Number(promo.validPackage.price)
            } : null
        }
    };
}

export async function purchasePackage(packageId: string, card: CreditCardInput | null, promoCode?: string) {
    const session = await getSession();

    if (!session?.userId) {
        return { error: "Oturum açmanız gerekiyor." };
    }

    const user = await db.user.findUnique({
        where: { id: session.userId as string },
        include: { profile: true }
    });

    if (!user) {
        return { error: "Kullanıcı bulunamadı." };
    }

    const pkg = await db.package.findUnique({
        where: { id: packageId }
    });

    if (!pkg) {
        return {
            error: "Paket bulunamadı."
        };
    }

    // Fiyat Hesaplama
    let finalPrice = Number(pkg.price);
    let usedPromoCodeId = null;

    if (promoCode) {
        const validation = await validatePromoCode(promoCode, packageId);
        if (validation.error) return { error: validation.error };

        if (validation.discountPercent) {
            const discountAmount = (finalPrice * validation.discountPercent) / 100;
            finalPrice -= discountAmount;
            if (finalPrice < 0) finalPrice = 0;
            usedPromoCodeId = validation.promo?.id;
        }
    }

    // 1. Order ID oluştur
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 2. Ödeme İşlemi (Eğer tuar > 0 ise)
    let paymentResponse: any = { status: "success", transactionId: "PROMO-" + orderId };

    if (finalPrice > 0) {
        if (!card) return { error: "Ödeme için kart bilgileri gereklidir." };

        try {
            paymentResponse = await webdetek.createDirectPayment({
                orderId: orderId,
                amount: finalPrice,
                currency: "TRY",
                card: {
                    cardHolderName: card.cardHolderName,
                    cardNumber: card.cardNumber.replace(/\s/g, ""),
                    expireMonth: card.expireMonth,
                    expireYear: card.expireYear,
                    cvc: card.cvc
                },
                productData: {
                    name: pkg.name,
                    externalProductId: pkg.id
                },
                buyer: {
                    id: user.id,
                    name: user.name?.split(" ")[0] || "Misafir",
                    surname: user.name?.split(" ").slice(1).join(" ") || "Kullanıcı",
                    email: user.email,
                    identityNumber: "11111111111", // Gerçek uygulamada kullanıcıdan alınmalı
                    address: user.profile?.address || "Adres Girilmemiş",
                    city: "Istanbul",
                    country: "Turkey",
                    phone: "+905555555555" // Gerçek uygulamada kullanıcıdan alınmalı
                }
            });

            // 3. İşlemi Kaydet (Başarılı veya Başarısız olsa da logluyoruz)
            await db.paymentTransaction.create({
                data: {
                    orderId,
                    amount: finalPrice, // Decimal sorunu yok çünkü modelde Decimal, burası number uyumlu
                    status: paymentResponse.status === "success" ? "SUCCESS" : "FAILURE",
                    provider: "WEBDETEK",
                    transactionId: paymentResponse.transactionId,
                    rawResponse: paymentResponse as any,
                    userId: user.id,
                    packageId: pkg.id,
                    errorReason: paymentResponse.status !== "success" ? paymentResponse.errorMessage : null
                }
            });

            if (paymentResponse.status !== "success") {
                console.error("Ödeme Başarısız:", paymentResponse.errorMessage);
                return { error: paymentResponse.errorMessage || "Ödeme işlemi başarısız oldu." };
            }

        } catch (error: any) {
            console.error("Ödeme İşlem Hatası:", error);
            // Hata durumunda da transaction kaydı oluşturmaya çalışalım
            try {
                await db.paymentTransaction.create({
                    data: {
                        orderId,
                        amount: finalPrice,
                        status: "FAILURE",
                        provider: "WEBDETEK",
                        userId: user.id,
                        packageId: pkg.id,
                        errorReason: error.message
                    }
                });
            } catch (e) {
                // Loglama da hata verirse yapacak bir şey yok
            }
            return { error: "Ödeme işlemi sırasında bir hata oluştu: " + error.message };
        }
    } else {
        // Ücretsiz işlem (Logla)
        await db.paymentTransaction.create({
            data: {
                orderId,
                amount: 0,
                status: "SUCCESS",
                provider: "PROMO",
                transactionId: "FREE-" + orderId,
                rawResponse: { note: "100% discount promo code used" },
                userId: user.id,
                packageId: pkg.id
            }
        });
    }

    // 4. Başarılı ise Aboneliği Başlat & Profil İşlemleri

    let profileId = user.profile?.id;

    // Eğer kullanıcının profili yoksa oluştur
    if (!profileId) {
        const slug = (user.name || "user").toLowerCase().replace(/[^a-z0-9]/g, "") + "-" + Math.floor(Math.random() * 1000);
        const newProfile = await db.profile.create({
            data: {
                userId: user.id,
                shopName: (user.name || "Yeni") + " Dükkanı",
                slug: slug,
                isActive: true, // İlk oluşturulduğunda aktif yapıyoruz
                subscriptionEndsAt: new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000),
                isVerified: true
            }
        });
        profileId = newProfile.id;
    } else {
        // Profil varsa güncelle
        await db.profile.update({
            where: { id: profileId },
            data: {
                isActive: true,
                subscriptionEndsAt: new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000)
            }
        });
    }

    // Promosyon Kodu Kullanımını Artır
    if (usedPromoCodeId) {
        await db.promoCode.update({
            where: { id: usedPromoCodeId },
            data: { usedCount: { increment: 1 } }
        });
    }

    // Abonelik geçmişine yaz
    await db.subscriptionHistory.create({
        data: {
            type: "YEAR_1", // Burası dinamik olabilir, şimdilik sabit
            startDate: new Date(),
            endDate: new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000),
            amount: finalPrice, // İndirimli fiyat
            paymentMethod: (finalPrice > 0 ? "CREDIT_CARD" : "PROMO_CODE") as any,
            profileId: profileId,
            packageId: pkg.id,
            promoCodeId: usedPromoCodeId
        }
    });

    // Kullanıcı rolünü BARBER yap (Eğer CUSTOMER ise)
    if (user.role === "CUSTOMER") {
        await db.user.update({
            where: { id: user.id },
            data: { role: "BARBER" }
        });
    }

    revalidatePath("/dashboard");
    return { success: true };
}
