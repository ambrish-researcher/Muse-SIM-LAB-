import type { LabId } from "../simulation.ts";
export type Phase =
  | "LOADING"
  | "INTRO"
  | "GATEWAY"
  | "SCENE_PREPARING"
  | "CONSTRUCTION"
  | "GUIDED_SIMULATION"
  | "FREE_EXPLORATION"
  | "INSPECTION"
  | "RESULTS"
  | "EXIT_TRANSITION";
export type Mode =
  "Build" | "Understand" | "Experiment" | "Inspect" | "Conclude";
export type Level = "beginner" | "engineering" | "research";
export type Chapter = {
  sceneId: string;
  title: string;
  userQuestion: string;
  learningGoal: string;
  whatYouSee: string;
  whyItHappens: string;
  stepByStep: string[];
  actualNumbersOrState: string;
  mathIfApplicable: string;
  documentedFacts: string[];
  illustrativeAssumptions: string[];
  limitations: string[];
  glossary: Record<string, string>;
  references: string[];
  camera: [number, number, number];
  cameraTarget: [number, number, number];
  relatedComponents: string[];
  levels: Record<Level, string>;
  entrance: string;
  exit: string;
  lighting: "cyan" | "gold" | "violet";
  audio: "silent";
  visual: string;
};
type Seed = [
  string,
  string,
  string,
  string[],
  [number, number, number],
  string,
];
const seeds: Record<LabId, Seed[]> = {
  wonder: [
    [
      "MW-01",
      "Intelligence, in layers",
      "An agent system coordinates goals, context, tools and validation. The structured lattice represents modules and their relationships, not the hidden neural internals of Muse Wonder.",
      ["architecture"],
      [8, 4, 11],
      "architecture",
    ],
    [
      "MW-02",
      "A request becomes a task",
      "Input tokens enter the context rail. A local deterministic task interpreter selects a predefined plan; no model-generated code executes.",
      ["tokens", "agent"],
      [5, 2, 7],
      "input",
    ],
    [
      "MW-03",
      "The mathematics of attention",
      "The independent transformer computes four-dimensional embeddings with position, separate Q/K/V projections, two causal attention heads, residual normalization, a ReLU feed-forward block and next-token logits.",
      ["qkv", "attention"],
      [5, 3, 6],
      "transformer",
    ],
    [
      "MW-04",
      "Remember what matters",
      "Synthetic facts receive Jaccard relevance scores against your query. Matching facts enter the context buffer; unrelated facts are filtered. This illustrates a memory capability, not Meta’s proprietary implementation.",
      ["memory"],
      [-6, 3, 6],
      "memory",
    ],
    [
      "MW-05",
      "Stay with the problem",
      "A deterministic task graph encounters a controlled validation failure, revises the plan and succeeds on a second check. It waits for user approval before its final synthetic publish action.",
      ["agent"],
      [5, 4, 7],
      "agent",
    ],
    [
      "MW-06",
      "Tools, observation, recovery",
      "Follow a safe feature-development workflow: requirements, plan, synthetic validation, failure, revision, revalidation and approval. The event log is the actual local task state, not a model’s private reasoning.",
      ["agent", "memory"],
      [7, 3, 8],
      "agent",
    ],
    [
      "MW-07",
      "Ask the system",
      "Curated explanations work offline at all three levels. If configured, Muse Spark Open through the server-side Nebius adapter can explain the active scene; it cannot change algorithms or invent a new lab.",
      ["architecture"],
      [8, 4, 10],
      "overview",
    ],
    [
      "MW-08",
      "What you actually learned",
      "Review the computed attention probabilities, next token, retrieved context and task events. Public capability descriptions, independent computations and unpublished model internals remain clearly separate.",
      ["architecture"],
      [9, 5, 12],
      "overview",
    ],
  ],
  chip: [
    [
      "MTIA-01",
      "Silicon at cinematic scale",
      "A machined package resolves into substrate, interposer, dual compute chiplets and memory structures. Mechanical dimensions, placement and cooling geometry are illustrative.",
      ["package"],
      [7, 5, 9],
      "package",
    ],
    [
      "MTIA-02",
      "An engineered stack",
      "Explode the package and isolate a layer. Contact arrays sit beneath the substrate; interconnects connect conceptual memory stacks to two compute surfaces.",
      ["substrate", "memory", "compute", "lid"],
      [7, 6, 8],
      "explode",
    ],
    [
      "MTIA-03",
      "Two chiplets. One system.",
      "Meta documents two compute chiplets in MTIA 400. Their internal teaching arrays make multiplication and synchronization visible without asserting a proprietary floorplan.",
      ["compute"],
      [4, 4, 5],
      "compute",
    ],
    [
      "MTIA-04",
      "Keep the data moving",
      "Input tiles move from memory lanes toward the active processing region. Their source, destination and highlighted cell follow actual matrix operation records. Packet speed is cinematic time.",
      ["memory", "compute"],
      [6, 5, 6],
      "memory",
    ],
    [
      "MTIA-05",
      "Multiply. Accumulate. Write.",
      "Edit 2×2 or 4×4 matrices, choose tile size and step through actual multiplication-accumulation records. Every highlighted output cell is computed in TypeScript.",
      ["compute"],
      [3, 4, 4],
      "matrix",
    ],
    [
      "MTIA-06",
      "The cost of fewer bits",
      "A symmetric integer teaching quantizer maps x to round(x/scale), with scale=max|x|/(2^(b−1)−1). Compare reconstructed values and measured RMSE. This is not an exact MX4, MX8, FP8 or BF16 encoder.",
      ["compute", "memory"],
      [6, 4, 7],
      "precision",
    ],
    [
      "MTIA-07",
      "Activity leaves a footprint",
      "A relative activity layer is driven by completed operation records and selected compute/memory workload. It has no temperature units and is not a measured thermal map.",
      ["compute"],
      [5, 6, 6],
      "heat",
    ],
    [
      "MTIA-08",
      "From software to silicon",
      "A conceptual pipeline connects a PyTorch graph, compilation, kernels, device operations and results. This browser executes JavaScript, not an MTIA runtime.",
      ["pipeline"],
      [7, 4, 9],
      "pipeline",
    ],
    [
      "MTIA-09",
      "A 72-device conversation",
      "Seventy-two repeated modules form the published scale-up domain count. Links illustrate a switched backplane. The rack’s mechanical layout and packet timings are illustrative.",
      ["rack"],
      [10, 6, 13],
      "rack",
    ],
    [
      "MTIA-10",
      "Separate the fact from the model",
      "Review the exact local matrix product and reconstruction error alongside verified architecture facts. Browser execution time must never be interpreted as chip performance.",
      ["package"],
      [8, 5, 10],
      "overview",
    ],
  ],
  robot: [
    [
      "MAX-01",
      "The assembly bay",
      "A precision platform, overhead gantry and coherent metric grid establish the robot’s world. The humanoid is an independent educational reconstruction inspired by reporting, not official Meta CAD.",
      ["body"],
      [8, 4, 10],
      "bay",
    ],
    [
      "MAX-02",
      "A body with a hierarchy",
      "Feet, leg actuators, pelvis, torso chassis, arms, hands and head assemble as connected modules. The hierarchy preserves joint ownership when links rotate.",
      ["body", "joints"],
      [5, 3, 7],
      "assembly",
    ],
    [
      "MAX-03",
      "Every joint has a limit",
      "Representative shoulder and elbow controls use configurable teaching limits in degrees, converted to radians for the rig. Axes, bearings and link relationships remain visible.",
      ["joints"],
      [4, 2, 5],
      "joints",
    ],
    [
      "MAX-04",
      "A hand is a mechanism",
      "Five articulated fingers close around a target only when the local state machine validates distance and object presence. Invalid grasps become failures, not success animations.",
      ["hands"],
      [3, 2, 4],
      "hands",
    ],
    [
      "MAX-05",
      "A world the robot can observe",
      "A synthetic camera frustum illustrates perception. Object positions and obstacle cells come from the same world state used by navigation. No actual Max sensor type is asserted.",
      ["sensors"],
      [6, 4, 7],
      "perception",
    ],
    [
      "MAX-06",
      "Turn geometry into a map",
      "An eight-by-eight occupancy grid uses 0.5 metre cells. Obstacle geometry, accessible editor, robot cell, target and delivery position all share one authoritative state.",
      ["world"],
      [8, 8, 9],
      "map",
    ],
    [
      "MAX-07",
      "Search the possible routes",
      "A* combines travelled cost and Manhattan distance. Frontier and visited cells expose the search. Obstacles invalidate a route and trigger replanning from the current reached cell.",
      ["world", "planner"],
      [7, 7, 8],
      "planning",
    ],
    [
      "MAX-08",
      "Reach without breaking the chain",
      "A FABRIK solver moves a two-link chain toward a reachable hand target while preserving link lengths. Unreachable targets are reported. Walking is kinematic, not dynamically balanced.",
      ["joints", "hands"],
      [4, 3, 5],
      "kinematics",
    ],
    [
      "MAX-09",
      "Observe. Pick. Carry. Place.",
      "The task progresses through perception, target localization, route planning, reach, verified grasp, delivery navigation, placement and verification. Fault controls test missing targets, moved objects and bad grasp distance.",
      ["body", "world"],
      [7, 5, 8],
      "task",
    ],
    [
      "MAX-10",
      "Measure what really happened",
      "Travelled distance, planned route, replans, rejected collisions, elapsed simulated time, joint values and object state come from local simulation records. There are no invented success percentages.",
      ["world"],
      [7, 4, 9],
      "metrics",
    ],
    [
      "MAX-11",
      "One robot, many systems",
      "Inspect mechanical structure, actuation, conceptual sensors and planning layers. Isolate the component selected from the accessible list and focus the camera on it.",
      ["body", "joints", "sensors"],
      [5, 3, 6],
      "architecture",
    ],
    [
      "MAX-12",
      "A result you can inspect",
      "A complete or failed task has a readable event log and measurable state. Replay reconstructs the deterministic seed. Physical balance, calibrated sensing and contact dynamics remain outside this model.",
      ["body", "world"],
      [8, 5, 10],
      "overview",
    ],
  ],
};
const refs = {
  wonder: [
    "https://research.meta.ai/blog/muse-wonder",
    "https://arxiv.org/html/1706.03762v7",
  ],
  chip: ["https://ai.meta.com/blog/meta-mtia-scale-ai-chips-for-billions/"],
  robot: [
    "https://www.theinformation.com/articles/meta-built-humanoid-prototype-chinese-startup-ramp-robotics-push/",
  ],
};
const buildManifest = (lab: LabId): Chapter[] =>
  seeds[lab].map(([sceneId, title, body, parts, camera, visual]): Chapter => ({
    sceneId,
    title,
    userQuestion: `How does ${title.toLowerCase()} work?`,
    learningGoal: body,
    whatYouSee: body,
    whyItHappens:
      "The renderer follows typed scene metadata and locally computed simulation state. Authored geometry explains relationships; unpublished internals are not asserted.",
    stepByStep: [
      "Identify the highlighted subsystem",
      "Change the valid inputs or step the demonstration",
      "Inspect results and limitations",
    ],
    actualNumbersOrState:
      "Live values appear in the Experiment and Conclude panels; no measurements are fabricated.",
    mathIfApplicable:
      lab === "wonder"
        ? "softmax(QKᵀ / √d)V"
        : lab === "chip"
          ? "Cij = Σk Aik Bkj; RMSE = √mean((x−x̂)²)"
          : "f(n) = g(n) + Manhattan(n, goal); link lengths in metres",
    documentedFacts:
      lab === "chip"
        ? [
            "Two compute chiplets and a 72-device scale-up domain are documented by Meta.",
          ]
        : lab === "wonder"
          ? [
              "Active Memory and Active Focus are public capability descriptions.",
            ]
          : [
              "Public reporting describes a prototype; official CAD is unavailable.",
            ],
    illustrativeAssumptions: [
      "Geometry, dimensions, intermediate interfaces and timing are authored teaching choices.",
    ],
    limitations: [
      "Educational reconstruction; no proprietary internals or real hardware execution.",
    ],
    glossary:
      lab === "wonder"
        ? {
            Attention: "A normalized weighted combination of values.",
            Context: "Information available to the current computation.",
            Residual: "A connection that adds a block input to its output.",
          }
        : lab === "chip"
          ? {
              Chiplet: "A separate die integrated into a package.",
              HBM: "Stacked high-bandwidth memory.",
              Quantization: "Approximating values with a smaller set of codes.",
            }
          : {
              Kinematics: "Geometry of motion without forces.",
              Heuristic: "An estimate of remaining route cost.",
              FABRIK: "Forward and backward reaching inverse kinematics.",
            },
    references: refs[lab as LabId],
    camera,
    cameraTarget: [0, lab === "robot" ? 1 : 0, 0],
    relatedComponents: parts,
    levels: {
      beginner: body,
      engineering: `${body} Inspect the ${parts.join(", ")} subsystem; source-of-truth numerical state is separated from cinematic playback.`,
      research: `${body} ${lab === "wonder" ? "The toy uses deterministic fixed weights, two causal attention heads, epsilon-stabilized layer normalization and greedy decoding; it is not trained." : lab === "chip" ? "Tiling preserves the mathematical product; symmetric per-tensor integer quantization is an explicitly approximate experiment." : "A* uses cardinal unit costs; the IK solver preserves segment lengths. Grid navigation does not establish continuous body clearance or dynamic stability."}`,
    },
    entrance:
      "Damped camera rail; selected components assemble from staging offsets",
    exit: "Retract into shared spatial tunnel",
    lighting:
      visual === "transformer" || visual === "planning"
        ? "gold"
        : visual === "agent"
          ? "violet"
          : "cyan",
    audio: "silent",
    visual,
  }));
