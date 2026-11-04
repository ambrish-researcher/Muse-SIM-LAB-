import { describe, it, expect } from "vitest";
import {
  tinyTransformer,
  retrieveMemory,
  advanceAgent,
  seedAgent,
  quantize,
  makeMatrix,
  tiledMultiply,
  solveFabrik,
  planSearch,
  seedRobot,
  stepRobot,
  routeIntent,
  editObstacle,
} from "./advanced";
describe("master specification computational spine", () => {
  it("exposes actual token IDs, position terms and pre-normalization projections", () => {
    const t = tinyTransformer("abc a");
    expect(t.tokenIds).toEqual([96354, 97]);
    expect(t.positions).toEqual([0, 1]);
    expect(t.embeddings[0][0]).toBeCloseTo(
      t.tokenEmbeddings[0][0] + t.positional[0][0],
    );
    expect(t.projection[0]).toHaveLength(4);
    expect(t.heads[0].scores[1][0]).toBeCloseTo(
      t.heads[0].rawScores[1][0] / Math.sqrt(2),
    );
  });
  it("shares protected obstacle edits and route invalidation between world and grid", () => {
    const r = seedRobot();
    expect(editObstacle(r, r.cell)).toBe(r);
    expect(editObstacle(r, r.target)).toBe(r);
    const changed = editObstacle({ ...r, phase: "NAVIGATE" }, [1, 0]);
    expect(changed.blocked).toContain("1,0");
    expect(changed.phase).toBe("PLAN_PATH");
    expect(changed.replans).toBe(1);
    expect(editObstacle(changed, [1, 0]).blocked).not.toContain("1,0");
  });
  it("executes real local validation before and after the agent revises its synthetic input guard", () => {
    let a = seedAgent();
    for (let i = 0; i < 7; i++) a = advanceAgent(a);
    expect(a.validation.map((x) => x.passed)).toEqual([false, true]);
    expect(a.guard).toBe(true);
  });
  it("halts on an occupied current cell and records the rejected collision", () => {
    const r = stepRobot({
      ...seedRobot(),
      phase: "NAVIGATE",
      blocked: ["0,0"],
    });
    expect(r.phase).toBe("FAILED");
    expect(r.collisions).toBe(1);
  });
  it("runs a causal deterministic transformer including projections, norm, FFN and logits", () => {
    const x = tinyTransformer("design reality");
    expect(x.tokens).toEqual(["design", "reality"]);
    expect(x.heads).toHaveLength(2);
    expect(x.heads[0].weights[0][1]).toBe(0);
    expect(x.probabilities.reduce((a, b) => a + b, 0)).toBeCloseTo(1, 10);
    expect(x.logits).toEqual(tinyTransformer("design reality").logits);
    expect(x.q).not.toEqual(x.embeddings);
    expect(x.hidden.flat().every(Number.isFinite)).toBe(true);
  });
  it("retrieves relevant synthetic facts and filters unrelated facts", () => {
    const r = retrieveMemory(
      [
        "The robot target is blue",
        "The chip uses tiled matrices",
        "The robot destination is table B",
      ],
      "robot target",
    );
    expect(r[0].text).toBe("The robot target is blue");
    expect(r.every((x) => x.score > 0)).toBe(true);
  });
  it("recovers from a controlled agent failure and waits for approval", () => {
    let s = seedAgent();
    for (let i = 0; i < 12; i++) s = advanceAgent(s);
    expect(s.events.some((x) => x.includes("failed"))).toBe(true);
    expect(s.status).toBe("approval");
    expect(advanceAgent(s).status).toBe("approval");
    expect(advanceAgent(s, true).status).toBe("complete");
  });
  it("computes seeded tiled products and actual per-cell operation records", () => {
    const r = tiledMultiply(
      [
        [1, 2],
        [3, 4],
      ],
      [
        [5, 6],
        [7, 8],
      ],
      1,
    );
    expect(r.product).toEqual([
      [19, 22],
      [43, 50],
    ]);
    expect(r.operations).toHaveLength(8);
    expect(r.operations.at(-1)?.sum).toBe(50);
    expect(makeMatrix(4, 3)).toEqual(makeMatrix(4, 3));
  });
  it("measures symmetric quantization reconstruction error", () => {
    const q = quantize([-0.7, 0.1, 1], 4);
    expect(q.values[2]).toBe(1);
    expect(q.error).toBeGreaterThan(0);
    expect(q.bits).toBe(4);
    expect(q.scale).toBeCloseTo(1 / 7);
  });
  it("solves a reachable FABRIK chain preserving link lengths and detects an unreachable target", () => {
    const r = solveFabrik(
      [
        [0, 0, 0],
        [0, 1, 0],
        [0, 2, 0],
      ],
      [1, 1, 0],
    );
    expect(r.reachable).toBe(true);
    expect(
      Math.hypot(...r.points[2].map((v, i) => v - [1, 1, 0][i])),
    ).toBeLessThan(0.005);
    expect(
      solveFabrik(
        [
          [0, 0, 0],
          [0, 1, 0],
          [0, 2, 0],
        ],
        [5, 0, 0],
      ).reachable,
    ).toBe(false);
  });
  it("retains A* visited/frontier evidence and reports failure", () => {
    const r = planSearch([0, 0], [2, 0], new Set(["1,0"]), 3);
    expect(r.path).toHaveLength(5);
    expect(r.visited.length).toBeGreaterThan(0);
    expect(planSearch([0, 0], [2, 2], new Set(["1,2", "2,1"]), 3).path).toEqual(
      [],
    );
  });
  it("runs a checked robot pick, carry and place sequence from a deterministic seed", () => {
    let s = seedRobot();
    for (let i = 0; i < 180; i++) {
      s = stepRobot(s);
      if (s.phase === "COMPLETE") break;
    }
    expect(s.phase).toBe("COMPLETE");
    expect(s.objectState).toBe("placed");
    expect(s.travelled).toBeGreaterThan(0);
    expect(s.events.some((x) => x.includes("VERIFY_GRASP"))).toBe(true);
  });
  it("fails honestly for missing targets and invalid grasps", () => {
    const s = seedRobot();
    expect(
      stepRobot({ ...s, phase: "PERCEIVE", targetPresent: false }).failure,
    ).toBe("Missing target");
    expect(
      stepRobot({ ...s, phase: "VERIFY_GRASP", graspDistance: 4 }).phase,
    ).toBe("FAILED");
  });
  it("routes supported English and Thanglish without accepting unrelated machines", () => {
    expect(routeIntent("wonder eppadi velai seiyum")).toBe("wonder");
    expect(routeIntent("simulate MTIA400")).toBe("chip");
    expect(routeIntent("build Max from start")).toBe("robot");
    expect(routeIntent("simulate an Nvidia H100")).toBe(null);
    expect(routeIntent("chip and robot")).toBe("ambiguous");
  });
});
