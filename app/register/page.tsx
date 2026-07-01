"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth, authErrorMessage } from "@/components/AuthProvider";
import {
  ROLE_OPTIONS,
  USER_TYPE_LABELS,
  type Role,
  type UserType,
} from "@/lib/nhost/roles";

interface RegistrationData {
  email: string;
  password: string;
  confirmPassword: string;
  zipCode: string;
  role: Role;
}

// Roles grouped by user type, preserving ROLE_OPTIONS order, for the picker.
const ROLE_GROUPS = (Object.keys(USER_TYPE_LABELS) as UserType[]).map(
  (userType) => ({
    userType,
    label: USER_TYPE_LABELS[userType],
    options: ROLE_OPTIONS.filter((o) => o.userType === userType),
  })
);

export default function RegisterPage() {
  const { signUp } = useAuth();
  const [formData, setFormData] = useState<RegistrationData>({
    email: "",
    password: "",
    confirmPassword: "",
    zipCode: "",
    role: "homecook",
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

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      setStatus("error");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      setStatus("error");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      setStatus("error");
      return;
    }

    try {
      const { needsVerification } = await signUp({
        email: formData.email,
        password: formData.password,
        role: formData.role,
        zipCode: formData.zipCode || undefined,
      });

      setStatus("success");

      // If the Nhost project doesn't require email verification, a session is
      // already active — send them straight in. Otherwise the success screen
      // tells them to verify their email.
      if (!needsVerification) {
        setTimeout(() => {
          window.location.href = "/dishes";
        }, 1500);
      }
    } catch (err) {
      setError(authErrorMessage(err));
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div style={styles.container}>
        <div style={styles.successBox}>
          <div style={styles.successIcon}>✉</div>
          <h2 style={styles.successHeading}>Check your email</h2>
          <p style={styles.successText}>
            We sent a verification link to <strong>{formData.email}</strong>.
            Click it to activate your account, then sign in.
          </p>
          <p style={styles.successText}>
            <Link href="/login" style={styles.link}>
              Go to sign in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.formCard}>
        <h1 style={styles.title}>Create Account</h1>
        <p style={styles.subtitle}>Join us to start reviewing dishes</p>

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
                placeholder="At least 8 characters"
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

          {/* Confirm Password */}
          <div style={styles.field}>
            <label style={styles.label}>
              Confirm Password <span style={styles.required}>*</span>
            </label>
            <input
              type={showPassword ? "text" : "password"}
              name="confirmPassword"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          {/* Divider */}
          <div style={styles.divider} />

          {/* Role */}
          <div style={styles.field}>
            <label style={styles.label}>
              I am signing up as... <span style={styles.required}>*</span>
            </label>
            {ROLE_GROUPS.map((group) => (
              <div key={group.userType} style={styles.roleGroup}>
                <span style={styles.roleGroupLabel}>{group.label}</span>
                <div style={styles.radioGroup}>
                  {group.options.map((opt) => (
                    <label key={opt.role} style={styles.radioLabel}>
                      <input
                        type="radio"
                        name="role"
                        value={opt.role}
                        checked={formData.role === opt.role}
                        onChange={handleChange}
                        style={styles.radioInput}
                      />
                      {opt.label}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Zip Code */}
          <div style={styles.field}>
            <label style={styles.label}>Zip Code <span style={styles.optional}>(optional)</span></label>
            <input
              type="text"
              name="zipCode"
              placeholder="e.g. 94105"
              value={formData.zipCode}
              onChange={handleChange}
              style={styles.input}
            />
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
            {status === "submitting" ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p style={styles.loginLink}>
          Already have an account?{" "}
          <Link href="/login" style={styles.link}>
            Sign in
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
  optional: {
    fontSize: 12,
    color: "#999",
    fontWeight: 400,
    marginLeft: 6,
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
  divider: {
    height: 1,
    background: "#e0e0e0",
    margin: "0.5rem 0",
  },
  roleGroup: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: "0.5rem",
    marginTop: "0.25rem",
  },
  roleGroupLabel: {
    fontSize: 12,
    fontWeight: 600,
    textTransform: "uppercase" as const,
    letterSpacing: "0.04em",
    color: "#999",
  },
  radioGroup: {
    display: "flex" as const,
    flexDirection: "column" as const,
    gap: "0.75rem",
    paddingLeft: "0.25rem",
  },
  radioLabel: {
    display: "flex" as const,
    alignItems: "center" as const,
    gap: "0.5rem",
    fontSize: 14,
    color: "#1a1a1a",
    cursor: "pointer" as const,
  },
  radioInput: {
    cursor: "pointer" as const,
    accentColor: "#d85a30",
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
  loginLink: {
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