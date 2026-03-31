import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    return NextResponse.rewrite(new URL("/index.html", request.url));
  }
  if (request.nextUrl.pathname === "/open-ideas") {
    return NextResponse.rewrite(new URL("/open-ideas.html", request.url));
  }
}
