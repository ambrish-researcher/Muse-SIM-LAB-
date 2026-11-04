import { it, expect } from "vitest";
import { MANIFESTS, chapterSnapshot, canTransition } from "./manifest";
it("contains every specified authored scene and explanation level", () => {
  expect(MANIFESTS.wonder).toHaveLength(8);
  expect(MANIFESTS.chip).toHaveLength(10);
  expect(MANIFESTS.robot).toHaveLength(12);
  for (const list of Object.values(MANIFESTS))
    for (const s of list) {
      expect(s.levels.beginner.length).toBeGreaterThan(20);
      expect(s.levels.engineering.length).toBeGreaterThan(20);
      expect(s.levels.research.length).toBeGreaterThan(20);
      expect(s.camera).toHaveLength(3);
    }
});
it("reconstructs deterministic timeline snapshots and rejects invalid phase jumps", () => {
  expect(chapterSnapshot("chip", 0.53)).toEqual(chapterSnapshot("chip", 0.53));
  expect(canTransition("INTRO", "GATEWAY")).toBe(true);
  expect(canTransition("LOADING", "RESULTS")).toBe(false);
});
