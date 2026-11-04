import { useMemo, useState, useRef, useEffect } from "react";
import { useData } from "./data";
import { useExperience } from "./store";
import {
  tinyTransformer,
  retrieveMemory,
  tiledMultiply,
  quantize,
  makeMatrix,
  seedRobot,
  editObstacle,
} from "../simulation/advanced";
import type { RobotState } from "../simulation/advanced";
import { findPath } from "../simulation";
export function WonderExperiment() {
  const d = useData();
  const [fact, setFact] = useState("");
  const t = useMemo(() => tinyTransformer(d.text), [d.text]);
  const q = Math.min(d.query, t.tokens.length - 1);
  const rows = retrieveMemory(d.facts, d.memoryQuery);
  return (
    <div className="experiment-content">
      <label>
        Context / maximum 8 tokens
        <input
          aria-label="Context tokens"
          value={d.text}
          maxLength={150}
          onChange={(e) =>
            d.set({ text: e.target.value || "design", query: 0 })
          }
        />
      </label>
      <div className="inline-fields">
        <label>
          Query
          <select
            aria-label="Query token"
            value={q}
            onChange={(e) => d.set({ query: Number(e.target.value) })}
          >
            {t.tokens.map((x, i) => (
              <option key={i} value={i}>
                {x}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() =>
            d.set({
              text: `${d.text} ${t.next}`,
              query: Math.min(7, t.tokens.length),
            })
          }
          disabled={t.tokens.length >= 8}
        >
          Generate token
        </button>
      </div>
      <p className="formula">softmax(QKᵀ / √2)V · two causal heads</p>
      <div className="bar-chart">
        {t.heads[0].weights[q].map((w, i) => (
          <div key={i}>
            <i style={{ height: `${w * 80 + 2}px` }} />
            <strong>{(w * 100).toFixed(1)}%</strong>
            <span>{t.tokens[i]}</span>
          </div>
        ))}
      </div>
      <p className="readout">
        Σ weights ={" "}
        {t.heads[0].weights[q].reduce((a, b) => a + b, 0).toFixed(4)}
        <br />
        Next token: <b>{t.next}</b>
      </p>
      <details>
        <summary>Inspect actual tensors</summary>
        {(
          [
            "tokenEmbeddings",
            "positional",
            "embeddings",
            "q",
            "k",
            "v",
            "projection",
            "residual",
            "ffn",
            "hidden",
          ] as const
        ).map((name) => (
          <div key={name}>
            <b>{name}</b>
            <pre>
              {t[name]
                .map((row) => row.map((v) => v.toFixed(3)).join(" "))
                .join("\n")}
            </pre>
          </div>
        ))}
        <b>Head 1 scores / masked future = −∞</b>
        <pre>
          {t.heads[0].scores[q]
            .map((v) => (Number.isFinite(v) ? v.toFixed(3) : "−∞"))
            .join(", ")}
        </pre>
        <b>Logits → probability</b>
        {t.vocabulary.map((word, i) => (
          <p key={word} className="tensor-line">
            {word} {t.logits[i].toFixed(3)} → {t.probabilities[i].toFixed(4)}
          </p>
        ))}
      </details>
      <h3>Synthetic Active Memory</h3>
      <p>Independent Jaccard retrieval demonstration.</p>
      <label>
        Retrieve relevant context
        <input
          aria-label="Memory query"
          value={d.memoryQuery}
          onChange={(e) => d.set({ memoryQuery: e.target.value })}
        />
      </label>
      <div className="memory-results">
        {rows.length ? (
          rows.map((x) => (
            <p key={x.id}>
              {x.text}
              <em>score {x.score.toFixed(3)}</em>
            </p>
          ))
        ) : (
          <p>No relevant facts. Try “robot target”.</p>
        )}
      </div>
      <div className="inline-fields">
        <input
          aria-label="New synthetic fact"
          placeholder="Add a synthetic fact"
          value={fact}
          maxLength={160}
          onChange={(e) => setFact(e.target.value)}
        />
        <button
          disabled={!fact.trim() || d.facts.length >= 12}
          onClick={() => {
            d.set({ facts: [...d.facts, fact.trim()] });
            setFact("");
          }}
        >
          Add fact
        </button>
      </div>
      <details>
        <summary>Inspect / edit stored facts ({d.facts.length})</summary>
        {d.facts.map((x, i) => (
          <div className="inline-fields" key={i}>
            <span>{x}</span>
            <button
              aria-label={`Remove fact ${i + 1}`}
              onClick={() =>
                d.set({ facts: d.facts.filter((_, j) => i !== j) })
              }
            >
              Remove
            </button>
          </div>
        ))}
      </details>
      <h3>Active Focus / safe agent</h3>
      <ol className="event-log">
        {d.agent.events.map((x, i) => (
          <li key={i} className={x.includes("failed") ? "warning" : ""}>
            {x}
          </li>
        ))}
      </ol>
      <div className="inline-fields">
        <button
          onClick={() => d.advanceAgent()}
          disabled={d.agent.status !== "running"}
        >
          Step agent
        </button>
        <button
          onClick={() => d.advanceAgent(true)}
          disabled={d.agent.status !== "approval"}
        >
          Approve demo action
        </button>
      </div>
      <p className="readout">
        {d.agent.status === "approval"
          ? "Waiting for approval before the synthetic publish action."
          : d.agent.status === "complete"
            ? "Safe workflow complete. No external code or publishing was executed."
            : "Step through a controlled failure and recovery."}
      </p>
      <p className="caveat">
        Toy transformer weights are fixed and untrained. This does not expose
        Muse Wonder’s hidden architecture or reasoning.
      </p>
    </div>
  );
}
export function ChipExperiment() {
  const worker = useRef<Worker | null>(null);
  useEffect(() => {
    if (typeof Worker === "undefined") return;
    const instance = new Worker(
      new URL("../simulation/compute.worker.ts", import.meta.url),
      { type: "module" },
    );
    worker.current = instance;
    instance.onmessage = (e) => setMeasured(e.data.ms);
    return () => {
      instance.terminate();
      worker.current = null;
    };
  }, []);
  const d = useData(),
    result = useMemo(
      () => tiledMultiply(d.matrixA, d.matrixB, d.tile),
      [d.matrixA, d.matrixB, d.tile],
    );
  const active = result.operations[d.op],
    q = quantize(d.matrixA.flat(), d.bits);
  const [measured, setMeasured] = useState<number | null>(null);
  return (
    <div className="experiment-content">
      <div className="inline-fields">
        <label>
          Matrix size
          <select
            aria-label="Matrix size"
            value={d.matrixA.length}
            onChange={(e) => {
              const n = Number(e.target.value);
              d.set({
                matrixA: makeMatrix(n, 1),
                matrixB: makeMatrix(n, 2),
                op: -1,
                computeRunning: false,
              });
            }}
          >
            <option value="2">2 × 2</option>
            <option value="4">4 × 4</option>
          </select>
        </label>
        <label>
          Tile size
          <select
            aria-label="Tile size"
            value={d.tile}
            onChange={(e) =>
              d.set({
                tile: Number(e.target.value),
                op: -1,
                computeRunning: false,
              })
            }
          >
            <option value="1">1</option>
            <option value="2">2</option>
          </select>
        </label>
      </div>
      <div className="matrix-set">
        {[d.matrixA, d.matrixB, result.product].map((matrix, m) => (
          <div key={m}>
            <h4>{["A", "B", "C = A × B"][m]}</h4>
            <div
              className="matrix-numbers"
              style={{ gridTemplateColumns: `repeat(${matrix.length},1fr)` }}
            >
              {matrix.flatMap((row, i) =>
                row.map((v, j) =>
                  m < 2 ? (
                    <input
                      key={i * matrix.length + j}
                      type="number"
                      aria-label={`${m === 0 ? "A" : "B"} row ${i + 1} column ${j + 1}`}
                      value={Number(v.toFixed(2))}
                      min={-99}
                      max={99}
                      onChange={(e) => {
                        const next = matrix.map((line, ri) =>
                          line.map((x, c) =>
                            ri === i && c === j
                              ? Math.max(
                                  -99,
                                  Math.min(99, Number(e.target.value) || 0),
                                )
                              : x,
                          ),
                        );
                        d.set({
                          ...(m === 0 ? { matrixA: next } : { matrixB: next }),
                          op: -1,
                          computeRunning: false,
                        });
                      }}
                    />
                  ) : (
                    <output
                      key={i * matrix.length + j}
                      className={
                        active?.row === i && active?.col === j ? "hot" : ""
                      }
                    >
                      {v.toFixed(matrix.length === 2 ? 0 : 1)}
                    </output>
                  ),
                ),
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="inline-fields">
        <button
          className="accent"
          onClick={() => {
            worker.current?.postMessage({
              a: d.matrixA,
              b: d.matrixB,
              tile: d.tile,
            });
            const start = performance.now();
            tiledMultiply(d.matrixA, d.matrixB, d.tile);
            setMeasured(performance.now() - start);
            d.set({ op: 0, computeRunning: true });
            useExperience.getState().patch({ flow: true, explode: 0.8 });
          }}
        >
          Run compute
        </button>
        <button
          onClick={() =>
            d.set({
              op: Math.min(result.operations.length - 1, d.op + 1),
              computeRunning: false,
            })
          }
        >
          Step MAC
        </button>
        <button onClick={() => d.set({ op: -1, computeRunning: false })}>
          Reset
        </button>
      </div>
      <p>
        Operation {Math.max(0, d.op + 1)} / {result.operations.length}
      </p>
      <p className="readout" role="status">
        {active
          ? `C[${active.row + 1},${active.col + 1}] += ${active.a.toFixed(2)} × ${active.b.toFixed(2)} → ${active.sum.toFixed(3)}`
          : "Ready. Results are real browser calculations."}
      </p>
      {measured !== null && (
        <p>
          Local JS computation: {measured.toFixed(3)} ms. This is not MTIA
          hardware throughput.
        </p>
      )}
      <h3>Precision experiment</h3>
      <label>
        Educational quantizer
        <select
          aria-label="Quantization bits"
          value={d.bits}
          onChange={(e) => d.set({ bits: Number(e.target.value) as 4 | 8 })}
        >
          <option value="4">4-bit symmetric integer</option>
          <option value="8">8-bit symmetric integer</option>
        </select>
      </label>
      <p className="formula">
        q = round(x / scale), x̂ = q · scale
        <br />
        scale = max |x| / (2^(b−1) − 1)
      </p>
      <p className="readout">
        RMSE {q.error.toFixed(6)} · scale {q.scale.toFixed(6)}
        <br />
        Packed payload {q.bytes} bytes (scale metadata excluded)
      </p>
      <details>
        <summary>Original → reconstructed values</summary>
        <pre>
          {d.matrixA
            .flat()
            .map((x, i) => `${x.toFixed(3)} → ${q.values[i].toFixed(3)}`)
            .join("\n")}
        </pre>
      </details>
      <p className="caveat">
        FP8 and BF16 are floating-point formats; MX formats use shared scaling.
        This integer approximation demonstrates error tradeoffs and is not a
        bit-accurate hardware encoding.
      </p>
      <label>
        Illustrative workload
        <select
          aria-label="Workload"
          value={d.workload}
          onChange={(e) =>
            d.set({ workload: e.target.value as "compute" | "memory" })
          }
        >
          <option value="compute">Compute dominated</option>
          <option value="memory">Memory dominated</option>
        </select>
      </label>
    </div>
  );
}
export function RobotExperiment() {
  const d = useData(),
    r = d.robot;
  const change = (p: Partial<RobotState>) => d.set({ robot: { ...r, ...p } });
  const search = findPath(r.cell, r.goal, new Set(r.blocked));
  const toggle = (i: number) => {
    d.set({ robot: editObstacle(r, [i % 8, Math.floor(i / 8)]) });
  };
  return (
    <div className="experiment-content">
      <p className="readout" role="status">
        {r.phase.replaceAll("_", " ")}
        {r.failure && ` · ${r.failure}`}
      </p>
      <div className="occupancy" aria-label="Accessible obstacle grid">
        {Array.from({ length: 64 }, (_, i) => {
          const key = `${i % 8},${Math.floor(i / 8)}`,
            isRobot = r.cell.join(",") === key,
            target = r.target.join(",") === key,
            goal = r.delivery.join(",") === key;
          return (
            <button
              key={i}
              aria-label={`Cell ${(i % 8) + 1},${Math.floor(i / 8) + 1}`}
              aria-pressed={r.blocked.includes(key)}
              className={`${r.blocked.includes(key) ? "wall" : ""} ${search.some((x) => x.join(",") === key) ? "route" : ""}`}
              disabled={isRobot || target || goal}
              onClick={() => toggle(i)}
            >
              {isRobot
                ? "R"
                : target
                  ? "T"
                  : goal
                    ? "G"
                    : r.blocked.includes(key)
                      ? "×"
                      : "·"}
            </button>
          );
        })}
      </div>
      <div className="inline-fields">
        <button
          className="accent"
          onClick={() => {
            d.set({
              robotRunning: true,
              robot:
                r.phase === "FAILED"
                  ? { ...r, phase: "PERCEIVE", failure: "" }
                  : r,
            });
          }}
          disabled={r.phase === "COMPLETE"}
        >
          Run autonomous task
        </button>
        <button onClick={() => d.tickRobot()}>Step task</button>
        <button onClick={d.resetRobot}>Reset world</button>
      </div>
      <div className="inline-fields">
        <button onClick={() => change({ blocked: [] })}>Clear obstacles</button>
        <button
          onClick={() => {
            const robot = seedRobot();
            d.set({
              robot: { ...robot, blocked: ["4,2", "6,2", "5,1", "5,3"] },
              robotRunning: true,
            });
          }}
        >
          Test no route
        </button>
      </div>
      <label>
        Navigation goal
        <select
          aria-label="Robot goal"
          value={r.target.join(",")}
          onChange={(e) => {
            const target = e.target.value.split(",").map(Number) as [
              number,
              number,
            ];
            change({
              target,
              goal: target,
              phase: "IDLE",
              failure: "",
              objectState: "waiting",
            });
            d.set({ robotRunning: false });
          }}
        >
          <option value="5,2">Pickup (6,3)</option>
          <option value="1,6">Pickup (2,7)</option>
          <option value="7,0">Pickup (8,1)</option>
        </select>
      </label>
      <h3>Checked failure scenarios</h3>
      <div className="inline-fields">
        <button
          onClick={() => {
            change({ targetPresent: false, phase: "PERCEIVE" });
            d.set({ robotRunning: true });
          }}
        >
          Missing target
        </button>
        <button
          onClick={() => {
            change({ phase: "VERIFY_GRASP", graspDistance: 2 });
            d.set({ robotRunning: true });
          }}
        >
          Invalid grasp
        </button>
        <button
          onClick={() => {
            change({ phase: "REACH", cell: [0, 0], reach: 0 });
            d.set({ robotRunning: true });
          }}
        >
          Unreachable target
        </button>
        <button
          onClick={() => {
            change({
              phase: "VERIFY_GRASP",
              cell: [0, 0],
              graspDistance: 0.03,
            });
            d.set({ robotRunning: true });
          }}
        >
          Object moved
        </button>
        <button
          onClick={() => {
            change({
              phase: "NAVIGATE",
              blocked: [...r.blocked, r.cell.join(",")],
            });
            d.set({ robotRunning: true });
          }}
        >
          Collision
        </button>
      </div>
      <div className="metrics-grid">
        <span>
          Travelled<b>{r.travelled.toFixed(2)} m</b>
        </span>
        <span>
          Route<b>{Math.max(0, search.length - 1)} cells</b>
        </span>
        <span>
          Replans<b>{r.replans}</b>
        </span>
        <span>
          Collisions rejected<b>{r.collisions}</b>
        </span>
        <span>
          Simulation time<b>{r.time.toFixed(2)} s</b>
        </span>
        <span>
          Object<b>{r.objectState}</b>
        </span>
      </div>
      <h3>Illustrative joint controls</h3>
      <label>
        Shoulder {d.joint}°
        <input
          aria-label="Shoulder angle"
          type="range"
          min={-60}
          max={60}
          value={d.joint}
          onChange={(e) => d.set({ joint: Number(e.target.value) })}
        />
      </label>
      <label>
        Elbow {d.elbow}°
        <input
          aria-label="Elbow angle"
          type="range"
          min={0}
          max={135}
          value={d.elbow}
          onChange={(e) => d.set({ elbow: Number(e.target.value) })}
        />
      </label>
      <details>
        <summary>Actual task event log</summary>
        <ol className="event-log">
          {r.events.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ol>
      </details>
      <p className="caveat">
        Grid-point collision and kinematic motion only. These teaching joint
        limits and sensors are not official Max specifications.
      </p>
    </div>
  );
}
