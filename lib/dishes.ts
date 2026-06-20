export const CUISINES = ["american","italian","mexican","indian","chinese","thai","japanese","korean","vietnamese","mediterranean","middle-eastern","french","ethiopian","other"] as const;
export const DISH_TYPES = ["main","side","appetizer","breakfast","soup","salad","dessert","snack","drink","sauce","other"] as const;
export const ALLERGENS = ["gluten","nuts","peanuts","soy","dairy","eggs","sesame","shellfish","fish"] as const;
export const UNITS = ["g","kg","ml","l","tsp","tbsp","cup","oz","lb","piece","clove","can","pinch","dash","handful","bunch","sprig","to_taste","other"] as const;
export const TRIED_BY = ["just_me","friends","family","strangers","a_lot"] as const;
export const TRIED_BY_LABELS: Record<(typeof TRIED_BY)[number], string> = {
  just_me: "Just me", friends: "Friends", family: "Family", strangers: "Strangers", a_lot: "A lot of people",
};
export const TAGS = ["fast","easy","cheap","expensive","fancy","healthy","high-protein","comfort-food","spicy","kid-friendly","bulk-prep","low-effort"] as const;

const MAX_SHORT = 200, MAX_LONG = 4000, MAX_NAME = 120, MAX_EMAIL = 254, MAX_TAGS = 25, MAX_INGREDIENTS = 100, MAX_STEPS = 60;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;

function str(v: unknown, max: number): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim().replace(/\s+/g, " ");
  return t === "" ? undefined : t.slice(0, max);
}
function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}
function strArray(v: unknown, max: number, cap: number): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => str(x, cap)).filter((x): x is string => !!x).slice(0, max);
}

export type DishData = Record<string, unknown>;

export function buildDishData(input: any): DishData {
  const title = str(input?.title, MAX_SHORT);
  if (!title) throw new Error("Recipe title is required");

  const d: DishData = { title };
  const desc = str(input?.description, MAX_LONG); if (desc) d.description = desc;
  // cuisine / dishType / unit / allergens are intentionally NOT clamped to the allowed
  // sets: the UI offers those lists plus an "Other → free text" escape, so any capped
  // string is accepted here. Moderators can normalize on promotion to `recipes`.
  const cuisine = str(input?.cuisine, MAX_SHORT); if (cuisine) d.cuisine = cuisine;
  const dishType = strArray(input?.dishType, DISH_TYPES.length, MAX_SHORT); if (dishType.length) d.dishType = dishType;

  const tags = strArray(input?.tags, MAX_TAGS, MAX_SHORT); if (tags.length) d.tags = tags;

  const rawIng = Array.isArray(input?.ingredients) ? input.ingredients : [];
  const ingredients = rawIng
    .map((r: any) => {
      const name = str(r?.name, MAX_NAME);
      if (!name) return null;
      const row: any = { name, quantity: num(r?.quantity), unit: str(r?.unit, 40) ?? "" };
      const id = str(r?.id, MAX_NAME); if (id) row.id = id;
      return row;
    })
    .filter(Boolean)
    .slice(0, MAX_INGREDIENTS);
  if (ingredients.length) d.ingredients = ingredients;

  const steps = strArray(input?.steps, MAX_STEPS, MAX_LONG); if (steps.length) d.steps = steps;

  const specialProducts = str(input?.specialProducts, MAX_LONG); if (specialProducts) d.specialProducts = specialProducts;
  const specialEquipment = str(input?.specialEquipment, MAX_LONG); if (specialEquipment) d.specialEquipment = specialEquipment;
  const originalCreator = str(input?.originalCreator, MAX_SHORT); if (originalCreator) d.originalCreator = originalCreator;
  const notes = str(input?.notes, MAX_LONG); if (notes) d.notes = notes;

  const allergens = strArray(input?.allergens, 30, MAX_SHORT); if (allergens.length) d.allergens = allergens;

  const resourceLink = str(input?.resourceLink, MAX_SHORT);
  if (resourceLink) { if (!URL_RE.test(resourceLink)) throw new Error("Resource link must be a valid URL"); d.resourceLink = resourceLink; }

  if (input?.cost != null && input.cost !== "") {
    const cost = num(input.cost);
    if (cost === null || cost < 0) throw new Error("Cost must be a non-negative number");
    d.cost = cost;
  }

  const sbName = str(input?.submittedBy?.name, MAX_NAME);
  const sbEmail = str(input?.submittedBy?.email, MAX_EMAIL);
  if (sbEmail && !EMAIL_RE.test(sbEmail)) throw new Error("Invalid email");
  if (sbName || sbEmail) { d.submittedBy = {}; if (sbName) (d.submittedBy as any).name = sbName; if (sbEmail) (d.submittedBy as any).email = sbEmail; }

  const v: any = {};
  const triedBy = strArray(input?.validation?.triedBy, TRIED_BY.length, 40)
    .filter((t) => (TRIED_BY as readonly string[]).includes(t));
  if (triedBy.length) v.triedBy = triedBy;
  const sourceUrl = str(input?.validation?.sourceUrl, MAX_SHORT);
  if (sourceUrl) { if (!URL_RE.test(sourceUrl)) throw new Error("Validation link must be a valid URL"); v.sourceUrl = sourceUrl; }
  if (input?.validation?.reviewCount != null && input.validation.reviewCount !== "") {
    const rc = num(input.validation.reviewCount);
    if (rc === null || rc < 0 || !Number.isInteger(rc)) throw new Error("Review count must be a non-negative integer");
    v.reviewCount = rc;
  }
  if (input?.validation?.stars != null && input.validation.stars !== "") {
    const st = num(input.validation.stars);
    if (st === null || st < 0 || st > 5) throw new Error("Stars must be 0-5");
    v.stars = st;
  }
  if (Object.keys(v).length) d.validation = v;

  return d;
}
