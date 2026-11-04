import { z } from "zod";
import { MANIFESTS } from "../src/experience/manifest.ts";
export const inferenceApproved = (key: string, approval: string | undefined) =>
  !!key && approval === "true";
export const RequestSchema = z
  .object({
    prompt: z.string().trim().min(1).max(2000),
    lab: z.enum(["wonder", "chip", "robot"]).default("wonder"),
    chapter: z.number().int().min(0).max(11).default(0),
    level: z.enum(["beginner", "engineering", "research"]).default("beginner"),
    context: z.string().max(1600).optional(),
  })
  .strict();
export type ExplainRequest = z.infer<typeof RequestSchema>;
const PlanSchema = z
  .object({
    lab: z.enum(["wonder", "chip", "robot"]),
    sceneId: z.string().max(20),
    narration: z.string().min(1).max(7000),
    focusTargets: z.array(z.string().max(30)).max(5),
    animationActions: z
      .array(z.enum(["focus", "assemble", "dataflow", "overview"]))
      .max(4),
    caveats: z.array(z.string().max(300)).max(5).default([]),
  })
  .strict();
export function validatePlan(data: unknown, lab: ExplainRequest["lab"]) {
  const plan = PlanSchema.parse(data);
  const scene = MANIFESTS[lab].find((s) => s.sceneId === plan.sceneId);
  const targets = new Set(MANIFESTS[lab].flatMap((s) => s.relatedComponents));
  if (
    plan.lab !== lab ||
    !scene ||
    plan.focusTargets.some((t) => !targets.has(t))
  )
    throw new Error("Unsupported scene plan");
  return plan;
}
export function offlineReply(request: ExplainRequest) {
  const scene =
    MANIFESTS[request.lab][
      Math.min(request.chapter, MANIFESTS[request.lab].length - 1)
    ];
  return {
    source: "offline" as const,
    lab: request.lab,
    sceneId: scene.sceneId,
    narration: scene.levels[request.level],
    focusTargets: scene.relatedComponents,
    animationActions: ["focus"],
    caveats: scene.limitations,
    status: "Using curated offline explanation",
  };
}
export function estimateReservation(
  inputTokens: number,
  outputTokens: number,
  inputPrice: number,
  outputPrice: number,
) {
  if (
    ![inputTokens, outputTokens, inputPrice, outputPrice].every(
      Number.isFinite,
    ) ||
    inputTokens < 0 ||
    outputTokens < 0 ||
    inputPrice <= 0 ||
    outputPrice <= 0
  )
    return null;
  return (inputTokens * inputPrice + outputTokens * outputPrice) / 1e6;
}