export const MANIFESTS: Record<LabId, Chapter[]> = {
  wonder: buildManifest("wonder"),
  chip: buildManifest("chip"),
  robot: buildManifest("robot"),
};
export function chapterSnapshot(lab: LabId, time: number) {
  const t = Math.max(0, Math.min(0.999999, time)),
    scaled = t * MANIFESTS[lab].length,
    index = Math.floor(scaled);
  return {
    index,
    local: scaled - index,
    scene: MANIFESTS[lab][index].sceneId,
    assembly: Math.min(1, (scaled - index) * 3),
  };
}
const transitions: Record<Phase, Phase[]> = {
  LOADING: ["INTRO", "GATEWAY"],
  INTRO: ["GATEWAY"],
  GATEWAY: ["SCENE_PREPARING", "INTRO"],
  SCENE_PREPARING: ["CONSTRUCTION", "GATEWAY"],
  CONSTRUCTION: ["GUIDED_SIMULATION", "FREE_EXPLORATION", "EXIT_TRANSITION"],
  GUIDED_SIMULATION: [
    "INSPECTION",
    "FREE_EXPLORATION",
    "RESULTS",
    "CONSTRUCTION",
    "EXIT_TRANSITION",
  ],
  FREE_EXPLORATION: [
    "INSPECTION",
    "GUIDED_SIMULATION",
    "RESULTS",
    "EXIT_TRANSITION",
  ],
  INSPECTION: [
    "FREE_EXPLORATION",
    "GUIDED_SIMULATION",
    "RESULTS",
    "EXIT_TRANSITION",
  ],
  RESULTS: ["CONSTRUCTION", "EXIT_TRANSITION", "INSPECTION"],
  EXIT_TRANSITION: ["GATEWAY"],
};
export const canTransition = (a: Phase, b: Phase) => transitions[a].includes(b);
