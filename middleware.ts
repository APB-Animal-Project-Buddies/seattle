import { NextRequest, NextResponse } from "next/server";

// Food product ("Ahead of the Menu") lives under /aheadofthemenu/*.
// Static SPA apps stay physically in public/<slug>/ — we serve them at the new
// URL via rewrite (their absolute asset paths keep resolving), and 308-redirect
// the old top-level URLs to the new prefixed ones.
const STATIC_APPS = [
  "recipes",
  "menus",
  "top-alternatives",
  "tips-and-tricks",
  "reverse-lookup",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // APB nonprofit landing + pages stay at the root.
  if (pathname === "/") {
    return NextResponse.rewrite(new URL("/index.html", request.url));
  }
  if (pathname === "/open-ideas") {
    return NextResponse.rewrite(new URL("/open-ideas.html", request.url));
  }
  if (pathname === "/start-a-chapter") {
    return NextResponse.rewrite(new URL("/start-a-chapter.html", request.url));
  }
  if (pathname === "/job-boards") {
    return NextResponse.rewrite(new URL("/job-boards.html", request.url));
  }

  // --- Ahead of the Menu: serve static apps at the new prefix ---
  for (const slug of STATIC_APPS) {
    if (pathname === `/aheadofthemenu/${slug}`) {
      return NextResponse.rewrite(new URL(`/${slug}/index.html`, request.url));
    }
  }

  // Dishes is a real Next.js route under app/dishes — serve it at the new
  // prefix without physically moving the folder.
  if (pathname === "/aheadofthemenu/dishes" || pathname.startsWith("/aheadofthemenu/dishes/")) {
    const rest = pathname.slice("/aheadofthemenu".length); // -> /dishes/...
    return NextResponse.rewrite(new URL(rest + request.nextUrl.search, request.url));
  }

  // --- Backward-compat: redirect old top-level food URLs to the new prefix ---
  for (const slug of STATIC_APPS) {
    if (pathname === `/${slug}`) {
      return NextResponse.redirect(new URL(`/aheadofthemenu/${slug}`, request.url), 308);
    }
  }
  if (pathname === "/dishes" || pathname.startsWith("/dishes/")) {
    return NextResponse.redirect(
      new URL(`/aheadofthemenu${pathname}${request.nextUrl.search}`, request.url),
      308,
    );
  }
  // Old dairy slug → new alternatives page (under the new prefix).
  if (pathname === "/top-dairy-products") {
    return NextResponse.redirect(new URL("/aheadofthemenu/top-alternatives", request.url), 308);
  }
}

export const config = {
  // Run on everything except Next internals, API routes, and files with an
  // extension (static assets in /public, including /aheadofthemenu/assets/*).
  matcher: ["/((?!_next/|api/|.*\\.).*)"],
};
