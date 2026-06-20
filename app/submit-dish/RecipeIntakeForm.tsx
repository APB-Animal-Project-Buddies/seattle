"use client";
import { useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, Options } from "@/components/ui/select";
import { Field } from "@/components/form/Field";
import { CUISINES, DISH_TYPES, ALLERGENS, TRIED_BY } from "@/lib/dishes";
import { IngredientsSection } from "./sections/IngredientsSection";
import { StepsSection } from "./sections/StepsSection";
import { RECIPE_FORM_DEFAULTS, type RecipeFormValues } from "./types";

const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

export function RecipeIntakeForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const methods = useForm<RecipeFormValues>({ defaultValues: RECIPE_FORM_DEFAULTS });
  const { register, handleSubmit, control, formState: { errors } } = methods;

  async function onSubmit(v: RecipeFormValues) {
    setStatus("submitting");
    setErrorMsg(null);
    const body = {
      title: v.title,
      description: v.description,
      cuisine: v.cuisine,
      dishType: v.dishType,
      tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
      ingredients: v.ingredients
        .filter((r) => r.name.trim())
        .map((r) => ({ id: r.id, name: r.name, quantity: numOrNull(r.quantity), unit: r.unit })),
      steps: v.steps.map((s) => s.text.trim()).filter(Boolean),
      specialProducts: v.specialProducts,
      specialEquipment: v.specialEquipment,
      cost: numOrNull(v.cost),
      allergens: v.allergens,
      resourceLink: v.resourceLink,
      originalCreator: v.originalCreator,
      notes: v.notes,
      submittedBy: { name: v.name, email: v.email },
      validation: {
        triedBy: v.triedBy,
        sourceUrl: v.sourceUrl,
        reviewCount: numOrNull(v.reviewCount),
        stars: numOrNull(v.stars),
      },
    };
    try {
      const res = await fetch("/api/dishes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        setErrorMsg(j?.error ?? "Something went wrong. Please try again.");
        setStatus("error");
        return;
      }
      setStatus("done");
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done")
    return (
      <div className="rounded-[16px] border p-8 text-center">
        <h2 className="text-xl font-semibold text-apb">Thank you!</h2>
        <p className="mt-2 text-neutral-600">Your recipe was submitted.</p>
      </div>
    );

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        {/* Basics */}
        <Field label="Recipe name" required error={errors.title?.message}>
          <Input className="mt-2" {...register("title", { required: "Recipe name is required" })} />
        </Field>
        <Field label="Description">
          <Textarea className="mt-2" {...register("description")} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Cuisine">
            <Select className="mt-2" {...register("cuisine")}><Options values={CUISINES} placeholder="—" /></Select>
          </Field>
          <Field label="Dish type">
            <Select className="mt-2" {...register("dishType")}><Options values={DISH_TYPES} placeholder="—" /></Select>
          </Field>
        </div>
        <Field label="Tags" hint="comma-separated">
          <Input className="mt-2" placeholder="bulk-prep, fast-service" {...register("tags")} />
        </Field>

        <IngredientsSection />
        <StepsSection />

        {/* Details */}
        <Field label="Special products needed (be specific!)">
          <Textarea className="mt-2" {...register("specialProducts")} />
        </Field>
        <Field label="Special equipment (N/A if none)">
          <Input className="mt-2" {...register("specialEquipment")} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Cost to make (1 person, $)">
            <Input className="mt-2" type="number" step="any" {...register("cost")} />
          </Field>
          <Field label="Original creator">
            <Input className="mt-2" {...register("originalCreator")} />
          </Field>
        </div>
        <Field label="Resource / docs link">
          <Input className="mt-2" type="url" {...register("resourceLink")} />
        </Field>
        <Field label="Allergens">
          <Controller
            control={control}
            name="allergens"
            render={({ field }) => (
              <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                {ALLERGENS.map((a) => (
                  <label key={a} className="flex items-center gap-2 capitalize">
                    <Checkbox
                      checked={field.value.includes(a)}
                      onCheckedChange={(c) =>
                        field.onChange(c ? [...field.value, a] : field.value.filter((x) => x !== a))
                      }
                    />
                    {a}
                  </label>
                ))}
              </div>
            )}
          />
        </Field>

        {/* Validation */}
        <div className="rounded-[16px] border border-neutral-200 bg-white/60 p-5">
          <Field label="How is this validated?">
            <div className="mt-2">
              <span className="text-sm">Who has tried this?</span>
              <Select className="mt-1" {...register("triedBy")}><Options values={TRIED_BY} placeholder="—" /></Select>
            </div>
          </Field>
          <Field className="mt-3" label="Original recipe reviews link">
            <Input className="mt-2" type="url" {...register("sourceUrl")} />
          </Field>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <Field label="Original review count">
              <Input className="mt-2" type="number" {...register("reviewCount")} />
            </Field>
            <Field label="Original stars (0–5)">
              <Input className="mt-2" type="number" step="any" {...register("stars")} />
            </Field>
          </div>
        </div>

        {/* Submitter + notes */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Your name / initials"><Input className="mt-2" {...register("name")} /></Field>
          <Field label="Email"><Input className="mt-2" type="email" {...register("email")} /></Field>
        </div>
        <Field label="Notes (verify recipe; what you liked/disliked/messed up)">
          <Textarea className="mt-2" {...register("notes")} />
        </Field>

        {status === "error" ? <p className="text-sm text-red-600">{errorMsg}</p> : null}
        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting…" : "Submit recipe"}
        </Button>
      </form>
    </FormProvider>
  );
}
