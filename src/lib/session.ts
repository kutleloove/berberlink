import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { db } from "@/lib/db";
import { cache } from "react";

export const getSession = cache(async () => {
    const token = (await cookies()).get("session_token")?.value;
    if (!token) return null;
    return verifyToken(token);
});

export const getCurrentUser = cache(async () => {
    const payload = await getSession();
    if (!payload?.userId) return null;

    const user = await db.user.findUnique({
        where: { id: payload.userId as string },
    });

    return user;
});
