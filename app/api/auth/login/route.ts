import { NextRequest, NextResponse } from "next/server";

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

export async function POST(
    request: NextRequest
): Promise<NextResponse<LoginResponse>> {
    try {
        // Get Nhost credentials from environment variables
        const NHOST_AUTH_URL = process.env.NEXT_PUBLIC_NHOST_AUTH_URL;

        if (!NHOST_AUTH_URL) {
            return NextResponse.json(
                { error: "NHOST_AUTH_URL is not configured" },
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

        // Call Nhost Auth login endpoint
        const loginRes = await fetch(`${NHOST_AUTH_URL}/v1/auth/signin/email-password`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        if (!loginRes.ok) {
            const errorData = await loginRes.json().catch(() => ({}));
            return NextResponse.json(
                {
                    error:
                        errorData.message ||
                        errorData.error ||
                        "Invalid email or password",
                },
                { status: loginRes.status }
            );
        }

        const loginData = await loginRes.json();

        if (!loginData.session) {
            return NextResponse.json(
                { error: "Failed to create session" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                session: {
                    accessToken: loginData.session.accessToken,
                    refreshToken: loginData.session.refreshToken,
                    user: {
                        id: loginData.user.id,
                        email: loginData.user.email,
                        metadata: loginData.user.metadata,
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