# MUSE SIMLAB

**Design Intelligence. Simulate Reality.**

An original, independent spatial learning experience. The user's final **Construct, Activate, Experiment** request supersedes conflicting playback and portal-preview requirements in `MASTER_PROMPT.txt`.

## Run

Node 24 and npm are required. On Windows PowerShell use `npm.cmd` when execution policy blocks `npm.ps1`.

```sh
npm install
npm run dev
```

Development: http://localhost:5173 with the local API on :8787. Production: `npm run build` then `npm start` (default :8787). Set `PORT=8788` for the review instance. Direct routes: `/#gateway`, `/#wonder`, `/#chip`, `/#robot`.

## Experience

- Pointer-reactive engineered intro, click pulse, scroll camera arc, abstract prompt gateway. Completed lab models never appear in the gateway.
- A prompt or suggestion launches the same construction pipeline. Every lab begins empty. Separate components enter, align and remain attached: **22 Wonder stages, 20 chip stages, 32 robot stages**.
- Automatic transition to experiments after assembly. Restart construction clears the model and experiment. Inspect enables orbit/zoom, component focus, labels, isolation, exploded assembly and x-ray. There are no video playback or chapter-scrubbing controls.
- **Wonder:** explicit token IDs, position terms, four-dimensional embeddings, Q/K/V, raw/scaled causal scores, softmax, two attention heads, projection, residual normalization, FFN and next-token probabilities. Editable synthetic memory uses Jaccard retrieval. A checked agent demonstrates validation failure, revision, retry and approval.
- **MTIA 400:** original dual-chiplet package with circuitry, compute arrays, layered memory, contacts, cooling, retention hardware and rack infrastructure. Editable 2×2/4×4 matrices, tiling, genuine MAC records, worker execution and symmetric 4/8-bit quantization with measured error. Rack inspection shows 72 illustrative trays.
- **Robot Max:** original articulated chassis, separate hip assemblies, bearings, struts, segmented hands, opposed thumbs, custom head enclosure, wiring and shell. A* navigation, shared 3D/grid obstacle edits, replanning, joint targets, FABRIK reaching, checked grasp/carry/place and explicit failures.
- Component-specific Beginner / Engineering / Research explanations, current experiment connections, provenance notes, offline reference answers and downloadable actual results.

## Optional Nebius narration

Use `.env.example` as a template; no credential file is included. The exact server secret is `NEBIUS_API_KEY`. It must never use a `VITE_` prefix.

Paid requests require all of:

1. A user-configured server key.
2. Verified current input/output prices.
3. Explicit approval of a paid test, followed by `NEBIUS_ALLOW_PAID_REQUESTS=true` on the server.

The approval flag defaults to false. Local construction and computation need no key. Launching a scene does not request inference. `/api/health` reports whether paid inference is enabled. The app's persistent reservation ledger is an application estimate, not a provider billing balance. No key or paid-test approval was supplied, and no paid request was made.

API routes: GET `/api/health`; POST `/api/scene/interpret`, `/api/explain`, `/api/ask`. The adapter retains schema validation, allowlisted scenes/actions, bounded requests, timeout, rate limiting, cache, spending guard and deterministic fallback. Generated executable code is never evaluated.

## Verify

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:e2e
```

Playwright uses installed Chrome and localhost:5173 by default. Set `E2E_BASE_URL=http://localhost:8788` to test the same-origin production server. The browser suite captures empty, middle, final, macro and mobile lab views. `scripts/visual-qa.js` is a function for the connected Playwright MCP tool; it captures the intro and abstract gateway at four sizes. Current evidence and limitations: [progress](docs/PROGRESS.md), [validation](docs/VALIDATION.md).

## Scope

These are conceptual educational reconstructions, not official Meta CAD, proprietary model internals or manufacturer robot specifications. Transformer weights are untrained. Memory and agent actions use synthetic local data. The integer quantizer is not a bit-accurate FP8/MX/BF16 implementation, browser timing is not chip throughput, thermal overlays are illustrative, and robot motion is kinematic rather than dynamic physics.

All 3D geometry is authored procedurally; no copied Lusion assets or purchased/proprietary models are used. Archivo and Space Grotesk use Google Fonts with system fallbacks. Audio is omitted. See [architecture](docs/ARCHITECTURE.md), [sources](docs/SOURCES.md) and [walkthrough](docs/DEMO.md).

The integrated Node server serves `dist` and API routes together. No public deployment was performed. A production deployment should retain durable ledger storage and add shared authentication/rate limits before multi-process or public operation.
