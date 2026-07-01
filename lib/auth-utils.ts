/**
 * lib/auth-utils.ts
 * Utility functions for authentication and token management
 */

export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}

/**
 * Store auth tokens in localStorage
 */
export function storeTokens(tokens: AuthTokens): void {
    localStorage.setItem("auth_token", tokens.accessToken);
    localStorage.setItem("refresh_token", tokens.refreshToken);
}

/**
 * Get auth tokens from localStorage
 */
export function getTokens(): AuthTokens | null {
    const accessToken = localStorage.getItem("auth_token");
    const refreshToken = localStorage.getItem("refresh_token");

    if (!accessToken || !refreshToken) {
        return null;
    }

    return { accessToken, refreshToken };
}

/**
 * Get user ID from localStorage
 */
export function getUserId(): string | null {
    return localStorage.getItem("user_id");
}

/**
 * Store user ID in localStorage
 */
export function setUserId(userId: string): void {
    localStorage.setItem("user_id", userId);
}

/**
 * Clear all auth data from localStorage
 */
export function clearAuth(): void {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("auth_user");
    localStorage.removeItem("user_id");
}

/**
 * Decode JWT payload (basic - doesn't verify signature)
 * Only use for reading non-sensitive data like expiration
 */
export function decodeToken(token: string): Record<string, any> | null {
    try {
        const parts = token.split(".");
        if (parts.length !== 3) return null;

        const decoded = JSON.parse(atob(parts[1]));
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
    const decoded = decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    // exp is in seconds, Date.now() is in milliseconds
    return decoded.exp * 1000 < Date.now();
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(): Promise<string | null> {
    const tokens = getTokens();
    if (!tokens) return null;

    try {
        const res = await fetch("/api/auth/refresh", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refreshToken: tokens.refreshToken }),
        });

        if (!res.ok) return null;

        const data = await res.json();
        if (data.accessToken) {
            localStorage.setItem("auth_token", data.accessToken);
            return data.accessToken;
        }

        return null;
    } catch {
        return null;
    }
}

/**
 * Get valid access token, refreshing if necessary
 */
export async function getValidToken(): Promise<string | null> {
    const tokens = getTokens();
    if (!tokens) return null;

    // Check if current token is still valid
    if (!isTokenExpired(tokens.accessToken)) {
        return tokens.accessToken;
    }

    // Try to refresh
    return await refreshAccessToken();
}

/**
 * Fetch with automatic token attachment
 * Usage: const data = await authFetch('/api/user-data')
 */
export async function authFetch(
    url: string,
    options: RequestInit = {}
): Promise<Response> {
    const token = await getValidToken();

    if (!token) {
        throw new Error("No valid auth token");
    }

    const headers = {
        ...options.headers,
        Authorization: `Bearer ${token}`,
    };

    return fetch(url, {
        ...options,
        headers,
    });
}

/**
 * Middleware-friendly token validation
 * Usage in middleware.ts
 */
export function validateTokenInHeader(authHeader: string | null): string | null {
    if (!authHeader?.startsWith("Bearer ")) {
        return null;
    }

    const token = authHeader.slice(7);

    if (isTokenExpired(token)) {
        return null;
    }

    return token;
}

/**
 * Get user data from response
 */
export function storeUserData(user: { id: string; email: string; metadata?: any }): void {
    localStorage.setItem("auth_user", JSON.stringify(user));
}

/**
 * Get stored user data
 */
export function getStoredUser(): { id: string; email: string; metadata?: any } | null {
    const data = localStorage.getItem("auth_user");
    return data ? JSON.parse(data) : null;
}