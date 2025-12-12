"use server";

import { db } from "@/lib/db";

export async function getFirstService(barberId: string) {
  const service = await db.service.findFirst({
    where: { profileId: barberId },
    orderBy: { createdAt: "asc" },
  });
  
  return service?.id || null;
}
