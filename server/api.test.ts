import { it, expect } from "vitest";
import {
  RequestSchema,
  validatePlan,
  offlineReply,
  estimateReservation,
  inferenceApproved,
} from "./service";
it("requires explicit paid-test approval as well as a configured credential", () => {
  expect(inferenceApproved("configured-key", undefined)).toBe(false);
  expect(inferenceApproved("configured-key", "false")).toBe(false);
  expect(inferenceApproved("", "true")).toBe(false);
  expect(inferenceApproved("configured-key", "true")).toBe(true);
});
it("disables paid calls for non-finite token or price configuration", () => {
  expect(estimateReservation(100, 1200, NaN, 2)).toBe(null);
  expect(estimateReservation(100, Infinity, 1, 2)).toBe(null);
});
it("rejects oversized and unsupported requests", () => {
  expect(RequestSchema.safeParse({ prompt: "x".repeat(2001) }).success).toBe(
    false,
  );
  expect(RequestSchema.safeParse({ prompt: "why", lab: "h100" }).success).toBe(
    false,
  );
});
it("rejects generated executable actions and unknown scene identifiers", () => {
  expect(() =>
    validatePlan(
      {
        lab: "chip",
        sceneId: "MTIA-99",
        narration: "hello",
        focusTargets: [],
        animationActions: ["eval"],
      },
      "chip",
    ),
  ).toThrow();
});
it("returns honest curated fallback without an API credential", () => {
  const r = offlineReply({
    prompt: "explain attention",
    lab: "wonder",
    chapter: 2,
    level: "research",
  });
  expect(r.source).toBe("offline");
  expect(r.sceneId).toBe("MW-03");
  expect(r.narration).toContain("causal");
});
it("reserves cost conservatively and refuses unknown pricing", () => {
  expect(estimateReservation(1000, 1200, 1, 2)).toBeCloseTo(0.0034);
  expect(estimateReservation(1000, 1200, 0, 0)).toBe(null);
});
