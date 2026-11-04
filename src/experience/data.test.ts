import { it, expect } from "vitest";
import { useData } from "./data";
import { seedRobot } from "../simulation/advanced";
it("single-step preserves a stopped robot playback choice", () => {
  const robot = seedRobot();
  useData.setState({
    robot,
    robotHistory: [robot],
    robotCursor: 0,
    robotRunning: false,
  });
  useData.getState().tickRobot();
  expect(useData.getState().robot.phase).toBe("PERCEIVE");
  expect(useData.getState().robotRunning).toBe(false);
});
