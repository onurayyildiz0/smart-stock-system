// middleware.ts (Örnek Yapı)
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    // Özel yönlendirme mantıkların varsa burada çalışır
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const path = req.nextUrl.pathname;

        // Login ve Register sayfaları herkese açık olmalı:
        if (path.startsWith("/login") || path.startsWith("/register")) {
          return true;
        }

        // Diğer sayfalar için oturum (token) şartı
        return !!token;
      },
    },
  },
);

export const config = {
  // middleware'in hangi sayfalarda çalışacağını belirleyen kısım
  matcher: [
    /*
     * Aşağıdakiler HARİÇ tüm istekleri yakala:
     * - api/auth (NextAuth rotaları)
     * - _next/static (statik dosyalar)
     * - _next/image (resim optimizasyonu)
     * - favicon.ico
     * - register (kayıt sayfası)
     * - login (giriş sayfası)
     */
    "/((?!api/auth|_next/static|_next/image|favicon.ico|login|register).*)",
  ],
};
