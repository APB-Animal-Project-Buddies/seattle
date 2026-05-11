import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/index.html", request.url));
  }
  if (request.nextUrl.pathname === "/open-ideas") {
    return NextResponse.rewrite(new URL("/open-ideas.html", request.url));
  }
  if (request.nextUrl.pathname === "/start-a-chapter") {
    return NextResponse.rewrite(new URL("/start-a-chapter.html", request.url));
  }
  if (request.nextUrl.pathname === "/recipes") {
    return NextResponse.rewrite(new URL("/recipes/index.html", request.url));
  }
  if (request.nextUrl.pathname === "/menus") {
    return NextResponse.rewrite(new URL("/menus/index.html", request.url));
  }
  if (request.nextUrl.pathname === "/tips-and-tricks") {
    return NextResponse.rewrite(new URL("/tips-and-tricks/index.html", request.url));
  }
  if (request.nextUrl.pathname === "/top-alternatives") {
    return NextResponse.rewrite(new URL("/top-alternatives/index.html", request.url));
  }
  if (request.nextUrl.pathname === "/reverse-lookup") {
    return NextResponse.rewrite(new URL("/reverse-lookup/index.html", request.url));
  }
  // Backward-compat: old slug → new slug
  if (request.nextUrl.pathname === "/top-dairy-products") {
    return NextResponse.redirect(new URL("/top-alternatives", request.url), 308);
  }
}
