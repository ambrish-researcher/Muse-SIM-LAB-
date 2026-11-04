import { create } from "zustand";
import type { LabId } from "../simulation";
import type { Phase, Mode, Level } from "./manifest";
import { BLUEPRINTS, constructionAt } from "../construction/blueprints";
export type Quality = "low" | "balanced" | "high";
export const constructionClock = { elapsed: 0 };
type State = {
  phase: Phase;
  lab: LabId | null;
  mode: Mode;
  chapter: number;
  reduced: boolean;
  quality: Quality;
  free: boolean;
  labels: boolean;
  explode: number;
  xray: boolean;
  flow: boolean;
  heat: boolean;
  legend: boolean;
  rackView: boolean;
  selected: string;
  isolated: boolean;
  level: Level;
  cameraRevision: number;
  cameraAction: string;
  transition: number;
  ready: boolean;
  modelReady: boolean;
  buildCount: number;
  buildAttached: number;
  buildActive: number;
  buildComplete: boolean;
  buildRevision: number;
  enter: () => void;
  launch: (lab: LabId) => void;
  returnGateway: () => void;
  chooseMode: (mode: Mode) => void;
  restart: () => void;
  advanceBuild: () => void;
  patch: (p: Partial<State>) => void;
};
const persistedQuality = (): Quality => {
  try {
    const v = localStorage.getItem("muse-quality");
    return v === "low" || v === "high" ? v : "balanced";
  } catch {
    return "balanced";
  }
};
export const useExperience = create<State>((set, get) => ({
  phase: "LOADING",
  lab: null,
  mode: "Build",
  chapter: 0,
  reduced:
    typeof matchMedia !== "undefined" &&
    matchMedia("(prefers-reduced-motion: reduce)").matches,
  quality: persistedQuality(),
  free: false,
  labels: false,
  explode: 0,
  xray: false,
  flow: true,
  heat: false,
  legend: false,
  rackView: false,
  selected: "",
  isolated: false,
  level: "beginner",
  cameraRevision: 0,
  cameraAction: "reset",
  transition: 0,
  ready: false,
  modelReady: false,
  buildCount: 0,
  buildAttached: 0,
  buildActive: 0,
  buildComplete: false,
  buildRevision: 0,
  enter: () =>
    set({ phase: "GATEWAY", lab: null, transition: get().transition + 1 }),
  launch: (lab) => {
    history.replaceState(null, "", `#${lab}`);
    constructionClock.elapsed = 0;
    set({
      lab,
      phase: "SCENE_PREPARING",
      modelReady: false,
      mode: "Build",
      chapter: 0,
      free: false,
      selected: "",
      isolated: false,
      explode: 0,
      xray: false,
      rackView: false,
      buildCount: 0,
      buildAttached: 0,
      buildActive: 0,
      buildComplete: false,
      buildRevision: get().buildRevision + 1,
      transition: get().transition + 1,
    });
  },
  restart: () => {
    constructionClock.elapsed = 0;
    set({
      phase: "CONSTRUCTION",
      modelReady: false,
      mode: "Build",
      free: false,
      selected: "",
      isolated: false,
      explode: 0,
      xray: false,
      rackView: false,
      buildCount: 0,
      buildAttached: 0,
      buildActive: 0,
      buildComplete: false,
      buildRevision: get().buildRevision + 1,
      cameraAction: "reset",
      cameraRevision: get().cameraRevision + 1,
    });
  },
  returnGateway: () => {
    history.replaceState(null, "", "#gateway");
    set({
      phase: "EXIT_TRANSITION",
      free: false,
      transition: get().transition + 1,
    });
  },
  chooseMode: (mode) => {
    if (!get().buildComplete) return;
    set({
      mode,
      phase:
        mode === "Inspect"
          ? "INSPECTION"
          : mode === "Conclude"
            ? "RESULTS"
            : "FREE_EXPLORATION",
      free: mode === "Inspect",
      isolated: false,
      ...(mode === "Experiment" && get().lab === "robot"
        ? { explode: 0, xray: false }
        : {}),
      ...(mode === "Experiment" ? { rackView: false } : {}),
      cameraAction: "reset",
      cameraRevision: get().cameraRevision + 1,
    });
  },
  advanceBuild: () => {
    const s = get();
    if (!s.lab || s.phase !== "CONSTRUCTION") return;
    const b = constructionAt(s.lab, constructionClock.elapsed, s.reduced);
    if (b.introduced !== s.buildCount || b.attached !== s.buildAttached) {
      set({
        buildCount: b.introduced,
        buildAttached: b.attached,
        buildActive: b.active,
        selected: b.introduced ? BLUEPRINTS[s.lab][b.active].id : "",
        buildComplete: b.complete,
        ...(b.complete
          ? {
              mode: "Experiment",
              phase: "FREE_EXPLORATION",
              cameraAction: "reset",
              cameraRevision: s.cameraRevision + 1,
            }
          : {}),
        ...(s.lab === "chip" && b.introduced === 17 ? { explode: 0.55 } : {}),
        ...(s.lab === "chip" && b.introduced === 18 ? { rackView: true } : {}),
        ...(s.lab === "chip" && b.introduced === 19 ? { rackView: false } : {}),
      });
    }
  },
  patch: (p) => {
    if (p.quality) {
      try {
        localStorage.setItem("muse-quality", p.quality);
      } catch {
        /* optional storage */
      }
    }
    set(p);
  },
}));
