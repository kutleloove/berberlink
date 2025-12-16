"use server";

import { db } from "@/lib/db";
import { hashPassword, signToken, verifyPassword } from "@/lib/auth";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE_NAME = "session_token";

export async function signup(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const name = formData.get("name") as string;

    if (!email || !password || !name) {
        return { error: "Missing fields" };
    }

    try {
        const existingUser = await db.user.findUnique({ where: { email } });
        if (existingUser) {
            return { error: "Email already in use" };
        }

        const hashedPassword = await hashPassword(password);

        // Check if this is the first user (admin) - replicating logic from auth-sync
        // Or just default to CUSTOMER
        const role = email === process.env.ADMIN_EMAIL ? "ADMIN" : "CUSTOMER";

        const user = await db.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role as any,
            },
        });

        // Create session
        const token = await signToken({ userId: user.id, email: user.email, role: user.role });

        (await cookies()).set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        return { success: true };
    } catch (error) {
        console.error("Signup error:", error);
        return { error: "Something went wrong" };
    }
}

export async function login(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !password) {
        return { error: "Missing fields" };
    }

    try {
        const user = await db.user.findUnique({ where: { email } });
        if (!user || !user.password) {
            return { error: "Invalid credentials" };
        }

        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            return { error: "Invalid credentials" };
        }

        if (user.twoFactorEnabled) {
            // Generate 2FA code
            const code = Math.floor(100000 + Math.random() * 900000).toString();
            const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

            await db.user.update({
                where: { id: user.id },
                data: {
                    twoFactorCode: code,
                    twoFactorExpires: expires,
                },
            });

            // MOCK SEND EMAIL
            console.log(`[2FA] Sending code ${code} to ${email}`);

            return { needs2FA: true, email };
        }

        // Login success
        const token = await signToken({ userId: user.id, email: user.email, role: user.role });
        (await cookies()).set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        return { success: true };

    } catch (error) {
        console.error("Login error:", error);
        return { error: "Something went wrong" };
    }
}

export async function verify2FA(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const code = formData.get("code") as string;

    if (!email || !code) return { error: "Missing fields" };

    try {
        const user = await db.user.findUnique({ where: { email } });

        if (!user || user.twoFactorCode !== code || !user.twoFactorExpires) {
            return { error: "Invalid code" };
        }

        if (new Date() > user.twoFactorExpires) {
            return { error: "Code expired" };
        }

        // Clear code
        await db.user.update({
            where: { id: user.id },
            data: { twoFactorCode: null, twoFactorExpires: null },
        });

        const token = await signToken({ userId: user.id, email: user.email, role: user.role });
        (await cookies()).set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: "/",
        });

        return { success: true };
    } catch (error) {
        return { error: "Verification failed" };
    }
}

export async function logout() {
    (await cookies()).delete(COOKIE_NAME);
    redirect("/sign-in");
}

export async function getSession() {
    const token = (await cookies()).get(COOKIE_NAME)?.value;
    if (!token) return null;
    // Verification logic should be in middleware or here if needed
    // For now just return token presence or use verifyToken if we need user info
    // import verifyToken logic here if needed
    return token;
}
