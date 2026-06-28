import { NextRequest, NextResponse } from "next/server";

interface RefreshRequest {
    refreshToken: string;
}

interface RefreshResponse {
    accessToken?: string;
    error?: string;
}

export async function POST(
    request: NextRequest
): Promise<NextResponse<RefreshResponse>> {
    try {
        const NHOST_AUTH_URL = process.env.NEXT_PUBLIC_NHOST_AUTH_URL;

        if (!NHOST_AUTH_URL) {
            return NextResponse.json(
                { error: "NHOST_AUTH_URL is not configured" },
                { status: 500 }
            );
        }

        const body: RefreshRequest = await request.json();

        const { refreshToken } = body;

        if (!refreshToken) {
            return NextResponse.json(
                { error: "Refresh token is required" },
                { status: 400 }
            );
        }

        // Call Nhost token endpoint
        const tokenRes = await fetch(`${NHOST_AUTH_URL}/v1/auth/token`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                refreshToken,
            }),
        });

        if (!tokenRes.ok) {
            const errorData = await tokenRes.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error:
                        errorData.message ||
                        errorData.error ||
                        "Token refresh failed",
                },
                { status: tokenRes.status }
            );
        }

        const tokenData = await tokenRes.json();

        return NextResponse.json(
            {
                accessToken: tokenData.accessToken,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Token refresh error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}