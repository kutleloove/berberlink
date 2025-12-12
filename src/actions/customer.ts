"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getCustomers(profileId: string) {
  // Randevu almış müşterileri getir
  const appointments = await db.appointment.findMany({
    where: { barberId: profileId },
    include: {
      customer: true
    },
    distinct: ['customerId']
  });

  const customerIds = appointments.map(a => a.customerId);
  
  const customers = await db.user.findMany({
    where: {
      id: { in: customerIds },
      role: "CUSTOMER"
    },
    include: {
      appointmentsAsCustomer: {
        where: { barberId: profileId },
        orderBy: { startTime: "desc" },
        take: 1
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return customers;
}

export async function createCustomer(formData: FormData, profileId: string) {
  const user = await currentUser();
  if (!user) return { error: "Yetkisiz işlem." };

  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;

    // E-posta kontrolü
    const existingUser = await db.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return { error: "Bu e-posta adresi zaten kullanılıyor." };
    }

    // Yeni müşteri oluştur (şifre olmadan)
    const customer = await db.user.create({
      data: {
        name,
        email,
        role: "CUSTOMER",
        // phone için ayrı bir alan yok, notes veya başka bir yerde saklanabilir
        // Şimdilik sadece name ve email ile devam ediyoruz
      }
    });

    revalidatePath("/barber/customers");
    return { success: true, customer };
  } catch (error) {
    console.error(error);
    return { error: "Müşteri oluşturulurken bir hata oluştu." };
  }
}

