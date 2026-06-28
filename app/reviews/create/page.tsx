"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { ChipGroup } from "@/components/form/ChipGroup";
import { ALLERGENS } from "@/lib/dishes";

interface DishReview {
    id: number;
    dish_name: string;
    dish_data: any;
    created_at: string;
}

const CHEF_EXPERIENCE_LEVELS = [
    { value: "beginner", label: "Beginner (first time cooking)" },
    { value: "homecook", label: "Home Cook (regular kitchen use)" },
    { value: "professional", label: "Professional Chef (commercial kitchen)" },
];

function Centered({ title, body }: { title: string; body: string }) {
    return (
        <main className="mx-auto max-w-xl px-5 py-20 text-center">
            <h1 className="text-2xl font-bold text-apb">{title}</h1>
            <p className="mt-3 text-neutral-600">{body}</p>
        </main>
    );
}

export default function CreateReviewLinkPage() {
    return (
        <Suspense fallback={<Centered title="Loading…" body="Fetching the dish." />}>
            <CreateReviewLinkContent />
        </Suspense>
    );
}

function CreateReviewLinkContent() {
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

    if (loading) return <Centered title="Loading…" body="Fetching the dish." />;
    if (error) return <Centered title="Something went wrong" body={error} />;
    if (!dish) return <Centered title="Dish not found" body="We couldn't find that dish." />;

    return (
        <main className="mx-auto max-w-xl px-5 py-10">
            <h1 className="text-2xl font-bold text-apb">Create a review link</h1>
            <CreateReviewLinkForm dish={dish} />
        </main>
    );
}

