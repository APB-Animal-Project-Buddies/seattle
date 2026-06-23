"use client";

import { useState } from "react";

const CHEF_EXPERIENCE_LEVELS = [
  { value: "beginner", label: "Beginner (first time cooking)" },
  { value: "homecook", label: "Home Cook (regular kitchen use)" },
  { value: "professional", label: "Professional Chef (commercial kitchen)" },
];

export function ReviewFormModal({ dish, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: "",
    chefExperience: "homecook",
    eventContext: "",
    difficulty: 3,
    notes: "",
  });
  const [status, setStatus] = useState("idle"); // idle, submitting, success, error
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === "difficulty" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("submitting");
    setError(null);

    try {
      const res = await fetch("/api/review-instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dishId: dish._id,  // Use _id instead of id
          name: formData.name.trim(),
          chefType: formData.chefExperience,
          eventContext: formData.eventContext.trim() || null,
          difficulty: formData.difficulty,
          notes: formData.notes.trim() || null,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to submit review");
      }

      setStatus("success");
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div style={styles.overlay} onClick={onClose}>
        <div style={styles.modal} onClick={e => e.stopPropagation()}>
          <div style={styles.successBox}>
            <div style={styles.successIcon}>✓</div>
            <h3 style={styles.successHeading}>Review submitted!</h3>
            <p style={styles.successText}>
              Thank you for testing this dish. Your feedback helps improve the recipe.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <button style={styles.closeBtn} onClick={onClose}>×</button>

        <h2 style={styles.title}>Review: {dish.title}</h2>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Name */}
          <div style={styles.field}>
            <label style={styles.label}>
              Your Name <span style={styles.required}>*</span>
            </label>
            <input
              type="text"
              name="name"
              placeholder="e.g. Sarah Chen"
              value={formData.name}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          {/* Chef Experience */}
          <div style={styles.field}>
            <label style={styles.label}>
              Your Experience Level <span style={styles.required}>*</span>
            </label>
            <select
              name="chefExperience"
              value={formData.chefExperience}
              onChange={handleChange}
              style={styles.select}
            >
              {CHEF_EXPERIENCE_LEVELS.map(level => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </select>
          </div>

          {/* Event Context */}
          <div style={styles.field}>
            <label style={styles.label}>
              Where did you test this? <span style={styles.optional}>(optional)</span>
            </label>
            <input
              type="text"
              name="eventContext"
              placeholder="e.g. Family dinner, Restaurant kitchen, Pop-up event"
              value={formData.eventContext}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          {/* Difficulty Slider */}
          <div style={styles.field}>
            <label style={styles.label}>
              How difficult was this to execute? <span style={styles.required}>*</span>
            </label>
            <div style={styles.difficultySliderContainer}>
              <input
                type="range"
                name="difficulty"
                min="1"
                max="5"
                step="1"
                value={formData.difficulty}
                onChange={handleChange}
                style={styles.difficultySlider}
              />
              <div style={styles.difficultyLabels}>
                <span style={styles.difficultyLabel}>1 · Very Easy</span>
                <span style={styles.difficultyLabel}>3 · Medium</span>
                <span style={styles.difficultyLabel}>5 · Very Difficult</span>
              </div>
              <div style={styles.difficultyValue}>
                Current: <strong>{formData.difficulty}</strong>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={styles.field}>
            <label style={styles.label}>
              Comments & Feedback <span style={styles.optional}>(optional)</span>
            </label>
            <p style={styles.hint}>
              What worked well? Any struggles? Modifications you made?
            </p>
            <textarea
              name="notes"
              placeholder="e.g. The sauce was perfect but cooking time was 10 min longer. Added ginger for depth."
              value={formData.notes}
              onChange={handleChange}
              style={styles.textarea}
            />
          </div>

          {status === "error" && (
            <div style={styles.errorBox}>{error}</div>
          )}

          <button
            type="submit"
            disabled={status === "submitting" || !formData.name.trim()}
            style={{
              ...styles.submitBtn,
              ...(status === "submitting" || !formData.name.trim() ? styles.submitBtnDisabled : {}),
            }}
          >
            {status === "submitting" ? "Submitting…" : "Submit Review"}
          </button>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(0, 0, 0, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "white",
    borderRadius: 12,
    padding: "2rem",
    maxWidth: 500,
    width: "90%",
    maxHeight: "90vh",
    overflowY: "auto",
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: "1rem",
    right: "1rem",
    background: "none",
    border: "none",
    fontSize: 28,
    cursor: "pointer",
    color: "#999",
  },
  title: {
    fontSize: 20,
    fontWeight: 600,
    marginBottom: "1.5rem",
    marginTop: 0,
    color: "#1a1a1a",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "1.5rem",
  },
  field: {
    display: "flex",
    flexDirection: "column",
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
  select: {
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid #ddd",
    borderRadius: 6,
    fontFamily: "inherit",
    color: "#1a1a1a",
    background: "white",
  },
  difficultySliderContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "0.75rem",
  },
  difficultySlider: {
    width: "100%",
    height: 6,
    borderRadius: 3,
    background: "#ddd",
    outline: "none",
    cursor: "pointer",
  },
  difficultyLabels: {
    display: "flex",
    justifyContent: "space-between",
    fontSize: 12,
    color: "#666",
  },
  difficultyLabel: {
    textAlign: "center",
  },
  difficultyValue: {
    textAlign: "center",
    fontSize: 14,
    color: "#1a1a1a",
    fontWeight: 500,
  },
  hint: {
    fontSize: 12,
    color: "#666",
    margin: "0 0 0.5rem 0",
    fontStyle: "italic",
  },
  textarea: {
    padding: "10px 12px",
    fontSize: 14,
    border: "1px solid #ddd",
    borderRadius: 6,
    fontFamily: "inherit",
    minHeight: 80,
    color: "#1a1a1a",
    resize: "vertical",
  },
  submitBtn: {
    padding: "12px 16px",
    fontSize: 15,
    fontWeight: 500,
    background: "#d85a30",
    color: "white",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
    fontFamily: "inherit",
  },
  submitBtnDisabled: {
    background: "#ccc",
    cursor: "not-allowed",
  },
  errorBox: {
    padding: "12px",
    background: "#fee",
    border: "1px solid #fcc",
    borderRadius: 6,
    color: "#c33",
    fontSize: 13,
  },
  successBox: {
    textAlign: "center",
    padding: "2rem 0",
  },
  successIcon: {
    fontSize: 48,
    color: "#1d9e75",
    marginBottom: "1rem",
  },
  successHeading: {
    fontSize: 18,
    fontWeight: 600,
    marginBottom: "0.5rem",
    color: "#1a1a1a",
  },
  successText: {
    fontSize: 14,
    color: "#666",
    lineHeight: 1.6,
  },
};
