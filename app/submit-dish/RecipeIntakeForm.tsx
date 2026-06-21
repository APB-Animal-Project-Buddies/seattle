"use client";
import { useState } from "react";
import { useForm, FormProvider, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/form/Field";
import { ChipGroup } from "@/components/form/ChipGroup";
import { MultiSelect } from "@/components/form/MultiSelect";
import { TagCombobox } from "@/components/form/TagCombobox";
import { CUISINES, DISH_TYPES, ALLERGENS, TRIED_BY, TRIED_BY_LABELS, TAGS } from "@/lib/dishes";
import { SPECIAL_PRODUCT_OPTIONS } from "@/lib/special-products";
import { IngredientsSection } from "./sections/IngredientsSection";
import { StepsSection } from "./sections/StepsSection";
import { RECIPE_FORM_DEFAULTS, type RecipeFormValues } from "./types";

const numOrNull = (s: string) => (s.trim() === "" ? null : Number(s));

// Submission rules — kept deliberately light:
//  - Title: always required (enforced on the field).
//  - At least 1 ingredient: always required — a recipe needs its ingredient list.
//  - At least 1 step: required UNLESS an online recipe link is given (resourceLink),
//    in which case the link stands in for the written-out method.
function validateRecipe(v: RecipeFormValues): string | null {
  if (!v.ingredients.some((r) => r.name.trim())) return "Add at least one ingredient.";
  const hasStep = v.steps.some((s) => s.text.trim());
  const hasLink = v.resourceLink.trim().length > 0;
  if (!hasStep && !hasLink) return "Add at least one step, or paste an online recipe link instead.";
  return null;
}

export function RecipeIntakeForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const methods = useForm<RecipeFormValues>({ defaultValues: RECIPE_FORM_DEFAULTS });
  const { register, handleSubmit, control, watch, formState: { errors } } = methods;

  async function onSubmit(v: RecipeFormValues) {
    const problem = validateRecipe(v);
    if (problem) { setErrorMsg(problem); setStatus("error"); return; }
    setStatus("submitting");
    setErrorMsg(null);
    const body = {
      title: v.title,
      description: v.description,
      cuisines: v.cuisines,
      dishType: v.dishType,
      tags: v.tags,
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
        feedback: v.feedback,
        reviewCount: numOrNull(v.reviewCount),
        rating: numOrNull(v.rating),
        ratingScale: numOrNull(v.ratingScale),
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
          <Input className="mt-2" placeholder="e.g. Vegan Zuppa Toscana" {...register("title", { required: "Recipe name is required" })} />
        </Field>
        <Field label="Description">
          <Textarea className="mt-2" placeholder="A short blurb — what the dish is and what makes it great" {...register("description")} />
        </Field>
        <Field label="Cuisine" hint="pick any that apply">
          <Controller control={control} name="cuisines" render={({ field }) => (
            <MultiSelect className="mt-2" value={field.value} onChange={field.onChange} options={CUISINES} />
          )} />
        </Field>
        <Field label="Dish type" hint="pick any that apply">
          <Controller control={control} name="dishType" render={({ field }) => (
            <ChipGroup value={field.value} onChange={field.onChange} options={DISH_TYPES} />
          )} />
        </Field>
        <Field label="Tags">
          <Controller control={control} name="tags" render={({ field }) => (
            <ChipGroup value={field.value} onChange={field.onChange} options={TAGS} />
          )} />
        </Field>

        <IngredientsSection />
        <StepsSection />

        {/* Details */}
        <Field
          label="Special products needed"
          hint="rare, pricey, or not normally stocked — plant-based brands, specialty pantry items, premium spices"
        >
          <Controller control={control} name="specialProducts" render={({ field }) => (
            <TagCombobox
              value={field.value}
              onChange={field.onChange}
              options={SPECIAL_PRODUCT_OPTIONS}
              placeholder="e.g. Beyond Meat, Earth Balance, Better Than Bouillon, saffron…"
            />
          )} />
        </Field>
        <Field label="Special equipment (N/A if none)">
          <Input className="mt-2" placeholder="e.g. sous vide circulator, pressure canner, suribachi" {...register("specialEquipment")} />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Cost to make (1 person, $)">
            <Input className="mt-2" type="number" step="any" placeholder="e.g. 3.50" {...register("cost")} />
          </Field>
          <Field label="Original creator">
            <Input className="mt-2" placeholder="e.g. Nora Cooks, Vegan Richa" {...register("originalCreator")} />
          </Field>
        </div>
        <Field label="Resource / docs link">
          <Input className="mt-2" type="url" placeholder="https://www.noracooks.com/vegan-blueberry-muffins/" {...register("resourceLink")} />
        </Field>
        <Field label="Allergens">
          <Controller control={control} name="allergens" render={({ field }) => (
            <ChipGroup value={field.value} onChange={field.onChange} options={ALLERGENS} />
          )} />
        </Field>

        {/* Validation */}
        <div className="rounded-[16px] border border-neutral-200 bg-white/60 p-5">
          <p className="text-sm font-semibold text-apb">
            How is this validated? <span className="font-normal text-neutral-400">(optional)</span>
          </p>
          <Field className="mt-3" label="Who has tried this?">
            <Controller control={control} name="triedBy" render={({ field }) => (
              <ChipGroup value={field.value} onChange={field.onChange} options={TRIED_BY} labels={TRIED_BY_LABELS} />
            )} />
          </Field>
          <Field className="mt-3" label="Feedback & notes" hint="example comments you've gotten back from people">
            <Textarea
              className="mt-2"
              rows={3}
              placeholder="e.g. “My roommate said it tasted just like the original!” · “Friends wanted it spicier next time.”"
              {...register("feedback")}
            />
          </Field>
          {/* Rating + review count describe the linked source recipe's reception —
              only relevant when a resource link is provided above. */}
          {watch("resourceLink")?.trim() ? (
            <div className="mt-3">
              <p className="text-xs text-neutral-500">From the linked recipe above:</p>
              <div className="mt-1 grid grid-cols-2 gap-3">
                <Field label="Review count">
                  <Input className="mt-2" type="number" placeholder="e.g. 1200" {...register("reviewCount")} />
                </Field>
                <Field label="Rating">
                  <div className="mt-2 flex items-center gap-2">
                    <Input type="number" step="any" placeholder="e.g. 8" {...register("rating")} />
                    <Select className="w-20" aria-label="Rating scale" {...register("ratingScale")}>
                      <option value="5">/5</option>
                      <option value="10">/10</option>
                      <option value="100">/100</option>
                    </Select>
                  </div>
                </Field>
              </div>
            </div>
          ) : null}
        </div>

        {/* Submitter + notes */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Your name / initials"><Input className="mt-2" placeholder="e.g. VA" {...register("name")} /></Field>
          <Field label="Email"><Input className="mt-2" type="email" placeholder="you@example.com" {...register("email")} /></Field>
        </div>
        <Field label="Notes (verify recipe; what you liked/disliked/messed up)">
          <Textarea className="mt-2" placeholder="e.g. Tried it twice — used 1.5x kale; cashew cream is worth it" {...register("notes")} />
        </Field>

        {status === "error" ? <p className="text-sm text-red-600">{errorMsg}</p> : null}
        <Button type="submit" disabled={status === "submitting"}>
          {status === "submitting" ? "Submitting…" : "Submit recipe"}
        </Button>
      </form>
    </FormProvider>
  );
}
