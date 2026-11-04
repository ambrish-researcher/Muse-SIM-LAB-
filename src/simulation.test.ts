import { describe, it, expect } from "vitest";
import {
  multiply,
  attention,
  findPath,
  routePrompt,
  robotArmPose,
} from "./simulation";
describe("working numerical demonstrations", () => {
  it("multiplies a hand-checked 2x2 fixture", () =>
    expect(
      multiply(
        [
          [1, 2],
          [3, 4],
        ],
        [
          [5, 6],
          [7, 8],
        ],
      ),
    ).toEqual([
      [19, 22],
      [43, 50],
    ]));
  it("rejects incompatible matrix dimensions", () =>
    expect(() => multiply([[1, 2]], [[1, 2]])).toThrow());
  it("normalizes scaled dot-product attention and computes weighted values", () => {
    const r = attention(
      [[0, 0]],
      [
        [1, 0],
        [0, 1],
      ],
      [
        [2, 4],
        [6, 8],
      ],
    );
    expect(r.weights[0]).toEqual([0.5, 0.5]);
    expect(r.output).toEqual([[4, 6]]);
  });
  it("is stable for large attention scores", () => {
    const r = attention(
      [[1000, 1000]],
      [
        [1000, 1000],
        [0, 0],
      ],
      [[1], [2]],
    );
    expect(r.output[0][0]).toBe(1);
  });
  it("finds a shortest cardinal path around an obstacle", () => {
    const p = findPath([0, 0], [2, 0], new Set(["1,0"]), 3);
    expect(p).toHaveLength(5);
    expect(p).not.toContainEqual([1, 0]);
    expect(p.at(-1)).toEqual([2, 0]);
  });
  it("returns no path for an enclosed goal", () =>
    expect(findPath([0, 0], [2, 2], new Set(["1,2", "2,1"]), 3)).toEqual([]));
  it("routes lab intents and leaves unknown prompts unassigned", () => {
    expect(routePrompt("robot path planning")).toBe("robot");
    expect(routePrompt("chip matrix")).toBe("chip");
    expect(routePrompt("transformer attention")).toBe("wonder");
    expect(routePrompt("hello")).toBe(null);
  });
  it("routes the suggested plural matrix prompt", () =>
    expect(routePrompt("multiply matrices")).toBe("chip"));
  it("places the robot hand at the pickup and receiving platform using two-link kinematics", () => {
    for (const [p, y, z] of [
      [0.3, 0.65, 0.18],
      [0.78, 0.9, 0.52],
    ]) {
      const pose = robotArmPose(p);
      const actualY =
        1.57 -
        0.49 * Math.cos(pose.shoulder) -
        0.46 * Math.cos(pose.shoulder + pose.elbow);
      const actualZ =
        0.49 * Math.sin(pose.shoulder) +
        0.46 * Math.sin(pose.shoulder + pose.elbow);
      expect(actualY).toBeCloseTo(y, 5);
      expect(actualZ).toBeCloseTo(z, 5);
    }
  });
});
