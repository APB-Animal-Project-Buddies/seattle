"use client";
import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { LIKED_OPTIONS, isCommentRequired } from "@/lib/reviews";

type FormValues = {
  rating: number; expectations: number; liked: string[];
  comments: string; name: string; email: string;
};

export function ReviewForm({ shortCode }: { shortCode: string }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const { control, register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>({
    defaultValues: { rating: 5, expectations: 5, liked: [], comments: "", name: "", email: "" },
  });
  const rating = watch("rating");
  const commentRequired = isCommentRequired(rating);

  async function onSubmit(values: FormValues) {
    setStatus("submitting");
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          short_code: shortCode,
          review_data: {
            rating: values.rating, expectations: values.expectations,
            liked: values.liked, comments: values.comments,
            reviewer: { name: values.name, email: values.email },
          },
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch { setStatus("error"); }
  }

  if (status === "done")
    return (
      <div className="rounded-[16px] border p-8 text-center">
        <h2 className="text-xl font-semibold text-apb">Thank you!</h2>
        <p className="mt-2 text-neutral-600">Your review was submitted.</p>
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <Label>How would you rate this dish? (1–10)</Label>
        <Controller control={control} name="rating" render={({ field }) => (
          <div className="mt-3">
            <div className="mb-1 text-sm font-medium">Rating: {field.value}</div>
            <Slider min={1} max={10} step={1} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
            <div className="mt-1 flex justify-between text-xs text-neutral-500">
              <span>1 · unpalatable</span><span>5</span><span>10 · restaurant-worthy</span>
            </div>
          </div>
        )} />
      </div>

      <div>
        <Label>What did you like? (optional)</Label>
        <Controller control={control} name="liked" render={({ field }) => (
          <div className="mt-2 flex gap-5">
            {LIKED_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2 capitalize">
                <Checkbox checked={field.value.includes(opt)}
                  onCheckedChange={(c) => field.onChange(c ? [...field.value, opt] : field.value.filter((x) => x !== opt))} />
                {opt}
              </label>
            ))}
          </div>
        )} />
      </div>

      <div>
        <Label>Did it meet your expectations? (1–10)</Label>
        <Controller control={control} name="expectations" render={({ field }) => (
          <div className="mt-3">
            <div className="mb-1 text-sm font-medium">Expectations: {field.value}</div>
            <Slider min={1} max={10} step={1} value={[field.value]} onValueChange={(v) => field.onChange(v[0])} />
            <div className="mt-1 flex justify-between text-xs text-neutral-500">
              <span>1 · below</span><span>5</span><span>10 · vastly exceeded</span>
            </div>
          </div>
        )} />
      </div>

      <div>
        <Label>Comments {commentRequired ? <span className="text-red-600">(required)</span> : "(optional)"}</Label>
        <Textarea className="mt-2"
          {...register("comments", {
            validate: (v) => !isCommentRequired(watch("rating")) || (v && v.trim() !== "") ? true : "Please tell us why for this rating",
          })} />
        {errors.comments ? <p className="mt-1 text-sm text-red-600">{errors.comments.message}</p> : null}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Name / initials (optional)</Label>
          <Input className="mt-2" {...register("name")} />
        </div>
        <div>
          <Label>Email (optional)</Label>
          <Input className="mt-2" type="email"
            {...register("email", { pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Invalid email" } })} />
          {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>
      </div>

      {status === "error" ? (
        <p className="text-sm text-red-600">Something went wrong submitting your review. Please try again.</p>
      ) : null}

      <Button type="submit" disabled={status === "submitting"}>
        {status === "submitting" ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  );
}
