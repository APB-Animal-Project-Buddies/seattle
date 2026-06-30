import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

interface RegisterRequest {
    email: string;
    password: string;
    metadata?: {
        zip_code?: string | null;
    };
}

interface RegisterResponse {
    user?: {
        id: string;
        email: string;
    };
    error?: string;
}

// Hash password using bcrypt-like approach (simple for demo)
function hashPassword(password: string): string {
    // In production, use bcrypt package
    // For now, use a simple hash - NOT SECURE FOR PRODUCTION
    return crypto.createHash("sha256").update(password).digest("hex");
}

export async function POST(
    request: NextRequest
): Promise<NextResponse<RegisterResponse>> {
    try {
        const NHOST_GRAPHQL_URL = process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL;
        const NHOST_ADMIN_SECRET = process.env.NHOST_ADMIN_SECRET;

        if (!NHOST_GRAPHQL_URL || !NHOST_ADMIN_SECRET) {
            return NextResponse.json(
                { error: "Nhost configuration missing" },
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

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return NextResponse.json(
                { error: "Please enter a valid email address" },
                { status: 400 }
            );
        }

        // Check if user already exists
        const checkQuery = `
      query CheckUserExists($email: citext!) {
        users(where: { email: { _eq: $email } }) {
          id
        }
      }
    `;

        const checkRes = await fetch(NHOST_GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-hasura-admin-secret": NHOST_ADMIN_SECRET,
            },
            body: JSON.stringify({
                query: checkQuery,
                variables: { email },
            }),
        });

        const checkText = await checkRes.text();

        let checkData;
        try {
            checkData = JSON.parse(checkText);
        } catch (e) {
            return NextResponse.json(
                { error: "GraphQL returned invalid JSON" },
                { status: 500 }
            );
        }

        if (checkData.data?.users?.length > 0) {
            return NextResponse.json(
                { error: "User with this email already exists" },
                { status: 400 }
            );
        }

        // Create user
        const createQuery = `
      mutation CreateUser(
        $id: uuid!
        $email: citext!
        $passwordHash: String!
        $metadata: jsonb
      ) {
        insertUsers(
          objects: [{
            id: $id
            email: $email
            passwordHash: $passwordHash
            metadata: $metadata
            locale: "en"
          }]
        ) {
          returning {
            id
            email
            metadata
          }
        }
      }
    `;

        const userId = crypto.randomUUID();
        const passwordHash = hashPassword(password);

        const createRes = await fetch(NHOST_GRAPHQL_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "x-hasura-admin-secret": NHOST_ADMIN_SECRET,
            },
            body: JSON.stringify({
                query: createQuery,
                variables: {
                    id: userId,
                    email,
                    passwordHash,
                    metadata: metadata || null,
                },
            }),
        });

        const createData = await createRes.json();

        if (createData.errors) {
            console.error("GraphQL errors:", createData.errors);
            return NextResponse.json(
                { error: createData.errors[0]?.message || "Failed to create user" },
                { status: 400 }
            );
        }

        const user = createData.data?.insertUsers?.returning?.[0];

        if (!user) {
            return NextResponse.json(
                { error: "Failed to create user account" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            {
                user: {
                    id: user.id,
                    email: user.email,
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