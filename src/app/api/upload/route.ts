
import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const slug = formData.get("slug") as string;

    if (!file) {
        return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!slug) {
        return NextResponse.json({ error: "No slug provided" }, { status: 400 });
    }

    // Verify ownership
    const profile = await db.profile.findUnique({
        where: { userId: session.userId as string },
    });

    if (!profile || profile.slug !== slug) {
        return NextResponse.json({ error: "Unauthorized access to this shop" }, { status: 403 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "")}`;

    // Define upload path
    const uploadDir = path.join(process.cwd(), "public", "uploads", slug);

    try {
        await mkdir(uploadDir, { recursive: true });
        await writeFile(path.join(uploadDir, filename), buffer);

        const fileUrl = `/uploads/${slug}/${filename}`;
        return NextResponse.json({ url: fileUrl });
    } catch (error) {
        console.error("Upload error:", error);
        return NextResponse.json({ error: "File upload failed" }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    const session = await getSession();
    if (!session?.userId) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();

    if (!url) {
        return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    // Verify ownership
    const profile = await db.profile.findUnique({
        where: { userId: session.userId as string },
    });

    if (!profile) {
        return NextResponse.json({ error: "Profile not found" }, { status: 403 });
    }

    // Extract path from URL
    // URL format: /uploads/slug/filename
    // We need to ensure the user isn't trying to delete files outside their directory

    const expectedPrefix = `/uploads/${profile.slug}/`;
    if (!url.startsWith(expectedPrefix)) {
        return NextResponse.json({ error: "Unauthorized to delete this file" }, { status: 403 });
    }

    const filename = url.replace(expectedPrefix, "");
    // Simple directory traversal check
    if (filename.includes("..") || filename.includes("/")) {
        return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "public", "uploads", profile.slug, filename);

    try {
        await unlink(filePath);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Delete error:", error);
        // If file doesn't exist, we can treat it as success or ignore
        return NextResponse.json({ error: "File deletion failed" }, { status: 500 });
    }
}
