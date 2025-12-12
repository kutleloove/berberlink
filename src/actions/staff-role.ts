"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function getStaffRoles(profileId: string) {
  return await db.staffRole.findMany({
    where: { profileId },
    orderBy: { name: "asc" }
  });
}

export async function createStaffRole(formData: FormData) {
  const user = await currentUser();
  if (!user) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    // Yetkiler
    const canCreateAppointments = formData.get("canCreateAppointments") === "on";
    const canEditAppointments = formData.get("canEditAppointments") === "on";
    const canManageMessages = formData.get("canManageMessages") === "on";
    const canUpdateProfile = formData.get("canUpdateProfile") === "on";
    const canManageStaff = formData.get("canManageStaff") === "on";

    const role = await db.staffRole.create({
      data: {
        name,
        description: description || null,
        profileId: dbUser.profile.id,
        canCreateAppointments,
        canEditAppointments,
        canManageMessages,
        canUpdateProfile,
        canManageStaff
      }
    });

    revalidatePath("/barber/staff/roles");
    return { success: true, role };
  } catch (error) {
    console.error(error);
    return { error: "Rol oluşturulurken bir hata oluştu." };
  }
}

export async function updateStaffRole(roleId: string, formData: FormData) {
  const user = await currentUser();
  if (!user) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  try {
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;

    // Yetkiler
    const canCreateAppointments = formData.get("canCreateAppointments") === "on";
    const canEditAppointments = formData.get("canEditAppointments") === "on";
    const canManageMessages = formData.get("canManageMessages") === "on";
    const canUpdateProfile = formData.get("canUpdateProfile") === "on";
    const canManageStaff = formData.get("canManageStaff") === "on";

    await db.staffRole.update({
      where: { id: roleId },
      data: {
        name,
        description: description || null,
        canCreateAppointments,
        canEditAppointments,
        canManageMessages,
        canUpdateProfile,
        canManageStaff
      }
    });

    revalidatePath("/barber/staff/roles");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Rol güncellenirken bir hata oluştu." };
  }
}

export async function deleteStaffRole(roleId: string) {
  const user = await currentUser();
  if (!user) return { error: "Yetkisiz işlem." };

  const dbUser = await db.user.findUnique({
    where: { email: user.emailAddresses[0].emailAddress },
    include: { profile: true }
  });

  if (!dbUser?.profile) return { error: "Profil bulunamadı." };

  try {
    await db.staffRole.delete({
      where: { id: roleId }
    });

    revalidatePath("/barber/staff/roles");
    return { success: true };
  } catch (error) {
    console.error(error);
    return { error: "Rol silinirken bir hata oluştu." };
  }
}

