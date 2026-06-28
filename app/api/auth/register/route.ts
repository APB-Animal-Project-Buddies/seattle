import { NextRequest, NextResponse } from "next/server";

interface RegisterRequest {
    email: string;
    password: string;
    metadata?: {
        zip_code?: string | null;
    };
}

interface RegisterResponse {
    session?: {
        accessToken: string;
        refreshToken: string;
        user: {
            id: string;
            email: string;
        };
    };
    error?: string;
}

export async function POST(
    request: NextRequest
): Promise<NextResponse<RegisterResponse>> {
    try {
        // Get Nhost credentials from environment variables
        const NHOST_AUTH_URL = process.env.NEXT_PUBLIC_NHOST_AUTH_URL;
        const NHOST_GRAPHQL_URL = process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL;

        if (!NHOST_AUTH_URL) {
            return NextResponse.json(
                { error: "NHOST_AUTH_URL is not configured" },
                { status: 500 }
            );
        }

        if (!NHOST_GRAPHQL_URL) {
            return NextResponse.json(
                { error: "NHOST_GRAPHQL_URL is not configured" },
                { status: 500 }
            );
        }

        const body: RegisterRequest = await request.json();

        const { email, password, metadata } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: "Email and password are required" },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        // Step 1: Register user with Nhost Auth
        const registerRes = await fetch(`${NHOST_AUTH_URL}/v1/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                password,
            }),
        });

        if (!registerRes.ok) {
            const errorData = await registerRes.json().catch(() => ({}));
            console.error("Nhost registration error:", {
                status: registerRes.status,
                statusText: registerRes.statusText,
                url: `${NHOST_AUTH_URL}/v1/auth/register`,
                response: errorData,
            });
            return NextResponse.json(
                {
                    error:
                        errorData.message ||
                        errorData.error ||
                        "Registration failed",
                },
                { status: registerRes.status }
            );
        }

        const registerData = await registerRes.json();
        const userId = registerData.user?.id;
        const session = registerData.session;

        if (!userId) {
            return NextResponse.json(
                { error: "Failed to create user account" },
                { status: 500 }
            );
        }

        // Step 2: Update user metadata with zip code (if provided)
        if (metadata?.zip_code) {
            const updateMetadataQuery = `
        mutation UpdateUserMetadata($userId: uuid!, $metadata: jsonb!) {
          updateUser(
            pk_columns: { id: $userId }
            _set: { metadata: $metadata }
          ) {
            id
            metadata
          }
        }
      `;

            const metadataRes = await fetch(NHOST_GRAPHQL_URL!, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    // Use admin secret if available, or user's access token
                    ...(process.env.NHOST_ADMIN_SECRET && {
                        "x-hasura-admin-secret": process.env.NHOST_ADMIN_SECRET,
                    }),
                },
                body: JSON.stringify({
                    query: updateMetadataQuery,
                    variables: {
                        userId,
                        metadata: {
                            zip_code: metadata.zip_code,
                        },
                    },
                }),
            });

            const metadataData = await metadataRes.json();

            if (metadataData.errors) {
                console.error("Failed to update metadata:", metadataData.errors);
                // Don't fail the registration if metadata update fails
            }
        }

        return NextResponse.json(
            {
                session: {
                    accessToken: session.accessToken,
                    refreshToken: session.refreshToken,
                    user: {
                        id: userId,
                        email,
                    },
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}