import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/auth";

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get("host")!;
  const path = url.pathname;

  // Custom Domain & Subdomain Logic
  const isMainDomain = hostname.includes("localhost") || hostname === "berberlink.com";

  if (!isMainDomain) {
    const subdomain = hostname.split(".")[0];
    return NextResponse.rewrite(new URL(`/${subdomain}${path}`, req.url));
  }

  // Auth Protection
  const isProtectedRoute = path.startsWith("/dashboard");
  const isAuthRoute = path.startsWith("/sign-in") || path.startsWith("/sign-up");

  const token = req.cookies.get("session_token")?.value;
  const session = token ? await verifyToken(token) : null;

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  if (isAuthRoute && session) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
