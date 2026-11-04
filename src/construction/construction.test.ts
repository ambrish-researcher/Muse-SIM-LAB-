import { describe, expect, it } from "vitest";
import {
  BLUEPRINTS,
  INITIAL_HOLD,
  stageDuration,
  constructionAt,
} from "./blueprints";

describe("progressive construction", () => {
  for (const [lab, count] of [
    ["wonder", 22],
    ["chip", 20],
    ["robot", 32],
  ] as const) {
    it(`${lab} begins empty and attaches ${count} distinct ordered stages`, () => {
      const parts = BLUEPRINTS[lab];
      expect(parts).toHaveLength(count);
      expect(new Set(parts.map((p) => p.id)).size).toBe(count);
      expect(constructionAt(lab, 0, false).introduced).toBe(0);
      expect(constructionAt(lab, INITIAL_HOLD - 0.01, false).introduced).toBe(
        0,
      );
      parts.forEach((part, i) => {
        expect(part.name.length).toBeGreaterThan(4);
        expect(part.levels.engineering.length).toBeGreaterThan(40);
        expect(part.levels.research.length).toBeGreaterThan(40);
        expect(part.relationship.length).toBeGreaterThan(10);
        if (part.parent)
          expect(parts.slice(0, i).some((p) => p.id === part.parent)).toBe(
            true,
          );
        const t = INITIAL_HOLD + i * stageDuration(false) + 0.02;
        expect(constructionAt(lab, t, false).introduced).toBe(i + 1);
        expect(constructionAt(lab, t, false).attached).toBe(i);
      });
      const done = constructionAt(lab, 1000, false);
      expect(done.complete).toBe(true);
      expect(done.attached).toBe(count);
      // Restart is a fresh clock, including the empty hold; no preserved complete model.
      expect(constructionAt(lab, 0, false).introduced).toBe(0);
    });
    it(`${lab} reduced motion still introduces parts separately`, () => {
      const a = constructionAt(lab, INITIAL_HOLD + 0.01, true);
      expect(a.introduced).toBe(1);
      expect(a.complete).toBe(false);
      expect(
        constructionAt(
          lab,
          INITIAL_HOLD + stageDuration(true) * count + 0.1,
          true,
        ).complete,
      ).toBe(true);
    });
  }
});
