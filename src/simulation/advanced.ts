import { multiply, findPath } from "../simulation.ts";
import type { Cell, LabId } from "../simulation.ts";
export type V3 = [number, number, number];
const dot = (a: number[], b: number[]) =>
  a.reduce((s, v, i) => s + v * b[i], 0);
export function makeMatrix(n: number, seed = 1) {
  return Array.from({ length: n }, (_, i) =>
    Array.from(
      { length: n },
      (_, j) => (((i * 37 + j * 13 + seed * 17) % 19) - 9) / 3,
    ),
  );
}
const softmax = (a: number[]) => {
  const e = a.map((x) => Math.exp(x - Math.max(...a))),
    s = e.reduce((x, y) => x + y, 0);
  return e.map((x) => x / s);
};
const norm = (a: number[]) => {
  const mean = a.reduce((x, y) => x + y, 0) / a.length,
    variance = a.reduce((s, x) => s + (x - mean) ** 2, 0) / a.length;
  return a.map((x) => (x - mean) / Math.sqrt(variance + 1e-5));
};
const project = (a: number[][], seed: number) =>
  multiply(
    a,
    makeMatrix(4, seed).map((row) => row.map((x) => x / 4)),
  );
export function tinyTransformer(text: string) {
  const tokens = (
    text.toLowerCase().match(/[\p{L}\p{N}]+|[^\s\p{L}\p{N}]/gu) ?? ["design"]
  ).slice(0, 8);
  const vocabulary = [
    "design",
    "intelligence",
    "simulate",
    "reality",
    "learn",
    "build",
    "systems",
    "together",
  ];
  const tokenIds = tokens.map((t) => {
    let h = 0;
    for (const c of t) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    return h;
  });
  const positions = tokens.map((_, i) => i);
  const tokenEmbeddings = tokenIds.map((h) =>
    Array.from({ length: 4 }, (_, j) => (((h >>> (j * 3)) % 23) - 11) / 11),
  );
  const positional = positions.map((i) =>
    Array.from({ length: 4 }, (_, j) =>
      j % 2 ? Math.cos(i / 10 ** (j / 4)) : Math.sin(i / 10 ** (j / 4)),
    ),
  );
  const embeddings = tokenEmbeddings.map((row, i) =>
    row.map((v, j) => v + positional[i][j]),
  );
  const q = project(embeddings, 2),
    k = project(embeddings, 3),
    v = project(embeddings, 5);
  const heads = [0, 1].map((head) => {
    const qs = q.map((x) => x.slice(head * 2, head * 2 + 2)),
      ks = k.map((x) => x.slice(head * 2, head * 2 + 2)),
      vs = v.map((x) => x.slice(head * 2, head * 2 + 2));
    const rawScores = qs.map((row, i) =>
      ks.map((key, j) => (j > i ? -Infinity : dot(row, key))),
    );
    const scores = rawScores.map((row) => row.map((v) => v / Math.sqrt(2)));
    const weights = scores.map(softmax);
    return { rawScores, scores, weights, output: multiply(weights, vs) };
  });
  const concat = heads[0].output.map((row, i) =>
    row.concat(heads[1].output[i]),
  );
  const projection = project(concat, 7);
  const residual = projection.map((row, i) =>
    norm(row.map((x, j) => x + embeddings[i][j])),
  );
  const ffn = project(residual, 11).map((row) =>
    row.map((x) => Math.max(0, x)),
  );
  const hidden = project(ffn, 13).map((row, i) =>
    norm(row.map((x, j) => x + residual[i][j])),
  );
  const last = hidden.at(-1)!;
  const logits = vocabulary.map((_, i) =>
    dot(
      last,
      Array.from({ length: 4 }, (_, j) => Math.sin((i + 1) * (j + 2)) * 0.7),
    ),
  );
  const probabilities = softmax(logits);
  const next = vocabulary[probabilities.indexOf(Math.max(...probabilities))];
  return {
    tokens,
    tokenIds,
    positions,
    tokenEmbeddings,
    positional,
    projection,
    vocabulary,
    embeddings,
    q,
    k,
    v,
    heads,
    residual,
    ffn,
    hidden,
    logits,
    probabilities,
    next,
  };
}
export function retrieveMemory(facts: string[], query: string) {
  const terms = (s: string) =>
    new Set(s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []);
  const q = terms(query);
  return facts
    .map((text, id) => {
      const t = terms(text),
        intersection = [...q].filter((w) => t.has(w)).length;
      return {
        id,
        text,
        score: intersection / Math.max(1, new Set([...q, ...t]).size),
      };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);
}
export type AgentState = {
  step: number;
  status: "running" | "approval" | "complete";
  events: string[];
  failed: boolean;
  guard: boolean;
  validation: {
    passed: boolean;
    cases: { input: string; expected: boolean; actual: boolean }[];
  }[];
};
export const seedAgent = (): AgentState => ({
  step: 0,
  status: "running",
  events: ["Goal: add a validated search field"],
  failed: false,
  guard: false,
  validation: [],
});
export function advanceAgent(s: AgentState, approve = false): AgentState {
  if (s.status === "complete") return s;
  if (s.status === "approval")
    return approve
      ? {
          ...s,
          status: "complete",
          events: [
            ...s.events,
            "User approved. Demo patch published to the synthetic workspace.",
          ],
        }
      : s;
  const steps = [
    "Interpret requirements",
    "Plan safe local actions",
    "Select synthetic test tool",
    "Validation failed: empty query accepted",
    "Revise input guard",
    "Re-run: validation passed",
    "Request user approval",
  ];
  const step = s.step + 1;
  const guard = step === 5 ? true : s.guard;
  const cases = ["", "find a chip"].map((input) => ({
    input,
    expected: input.trim().length > 0,
    actual: guard ? input.trim().length > 0 : true,
  }));
  const validation =
    step === 4 || step === 6
      ? [
          ...s.validation,
          { passed: cases.every((c) => c.expected === c.actual), cases },
        ]
      : s.validation;
  return {
    ...s,
    step,
    status: step >= 7 ? "approval" : "running",
    failed: s.failed || step === 4,
    guard,
    validation,
    events: [...s.events, steps[Math.min(s.step, 6)]],
  };
}
export function tiledMultiply(a: number[][], b: number[][], tile = 2) {
  const product = a.map(() => b[0].map(() => 0));
  const operations: {
    row: number;
    col: number;
    k: number;
    a: number;
    b: number;
    sum: number;
    tile: number;
  }[] = [];
  for (let ii = 0; ii < a.length; ii += tile)
    for (let jj = 0; jj < b[0].length; jj += tile)
      for (let kk = 0; kk < b.length; kk += tile)
        for (let i = ii; i < Math.min(ii + tile, a.length); i++)
          for (let j = jj; j < Math.min(jj + tile, b[0].length); j++)
            for (let k = kk; k < Math.min(kk + tile, b.length); k++) {
              product[i][j] += a[i][k] * b[k][j];
              operations.push({
                row: i,
                col: j,
                k,
                a: a[i][k],
                b: b[k][j],
                sum: product[i][j],
                tile:
                  Math.floor(ii / tile) * Math.ceil(b[0].length / tile) +
                  Math.floor(jj / tile),
              });
            }
  return { product, operations };
}
export function quantize(values: number[], bits: 4 | 8) {
  const max = Math.max(...values.map(Math.abs), 1e-9),
    range = 2 ** (bits - 1) - 1,
    scale = max / range;
  const codes = values.map((x) =>
    Math.max(-range, Math.min(range, Math.round(x / scale))),
  );
  const reconstructed = codes.map((x) => x * scale);
  return {
    bits,
    scale,
    codes,
    values: reconstructed,
    error: Math.sqrt(
      values.reduce((s, v, i) => s + (v - reconstructed[i]) ** 2, 0) /
        values.length,
    ),
    bytes: (values.length * bits) / 8,
  };
}
const distance = (a: number[], b: number[]) =>
  Math.hypot(...a.map((v, i) => v - b[i]));
export function solveFabrik(input: V3[], target: V3, iterations = 24) {
  const points = input.map((x) => [...x] as V3),
    root = [...input[0]] as V3,
    lengths = input.slice(1).map((p, i) => distance(p, input[i])),
    total = lengths.reduce((a, b) => a + b, 0);
  const reachable = distance(root, target) <= total;
  const toward = (a: V3, b: V3, l: number): V3 => {
    const d = distance(a, b) || 1;
    return a.map((x, i) => x + ((b[i] - x) * l) / d) as V3;
  };
  if (!reachable) {
    for (let i = 1; i < points.length; i++)
      points[i] = toward(points[i - 1], target, lengths[i - 1]);
    return { points, reachable, error: distance(points.at(-1)!, target) };
  }
  for (let n = 0; n < iterations; n++) {
    points[points.length - 1] = [...target];
    for (let i = points.length - 2; i >= 0; i--)
      points[i] = toward(points[i + 1], points[i], lengths[i]);
    points[0] = [...root];
    for (let i = 1; i < points.length; i++)
      points[i] = toward(points[i - 1], points[i], lengths[i - 1]);
    if (distance(points.at(-1)!, target) < 0.001) break;
  }
  return { points, reachable, error: distance(points.at(-1)!, target) };
}
export function planSearch(
  start: Cell,
  goal: Cell,
  blocked: Set<string>,
  size = 8,
) {
  const key = (p: Cell) => p.join(",");
  const h = (p: Cell) => Math.abs(p[0] - goal[0]) + Math.abs(p[1] - goal[1]);
  const path = findPath(start, goal, blocked, size),
    open: Cell[] = [start],
    visited: Cell[] = [],
    closed = new Set<string>(),
    cost = new Map([[key(start), 0]]);
  while (open.length) {
    open.sort((a, b) => cost.get(key(a))! + h(a) - (cost.get(key(b))! + h(b)));
    const p = open.shift()!;
    if (blocked.has(key(p)) || closed.has(key(p))) continue;
    closed.add(key(p));
    visited.push(p);
    if (key(p) === key(goal)) break;
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const q: Cell = [p[0] + dx, p[1] + dy];
      if (
        q.some((x) => x < 0 || x >= size) ||
        blocked.has(key(q)) ||
        closed.has(key(q))
      )
        continue;
      const g = cost.get(key(p))! + 1;
      if (g < (cost.get(key(q)) ?? Infinity)) {
        cost.set(key(q), g);
        if (!open.some((x) => key(x) === key(q))) open.push(q);
      }
    }
  }
  return { path, visited, frontier: open };
}
export type RobotPhase =
  | "IDLE"
  | "PERCEIVE"
  | "LOCATE_TARGET"
  | "PLAN_PATH"
  | "NAVIGATE"
  | "REACH"
  | "GRASP"
  | "VERIFY_GRASP"
  | "PLAN_DELIVERY"
  | "NAVIGATE_TO_DESTINATION"
  | "PLACE"
  | "VERIFY_PLACEMENT"
  | "COMPLETE"
  | "FAILED";
