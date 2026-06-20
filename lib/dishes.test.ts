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
    cuisine: "american",
    dishType: "main",
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
    validation: { triedBy: "friends", sourceUrl: "https://src", reviewCount: 2000, stars: 4.8 },
    injected: "drop",
  } as any);

  expect(d.title).toBe("Vegan Mac");
  expect(d.tags).toEqual(["bulk-prep"]);
  expect(d.ingredients).toEqual([
    { name: "Cashews", quantity: 1.5, unit: "cup", id: "en:cashew" },
    { name: "Salt", quantity: null, unit: "bogus" },
  ]);
  expect(d.cost).toBe(1.85);
  expect(d.validation).toEqual({ triedBy: "friends", sourceUrl: "https://src", reviewCount: 2000, stars: 4.8 });
  expect((d as any).injected).toBeUndefined();
});

test("buildDishData validates email, url, number ranges", () => {
  expect(() => buildDishData({ title: "x", submittedBy: { email: "nope" } } as any)).toThrow(/email/i);
  expect(() => buildDishData({ title: "x", resourceLink: "not a url" } as any)).toThrow(/url|link/i);
  expect(() => buildDishData({ title: "x", cost: -1 } as any)).toThrow(/cost/i);
  expect(() => buildDishData({ title: "x", validation: { stars: 9 } } as any)).toThrow(/star/i);
});

test("buildDishData drops invalid triedBy but keeps the rest", () => {
  const d = buildDishData({ title: "x", validation: { triedBy: "bogus", reviewCount: 5 } } as any);
  expect(d.validation).toEqual({ reviewCount: 5 });
});

test("buildDishData keeps non-empty steps as a string array", () => {
  expect(buildDishData({ title: "x", steps: ["Boil water", "  ", "Add pasta"] } as any).steps)
    .toEqual(["Boil water", "Add pasta"]);
  expect("steps" in buildDishData({ title: "x", steps: ["", "   "] } as any)).toBe(false);
});
