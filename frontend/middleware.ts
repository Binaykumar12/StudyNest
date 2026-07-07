import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PATHS = ["/dashboard", "/admin"];

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;
    const isProtectedPath = PROTECTED_PATHS.some(
        (protectedPath) =>
            pathname === protectedPath || pathname.startsWith(`${protectedPath}/`),
    );

    if (!isProtectedPath) {
        return NextResponse.next();
    }

    const accessToken = request.cookies.get("access_token")?.value;

    if (!accessToken) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("redirect", pathname);
        return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/dashboard/:path*", "/admin/:path*"],
};
