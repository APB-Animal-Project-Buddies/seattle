// Shared form-state types for the recipe intake form.
// (react-hook-form keeps numbers as strings in inputs; the API coerces them.)
export type Ingredient = { id?: string; name: string; quantity: string; unit: string };
export type Step = { text: string };

export type RecipeFormValues = {
  title: string;
  description: string;
  cuisine: string;
  dishType: string;
  tags: string;
  ingredients: Ingredient[];
  steps: Step[];
  specialProducts: string;
  specialEquipment: string;
  cost: string;
  allergens: string[];
  resourceLink: string;
  originalCreator: string;
  notes: string;
  name: string;
  email: string;
  triedBy: string;
  sourceUrl: string;
  reviewCount: string;
  stars: string;
};

export const RECIPE_FORM_DEFAULTS: RecipeFormValues = {
  title: "", description: "", cuisine: "", dishType: "", tags: "",
  ingredients: [{ name: "", quantity: "", unit: "" }],
  steps: [{ text: "" }],
  specialProducts: "", specialEquipment: "", cost: "", allergens: [],
  resourceLink: "", originalCreator: "", notes: "",
  name: "", email: "", triedBy: "", sourceUrl: "", reviewCount: "", stars: "",
};
