"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface LoginData {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<LoginData>({
    email: "",
    password: "",
  });
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    // Validation
    if (!formData.email || !formData.password) {
      setError("Email and password are required");
      setStatus("error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      setStatus("error");
      return;
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Login failed");
      }

      const data = await res.json();

      // Store token in localStorage or cookie
      if (data.session?.accessToken) {
        localStorage.setItem("auth_token", data.session.accessToken);
        localStorage.setItem("refresh_token", data.session.refreshToken || "");
        localStorage.setItem("user_id", data.session.user?.id || "");
      }

      setStatus("success");
      setTimeout(() => {
        router.push("/dishes");
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div style={styles.container}>
        <div style={styles.successBox}>
          <div style={styles.successIcon}>✓</div>
          <h2 style={styles.successHeading}>Logged in!</h2>
          <p style={styles.successText}>
            Redirecting to dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h1 style={styles.title}>Sign In</h1>
        <p style={styles.subtitle}>Welcome back to dish reviews</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Email */}
          <div style={styles.field}>
            <label style={styles.label}>
              Email <span style={styles.required}>*</span>
            </label>
            <input
              type="email"
              name="email"
              placeholder="you@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          {/* Password */}
          <div style={styles.field}>
            <label style={styles.label}>
              Password <span style={styles.required}>*</span>
            </label>
            <div style={styles.passwordInputContainer}>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
                style={styles.input}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.togglePasswordBtn}
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>

          {status === "error" && (
            <div style={styles.errorBox}>{error}</div>
          )}

          <button
            type="submit"
            disabled={status === "submitting"}
            style={{
              ...styles.submitBtn,
              ...(status === "submitting" ? styles.submitBtnDisabled : {}),
            }}
          >
            {status === "submitting" ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p style={styles.signupLink}>
          Don't have an account?{" "}
          <Link href="/register" style={styles.link}>
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: "100vh",
    display: "flex" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: "1rem",
    background: "linear-gradient(135deg, #f5f5f3 0%, #fafafa 100%)",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  formCard: {
    background: "white",
    border: "1px solid #e0e0e0",
    borderRadius: 12,
    padding: "2rem",
    maxWidth: 500,
    width: "100%",
    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
  },
  title: {
    fontSize: 28,
    fontWeight: 600,
    margin: "0 0 0.5rem 0",
    color: "#1a1a1a",
  },
  subtitle: {
    fontSize: 14,
    color: "#666",
    margin: "0 0 2rem 0",
  },
  form: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: "1.5rem",
  },
  field: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  label: {
    fontSize: 14,
    fontWeight: 500,
    color: "#1a1a1a",
  },
  required: {
    color: "#d85a30",
    marginLeft: 2,
  },
  input: {
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid #ddd",
    borderRadius: 6,
    fontFamily: "inherit",
    color: "#1a1a1a",
  },
  passwordInputContainer: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
  },
  togglePasswordBtn: {
    padding: "6px 12px",
    fontSize: 12,
    background: "white",
    color: "#666",
    border: "1px solid #ddd",
    borderRadius: 4,
    cursor: "pointer" as const,
    fontFamily: "inherit",
    whiteSpace: "nowrap" as const,
  },
  errorBox: {
    padding: "12px",
    background: "#fee",
    border: "1px solid #fcc",
    borderRadius: 6,
    color: "#c33",
    fontSize: 13,
  },
  submitBtn: {
    padding: "12px 16px",
    fontSize: 15,
    fontWeight: 500,
    background: "#d85a30",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer" as const,
    fontFamily: "inherit",
  },
  submitBtnDisabled: {
    background: "#ccc",
    cursor: "not-allowed" as const,
  },
  signupLink: {
    textAlign: "center" as const,
    fontSize: 14,
    color: "#666",
    margin: "1rem 0 0 0",
  },
  link: {
    color: "#d85a30",
    textDecoration: "none",
    fontWeight: 500,
  },
  successBox: {
    textAlign: "center" as const,
    padding: "2rem",
  },
  successIcon: {
    fontSize: 48,
    color: "#1d9e75",
    marginBottom: "1rem",
  },
  successHeading: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: "0.5rem",
    color: "#1a1a1a",
  },
  successText: {
    fontSize: 15,
    color: "#666",
    lineHeight: 1.6,
  },
};