export type RobotState = {
  phase: RobotPhase;
  cell: Cell;
  target: Cell;
  delivery: Cell;
  goal: Cell;
  path: Cell[];
  blocked: string[];
  targetPresent: boolean;
  objectState: "waiting" | "held" | "placed";
  graspDistance: number;
  travelled: number;
  replans: number;
  collisions: number;
  time: number;
  events: string[];
  failure: string;
  reach: number;
  revision: number;
};
export const seedRobot = (): RobotState => ({
  phase: "IDLE",
  cell: [0, 0],
  target: [5, 2],
  delivery: [6, 6],
  goal: [5, 2],
  path: [],
  blocked: ["2,1", "2,2", "2,3", "4,4", "5,4"],
  targetPresent: true,
  objectState: "waiting",
  graspDistance: 0.03,
  travelled: 0,
  replans: 0,
  collisions: 0,
  time: 0,
  events: ["World initialized: 0.5 m cells, kinematic motion"],
  failure: "",
  reach: 0,
  revision: 0,
});
export function stepRobot(input: RobotState): RobotState {
  const s = {
    ...input,
    time: input.time + 0.25,
    revision: input.revision + 1,
    events: [...input.events],
  };
  const go = (p: RobotPhase) => {
    s.phase = p;
    s.events = [...s.events, p].slice(-100);
    return s;
  };
  const fail = (reason: string) => {
    s.failure = reason;
    return go("FAILED");
  };
  switch (s.phase) {
    case "IDLE":
      return go("PERCEIVE");
    case "PERCEIVE":
      return s.targetPresent ? go("LOCATE_TARGET") : fail("Missing target");
    case "LOCATE_TARGET":
      s.goal = s.target;
      return go("PLAN_PATH");
    case "PLAN_PATH":
    case "PLAN_DELIVERY": {
      const delivery = s.phase === "PLAN_DELIVERY";
      s.goal = delivery ? s.delivery : s.target;
      s.path = findPath(s.cell, s.goal, new Set(s.blocked));
      if (!s.path.length) return fail("No route available");
      return go(delivery ? "NAVIGATE_TO_DESTINATION" : "NAVIGATE");
    }
    case "NAVIGATE":
    case "NAVIGATE_TO_DESTINATION": {
      if (s.blocked.includes(s.cell.join(","))) {
        s.collisions++;
        return fail("Collision: current cell is occupied");
      }
      if (s.path.length <= 1)
        return go(s.phase === "NAVIGATE" ? "REACH" : "PLACE");
      const next = s.path[1];
      if (s.blocked.includes(next.join(","))) {
        s.replans++;
        return go(s.phase === "NAVIGATE" ? "PLAN_PATH" : "PLAN_DELIVERY");
      }
      s.cell = next;
      s.path = s.path.slice(1);
      s.travelled += 0.5;
      return s;
    }
    case "REACH":
      if (!s.targetPresent) return fail("Target moved or missing");
      if (distance(s.cell, s.target) > 0.01) return fail("Unreachable target");
      s.reach = Math.min(1, s.reach + 0.25);
      return s.reach >= 1 ? go("GRASP") : s;
    case "GRASP":
      {
        const solved = solveFabrik(
          [
            [0.43, 1.47, 0],
            [0.43, 1.08, 0],
            [0.43, 0.7, 0],
          ],
          [0.39, 0.74, 0.25],
        );
        const object: V3 = [
          (s.target[0] - s.cell[0]) * 0.7 + 0.4,
          0.75,
          (s.target[1] - s.cell[1]) * 0.7 + 0.25,
        ];
        s.graspDistance = distance(solved.points[2], object);
      }
      return go("VERIFY_GRASP");
    case "VERIFY_GRASP":
      if (s.graspDistance > 0.12) return fail("Invalid grasp distance");
      if (distance(s.cell, s.target) > 0.01) return fail("Object moved");
      s.objectState = "held";
      return go("PLAN_DELIVERY");
    case "PLACE":
      if (s.objectState !== "held") return fail("Object not held");
      if (distance(s.cell, s.delivery) > 0.01)
        return fail("Invalid placement distance");
      if (s.reach > 0) {
        s.reach = Math.max(0, s.reach - 0.25);
        return s;
      }
      s.objectState = "placed";
      s.reach = 0;
      return go("VERIFY_PLACEMENT");
    case "VERIFY_PLACEMENT":
      return s.objectState === "placed"
        ? go("COMPLETE")
        : fail("Placement not verified");
    default:
      return input;
  }
}
export function editObstacle(
  state: RobotState,
  cell: [number, number],
): RobotState {
  const key = cell.join(",");
  if (
    cell.some((v) => v < 0 || v > 7 || !Number.isInteger(v)) ||
    [state.cell, state.target, state.delivery].some((c) => c.join(",") === key)
  )
    return state;
  const navigating = /NAVIGATE/.test(state.phase);
  return {
    ...state,
    blocked: state.blocked.includes(key)
      ? state.blocked.filter((k) => k !== key)
      : [...state.blocked, key],
    replans: state.replans + (navigating ? 1 : 0),
    phase: navigating
      ? state.objectState === "held"
        ? "PLAN_DELIVERY"
        : "PLAN_PATH"
      : state.phase,
  };
}
export function routeIntent(prompt: string): LabId | "ambiguous" | null {
  const s = prompt.toLowerCase();
  if (/nvidia|h100|blackwell|amd|gpt|claude|airplane|car engine/.test(s))
    return null;
  const hits: LabId[] = [];
  if (
    /wonder|attention|transformer|active memory|active focus|நினை|கவனம்|muse eppadi/.test(
      s,
    )
  )
    hits.push("wonder");
  if (/mtia\s*400|mtia|chip|silicon|matri[xc]|multiply|சிப்/.test(s))
    hits.push("chip");
  if (/robot|max\b|humanoid|pathfinding|ரோபோ|robo/.test(s)) hits.push("robot");
  return hits.length > 1 ? "ambiguous" : (hits[0] ?? null);
}
