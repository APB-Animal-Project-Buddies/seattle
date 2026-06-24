"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";

interface DishReview {
    id: number;
    dish_name: string;
    dish_data: any;
    created_at: string;
}

export default function CreateReviewLinkPage() {
    const searchParams = useSearchParams();
    const dishId = searchParams.get("dishId");

    const [dish, setDish] = useState<DishReview | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!dishId) {
            setError("No dish selected");
            setLoading(false);
            return;
        }

        async function fetchDish() {
            try {
                const res = await fetch(`/api/dishes/${dishId}`);
                if (!res.ok) throw new Error("Dish not found");
                const data = await res.json();
                setDish(data);
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load dish");
            } finally {
                setLoading(false);
            }
        }

        fetchDish();
    }, [dishId]);

    if (loading) {
        return <div style={styles.container}><p>Loading...</p></div>;
    }

    if (error) {
        return (
            <div style={styles.container}>
                <div style={styles.errorBox}>
                    <h2>Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!dish) {
        return (
            <div style={styles.container}>
                <div style={styles.errorBox}>
                    <h2>Dish not found</h2>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <h1 style={styles.title}>Create a review link</h1>
            <CreateReviewLinkForm dish={dish} />
        </div>
    );
}

function CreateReviewLinkForm({ dish }: { dish: any }) {
    const [formData, setFormData] = useState({
        name: "",
        chefExperience: "homecook",
        eventContext: "",
        difficulty: 3,
        notes: "",
    });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [error, setError] = useState<string | null>(null);
    const [generatedId, setGeneratedId] = useState<string | null>(null);
    const [reviewUrl, setReviewUrl] = useState<string | null>(null);
    const qrCanvasRef = useRef<HTMLCanvasElement>(null);

    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "difficulty" ? Number(value) : value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus("submitting");
        setError(null);

        try {
            const res = await fetch("/api/review-instances", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    dishId: dish.id,
                    name: formData.name.trim(),
                    chefType: formData.chefExperience,
                    eventContext: formData.eventContext.trim() || null,
                    difficulty: formData.difficulty,
                    notes: formData.notes.trim() || null,
                }),
            });

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to create review link");
            }

            const data = await res.json();
            const url = `${window.location.origin}/reviews/${data.id}`;

            setGeneratedId(data.id);
            setReviewUrl(url);
            setStatus("success");

            // Generate QR code
            setTimeout(async () => {
                console.log("Canvas ref:", qrCanvasRef.current);
                if (qrCanvasRef.current) {
                    try {
                        await QRCode.toCanvas(qrCanvasRef.current, url, {
                            errorCorrectionLevel: "H",
                            type: "image/png",
                            quality: 0.95,
                            margin: 1,
                            width: 256,
                        });
                        console.log("QR code generated successfully");
                    } catch (err) {
                        console.error("Failed to generate QR code:", err);
                    }
                } else {
                    console.error("Canvas ref is null");
                }
            }, 100);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setStatus("error");
        }
    };

    if (status === "success" && generatedId && reviewUrl) {
        return (
            <div style={styles.successContainer}>
                <div style={styles.successBox}>
                    <div style={styles.successIcon}>✓</div>
                    <h2 style={styles.successHeading}>Review link created!</h2>
                    <p style={styles.successText}>
                        Share this link to collect their feedback on {dish.dish_data?.title || dish.dish_name}.
                    </p>

                    <div style={styles.urlBox}>
                        <p style={styles.urlLabel}>QR Code:</p>
                        <div style={styles.qrContainer}>
                            <canvas
                                ref={qrCanvasRef}
                                style={styles.qrCanvas}
                            />
                        </div>

                        <p style={styles.urlLabel}>Review Link:</p>
                        <div style={styles.urlDisplay}>
                            <code style={styles.urlCode}>{reviewUrl}</code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(reviewUrl);
                                    alert("Link copied to clipboard!");
                                }}
                                style={styles.copyBtn}
                            >
                                Copy
                            </button>
                        </div>
                    </div>

                    <div style={styles.detailsBox}>
                        <h3 style={styles.detailsHeading}>Review Session Details</h3>
                        <dl style={styles.detailsList}>
                            <dt>Reviewer:</dt>
                            <dd>{formData.name}</dd>

                            <dt>Experience Level:</dt>
                            <dd style={styles.capitalize}>{formData.chefExperience}</dd>

                            {formData.eventContext && (
                                <>
                                    <dt>Event/Context:</dt>
                                    <dd>{formData.eventContext}</dd>
                                </>
                            )}

                            <dt>Initial Difficulty Rating:</dt>
                            <dd>{formData.difficulty}/5</dd>

                            {formData.notes && (
                                <>
                                    <dt>Prep Notes:</dt>
                                    <dd>{formData.notes}</dd>
                                </>
                            )}
                        </dl>
                    </div>

                    <button
                        onClick={() => {
                            setStatus("idle");
                            setFormData({
                                name: "",
                                chefExperience: "homecook",
                                eventContext: "",
                                difficulty: 3,
                                notes: "",
                            });
                        }}
                        style={styles.createAnotherBtn}
                    >
                        Create another review link
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={styles.formCard}>
            <div style={styles.dishInfo}>
                <h3 style={styles.dishTitle}>{dish.dish_data?.title || dish.dish_name}</h3>
                {dish.dish_data?.description && (
                    <p style={styles.dishDesc}>{dish.dish_data.description}</p>
                )}
            </div>

            <form onSubmit={handleSubmit} style={styles.form}>
                {/* Name */}
                <div style={styles.field}>
                    <label style={styles.label}>
                        Reviewer's Name <span style={styles.required}>*</span>
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
                        Reviewer's Experience Level <span style={styles.required}>*</span>
                    </label>
                    <select
                        name="chefExperience"
                        value={formData.chefExperience}
                        onChange={handleChange}
                        style={styles.select}
                    >
                        <option value="beginner">Beginner (first time cooking)</option>
                        <option value="homecook">Home Cook (regular kitchen use)</option>
                        <option value="professional">Professional Chef (commercial kitchen)</option>
                    </select>
                </div>

                {/* Event Context */}
                <div style={styles.field}>
                    <label style={styles.label}>
                        Where will they test this? <span style={styles.optional}>(optional)</span>
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
                        Initial difficulty assessment <span style={styles.required}>*</span>
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
                        Prep notes <span style={styles.optional}>(optional)</span>
                    </label>
                    <p style={styles.hint}>
                        Any context for the reviewer? (e.g. "We have access to X equipment", "Budget is $Y per plate")
                    </p>
                    <textarea
                        name="notes"
                        placeholder="e.g. This is for a catering event with 50 guests. We have a sous vide machine available."
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
                    {status === "submitting" ? "Creating…" : "Create a review link"}
                </button>
            </form>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    container: {
        maxWidth: 700,
        margin: "0 auto",
        padding: "2rem 1rem",
        fontFamily: "system-ui, -apple-system, sans-serif",
    },
    title: {
        fontSize: 28,
        fontWeight: 600,
        marginBottom: "2rem",
        color: "#1a1a1a",
    },
    formCard: {
        background: "white",
        border: "1px solid #e0e0e0",
        borderRadius: 12,
        padding: "2rem",
    },
    dishInfo: {
        marginBottom: "2rem",
        paddingBottom: "2rem",
        borderBottom: "1px solid #e0e0e0",
    },
    dishTitle: {
        fontSize: 20,
        fontWeight: 600,
        margin: "0 0 0.5rem 0",
        color: "#1a1a1a",
    },
    dishDesc: {
        fontSize: 14,
        color: "#666",
        lineHeight: 1.6,
        margin: 0,
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
        display: "flex" as const,
        flexDirection: "column" as const,
        gap: "0.75rem",
    },
    difficultySlider: {
        width: "100%",
        height: 6,
        borderRadius: 3,
        background: "#ddd",
        outline: "none",
        cursor: "pointer" as const,
    },
    difficultyLabels: {
        display: "flex" as const,
        justifyContent: "space-between" as const,
        fontSize: 12,
        color: "#666",
    },
    difficultyLabel: {
        textAlign: "center" as const,
    },
    difficultyValue: {
        textAlign: "center" as const,
        fontSize: 14,
        color: "#1a1a1a",
        fontWeight: 500,
    },
    hint: {
        fontSize: 12,
        color: "#666",
        margin: "0 0 0.5rem 0",
        fontStyle: "italic" as const,
    },
    textarea: {
        padding: "10px 12px",
        fontSize: 14,
        border: "1px solid #ddd",
        borderRadius: 6,
        fontFamily: "inherit",
        minHeight: 80,
        color: "#1a1a1a",
        resize: "vertical" as const,
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
    errorBox: {
        padding: "12px",
        background: "#fee",
        border: "1px solid #fcc",
        borderRadius: 6,
        color: "#c33",
        fontSize: 13,
    },
    successContainer: {
        display: "flex" as const,
        justifyContent: "center" as const,
    },
    successBox: {
        width: "100%",
        background: "white",
        border: "1px solid #e0e0e0",
        borderRadius: 12,
        padding: "2rem",
        textAlign: "center" as const,
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
        marginBottom: "2rem",
    },
    urlBox: {
        background: "#f5f5f3",
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: "1rem",
        marginBottom: "2rem",
    },
    qrContainer: {
        display: "flex" as const,
        justifyContent: "center" as const,
        marginBottom: "1.5rem",
        padding: "1rem",
        background: "white",
        borderRadius: 8,
    },
    qrCanvas: {
        maxWidth: "100%",
        height: "auto",
    },
    urlLabel: {
        fontSize: 12,
        color: "#999",
        textTransform: "uppercase" as const,
        margin: "0 0 0.5rem 0",
        fontWeight: 500,
    },
    urlDisplay: {
        display: "flex" as const,
        alignItems: "center" as const,
        gap: "0.5rem",
    },
    urlCode: {
        fontSize: 13,
        color: "#1a1a1a",
        wordBreak: "break-all" as const,
        flex: 1,
    },
    copyBtn: {
        padding: "6px 12px",
        fontSize: 12,
        background: "#d85a30",
        color: "white",
        border: "none",
        borderRadius: 4,
        cursor: "pointer" as const,
        fontFamily: "inherit",
        whiteSpace: "nowrap" as const,
    },
    detailsBox: {
        textAlign: "left" as const,
        background: "#fafafa",
        border: "1px solid #e0e0e0",
        borderRadius: 8,
        padding: "1rem",
        marginBottom: "2rem",
    },
    detailsHeading: {
        fontSize: 14,
        fontWeight: 600,
        marginBottom: "1rem",
        color: "#1a1a1a",
    },
    detailsList: {
        display: "grid" as const,
        gridTemplateColumns: "120px 1fr",
        gap: "0.5rem 1rem",
        margin: 0,
        padding: 0,
    },
    capitalize: {
        textTransform: "capitalize" as const,
    },
    createAnotherBtn: {
        padding: "12px 16px",
        fontSize: 15,
        background: "white",
        color: "#d85a30",
        border: "1px solid #d85a30",
        borderRadius: 6,
        cursor: "pointer" as const,
        fontFamily: "inherit",
        fontWeight: 500,
    },
};