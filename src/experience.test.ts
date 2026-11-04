import { it, expect } from "vitest";
import { LABS, tokenVectors } from "./content";
it("provides three distinct guided labs with meaningful replay chapters", () => {
  expect(LABS.map((l) => l.id)).toEqual(["wonder", "chip", "robot"]);
  for (const lab of LABS) {
    expect(lab.steps.length).toBeGreaterThanOrEqual(3);
    expect(lab.steps.every((s) => s.title && s.body)).toBe(true);
  }
});
it("creates reproducible two-dimensional teaching embeddings", () => {
  expect(tokenVectors(["design", "reality"])).toEqual(
    tokenVectors(["design", "reality"]),
  );
  expect(tokenVectors(["a", "b"])).toHaveLength(2);
});
