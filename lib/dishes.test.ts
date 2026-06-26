import { test, expect } from "bun:test";
import { CUISINES, DISH_TYPES, ALLERGENS, UNITS, TRIED_BY, buildDishData } from "./dishes";

test("allowed sets are frozen lists", () => {
  expect(TRIED_BY).toEqual(["just_me", "friends", "family", "strangers", "a_lot"]);
  expect(UNITS).toContain("cup");
});

test("buildDishData requires a title", () => {
  expect(() => buildDishData({ title: "" } as any)).toThrow(/title/i);
  expect(() => buildDishData({} as any)).toThrow(/title/i);
});

test("buildDishData keeps only allowed fields and normalizes ingredients", () => {
  const d = buildDishData({
    title: "  Vegan Mac  ",
    description: "Cheesy",
    cuisines: ["american", "italian"],
    dishType: ["main"],
    tags: ["bulk-prep", "  "],
    ingredients: [
      { name: " Cashews ", quantity: 1.5, unit: "cup", id: "en:cashew" },
      { name: "", quantity: 2, unit: "g" },
      { name: "Salt", quantity: "x" as any, unit: "bogus" },
    ],
    allergens: ["nuts", "gluten"],
    cost: 1.85,
    resourceLink: "https://example.com/r",
    notes: "verify",
    submittedBy: { name: "VA", email: "va@example.com" },
    validation: { triedBy: ["friends", "bogus"], reviewCount: 2000, rating: 8, ratingScale: 10 },
    injected: "drop",
  } as any);

  expect(d.title).toBe("Vegan Mac");
  expect(d.cuisines).toEqual(["american", "italian"]);
  expect(d.tags).toEqual(["bulk-prep"]);
  expect(d.dishType).toEqual(["main"]);
  expect(d.ingredients).toEqual([
    { name: "Cashews", quantity: 1.5, unit: "cup", id: "en:cashew" },
    { name: "Salt", quantity: null, unit: "bogus" },
  ]);
  expect(d.cost).toBe(1.85);
  expect(d.validation).toEqual({ triedBy: ["friends"], reviewCount: 2000, rating: 8, ratingScale: 10 });
  expect((d as any).injected).toBeUndefined();
});

test("buildDishData validates email, url, number ranges", () => {
  expect(() => buildDishData({ title: "x", submittedBy: { email: "nope" } } as any)).toThrow(/email/i);
  expect(() => buildDishData({ title: "x", resourceLink: "not a url" } as any)).toThrow(/url|link/i);
  expect(() => buildDishData({ title: "x", cost: -1 } as any)).toThrow(/cost/i);
  expect(() => buildDishData({ title: "x", validation: { rating: 9, ratingScale: 5 } } as any)).toThrow(/rating/i);
});

test("buildDishData drops invalid triedBy but keeps the rest", () => {
  const d = buildDishData({ title: "x", validation: { triedBy: ["bogus"], reviewCount: 5 } } as any);
  expect(d.validation).toEqual({ reviewCount: 5 });
});

test("buildDishData keeps non-empty steps as a string array", () => {
  expect(buildDishData({ title: "x", steps: ["Boil water", "  ", "Add pasta"] } as any).steps)
    .toEqual(["Boil water", "Add pasta"]);
  expect("steps" in buildDishData({ title: "x", steps: ["", "   "] } as any)).toBe(false);
});

test("UNITS includes the newly added units", () => {
  for (const u of ["mg", "fl_oz", "pt", "qt", "gallon", "stick", "mm", "cm", "inch", "splash", "cube"]) {
    expect(UNITS as readonly string[]).toContain(u);
  }
});

// ── Ingredient sections (multi-part recipes), backwards-compatible with legacy rows ──

test("buildDishData backwards-compat: a legacy row with no section is unchanged", () => {
  const d = buildDishData({ title: "x", ingredients: [{ name: "Flour", quantity: 2, unit: "cup" }] } as any);
  expect(d.ingredients).toEqual([{ name: "Flour", quantity: 2, unit: "cup" }]);
  expect("section" in (d.ingredients as any[])[0]).toBe(false);
});

test("buildDishData preserves section when present, omits when empty", () => {
  const d = buildDishData({
    title: "x",
    ingredients: [
      { name: "Tofu", quantity: 400, unit: "g", section: "  Main  " },
      { name: "Salt", quantity: null, unit: "to_taste", section: "   " },
    ],
  } as any);
  expect((d.ingredients as any[])[0].section).toBe("Main");
  expect("section" in (d.ingredients as any[])[1]).toBe(false);
});
