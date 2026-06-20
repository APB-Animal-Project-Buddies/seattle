"use client";
import { useFieldArray, useFormContext, Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Select, Options } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { IngredientCombobox } from "@/components/ui/IngredientCombobox";
import { UNITS } from "@/lib/dishes";
import type { RecipeFormValues } from "../types";

export function IngredientsSection() {
  const { control, register, setValue } = useFormContext<RecipeFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "ingredients" });

  return (
    <div>
      <Label>Ingredients</Label>
      <div className="mt-2 flex flex-col gap-2">
        {fields.map((f, i) => (
          <div key={f.id} className="flex items-start gap-2">
            <div className="flex-1">
              <Controller
                control={control}
                name={`ingredients.${i}.name`}
                render={({ field }) => (
                  <IngredientCombobox
                    value={{ name: field.value }}
                    onChange={(val) => {
                      // Only touch name + id; never re-mount the row (that would wipe
                      // the registered Qty/unit inputs). id is set on a pool pick and
                      // cleared (undefined) on free-text edits, so it never desyncs.
                      field.onChange(val.name);
                      setValue(`ingredients.${i}.id`, val.id, { shouldDirty: true });
                    }}
                  />
                )}
              />
            </div>
            <Input
              className="w-20"
              type="number"
              step="any"
              placeholder="Qty"
              aria-label="Quantity"
              {...register(`ingredients.${i}.quantity`)}
            />
            <Select className="w-28" aria-label="Unit" {...register(`ingredients.${i}.unit`)}>
              <Options values={UNITS} placeholder="unit" />
            </Select>
            <button
              type="button"
              aria-label="Remove ingredient"
              className="px-2 py-2 text-neutral-400 hover:text-red-600"
              onClick={() => remove(i)}
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className="mt-2 text-sm font-medium text-apb"
        onClick={() => append({ name: "", quantity: "", unit: "" })}
      >
        + Add ingredient
      </button>
    </div>
  );
}
