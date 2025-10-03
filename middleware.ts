import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Rotas que precisam de autenticação
  const protectedRoutes = ["/sistema"];

  // Rotas de autenticação que usuários logados não devem acessar
  const authRoutes = ["/auth"];

  // Verificar se a rota atual é protegida
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Verificar se é uma rota de autenticação
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Obter token do cookie
  const token = request.cookies.get("auth-token")?.value;
  const userCookie = request.cookies.get("auth-user")?.value;

  let user = null;
  try {
    user = userCookie ? JSON.parse(userCookie) : null;
  } catch (error) {
    console.error("Erro ao fazer parse do cookie do usuário:", error);
  }

  // Se está tentando acessar rota protegida sem autenticação
  if (isProtectedRoute && (!token || !user)) {
    return NextResponse.redirect(new URL("/auth", request.url));
  }

  // Se está autenticado e tentando acessar rotas de auth, redirecionar para sistema
  if (isAuthRoute && token && user) {
    return NextResponse.redirect(new URL("/sistema", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|public).*)",
  ],
};
