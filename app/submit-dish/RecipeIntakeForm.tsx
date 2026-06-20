"use client";
import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { IngredientCombobox } from "@/components/ui/IngredientCombobox";
import { CUISINES, DISH_TYPES, ALLERGENS, UNITS, TRIED_BY } from "@/lib/dishes";

const selectCls = "mt-2 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-apb";

type Ing = { id?: string; name: string; quantity: string; unit: string };
type FormValues = {
  title: string; description: string; cuisine: string; dishType: string; tags: string;
  ingredients: Ing[]; specialProducts: string; specialEquipment: string; cost: string;
  allergens: string[]; resourceLink: string; originalCreator: string; notes: string;
  name: string; email: string; triedBy: string; sourceUrl: string; reviewCount: string; stars: string;
};

export function RecipeIntakeForm() {
  const [status, setStatus] = useState<"idle"|"submitting"|"done"|"error">("idle");
  const { register, handleSubmit, control, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      title: "", description: "", cuisine: "", dishType: "", tags: "",
      ingredients: [{ name: "", quantity: "", unit: "" }],
      specialProducts: "", specialEquipment: "", cost: "", allergens: [],
      resourceLink: "", originalCreator: "", notes: "",
      name: "", email: "", triedBy: "", sourceUrl: "", reviewCount: "", stars: "",
    },
  });
  const ing = useFieldArray({ control, name: "ingredients" });

  async function onSubmit(v: FormValues) {
    setStatus("submitting");
    const body = {
      title: v.title, description: v.description, cuisine: v.cuisine, dishType: v.dishType,
      tags: v.tags.split(",").map((t) => t.trim()).filter(Boolean),
      ingredients: v.ingredients
        .filter((r) => r.name.trim())
        .map((r) => ({ id: r.id, name: r.name, quantity: r.quantity === "" ? null : Number(r.quantity), unit: r.unit })),
      specialProducts: v.specialProducts, specialEquipment: v.specialEquipment,
      cost: v.cost === "" ? null : Number(v.cost),
      allergens: v.allergens, resourceLink: v.resourceLink, originalCreator: v.originalCreator, notes: v.notes,
      submittedBy: { name: v.name, email: v.email },
      validation: {
        triedBy: v.triedBy, sourceUrl: v.sourceUrl,
        reviewCount: v.reviewCount === "" ? null : Number(v.reviewCount),
        stars: v.stars === "" ? null : Number(v.stars),
      },
    };
    try {
      const res = await fetch("/api/dishes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error(String(res.status));
      setStatus("done");
    } catch { setStatus("error"); }
  }

  if (status === "done")
    return <div className="rounded-[16px] border p-8 text-center"><h2 className="text-xl font-semibold text-apb">Thank you!</h2><p className="mt-2 text-neutral-600">Your recipe was submitted.</p></div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <div>
        <Label>Recipe name <span className="text-red-600">*</span></Label>
        <Input className="mt-2" {...register("title", { required: "Recipe name is required" })} />
        {errors.title ? <p className="mt-1 text-sm text-red-600">{errors.title.message}</p> : null}
      </div>
      <div><Label>Description</Label><Textarea className="mt-2" {...register("description")} /></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Cuisine</Label>
          <select className={selectCls} {...register("cuisine")}>
            <option value="">—</option>{CUISINES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select></div>
        <div><Label>Dish type</Label>
          <select className={selectCls} {...register("dishType")}>
            <option value="">—</option>{DISH_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select></div>
      </div>
      <div><Label>Tags (comma-separated)</Label><Input className="mt-2" placeholder="bulk-prep, fast-service" {...register("tags")} /></div>

      <div>
        <Label>Ingredients</Label>
        <div className="mt-2 flex flex-col gap-2">
          {ing.fields.map((f, i) => (
            <div key={f.id} className="flex items-start gap-2">
              <div className="flex-1">
                <Controller control={control} name={`ingredients.${i}.name`} render={({ field }) => (
                  <IngredientCombobox
                    value={{ name: field.value }}
                    onChange={(val) => { field.onChange(val.name); if (val.id) ing.update(i, { ...(ing.fields[i] as Ing), id: val.id, name: val.name }); }}
                  />
                )} />
              </div>
              <Input className="w-20" type="number" step="any" placeholder="Qty" {...register(`ingredients.${i}.quantity`)} />
              <select className="mt-0 w-24 rounded-lg border border-neutral-300 bg-white px-2 py-2 text-sm outline-none focus:border-apb" {...register(`ingredients.${i}.unit`)}>
                <option value="">unit</option>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              <button type="button" className="px-2 py-2 text-neutral-400 hover:text-red-600" onClick={() => ing.remove(i)}>×</button>
            </div>
          ))}
        </div>
        <button type="button" className="mt-2 text-sm font-medium text-apb" onClick={() => ing.append({ name: "", quantity: "", unit: "" })}>+ Add ingredient</button>
      </div>

      <div><Label>Special products needed (be specific!)</Label><Textarea className="mt-2" {...register("specialProducts")} /></div>
      <div><Label>Special equipment (N/A if none)</Label><Input className="mt-2" {...register("specialEquipment")} /></div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Cost to make (1 person, $)</Label><Input className="mt-2" type="number" step="any" {...register("cost")} /></div>
        <div><Label>Original creator</Label><Input className="mt-2" {...register("originalCreator")} /></div>
      </div>
      <div><Label>Resource / docs link</Label><Input className="mt-2" type="url" {...register("resourceLink")} /></div>
      <div>
        <Label>Allergens</Label>
        <Controller control={control} name="allergens" render={({ field }) => (
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
            {ALLERGENS.map((a) => (
              <label key={a} className="flex items-center gap-2 capitalize">
                <Checkbox checked={field.value.includes(a)}
                  onCheckedChange={(c) => field.onChange(c ? [...field.value, a] : field.value.filter((x) => x !== a))} />
                {a}
              </label>
            ))}
          </div>
        )} />
      </div>

      <div className="rounded-[16px] border border-neutral-200 bg-white/60 p-5">
        <Label>How is this validated?</Label>
        <div className="mt-2"><span className="text-sm">Who has tried this?</span>
          <select className={selectCls} {...register("triedBy")}>
            <option value="">—</option>
            {TRIED_BY.map((t) => <option key={t} value={t}>{t.replace("_", " ")}</option>)}
          </select>
        </div>
        <div className="mt-3"><Label>Original recipe reviews link</Label><Input className="mt-2" type="url" {...register("sourceUrl")} /></div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div><Label>Original review count</Label><Input className="mt-2" type="number" {...register("reviewCount")} /></div>
          <div><Label>Original stars (0–5)</Label><Input className="mt-2" type="number" step="any" {...register("stars")} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Your name / initials</Label><Input className="mt-2" {...register("name")} /></div>
        <div><Label>Email</Label><Input className="mt-2" type="email" {...register("email")} /></div>
      </div>
      <div><Label>Notes (verify recipe; what you liked/disliked/messed up)</Label><Textarea className="mt-2" {...register("notes")} /></div>

      {status === "error" ? <p className="text-sm text-red-600">Something went wrong. Please try again.</p> : null}
      <Button type="submit" disabled={status === "submitting"}>{status === "submitting" ? "Submitting…" : "Submit recipe"}</Button>
    </form>
  );
}
