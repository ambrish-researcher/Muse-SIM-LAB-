import type { LabId } from "./simulation";
export const LABS: {
  id: LabId;
  name: string;
  category: string;
  description: string;
  tags: string[];
  steps: { title: string; body: string }[];
}[] = [
  {
    id: "wonder",
    name: "Muse Wonder Lab",
    category: "Intelligence, made visible",
    description:
      "Step inside a thinking system. Follow a thought from token to attention to memory.",
    tags: ["AI architecture", "Attention", "Memory"],
    steps: [
      {
        title: "A thought takes shape",
        body: "Words enter as tokens. This model turns each token into a small, deterministic two-dimensional vector. These are teaching embeddings, not learned language understanding.",
      },
      {
        title: "Attention connects context",
        body: "A query compares against every key. Scaled dot products pass through softmax, producing weights that sum to one. Bright connections in the model show the selected query’s attention.",
      },
      {
        title: "Values become an output",
        body: "Each value vector is multiplied by its attention weight and summed. Select a different query below to inspect how the output changes. This demonstrates a single attention head.",
      },
      {
        title: "Memory holds the context",
        body: "Save the current tokens to the session buffer, then recall them after changing the input. This illustrates external context storage; it is separate from transformer weights and disappears when this page reloads.",
      },
    ],
  },
  {
    id: "chip",
    name: "MTIA 400 Lab",
    category: "The anatomy of compute",
    description:
      "Peel back the silicon. Explore the architecture that turns data into intelligence.",
    tags: ["Exploded view", "Dataflow", "Matrix compute"],
    steps: [
      {
        title: "Built from the inside out",
        body: "Inspect an original conceptual accelerator assembly: substrate, interposer, compute die, memory stacks and thermal lid. The geometry is educational and does not reproduce an official Meta layout.",
      },
      {
        title: "Memory feeds compute",
        body: "Memory stacks surround the compute die. Use Explode to reveal each layer. Animated packets illustrate data traveling toward compute; their speed is illustrative, not a hardware bandwidth measurement.",
      },
      {
        title: "A matrix, one dot product at a time",
        body: "Edit matrices A and B below. Each output cell is the dot product of a row of A and a column of B. Run compute to step through the four results and watch the compute tiles activate.",
      },
    ],
  },
  {
    id: "robot",
    name: "Meta Robot Max Lab",
    category: "Intelligence in motion",
    description:
      "Meet embodied intelligence. Plan a route, change its world, and watch it adapt.",
    tags: ["Articulated robot", "A* planning", "Manipulation"],
    steps: [
      {
        title: "An articulated body",
        body: "Explore a custom humanoid teaching model with shoulder, elbow, hip and knee joints. Assembly separates the major body modules. This is an independent concept, not an official Meta robot design.",
      },
      {
        title: "Plan before moving",
        body: "A* searches the grid using unit-cost cardinal moves and Manhattan distance. Lavender tiles show the shortest available route from S to G. Click an empty grid cell or use its keyboard control below to add an obstacle.",
      },
      {
        title: "Adapt to a changing world",
        body: "Insert an obstacle while the robot moves. The planner recomputes from its last reached cell and restarts along the new route. If the goal is enclosed, movement stops and the interface reports no route.",
      },
      {
        title: "Reach. Grasp. Place.",
        body: "Run manipulation after arriving at the goal. The shoulder and elbow drive a kinematic reach, the gripper closes, and the cube follows the hand before being placed on a small platform. This is scripted kinematics, not a physics simulation.",
      },
    ],
  },
];
export function tokenVectors(tokens: string[]) {
  return tokens.map((t) => {
    let hash = 0;
    for (const c of t) hash = (hash * 31 + c.charCodeAt(0)) >>> 0;
    return [((hash % 17) - 8) / 4, (((hash >>> 4) % 17) - 8) / 4];
  });
}