function CreateReviewLinkForm({ dish }: { dish: DishReview }) {
    const dishTitle = dish.dish_data?.title || dish.dish_name || "this dish";

    const [formData, setFormData] = useState({
        name: "",
        chefExperience: "homecook",
        eventContext: "",
        difficulty: 3,
        notes: "",
        substituted: false,
        allergens: [] as string[],
    });

    // Reprompt for allergens when the cook substituted ingredients — prefill from the
    // dish's allergens so they only adjust what their swaps changed.
    const toggleSubstituted = (on: boolean) =>
        update(on ? { substituted: true, allergens: (dish.dish_data?.allergens ?? []) as string[] } : { substituted: false });
    const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
    const [error, setError] = useState<string | null>(null);
    const [reviewUrl, setReviewUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const update = (patch: Partial<typeof formData>) => setFormData(prev => ({ ...prev, ...patch }));

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
                    substituted: formData.substituted,
                    allergens: formData.substituted ? formData.allergens : [],
                }),
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to create review link");
            }
            const data = await res.json();
            setReviewUrl(`${window.location.origin}${data.path}`);
            setStatus("success");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Something went wrong");
            setStatus("error");
        }
    };

    const copy = async () => {
        if (!reviewUrl) return;
        try {
            await navigator.clipboard.writeText(reviewUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard unavailable — the URL is still selectable on screen */
        }
    };

    if (status === "success" && reviewUrl) {
        return (
            <div className="mt-6 flex flex-col gap-6 rounded-[16px] border border-neutral-200 bg-white/60 p-6">
                <div>
                    <h2 className="text-xl font-semibold text-apb">Review link created!</h2>
                    <p className="mt-2 text-sm text-neutral-600">
                        Your instance of <span className="font-semibold">{dishTitle}</span> is logged. Share this
                        link or QR code so anyone who tasted it can leave a review.
                    </p>
                </div>

                <div className="flex justify-center rounded-[16px] border border-neutral-200 bg-white p-5">
                    <QRCodeSVG value={reviewUrl} size={200} marginSize={2} />
                </div>

                <div>
                    <Label>Review link</Label>
                    <div className="mt-2 flex items-stretch gap-2">
                        <code className="flex flex-1 items-center break-all rounded-lg border border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
                            {reviewUrl}
                        </code>
                        <Button type="button" onClick={copy} className="px-4 py-2 text-sm">
                            {copied ? "Copied!" : "Copy"}
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <a
                        href={reviewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center rounded-[16px] border border-neutral-300 px-5 py-2.5 text-sm font-semibold text-apb transition hover:border-apb"
                    >
                        Open the form
                    </a>
                    <button
                        type="button"
                        className="text-sm text-neutral-500 underline hover:text-apb"
                        onClick={() => {
                            setReviewUrl(null);
                            setStatus("idle");
                            setFormData({ name: "", chefExperience: "homecook", eventContext: "", difficulty: 3, notes: "", substituted: false, allergens: [] });
                        }}
                    >
                        Create another link
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-6 rounded-[16px] border border-neutral-200 bg-white/60 p-6">
            <p className="text-sm text-neutral-600">
                Log this instance of <span className="font-semibold">{dishTitle}</span> — your details and how it
                went. Then share the generated link &amp; QR code so people who tasted it can leave a review.
            </p>

            <div>
                <Label htmlFor="name">Your name <span className="text-red-600">*</span></Label>
                <Input
                    id="name"
                    className="mt-2"
                    placeholder="e.g. Sarah Chen"
                    value={formData.name}
                    onChange={(e) => update({ name: e.target.value })}
                    required
                />
            </div>

            <div>
                <Label htmlFor="chef">Your experience level <span className="text-red-600">*</span></Label>
                <select
                    id="chef"
                    className="mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-apb"
                    value={formData.chefExperience}
                    onChange={(e) => update({ chefExperience: e.target.value })}
                >
                    {CHEF_EXPERIENCE_LEVELS.map((level) => (
                        <option key={level.value} value={level.value}>{level.label}</option>
                    ))}
                </select>
            </div>

            <div>
                <Label htmlFor="event">Where did you make this? <span className="text-neutral-400">(optional)</span></Label>
                <Input
                    id="event"
                    className="mt-2"
                    placeholder="e.g. Family dinner, Restaurant kitchen, Pop-up event"
                    value={formData.eventContext}
                    onChange={(e) => update({ eventContext: e.target.value })}
                />
            </div>

            <div>
                <Label>How difficult was it to make? <span className="text-red-600">*</span></Label>
                <div className="mt-3">
                    <div className="mb-1 text-sm font-medium">Difficulty: {formData.difficulty}</div>
                    <Slider
                        min={1}
                        max={5}
                        step={1}
                        value={[formData.difficulty]}
                        onValueChange={(v) => update({ difficulty: v[0] })}
                    />
                    <div className="mt-1 flex justify-between text-xs text-neutral-500">
                        <span>1 · very easy</span><span>3 · medium</span><span>5 · very difficult</span>
                    </div>
                </div>
            </div>

            <div>
                <Label htmlFor="notes">Notes <span className="text-neutral-400">(optional)</span></Label>
                <Textarea
                    id="notes"
                    className="mt-2"
                    placeholder="How did this attempt go? Anything notable for yourself."
                    value={formData.notes}
                    onChange={(e) => update({ notes: e.target.value })}
                />
            </div>

            <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-apb">
                    <input
                        type="checkbox"
                        checked={formData.substituted}
                        onChange={(e) => toggleSubstituted(e.target.checked)}
                    />
                    I swapped or substituted ingredients
                </label>
                {formData.substituted ? (
                    <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                        <Label>Allergens for your version</Label>
                        <p className="mt-1 text-xs text-neutral-600">
                            Substitutions can change allergens — we&rsquo;ve prefilled the recipe&rsquo;s. Adjust them to
                            match what you actually made.
                        </p>
                        <div className="mt-2">
                            <ChipGroup
                                value={formData.allergens}
                                onChange={(v) => update({ allergens: v })}
                                options={ALLERGENS}
                            />
                        </div>
                    </div>
                ) : null}
            </div>

            {status === "error" ? (
                <p className="text-sm text-red-600">{error}</p>
            ) : null}

            <Button type="submit" disabled={status === "submitting" || !formData.name.trim()}>
                {status === "submitting" ? "Creating…" : "Generate review link"}
            </Button>
        </form>
    );
}
