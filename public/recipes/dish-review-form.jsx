import { useState } from "react";

const DISH = {
    name: "Braised Short Rib Ragu",
    description:
        "Slow-braised beef short ribs pulled and tossed with a rich tomato and red wine sauce over hand-rolled pappardelle. Finished with gremolata and aged Parmigiano.",
    image: null,
};

const RATING_ANCHORS = [
    { label: "10", text: "You'd travel to a restaurant just for this." },
    { label: "Above 5", text: "You'd order this at a restaurant." },
    { label: "Below 5", text: "You wouldn't want to see this at a restaurant." },
    { label: "1", text: "Unpalatable; not worth eating at all." },
];

const EXPECTATION_ANCHORS = [
    { label: "10", text: "Vastly exceeded your expectations." },
    { label: "Above 5", text: "Exceeded your expectations." },
    { label: "Below 5", text: "Was below expectations." },
    { label: "1", text: "Completely missed the mark." },
];

const LIKES = [
    { id: "taste", label: "Taste", icon: "🔥" },
    { id: "texture", label: "Texture", icon: "〰️" },
    { id: "seasoning", label: "Seasoning", icon: "🧂" },
];

function ScaleSlider({ id, value, onChange, anchors }) {
    return (
        <div style={{ marginBottom: "0.5rem" }}>
            <div style={styles.scaleTicks}>
                {Array.from({ length: 10 }, (_, i) => (
                    <span key={i + 1} style={styles.scaleTick}>{i + 1}</span>
                ))}
            </div>
            <input
                type="range"
                id={id}
                min={1}
                max={10}
                step={1}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                style={styles.rangeInput}
                aria-label={`${id} rating 1 to 10`}
            />
            <div style={styles.scaleValueDisplay}>{value}</div>
            <div style={styles.anchorsBox}>
                {anchors.map((a) => (
                    <div key={a.label} style={styles.anchorLine}>
                        <div style={styles.anchorDot} />
                        <div style={styles.anchorText}>
                            <strong>{a.label}</strong> — {a.text}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function CheckItem({ id, label, icon, checked, onChange }) {
    return (
        <label
            htmlFor={id}
            style={{
                ...styles.checkItem,
                ...(checked ? styles.checkItemChecked : {}),
            }}
        >
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                style={styles.checkbox}
            />
            <span style={{
                ...styles.checkItemLabel,
                ...(checked ? styles.checkItemLabelChecked : {}),
            }}>
                {icon} {label}
            </span>
        </label>
    );
}

export default function DishReviewForm() {
    const [rating, setRating] = useState(5);
    const [likes, setLikes] = useState({ taste: false, texture: false, seasoning: false });
    const [expectation, setExpectation] = useState(null);
    const [comments, setComments] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const toggleLike = (id, checked) => setLikes((prev) => ({ ...prev, [id]: checked }));

    const handleSubmit = () => {
        // Replace with your API call, e.g.:
        // await fetch('/api/reviews', { method: 'POST', body: JSON.stringify({ rating, likes, expectation, comments }) })
        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div style={styles.thanks}>
                <div style={styles.thanksIcon}>✓</div>
                <h2 style={styles.thanksHeading}>Thanks for your review!</h2>
                <p style={styles.thanksText}>
                    Your feedback helps calibrate the dish and improve future iterations. It's been recorded.
                </p>
            </div>
        );
    }

    return (
        <div style={styles.formWrap}>
            {/* Dish info (read-only) */}
            <div style={styles.dishCard}>
                {DISH.image ? (
                    <img src={DISH.image} alt={DISH.name} style={styles.dishImg} />
                ) : (
                    <div style={styles.dishImgPlaceholder}>🍽️</div>
                )}
                <div style={styles.dishInfo}>
                    <p style={styles.dishLabel}>Dish being reviewed</p>
                    <p style={styles.dishName}>{DISH.name}</p>
                    <p style={styles.dishDesc}>{DISH.description}</p>
                </div>
            </div>

            {/* 1. Overall rating */}
            <div style={styles.section}>
                <p style={styles.sectionLabel}>
                    Overall rating <span style={styles.required}>*</span>
                </p>
                <p style={styles.sectionHint}>How would you rate this dish on a scale of 1–10?</p>
                <ScaleSlider id="rating" value={rating} onChange={setRating} anchors={RATING_ANCHORS} />
            </div>

            <hr style={styles.divider} />

            {/* 2. What did you like */}
            <div style={styles.section}>
                <p style={styles.sectionLabel}>
                    What did you like? <span style={styles.optional}>optional</span>
                </p>
                <p style={styles.sectionHint}>Select everything that stood out positively.</p>
                <div style={styles.checkGroup}>
                    {LIKES.map((item) => (
                        <CheckItem
                            key={item.id}
                            id={item.id}
                            label={item.label}
                            icon={item.icon}
                            checked={likes[item.id]}
                            onChange={(checked) => toggleLike(item.id, checked)}
                        />
                    ))}
                </div>
            </div>

            <hr style={styles.divider} />

            {/* 3. Expectations */}
            <div style={styles.section}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <p style={{ ...styles.sectionLabel, marginBottom: 0 }}>
                        Did it meet your expectations? <span style={styles.optional}>optional</span>
                    </p>
                    {expectation !== null && (
                        <button
                            onClick={() => setExpectation(null)}
                            style={styles.clearBtn}
                            aria-label="Clear expectation rating"
                        >
                            Clear
                        </button>
                    )}
                </div>
                <p style={styles.sectionHint}>
                    Did this dish match what you expected, or did it surprise you?
                </p>
                {expectation === null ? (
                    <button onClick={() => setExpectation(5)} style={styles.addRatingBtn}>
                        + Add a rating
                    </button>
                ) : (
                    <ScaleSlider
                        id="expectation"
                        value={expectation}
                        onChange={setExpectation}
                        anchors={EXPECTATION_ANCHORS}
                    />
                )}
            </div>

            <hr style={styles.divider} />

            {/* 4. Comments */}
            <div style={styles.section}>
                <p style={styles.sectionLabel}>
                    Comments <span style={styles.optional}>optional</span>
                </p>
                <p style={styles.sectionHint}>
                    Anything else — presentation, temperature, portion size, or general impressions.
                </p>
                <textarea
                    value={comments}
                    onChange={(e) => setComments(e.target.value)}
                    placeholder="Share your thoughts…"
                    style={styles.textarea}
                    aria-label="Additional comments"
                />
            </div>

            {/* 5. Submit */}
            <button onClick={handleSubmit} style={styles.submitBtn}>
                Submit review
            </button>
        </div>
    );
}

const CORAL = "#D85A30";
const CORAL_DARK = "#993C1D";
const CORAL_BG = "#FAECE7";

const styles = {
    formWrap: {
        maxWidth: 600,
        margin: "0 auto",
        padding: "1.5rem 1rem",
        fontFamily: "sans-serif",
    },
    dishCard: {
        border: "0.5px solid #e0e0e0",
        borderRadius: 12,
        overflow: "hidden",
        marginBottom: "2rem",
        background: "#fff",
    },
    dishImg: {
        width: "100%",
        height: 200,
        objectFit: "cover",
        display: "block",
    },
    dishImgPlaceholder: {
        width: "100%",
        height: 200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 48,
        background: "#f5f5f3",
    },
    dishInfo: { padding: "1rem 1.25rem" },
    dishLabel: { fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase", color: "#999", marginBottom: 4 },
    dishName: { fontSize: 20, fontWeight: 500, marginBottom: 6 },
    dishDesc: { fontSize: 14, color: "#666", lineHeight: 1.6 },
    section: { marginBottom: "2rem" },
    sectionLabel: { fontSize: 15, fontWeight: 500, marginBottom: 4 },
    sectionHint: { fontSize: 13, color: "#666", marginBottom: "1rem", lineHeight: 1.5 },
    required: { color: CORAL },
    optional: { fontSize: 12, color: "#aaa", fontWeight: 400, marginLeft: 6 },
    scaleTicks: { display: "flex", justifyContent: "space-between", padding: "0 2px", marginBottom: 2 },
    scaleTick: { fontSize: 11, color: "#bbb", width: 20, textAlign: "center" },
    rangeInput: { width: "100%", accentColor: CORAL, cursor: "pointer" },
    scaleValueDisplay: { textAlign: "center", fontSize: 28, fontWeight: 500, color: CORAL, margin: "8px 0 4px" },
    anchorsBox: {
        background: "#f5f5f3",
        borderRadius: 8,
        padding: "12px 14px",
        marginTop: 12,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "6px 16px",
    },
    anchorLine: { display: "flex", alignItems: "flex-start", gap: 8 },
    anchorDot: { width: 6, height: 6, borderRadius: "50%", background: CORAL, flexShrink: 0, marginTop: 5 },
    anchorText: { fontSize: 12, color: "#555", lineHeight: 1.5 },
    checkGroup: { display: "flex", flexDirection: "column", gap: 8 },
    checkItem: {
        display: "flex",
        alignItems: "center",
        gap: 10,
        cursor: "pointer",
        padding: "10px 14px",
        border: "0.5px solid #e0e0e0",
        borderRadius: 8,
        background: "#fff",
    },
    checkItemChecked: {
        border: `0.5px solid ${CORAL}`,
        background: CORAL_BG,
    },
    checkbox: { width: 16, height: 16, accentColor: CORAL, cursor: "pointer" },
    checkItemLabel: { fontSize: 14, cursor: "pointer" },
    checkItemLabelChecked: { color: CORAL_DARK },
    divider: { border: "none", borderTop: "0.5px solid #e0e0e0", margin: "2rem 0" },
    textarea: {
        width: "100%",
        minHeight: 100,
        padding: "10px 14px",
        fontSize: 14,
        border: "0.5px solid #e0e0e0",
        borderRadius: 8,
        resize: "vertical",
        lineHeight: 1.6,
        fontFamily: "sans-serif",
    },
    submitBtn: {
        width: "100%",
        padding: 14,
        background: CORAL,
        color: "#fff",
        border: "none",
        borderRadius: 8,
        fontSize: 15,
        fontWeight: 500,
        cursor: "pointer",
    },
    thanks: { textAlign: "center", padding: "3rem 1rem" },
    thanksIcon: { fontSize: 48, color: "#1D9E75", marginBottom: "1rem" },
    thanksHeading: { fontSize: 22, fontWeight: 500, marginBottom: 8 },
    thanksText: { fontSize: 15, color: "#666", lineHeight: 1.6 },
    clearBtn: {
        background: "none",
        border: "0.5px solid #e0e0e0",
        borderRadius: 6,
        fontSize: 12,
        color: "#999",
        padding: "3px 10px",
        cursor: "pointer",
        fontFamily: "sans-serif",
    },
    addRatingBtn: {
        background: "none",
        border: `0.5px dashed #ccc`,
        borderRadius: 8,
        fontSize: 14,
        color: "#999",
        padding: "10px 16px",
        cursor: "pointer",
        fontFamily: "sans-serif",
        width: "100%",
    },
};
