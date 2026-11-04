import {
  Component,
  lazy,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowUpRight,
  ArrowLeft,
  X,
  SlidersHorizontal,
  RotateCcw,
  Focus,
  Plus,
  Minus,
  MoveLeft,
  MoveRight,
  Layers3,
  Scan,
  Box,
  Sparkles,
  ChevronDown,
  Download,
  Check,
} from "lucide-react";
import { useExperience, type Quality } from "./store";
import { useData, resetExperiment } from "./data";
import { BLUEPRINTS, type ConstructionPart } from "../construction/blueprints";
import {
  routeIntent,
  tiledMultiply,
  tinyTransformer,
} from "../simulation/advanced";
import type { LabId } from "../simulation";
import {
  WonderExperiment,
  ChipExperiment,
  RobotExperiment,
} from "./Experiments";
const World = lazy(() => import("./World"));
const names: Record<LabId, string> = {
  wonder: "Muse Wonder Lab",
  chip: "MTIA 400 Lab",
  robot: "Meta Robot Max Lab",
};
const short: Record<LabId, string> = {
  wonder: "Wonder",
  chip: "MTIA 400",
  robot: "Robot Max",
};
const prompts: Record<LabId, string> = {
  wonder: "Construct Muse Wonder and explain attention",
  chip: "Build MTIA 400 and multiply matrices",
  robot: "Assemble Robot Max and deliver an object",
};
type Health = {
  provider: string;
  status: string;
  model: string;
  liveEnabled?: boolean;
  budgetUsd: number;
  estimatedSpendUsd: number;
  authenticated: boolean;
  billingBalanceKnown: boolean;
};
class SceneBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="scene-failure">
        The 3D scene could not start.{" "}
        <button onClick={() => location.reload()}>Reload scene</button>
        <p>Calculations remain available in the experiment panel.</p>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Settings({
  close,
  health,
  retry,
}: {
  close: () => void;
  health: Health | null;
  retry: () => void;
}) {
  const s = useExperience(),
    dialog = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    dialog.current?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "Tab") {
        const nodes = dialog.current?.querySelectorAll<HTMLElement>(
          "button,select,input,[tabindex='0']",
        );
        if (!nodes?.length) return;
        const first = nodes[0],
          last = nodes[nodes.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [close]);
  return (
    <div className="modal-shade" onClick={close}>
      <div
        className="settings-panel narrative-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Experience settings"
        ref={dialog}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-heading">
          <span className="kicker">EXPERIENCE SETTINGS</span>
          <button
            aria-label="Close settings"
            className="icon-control"
            onClick={close}
          >
            <X size={16} />
          </button>
        </div>
        <h2>Make it yours.</h2>
        <label>
          Render quality
          <select
            aria-label="Render quality"
            value={s.quality}
            onChange={(e) => s.patch({ quality: e.target.value as Quality })}
          >
            <option value="low">Low · DPR 1</option>
            <option value="balanced">Balanced</option>
            <option value="high">High · bloom</option>
          </select>
        </label>
        <label className="check-field">
          <input
            type="checkbox"
            checked={s.reduced}
            onChange={(e) => {
              if (s.lab && !s.buildComplete) return;
              s.patch({ reduced: e.target.checked });
            }}
            disabled={!!s.lab && !s.buildComplete}
          />
          Reduced motion
        </label>
        <p className="caveat">
          Reduced motion preserves each construction step with direct placement.
          Set this before launching or after assembly.
        </p>
        <h3>Narration connection</h3>
        <p className="offline-label">
          <span className="status-dot" />
          {health?.status ??
            "Local simulations are available; narration server is unreachable."}
        </p>
        <p>Model: {health?.model ?? "Muse Spark Open via Nebius"}</p>
        <p className="caveat">
          Server key: NEBIUS_API_KEY. Paid requests remain disabled until
          explicitly approved on the server. Simulations need no API key.
        </p>
        <div className="metrics-grid">
          <span>
            App budget<b>${(health?.budgetUsd ?? 5).toFixed(2)}</b>
          </span>
          <span>
            Recorded estimate
            <b>${(health?.estimatedSpendUsd ?? 0).toFixed(4)}</b>
          </span>
        </div>
        <p className="caveat">
          Provider billing balance: unknown. Authentication:{" "}
          {health?.authenticated ? "verified this session" : "unverified"}.
        </p>
        <button onClick={retry}>Check connection</button>
      </div>
    </div>
  );
}
function Gateway({ launch }: { launch: (prompt: string) => void }) {
  const [prompt, setPrompt] = useState("");
  return (
    <main className="gateway">
      <div className="gateway-heading">
        <span className="kicker">AN OPEN SPACE FOR UNDERSTANDING</span>
        <h1>
          Everything begins
          <br />
          with a <em>question.</em>
        </h1>
        <p>Choose a system. Watch it take shape. Discover how it works.</p>
      </div>
      <div className="gateway-console">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            launch(prompt);
          }}
        >
          <Sparkles size={19} />
          <input
            aria-label="Describe a system to simulate"
            value={prompt}
            maxLength={2000}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="What would you like to understand?"
          />
          <button aria-label="Launch simulation" disabled={!prompt.trim()}>
            <ArrowUpRight size={22} />
          </button>
        </form>
        <div className="suggestion-label">OR BEGIN WITH A CURIOSITY</div>
        <div className="portal-shortcuts">
          {(["wonder", "chip", "robot"] as const).map((id, i) => (
            <button key={id} onClick={() => launch(prompts[id])}>
              <span>0{i + 1}</span>
              {short[id]}
              <ArrowUpRight size={13} />
            </button>
          ))}
        </div>
      </div>
      <div className="gateway-foot">
        <span>CONSTRUCT → ACTIVATE → EXPERIMENT</span>
        <span>Three systems. One continuous space.</span>
      </div>
    </main>
  );
}
function ComponentReference({ part }: { part: ConstructionPart }) {
  const level = useExperience((s) => s.level),
    patch = useExperience((s) => s.patch);
  const lab = useExperience((s) => s.lab),
    text = useData((s) => s.text),
    query = useData((s) => s.query),
    op = useData((s) => s.op),
    robot = useData((s) => s.robot),
    facts = useData((s) => s.facts),
    agent = useData((s) => s.agent);
  const tensor = useMemo(() => tinyTransformer(text), [text]);
  const experiment =
    lab === "wonder"
      ? part.id === "memory" || part.id === "retrieval"
        ? `${facts.length} editable synthetic facts are available to the retrieval query.`
        : ["focus", "planner", "tools"].includes(part.id)
          ? `The checked agent is at step ${agent.step}; status ${agent.status}.`
          : `The current input has ${tensor.tokens.length} tokens. Query ${Math.min(query, tensor.tokens.length - 1) + 1} drives the visible attention connections; predicted token: ${tensor.next}.`
      : lab === "chip"
        ? `The matrix experiment has executed ${Math.max(0, op + 1)} MAC operations. ${part.purpose}`
        : `The robot controller is in ${robot.phase.replaceAll("_", " ")}; object state ${robot.objectState}. ${part.purpose}`;
  return (
    <>
      <label className="level-select">
        Explanation depth
        <select
          aria-label="Explanation depth"
          value={level}
          onChange={(e) =>
            patch({
              level: e.target.value as "beginner" | "engineering" | "research",
            })
          }
        >
          <option value="beginner">Beginner</option>
          <option value="engineering">Engineering</option>
          <option value="research">Research</option>
        </select>
      </label>
      <p className="component-explanation" data-testid="component-explanation">
        {part.levels[level]}
      </p>
      <details>
        <summary>
          Purpose & relationships <ChevronDown size={12} />
        </summary>
        <h3>Why it exists</h3>
        <p>{part.purpose}</p>
        <h3>Connected to</h3>
        <p>{part.relationship}</p>
        <h3>Working principle</h3>
        <p>{part.principle}</p>
        <h3>In your experiment</h3>
        <p>{experiment}</p>
      </details>
      <p className="classification">
        <span /> {part.classification}
      </p>
    </>
  );
}
function Inspection() {
  const s = useExperience(),
    parts = BLUEPRINTS[s.lab!].slice(0, s.buildCount);
  return (
    <div className="inspection-content">
      <label>
        Attached component
        <select
          aria-label="Select component"
          value={s.selected}
          onChange={(e) =>
            s.patch({ selected: e.target.value, isolated: false })
          }
        >
          {parts.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </label>
      <div className="inspection-grid">
        {(
          [
            ["labels", "Labels"],
            ["isolated", "Isolate"],
            ["xray", "X-ray"],
            ["flow", "Dataflow"],
            ["heat", "Heat overlay"],
          ] as const
        )
          .filter(([key]) => key !== "heat" || s.lab === "chip")
          .map(([key, label]) => (
            <button
              key={key}
              aria-pressed={s[key]}
              onClick={() => s.patch({ [key]: !s[key] })}
            >
              {label}
            </button>
          ))}
      </div>
      <label>
        Exploded assembly
        <input
          aria-label="Exploded assembly"
          type="range"
          min="0"
          max="1"
          step=".05"
          value={s.explode}
          onChange={(e) => s.patch({ explode: Number(e.target.value) })}
        />
      </label>
      <p className="caveat">
        Drag to orbit. Scroll or pinch to zoom. Select a component in the scene
        or menu. Heat is illustrative.
      </p>
      {s.lab === "chip" && (
        <>
          <button
            aria-pressed={s.rackView}
            onClick={() =>
              s.patch({
                rackView: !s.rackView,
                selected: "rack",
                cameraAction: "reset",
                cameraRevision: s.cameraRevision + 1,
              })
            }
          >
            Rack infrastructure
          </button>
          <p className="caveat">
            72 illustrative accelerator trays. Independent rack arrangement; no
            physical system topology is asserted.
          </p>
        </>
      )}
    </div>
  );
}
function Results() {
  const lab = useExperience((s) => s.lab)!,
    d = useData();
  const actual =
    lab === "wonder"
      ? {
          nextToken: tinyTransformer(d.text).next,
          agent: d.agent.status,
          memoryFacts: d.facts.length,
        }
      : lab === "chip"
        ? {
            product: tiledMultiply(d.matrixA, d.matrixB, d.tile).product,
            completedOperations: d.op + 1,
            totalOperations: d.matrixA.length ** 3,
          }
        : {
            phase: d.robot.phase,
            object: d.robot.objectState,
            travelledMetres: d.robot.travelled,
            replans: d.robot.replans,
            failure: d.robot.failure || null,
          };
  return (
    <div className="results-content">
      <span className="result-mark">
        <Check size={22} />
      </span>
      <h3>Your experiment, recorded.</h3>
      <p>These values come from the current local simulation.</p>
      <pre>{JSON.stringify(actual, null, 2)}</pre>
      <button
        className="accent"
        onClick={() => {
          const url = URL.createObjectURL(
            new Blob(
              [
                JSON.stringify(
                  {
                    lab,
                    classification: "Independent educational simulation",
                    results: actual,
                  },
                  null,
                  2,
                ),
              ],
              { type: "application/json" },
            ),
          );
          const a = document.createElement("a");
          a.href = url;
          a.download = `muse-${lab}-results.json`;
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        <Download size={14} />
        Download actual results
      </button>
    </div>
  );
}
function Explain({
  part,
  health,
}: {
  part: ConstructionPart;
  health: Health | null;
}) {
  const [question, setQuestion] = useState(""),
    [reply, setReply] = useState(""),
    [busy, setBusy] = useState(false);
  const lab = useExperience((s) => s.lab)!,
    level = useExperience((s) => s.level);
  return (
    <details className="ask-panel">
      <summary>
        Ask about this system <Sparkles size={12} />
      </summary>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const match =
            BLUEPRINTS[lab].find((p) =>
              question.toLowerCase().includes(p.id),
            ) ?? part;
          if (!health?.liveEnabled) {
            setReply(
              `Curated component reference · ${match.name}: ${match.levels[level]}`,
            );
            setBusy(false);
            return;
          }
          try {
            const r = await fetch("/api/ask", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                prompt: question,
                lab,
                chapter: lab === "wonder" ? 2 : lab === "chip" ? 4 : 8,
                level,
                context: `Selected component: ${part.name}. ${part.principle}`,
              }),
            });
            const data = await r.json();
            setReply(
              data.narration ??
                "Narration unavailable; the component reference remains available.",
            );
          } catch {
            setReply(match.levels[level]);
          } finally {
            setBusy(false);
          }
        }}
      >
        <input
          aria-label="Question about this system"
          placeholder="Ask about attention, memory, a joint…"
          value={question}
          maxLength={2000}
          onChange={(e) => setQuestion(e.target.value)}
        />
        <button disabled={!question.trim() || busy}>
          {busy ? "Explaining…" : "Explain"}
        </button>
      </form>
      {reply && <p className="readout">{reply}</p>}
      <p className="caveat">
        {health?.liveEnabled
          ? "Optional server narration enabled. Computations remain local."
          : "Curated offline reference. No inference request is sent."}
      </p>
    </details>
  );
}
function LabPanel({ health }: { health: Health | null }) {
  const s = useExperience(),
    parts = BLUEPRINTS[s.lab!],
    part = parts.find((p) => p.id === s.selected) ?? parts[s.buildActive];
  return (
    <aside
      className={`narrative-panel lab-panel ${s.mode === "Experiment" ? "is-experiment" : ""}`}
      aria-label="Lab controls and explanation"
    >
      <span className="kicker">
        {s.buildComplete
          ? s.mode === "Inspect"
            ? "COMPONENT INSPECTION"
            : s.mode === "Conclude"
              ? "EXPERIMENT FINDINGS"
              : "SYSTEM ACTIVE"
          : "PROGRESSIVE CONSTRUCTION"}
      </span>
      <h1>{names[s.lab!]}</h1>
      {!s.buildCount ? (
        <div className="empty-stage-copy">
          <span className="empty-marker" />
          <h2>
            An empty stage.
            <br />A system about to emerge.
          </h2>
          <p>
            Each component will enter, align and attach. The completed system
            opens directly into your experiment.
          </p>
        </div>
      ) : (
        <>
          {s.mode !== "Experiment" && s.mode !== "Conclude" && (
            <>
              <div className="part-title">
                <span>{String(parts.indexOf(part) + 1).padStart(2, "0")}</span>
                <h2 data-testid="component-name">{part.name}</h2>
              </div>
              <ComponentReference part={part} />
            </>
          )}
          {s.mode === "Experiment" && (
            <>
              <p className="experiment-intro">
                {s.lab === "wonder"
                  ? "Change the context. Inspect attention. Retrieve memory. Test an agent."
                  : s.lab === "chip"
                    ? "Change the operands. Follow every multiply-accumulate."
                    : "Plan a route. Change the world. Deliver the object."}
              </p>
              {s.lab === "wonder" ? (
                <WonderExperiment />
              ) : s.lab === "chip" ? (
                <ChipExperiment />
              ) : (
                <RobotExperiment />
              )}
              <details>
                <summary>Explain the selected component</summary>
                <h2 data-testid="component-name">{part.name}</h2>
                <ComponentReference part={part} />
              </details>
            </>
          )}
          {s.mode === "Inspect" && <Inspection />}
          {s.mode === "Conclude" && <Results />}
          {s.buildComplete && <Explain part={part} health={health} />}
        </>
      )}
      <details className="source-details">
        <summary>Sources & model provenance</summary>
        <p>
          All geometry is original procedural work. All three systems are
          independent educational reconstructions, with conceptual layouts and
          simplified algorithms.
        </p>
        <a
          href="https://arxiv.org/abs/1706.03762"
          target="_blank"
          rel="noreferrer"
        >
          Attention Is All You Need ↗
        </a>
        <a
          href="https://ai.meta.com/blog/meta-mtia-scale-ai-chips-for-billions/"
          target="_blank"
          rel="noreferrer"
        >
          Meta MTIA overview ↗
        </a>
        <p className="caveat">
          No official Meta CAD, hidden model internals or manufacturer robot
          specifications are represented. Robot motion is kinematic; thermal and
          traffic overlays are illustrative.
        </p>
      </details>
    </aside>
  );
}
function ConstructionStatus() {
  const s = useExperience(),
    parts = BLUEPRINTS[s.lab!];
  return (
    <div
      className="construction-status"
      data-testid="construction-status"
      data-introduced={s.buildCount}
      data-attached={s.buildAttached}
    >
      <div className="stage-numeral">
        {String(s.buildAttached).padStart(2, "0")}
        <span>/{parts.length}</span>
      </div>
      <div>
        <span className="kicker">
          {s.buildComplete ? "ASSEMBLY COMPLETE" : "COMPONENTS ATTACHED"}
        </span>
        <p>
          {s.buildComplete
            ? "Your system is ready to explore."
            : s.buildCount
              ? parts[s.buildActive].name
              : "Preparing the empty assembly space"}
        </p>
      </div>
      <div
        className="construction-dots"
        aria-label={`${s.buildAttached} of ${parts.length} components attached`}
      >
        {parts.map((p, i) => (
          <i
            key={p.id}
            className={
              i < s.buildAttached
                ? "attached"
                : i < s.buildCount
                  ? "entering"
                  : ""
            }
          />
        ))}
      </div>
    </div>
  );
}
function LabActions() {
  const s = useExperience();
  const command = (cameraAction: string) =>
    s.patch({ cameraAction, cameraRevision: s.cameraRevision + 1 });
  return (
    <>
      <div className="camera-controls" aria-label="Camera controls">
        <button aria-label="Zoom in" onClick={() => command("in")}>
          <Plus size={15} />
        </button>
        <button aria-label="Zoom out" onClick={() => command("out")}>
          <Minus size={15} />
        </button>
        <button aria-label="Orbit left" onClick={() => command("left")}>
          <MoveLeft size={15} />
        </button>
        <button aria-label="Orbit right" onClick={() => command("right")}>
          <MoveRight size={15} />
        </button>
        <button
          aria-label="Focus selected component"
          disabled={!s.selected}
          onClick={() => command("focus")}
        >
          <Focus size={15} />
        </button>
        <button aria-label="Reset camera" onClick={() => command("reset")}>
          <Scan size={15} />
        </button>
      </div>
      <div className="lab-actions">
        <button
          onClick={() => {
            useData
              .getState()
              .set({ robotRunning: false, computeRunning: false });
            resetExperiment(s.lab!);
            s.restart();
          }}
        >
          <RotateCcw size={14} />
          Restart construction
        </button>
        <div className="mode-actions">
          <button
            aria-pressed={s.mode === "Inspect"}
            disabled={!s.buildComplete}
            onClick={() => s.chooseMode("Inspect")}
          >
            <Box size={14} />
            Inspect
          </button>
          <button
            aria-pressed={s.mode === "Experiment"}
            disabled={!s.buildComplete}
            onClick={() => s.chooseMode("Experiment")}
          >
            <Sparkles size={14} />
            Experiment
          </button>
          <button
            aria-pressed={s.mode === "Conclude"}
            disabled={!s.buildComplete}
            onClick={() => s.chooseMode("Conclude")}
          >
            Results
            <ArrowUpRight size={14} />
          </button>
        </div>
        <button
          disabled={!s.buildComplete}
          onClick={() => resetExperiment(s.lab!)}
        >
          <RotateCcw size={14} />
          Reset experiment
        </button>
      </div>
      <div className="scene-caption">
        <span className="caption-rule" />
        <p>
          {s.buildComplete
            ? "An independent reconstruction."
            : "Built one component at a time."}
          <small>
            {s.lab === "robot"
              ? "Articulated geometry · kinematic simulation"
              : s.lab === "chip"
                ? "Conceptual topology · actual arithmetic"
                : "Conceptual architecture · actual attention"}
          </small>
        </p>
      </div>
    </>
  );
}
export default function Experience() {
  const phase = useExperience((s) => s.phase),
    lab = useExperience((s) => s.lab),
    ready = useExperience((s) => s.ready);
  const [settings, setSettings] = useState(false),
    [health, setHealth] = useState<Health | null>(null),
    [message, setMessage] = useState("");
  const checkHealth = () => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth(null));
  };
  useEffect(() => {
    checkHealth();
  }, []);
  useEffect(() => {
    const tick = setInterval(() => {
      const s = useExperience.getState(),
        d = useData.getState();
      if (!s.lab || !s.buildComplete || document.hidden) return;
      if (d.robotRunning) d.tickRobot();
      if (d.computeRunning) {
        const max = d.matrixA.length ** 3 - 1;
        d.set({ op: Math.min(max, d.op + 1), computeRunning: d.op < max - 1 });
      }
    }, 220);
    return () => clearInterval(tick);
  }, []);
  const launch = (prompt: string) => {
    const intent = routeIntent(prompt);
    if (!intent || intent === "ambiguous") {
      setMessage(
        intent === "ambiguous"
          ? "Choose one system: Wonder, MTIA 400 or Robot Max."
          : "That system is not supported yet. Try Wonder, MTIA 400 or Robot Max.",
      );
      return;
    }
    setMessage("");
    useData.getState().set({ robotRunning: false, computeRunning: false });
    resetExperiment(intent);
    useExperience.getState().launch(intent);
  };
  const inLab = !!lab && phase !== "EXIT_TRANSITION";
  const context = useMemo(
    () => (inLab ? names[lab!] : "AN INDEPENDENT SIMULATION STUDIO"),
    [inLab, lab],
  );
  return (
    <div className={`experience ${inLab ? "in-lab" : ""}`}>
      <SceneBoundary>
        <Suspense fallback={null}>
          <World />
        </Suspense>
      </SceneBoundary>
      <header className="experience-header">
        <button
          className="wordmark"
          aria-label="MUSE SIMLAB home"
          onClick={() => {
            useData
              .getState()
              .set({ robotRunning: false, computeRunning: false });
            useExperience.getState().returnGateway();
          }}
        >
          <span className="brand-symbol">
            m<span>·</span>
          </span>
          MUSE <b>SIMLAB</b>
        </button>
        <div className="header-context">
          <span className="status-dot" />
          {context}
        </div>
        <div className="header-actions">
          {inLab && (
            <button
              className="text-button"
              aria-label="Return to gateway"
              onClick={() => {
                useData
                  .getState()
                  .set({ robotRunning: false, computeRunning: false });
                useExperience.getState().returnGateway();
              }}
            >
              <ArrowLeft size={14} />
              Gateway
            </button>
          )}
          <button
            className="icon-control"
            aria-label="Experience settings"
            onClick={() => setSettings(true)}
          >
            <SlidersHorizontal size={16} />
          </button>
        </div>
      </header>
      {(phase === "INTRO" || phase === "LOADING") && (
        <main className="intro-overlay">
          <div className="intro-kicker">
            <span /> A NEW PERSPECTIVE ON COMPLEX SYSTEMS
          </div>
          <h1>
            Design Intelligence.
            <br />
            <em>Simulate Reality.</em>
          </h1>
          <p>
            From the first connection to the final possibility.
            <br />
            Enter a living space for intelligence, silicon and motion.
          </p>
          <div className="intro-actions">
            <button
              className="enter-button"
              disabled={!ready}
              onClick={() => useExperience.getState().enter()}
            >
              Enter SimLab
              <ArrowUpRight size={20} />
            </button>
            <span>THINK. BUILD. UNDERSTAND.</span>
          </div>
          <div className="intro-footnote">
            Original spatial explorations.
            <br />
            Three interactive systems. Built from first principles.
          </div>
        </main>
      )}
      {phase === "GATEWAY" && <Gateway launch={launch} />}
      {message && phase === "GATEWAY" && (
        <div className="gateway-message" role="status">
          {message}
        </div>
      )}
      {inLab && (
        <>
          <LabPanel health={health} />
          <ConstructionStatus />
          <LabActions />
        </>
      )}
      {phase === "SCENE_PREPARING" && (
        <div className="transit-note">
          <Layers3 size={16} />
          ENTERING THE ASSEMBLY SPACE
        </div>
      )}
      <footer className="experience-footer">
        <span>DESIGN INTELLIGENCE. SIMULATE REALITY.</span>
        <span>ORIGINAL CONCEPTUAL MODELS · NOT AFFILIATED WITH META</span>
      </footer>
      <div id="webgl-status" hidden role="alert">
        The graphics context was interrupted.{" "}
        <button onClick={() => location.reload()}>Reload</button>
      </div>
      {settings && (
        <Settings
          close={() => setSettings(false)}
          health={health}
          retry={checkHealth}
        />
      )}
    </div>
  );
}
