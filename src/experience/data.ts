import { create } from "zustand";
import {
  tinyTransformer,
  seedAgent,
  advanceAgent,
  seedRobot,
  stepRobot,
  makeMatrix,
} from "../simulation/advanced";
import type { RobotState, AgentState } from "../simulation/advanced";
import type { LabId } from "../simulation";
type Data = {
  text: string;
  query: number;
  facts: string[];
  memoryQuery: string;
  agent: AgentState;
  robot: RobotState;
  robotHistory: RobotState[];
  robotRunning: boolean;
  robotCursor: number;
  matrixA: number[][];
  matrixB: number[][];
  tile: number;
  op: number;
  computeRunning: boolean;
  bits: 4 | 8;
  workload: "compute" | "memory";
  joint: number;
  elbow: number;
  set: (x: Partial<Data>) => void;
  tickRobot: () => void;
  resetRobot: () => void;
  advanceAgent: (approve?: boolean) => void;
};
export const useData = create<Data>((set, get) => ({
  text: "design intelligence simulate reality",
  query: 3,
  facts: [
    "The robot target is a blue cube",
    "The delivery platform is table B",
    "The chip uses tiled matrices",
    "The user prefers concise explanations",
  ],
  memoryQuery: "robot target",
  agent: seedAgent(),
  robot: seedRobot(),
  robotHistory: [seedRobot()],
  robotRunning: false,
  robotCursor: 0,
  matrixA: [
    [1, 2],
    [3, 4],
  ],
  matrixB: [
    [5, 6],
    [7, 8],
  ],
  tile: 1,
  op: -1,
  computeRunning: false,
  bits: 4,
  workload: "compute",
  joint: 0,
  elbow: 0,
  set,
  advanceAgent: (approve) => set({ agent: advanceAgent(get().agent, approve) }),
  tickRobot: () => {
    const r = stepRobot(get().robot),
      history = [...get().robotHistory, r].slice(-250);
    set({
      robot: r,
      robotHistory: history,
      robotCursor: history.length - 1,
      robotRunning:
        get().robotRunning && r.phase !== "COMPLETE" && r.phase !== "FAILED",
    });
  },
  resetRobot: () => {
    const robot = seedRobot();
    set({ robot, robotHistory: [robot], robotCursor: 0, robotRunning: false });
  },
}));
export const defaultTransformer = tinyTransformer(
  "design intelligence simulate reality",
);
export { makeMatrix };
export function resetExperiment(lab: LabId) {
  const d = useData.getState();
  if (lab === "robot") {
    d.resetRobot();
    d.set({ joint: 0, elbow: 0 });
  } else if (lab === "chip")
    d.set({
      matrixA: [
        [1, 2],
        [3, 4],
      ],
      matrixB: [
        [5, 6],
        [7, 8],
      ],
      tile: 1,
      op: -1,
      computeRunning: false,
      bits: 4,
      workload: "compute",
    });
  else
    d.set({
      text: "design intelligence simulate reality",
      query: 3,
      agent: seedAgent(),
      memoryQuery: "robot target",
      facts: [
        "The robot target is a blue cube",
        "The delivery platform is table B",
        "The chip uses tiled matrices",
        "The user prefers concise explanations",
      ],
    });
}
