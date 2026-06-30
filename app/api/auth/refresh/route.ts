import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

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
        const NHOST_GRAPHQL_URL = process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL;
        const NHOST_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET;

        if (!NHOST_GRAPHQL_URL || !NHOST_ADMIN_SECRET) {
            return NextResponse.json(
                { error: "Nhost configuration missing" },
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

        // Query refresh token
        const tokenQuery = `
      query GetRefreshToken($refreshToken: String!) {
        authRefreshTokens(where: { refreshToken: { _eq: $refreshToken } }) {
          userId
          expiresAt
        }
      }
    `;

        const tokenRes = await fetch(NHOST_GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-hasura-admin-secret": NHOST_ADMIN_SECRET,
            },
            body: JSON.stringify({
                query: tokenQuery,
                variables: { refreshToken },
            }),
        });

        const tokenData = await tokenRes.json();

        if (tokenData.errors) {
            return NextResponse.json(
                { error: "Invalid refresh token" },
                { status: 401 }
            );
        }

        const storedToken = tokenData.data?.authRefreshTokens?.[0];

        if (!storedToken) {
            return NextResponse.json(
                { error: "Invalid refresh token" },
                { status: 401 }
            );
        }

        // Check if token is expired
        if (new Date(storedToken.expiresAt) < new Date()) {
            return NextResponse.json(
                { error: "Refresh token expired" },
                { status: 401 }
            );
        }

        // Generate new access token
        const newAccessToken = crypto.randomBytes(32).toString("hex");

        return NextResponse.json(
            {
                accessToken: newAccessToken,
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