import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPaths = ["/rooms", "/balances", "/history"];
const authPaths = ["/login", "/register"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie =
    request.cookies.get(process.env.SESSION_COOKIE_NAME ?? "catte_session")
      ?.value ?? null;

  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const isAuthPage = authPaths.some((p) => pathname === p);

  if (isProtected && !sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAuthPage && sessionCookie) {
    const url = request.nextUrl.clone();
    url.pathname = "/rooms";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/rooms/:path*", "/balances/:path*", "/history/:path*", "/login", "/register"],
};
