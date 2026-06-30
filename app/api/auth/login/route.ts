import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface LoginRequest {
    email: string;
    password: string;
}

interface LoginResponse {
    session?: {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
            metadata?: any;
        };
    };
    error?: string;
}

function hashPassword(password: string): string {
    return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(
    request: NextRequest
): Promise<NextResponse<LoginResponse>> {
    try {
        const NHOST_GRAPHQL_URL = process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL;
        const NHOST_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET;

        if (!NHOST_GRAPHQL_URL || !NHOST_ADMIN_SECRET) {
            return NextResponse.json(
                { error: "Nhost configuration missing" },
                { status: 500 }
            );
        }

        const body: LoginRequest = await request.json();
        const { email, password } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "Please enter a valid email address" },
                { status: 400 }
            );
        }

        // Query user by email
        const userQuery = `
      query GetUser($email: citext!) {
        users(where: { email: { _eq: $email } }) {
          id
          email
          passwordHash
          metadata
        }
      }
    `;

        const userRes = await fetch(NHOST_GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-hasura-admin-secret": NHOST_ADMIN_SECRET,
            },
            body: JSON.stringify({
                query: userQuery,
                variables: { email },
            }),
        });

        const userData = await userRes.json();

        if (userData.errors) {
            return NextResponse.json(
                { error: "Database error" },
                { status: 500 }
            );
        }

        const user = userData.data?.users?.[0];

        if (!user) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Verify password
        const passwordHash = hashPassword(password);

        if (passwordHash !== user.passwordHash) {
            return NextResponse.json(
                { error: "Invalid email or password" },
                { status: 401 }
            );
        }

        // Generate tokens
        const accessToken = crypto.randomBytes(32).toString("hex");
        const refreshToken = crypto.randomBytes(32).toString("hex");

        // Store refresh token in database
        const storeTokenQuery = `
      mutation StoreRefreshToken($userId: uuid!, $refreshToken: String!) {
        insertAuthRefreshTokens(
          objects: [{
            userId: $userId
            refreshToken: $refreshToken
            type: "pat"
            expiresAt: "2099-12-31T23:59:59Z"
          }]
        ) {
          returning {
            refreshToken
          }
        }
      }
    `;

        await fetch(NHOST_GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-hasura-admin-secret": NHOST_ADMIN_SECRET,
            },
            body: JSON.stringify({
                query: storeTokenQuery,
                variables: {
                    userId: user.id,
                    refreshToken,
                },
            }),
        });

        return NextResponse.json(
            {
                session: {
                    accessToken,
                    refreshToken,
                    user: {
                        id: user.id,
                        email: user.email,
                        metadata: user.metadata,
                    },
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Login error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}