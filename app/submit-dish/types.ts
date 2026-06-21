// Shared form-state types for the recipe intake form.
// (react-hook-form keeps numbers as strings in inputs; the API coerces them.)
export type Ingredient = { id?: string; name: string; quantity: string; unit: string };
export type Step = { text: string };

export type RecipeFormValues = {
  title: string;
  description: string;
  cuisines: string[];
  dishType: string[];
  tags: string[];
  ingredients: Ingredient[];
  steps: Step[];
  specialProducts: string[];
  specialEquipment: string;
  cost: string;
  allergens: string[];
  resourceLink: string;
  originalCreator: string;
  notes: string;
  name: string;
  email: string;
  triedBy: string[];
  feedback: string;
  reviewCount: string;
  rating: string;
  ratingScale: string;
};

export const RECIPE_FORM_DEFAULTS: RecipeFormValues = {
  title: "", description: "", cuisines: [], dishType: [], tags: [],
  // Open a handful of rows up front so the form looks ready to fill in.
  ingredients: Array.from({ length: 5 }, () => ({ name: "", quantity: "", unit: "" })),
  steps: Array.from({ length: 3 }, () => ({ text: "" })),
  specialProducts: [], specialEquipment: "", cost: "", allergens: [],
  resourceLink: "", originalCreator: "", notes: "",
  name: "", email: "", triedBy: [], feedback: "", reviewCount: "", rating: "", ratingScale: "5",
};
