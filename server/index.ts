import { createServer } from "node:http";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import {
  RequestSchema,
  offlineReply,
  validatePlan,
  estimateReservation,
  inferenceApproved,
} from "./service.ts";
import { MANIFESTS } from "../src/experience/manifest.ts";
import { routeIntent } from "../src/simulation/advanced.ts";
const port = Number(process.env.PORT || 8787),
  root = resolve("dist"),
  key = process.env.NEBIUS_API_KEY || "",
  base =
    process.env.NEBIUS_BASE_URL ||
    "https://api.tokenfactory.us-north1.nebius.com/v1/",
  model = process.env.NEBIUS_MODEL || "meta-models/muse-spark-open";
const paidApproved = inferenceApproved(
  key,
  process.env.NEBIUS_ALLOW_PAID_REQUESTS,
);
const inputPrice = Number(process.env.NEBIUS_INPUT_USD_PER_MILLION || 0),
  outputPrice = Number(process.env.NEBIUS_OUTPUT_USD_PER_MILLION || 0),
  budget = Number.isFinite(Number(process.env.AI_DEMO_BUDGET_USD || 5))
    ? Math.max(0, Number(process.env.AI_DEMO_BUDGET_USD || 5))
    : 0,
  cap = Math.min(
    1200,
    Math.max(64, Number(process.env.AI_REQUEST_MAX_OUTPUT_TOKENS || 1200)),
  );
let ledger = { spent: 0, promptTokens: 0, completionTokens: 0, requests: 0 };
let authenticated = false;
try {
  ledger = JSON.parse(await readFile(".runtime/usage.json", "utf8"));
} catch {
  /* no previous local ledger */
}
const cache = new Map<string, unknown>(),
  rates = new Map<string, { time: number; count: number }>();
