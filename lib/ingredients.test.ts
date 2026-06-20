import { test, expect } from "bun:test";
import { normalize, slug, buildSearchText, decideAdd } from "./ingredients";

test("normalize collapses spacing/hyphens/case and light plural", () => {
  expect(normalize("Soy Milk")).toBe(normalize("soymilk"));
  expect(normalize("soya-milk")).toBe("soyamilk");
  expect(normalize("Peaches")).toBe("peache".replace(/e$/, "e"));
});

test("normalize maps simple plural to singular-ish key", () => {
  expect(normalize("peaches")).toBe(normalize("peache"));
  expect(normalize("cashews")).toBe(normalize("cashew"));
});

test("slug is url/id-safe", () => {
  expect(slug("Beyond Meat!")).toBe("beyond-meat");
  expect(slug("  Olive   Oil ")).toBe("olive-oil");
});

test("buildSearchText lowercases name + synonyms", () => {
  expect(buildSearchText("Tofu", ["Bean Curd", "Tofus"])).toBe("tofu bean curd tofus");
});

test("decideAdd reuses an existing entry with the same norm_key", () => {
  const existing = new Map([[normalize("soy milk"), "en:soy-milk"]]);
  expect(decideAdd("Soymilk", existing)).toEqual({ action: "reuse", id: "en:soy-milk" });
});

test("decideAdd creates a custom id when no norm_key match", () => {
  expect(decideAdd("Beyond Meat", new Map())).toEqual({ action: "create", id: "custom:beyond-meat" });
});
