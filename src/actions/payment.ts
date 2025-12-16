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

export async function purchasePackage(packageId: string, card: CreditCardInput) {
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
        return { error: "Paket bulunamadı." };
    }

    // 1. Order ID oluştur
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // 2. Webdetek'e ödeme isteği gönder
    try {
        const paymentResponse = await webdetek.createDirectPayment({
            orderId: orderId,
            amount: Number(pkg.price),
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
                amount: pkg.price,
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

        // 4. Başarılı ise Aboneliği Başlat
        const savedCardLast4 = card.cardNumber.slice(-4);

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

        // Abonelik geçmişine yaz
        await db.subscriptionHistory.create({
            data: {
                type: "YEAR_1", // Burası dinamik olabilir, şimdilik sabit
                startDate: new Date(),
                endDate: new Date(Date.now() + pkg.durationDays * 24 * 60 * 60 * 1000),
                amount: Number(pkg.price), // Decimal hatası için Number'a çeviriyoruz
                paymentMethod: "CREDIT_CARD",
                profileId: profileId,
                packageId: pkg.id
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

    } catch (error: any) {
        console.error("Ödeme İşlem Hatası:", error);

        // Hata durumunda da transaction kaydı oluşturmaya çalışalım
        try {
            await db.paymentTransaction.create({
                data: {
                    orderId,
                    amount: pkg.price,
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
}
