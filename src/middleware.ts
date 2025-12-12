import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher(["/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  const { userId, redirectToSignIn } = await auth();
  
  // Custom Domain & Subdomain Logic
  const url = req.nextUrl;
  const hostname = req.headers.get("host")!;
  
  // Yerel geliştirme ortamı (localhost) veya ana domain (berberlink.com) kontrolü
  // Gerçek prod ortamında 'berberlink.com' ile değiştirilmeli
  const isMainDomain = hostname.includes("localhost") || hostname === "berberlink.com"; 

  // Eğer istek ana domainden GELMİYORSA (yani berberahmet.com gibi bir domain ise)
  if (!isMainDomain) {
    // URL'i rewrite et: berberlink.com/[slug] içeriğini göster ama URL değişmesin
    // Burada hostname'i slug olarak varsayabiliriz veya veritabanından domain -> slug eşleşmesi yapabiliriz.
    // Şimdilik basitçe hostname'i slug olarak kabul edelim (veya subdomaini)
    
    // Örnek: ahmet.berberlink.com -> [slug] = ahmet
    const subdomain = hostname.split(".")[0]; 
    
    // Bu mantığı custom domain yapınıza göre özelleştireceğiz.
    // Şimdilik subdomain mantığı ile rewrite yapıyoruz:
    return NextResponse.rewrite(new URL(`/${subdomain}${url.pathname}`, req.url));
  }

  if (isProtectedRoute(req)) {
    if (!userId) {
      return redirectToSignIn();
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