const status = () => ({
  provider: key ? "configured" : "offline",
  model,
  authenticated,
  liveEnabled: paidApproved && inputPrice > 0 && outputPrice > 0,
  status: !key
    ? "No server API key configured"
    : !paidApproved
      ? "Paid inference disabled; explicit test approval required"
      : !inputPrice || !outputPrice
        ? "Pricing required before live inference"
        : authenticated
          ? "Provider accepted a request this session"
          : "Ready to test; authentication unverified",
  budgetUsd: budget,
  estimatedSpendUsd: ledger.spent,
  usage: ledger,
  pricingConfigured: inputPrice > 0 && outputPrice > 0,
  billingBalanceKnown: false,
});
const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://localhost");
  const json = (code: number, data: unknown) => {
    res.writeHead(code, {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(JSON.stringify(data));
  };
  try {
    if (url.pathname === "/api/health" && req.method === "GET") {
      json(200, status());
      return;
    }
    if (url.pathname.startsWith("/api/")) {
      if (
        req.method !== "POST" ||
        !["/api/explain", "/api/ask", "/api/scene/interpret"].includes(
          url.pathname,
        )
      ) {
        json(404, { error: "Unknown API endpoint" });
        return;
      }
      const origin = req.headers.origin;
      if (
        origin &&
        ![
          "http://localhost:5173",
          "http://localhost:4173",
          process.env.PUBLIC_ORIGIN,
          `http://${req.headers.host}`,
        ].includes(origin)
      ) {
        json(403, { error: "Origin not allowed" });
        return;
      }
      const ip = req.socket.remoteAddress || "local",
        now = Date.now(),
        rate = rates.get(ip);
      if (rate && now - rate.time < 60000 && rate.count >= 15) {
        json(429, { error: "Request limit reached. Try again in one minute." });
        return;
      }
      rates.set(
        ip,
        rate && now - rate.time < 60000
          ? { ...rate, count: rate.count + 1 }
          : { time: now, count: 1 },
      );
      if (rates.size > 1000) rates.clear();
      let raw = "";
      for await (const chunk of req) {
        raw += chunk;
        if (Buffer.byteLength(raw) > 10000) {
          json(413, { error: "Request too large" });
          return;
        }
      }
      let body: unknown;
      try {
        body = JSON.parse(raw);
      } catch {
        json(400, { error: "Invalid JSON" });
        return;
      }
      const parsed = RequestSchema.safeParse(body);
      if (!parsed.success) {
        json(400, {
          error:
            "Invalid request. Prompt, lab, chapter and level must be supported.",
        });
        return;
      }
      const request = parsed.data,
        fallback = offlineReply(request);
      if (url.pathname === "/api/scene/interpret") {
        const intent = routeIntent(request.prompt);
        if (!intent || intent === "ambiguous") {
          json(200, {
            source: "offline",
            unsupported: true,
            narration:
              intent === "ambiguous"
                ? "Choose one supported lab to continue."
                : "Only Muse Wonder, MTIA 400 and Robot Max are supported.",
          });
          return;
        }
        if (intent !== request.lab) {
          json(400, { error: "Prompt intent and selected lab differ" });
          return;
        }
      }
      const reserve = estimateReservation(24000, cap, inputPrice, outputPrice);
      if (!paidApproved || reserve === null) {
        json(200, {
          ...fallback,
          reason: !paidApproved
            ? "Paid inference disabled; key and explicit test approval required"
            : "Verified pricing not configured",
        });
        return;
      }
      if (ledger.spent + reserve > budget) {
        json(200, {
          ...fallback,
          reason: "Application spending guard reached",
        });
        return;
      }
      const cacheKey = JSON.stringify(request);
      if (cache.has(cacheKey)) {
        json(200, { ...(cache.get(cacheKey) as object), cached: true });
        return;
      }
      const allowed = MANIFESTS[request.lab].map((s) => ({
        sceneId: s.sceneId,
        title: s.title,
        targets: s.relatedComponents,
      }));
      // Persist the conservative reservation before sending a potentially billable request.
      ledger = {
        ...ledger,
        spent: ledger.spent + reserve,
        requests: ledger.requests + 1,
      };
      await mkdir(".runtime", { recursive: true });
      await writeFile(".runtime/usage.json", JSON.stringify(ledger));
      try {
        const response = await fetch(new URL("chat/completions", base), {
          method: "POST",
          signal: AbortSignal.timeout(12000),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: cap,
            messages: [
              {
                role: "system",
                content: `You explain an independent educational simulation. Never invent proprietary internals, hardware performance or computations. Muse Wonder is the subject; you are Muse Spark Open. Return JSON only with lab, sceneId, narration, focusTargets, animationActions, caveats. Allowed actions: focus, assemble, dataflow, overview. Allowed scenes: ${JSON.stringify(allowed)}. Use only the active lab ${request.lab}. Curated reference: ${fallback.narration}`,
              },
              {
                role: "user",
                content: `Level: ${request.level}. Question: ${request.prompt}. Local state: ${request.context || "No local measurements supplied."}`,
              },
            ],
          }),
        });
        if (!response.ok) throw new Error("Provider returned an error");
        authenticated = true;
        const data = (await response.json()) as {
          choices?: { message?: { content?: string } }[];
          usage?: { prompt_tokens: number; completion_tokens: number };
        };
        // Reserve the full request estimate even when usage or output is malformed.
        const usage = data.usage;
        const estimated = usage
          ? (estimateReservation(
              usage.prompt_tokens,
              usage.completion_tokens,
              inputPrice,
              outputPrice,
            ) ?? reserve)
          : reserve;
        ledger = {
          spent: ledger.spent - reserve + estimated,
          promptTokens: ledger.promptTokens + (usage?.prompt_tokens || 0),
          completionTokens:
            ledger.completionTokens + (usage?.completion_tokens || 0),
          requests: ledger.requests,
        };
        await mkdir(".runtime", { recursive: true });
        await writeFile(".runtime/usage.json", JSON.stringify(ledger));
        const content = data.choices?.[0]?.message?.content || "";
        const clean = content.replace(/^```(?:json)?\s*|\s*```$/g, "");
        const plan = validatePlan(JSON.parse(clean), request.lab);
        const reply = {
          ...plan,
          source: "nebius",
          model,
          status:
            "Explanation generated using Meta Muse Spark Open via Nebius.",
          usage: usage ?? null,
          estimatedRequestUsd: estimated,
        };
        cache.set(cacheKey, reply);
        if (cache.size > 50) cache.delete(cache.keys().next().value!);
        json(200, reply);
      } catch {
        json(200, {
          ...fallback,
          reason:
            "Provider timeout, error or invalid structured response. Curated explanation retained.",
        });
      }
      return;
    }
    if (req.method !== "GET") {
      json(405, { error: "Method not allowed" });
      return;
    }
    const file = resolve(root, `.${decodeURIComponent(url.pathname)}`);
    if (!file.startsWith(root + sep) && file !== root) {
      json(403, { error: "Invalid path" });
      return;
    }
    let target = file;
    try {
      if (!(await stat(file)).isFile()) target = resolve(root, "index.html");
    } catch {
      target = resolve(root, "index.html");
    }
    const mime: Record<string, string> = {
      ".html": "text/html",
      ".js": "application/javascript",
      ".css": "text/css",
      ".svg": "image/svg+xml",
      ".png": "image/png",
      ".json": "application/json",
      ".woff2": "font/woff2",
    };
    res.writeHead(200, {
      "Content-Type": mime[extname(target)] || "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
    });
    res.end(await readFile(target));
  } catch {
    json(500, {
      error: "Local server error; simulation remains available offline",
    });
  }
});
server.listen(port, process.env.HOST || "127.0.0.1", () =>
  process.stdout.write(
    `MUSE API listening at http://localhost:${port} (${key ? "key configured" : "offline"})\n`,
  ),
);
process.on("SIGTERM", () => server.close());
process.on("SIGINT", () => server.close());
