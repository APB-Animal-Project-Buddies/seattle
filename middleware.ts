import { NextRequest, NextResponse } from "next/server";

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
}

export const config = {
  // Run on everything except Next internals, API routes, and files with an
  // extension (static assets in /public/).
  matcher: ["/((?!_next/|api/|.*\\.).*)"],
};
