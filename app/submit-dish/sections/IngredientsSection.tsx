"use client";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineFields } from "./LineFields";
import { AlternativesEditor } from "./AlternativesEditor";
import { AddButton } from "./AddButton";
import { emptyIngredient, type RecipeFormValues } from "../types";

export function IngredientsSection() {
  const { control } = useFormContext<RecipeFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "ingredientGroups" });

  // Section headers only appear once there's more than one group — a single
  // unnamed group reads as a plain ingredient list (unchanged from before).
  const showSections = fields.length > 1;

  return (
    <div>
      <Label>Ingredients</Label>
      <div className="mt-2 flex flex-col gap-4">
        {fields.map((f, g) => (
          <SectionGroup
            key={f.id}
            groupIndex={g}
            showSection={showSections}
            onRemoveGroup={() => remove(g)}
          />
        ))}
      </div>
      <div className="mt-3">
        <AddButton variant="primary" onClick={() => append({ section: "", items: [emptyIngredient()] })}>
          Add section
        </AddButton>
      </div>
    </div>
  );
}

/** One ingredient section: optional header + its rows. */
function SectionGroup({
  groupIndex,
  showSection,
  onRemoveGroup,
}: {
  groupIndex: number;
  showSection: boolean;
  onRemoveGroup: () => void;
}) {
  const { control, register } = useFormContext<RecipeFormValues>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: `ingredientGroups.${groupIndex}.items`,
  });

  return (
    <div className={showSection ? "rounded-[12px] border border-neutral-200 p-3" : undefined}>
      {showSection ? (
        <div className="mb-2 flex items-center gap-2">
          <Input
            className="h-9 flex-1 font-medium"
            placeholder="Section name — e.g. Batter, Sauce, Topping"
            aria-label="Section name"
            {...register(`ingredientGroups.${groupIndex}.section`)}
          />
          <button
            type="button"
            aria-label="Remove section"
            className="px-2 py-2 text-sm text-neutral-400 hover:text-red-600"
            onClick={onRemoveGroup}
          >
            Remove section
          </button>
        </div>
      ) : null}

      <div className="flex flex-col gap-3">
        {fields.map((f, i) => (
          <div key={f.id}>
            <div className="flex items-start gap-2">
              <LineFields namePrefix={`ingredientGroups.${groupIndex}.items.${i}`} />
              <button
                type="button"
                aria-label="Remove ingredient"
                className="px-2 py-2 text-neutral-400 hover:text-red-600"
                onClick={() => remove(i)}
              >
                ×
              </button>
            </div>
            <AlternativesEditor namePrefix={`ingredientGroups.${groupIndex}.items.${i}`} />
          </div>
        ))}
      </div>

      <div className="mt-3">
        <AddButton variant="default" onClick={() => append(emptyIngredient())}>
          Add ingredient
        </AddButton>
      </div>
    </div>
  );
}
