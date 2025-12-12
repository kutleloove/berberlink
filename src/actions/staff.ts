"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getStaffList(profileId: string) {
  return await db.staff.findMany({
    where: { profileId },
    include: {
      role: true,
      serviceAssignments: {
        include: {
          service: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });
}

export async function createStaff(formData: FormData) {
  const user = await currentUser();
  if (!user) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const roleId = formData.get("roleId") as string;
    const serviceIds = formData.getAll("serviceIds") as string[];

    const staff = await db.staff.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        profileId: dbUser.profile.id,
        roleId: roleId || null,
        serviceAssignments: {
          create: serviceIds.map(serviceId => ({
            serviceId
          }))
        }
      }
    });

    revalidatePath("/barber/staff");
    return { success: true, staff };
  } catch (error) {
    console.error(error);
    return { error: "Personel oluşturulurken bir hata oluştu." };
  }
}

export async function updateStaff(staffId: string, formData: FormData) {
  const user = await currentUser();
  if (!user) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  try {
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const roleId = formData.get("roleId") as string;
    const serviceIds = formData.getAll("serviceIds") as string[];
    const isActive = formData.get("isActive") === "on";

    // Önce mevcut atamaları sil
    await db.staffServiceAssignment.deleteMany({
      where: { staffId }
    });

    await db.staff.update({
      where: { id: staffId },
      data: {
        name,
        email: email || null,
        phone: phone || null,
        roleId: roleId || null,
        isActive,
        serviceAssignments: {
          create: serviceIds.map(serviceId => ({
            serviceId
          }))
        }
      }
    });

    revalidatePath("/barber/staff");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Personel güncellenirken bir hata oluştu." };
  }
}

export async function deleteStaff(staffId: string) {
  const user = await currentUser();
  if (!user) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  try {
    await db.staff.delete({
      where: { id: staffId }
    });

    revalidatePath("/barber/staff");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Personel silinirken bir hata oluştu." };
  }
}

