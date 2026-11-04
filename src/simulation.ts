export type LabId = "wonder" | "chip" | "robot";
export type Cell = [number, number];
export function robotArmPose(progress: number) {
  const p = Math.max(0, Math.min(1, progress));
  const stops = [
    [0, 0.62, 0],
    [0.3, 0.65, 0.18],
    [0.55, 1.05, 0.25],
    [0.78, 0.9, 0.52],
    [1, 0.62, 0],
  ];
  const i = Math.min(
    3,
    Math.max(
      0,
      stops.findIndex((s, j) => j < 4 && p >= s[0] && p <= stops[j + 1][0]),
    ),
  );
  const t = (p - stops[i][0]) / (stops[i + 1][0] - stops[i][0]);
  const y = stops[i][1] + (stops[i + 1][1] - stops[i][1]) * t,
    z = stops[i][2] + (stops[i + 1][2] - stops[i][2]) * t;
  const down = 1.57 - y,
    d = Math.min(0.95, Math.hypot(down, z));
  const clamp = (v: number) => Math.max(-1, Math.min(1, v));
  return {
    shoulder:
      Math.atan2(z, down) -
      Math.acos(clamp((d * d + 0.49 * 0.49 - 0.46 * 0.46) / (2 * d * 0.49))),
    elbow: Math.acos(
      clamp((d * d - 0.49 * 0.49 - 0.46 * 0.46) / (2 * 0.49 * 0.46)),
    ),
  };
}
export function multiply(a: number[][], b: number[][]): number[][] {
  if (
    !a.length ||
    !b.length ||
    a[0].length !== b.length ||
    a.some((r) => r.length !== a[0].length) ||
    b.some((r) => r.length !== b[0].length)
  )
    throw new Error("Incompatible matrix dimensions");
  return a.map((row) =>
    b[0].map((_, j) => row.reduce((sum, x, k) => sum + x * b[k][j], 0)),
  );
}
export function attention(q: number[][], k: number[][], v: number[][]) {
  const scores = multiply(
    q,
    k[0].map((_, j) => k.map((row) => row[j])),
  ).map((row) => row.map((x) => x / Math.sqrt(k[0].length)));
  const weights = scores.map((row) => {
    const max = Math.max(...row);
    const e = row.map((x) => Math.exp(x - max));
    const sum = e.reduce((a, b) => a + b, 0);
    return e.map((x) => x / sum);
  });
  return { scores, weights, output: multiply(weights, v) };
}
export function routePrompt(s: string): LabId | null {
  if (/robot|path|obstacle|humanoid|manipulat/i.test(s)) return "robot";
  if (/chip|matrix|matrices|multiply|mtia|silicon|memory bandwidth/i.test(s))
    return "chip";
  if (
    /attention|transformer|architect|memory|wonder|intelligence|neural/i.test(s)
  )
    return "wonder";
  return null;
}
export function findPath(
  start: Cell,
  goal: Cell,
  blocked: Set<string>,
  size = 8,
): Cell[] {
  const key = (c: Cell) => c.join(",");
  const h = (c: Cell) => Math.abs(c[0] - goal[0]) + Math.abs(c[1] - goal[1]);
  if (blocked.has(key(start)) || blocked.has(key(goal))) return [];
  const open: Cell[] = [start],
    g = new Map([[key(start), 0]]),
    parent = new Map<string, Cell>(),
    closed = new Set<string>();
  while (open.length) {
    open.sort((a, b) => g.get(key(a))! + h(a) - (g.get(key(b))! + h(b)));
    const c = open.shift()!;
    if (key(c) === key(goal)) {
      const path: Cell[] = [c];
      while (parent.has(key(path[0]))) path.unshift(parent.get(key(path[0]))!);
      return path;
    }
    closed.add(key(c));
    for (const [dx, dy] of [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ]) {
      const n: Cell = [c[0] + dx, c[1] + dy],
        nk = key(n);
      if (
        n.some((x) => x < 0 || x >= size) ||
        blocked.has(nk) ||
        closed.has(nk)
      )
        continue;
      const cost = g.get(key(c))! + 1;
      if (cost < (g.get(nk) ?? Infinity)) {
        g.set(nk, cost);
        parent.set(nk, c);
        if (!open.some((x) => key(x) === nk)) open.push(n);
      }
    }
  }
  return [];
}
