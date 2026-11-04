# MUSE SIMLAB — final construction rebuild

Updated November 5, 2026. The user's **Construct, Activate, Experiment** request supersedes conflicting requirements in the earlier master specification. Earlier `master-*.png` screenshots are historical prototype evidence.

## Implemented

- Read the attached request, complete master specification, workspace guidance and current implementation. Applied installed `3dviz-pro-max`, `frontend-design`, `ui-ux-pro-max`, `vercel-react-best-practices`, test-first debugging and `verification-before-completion` guidance. Context7 supplied current R3F frame-loop and disposal guidance. Playwright MCP inspected actual rendering.
- Removed all video playback buttons, timeline/chapter selectors, speed controls and robot history scrubbing from the interface. Replaced the preassembled gateway models with an abstract reactive environment and a central prompt. Suggestions and typed prompts share the local launch pipeline.
- Replaced the old pre-mounted chapter offsets with an explicit construction engine. Labs begin with no mounted components, wait for the model library to load, then introduce named geometry sequentially. Parts align, attach and remain. Restart resets the clock, mounts, counts and numerical experiment. Reduced motion retains independent stages.
- **Wonder — 22 stages:** token/ID/position carriers; distinct embedding and position banks; separate Q/K/V vector structures; raw causal score lattice; softmax manifold; weighted values; detailed dual-head bridge; projection; residual/norm; FFN; stack; memory; retrieval; focus; planning; validation/recovery; complete frame; live output. Render structures consume actual intermediate tensors. Local untrained transformer, Jaccard memory and checked synthetic agent remain functional.
- **Chip — 20 stages:** cradle, layered substrate, routes, independent die A and regions, die B and regions, interconnect, PEs, arithmetic, stacked memory, buffers, contacts, thermal hardware, protective frame, closure, exploded registration, rack context, software dispatch and live compute. Instanced detail includes 72 illustrative rack trays. Editable matrices, actual MAC execution, worker timing and 4/8-bit integer reconstruction remain functional.
- **Robot — 32 stages:** pelvis, internal torso, separate left and right hips, linked legs/knees/ankles/feet, shoulders/arms/elbows/wrists, palms, nested phalanges, opposed thumbs, neck, custom faceted head, sensors, transmissions, wiring, shell, assembly witnesses, calibration markers, perception, map, A*, replanning, IK, grasp/pick/place and autonomous control. Joint groups parent each limb; verified state controls route, reach, grip, carried object and placement.
- Automatic experiment activation after construction. Orbit/zoom inspection, actual mesh-bound focus, labels, isolate, x-ray, explode, dataflow and chip-only heat controls. Component references expose purpose, principle, relationships, current experiment context and three explanation levels. Classification identifies all reconstructions and toy computations.
- Preserved the server-only Nebius adapter and added an explicit paid-test approval guard. Exact key: `NEBIUS_API_KEY`. `.env.example` has placeholders and `NEBIUS_ALLOW_PAID_REQUESTS=false`. No credential was supplied or paid call made.
- Dependencies installed; Prettier added for readable source. The install audit reported zero vulnerabilities.

## Verification status

- Unit suite: **40 tests passed in 7 suites**. Red/green checks covered empty/sequential construction, reduced motion, paid-test approval, shared obstacle edits and exposed intermediate tensors. Existing numerical/controller tests remain passing.
- Typecheck and lint passed before the final cinematic camera addition; the final production build and complete browser regression are in progress. Final results will be recorded in `VALIDATION.md` before handoff.
- Actual Playwright MCP inspection already observed empty starts and partial/complete assemblies in all labs, no runtime/console errors, chip product `[19,22;43,50]`, and robot `COMPLETE` / object `placed` / 6.00 m travelled. Subsequent source refinements are covered by the pending production rerun.
- Actual beginning/middle/final screenshots exist for all three labs. The production suite refreshes these and adds macro/mobile views.

## Remaining limits

1. Live Nebius authentication, inference, returned usage and billing are unverified. A configured key and explicit approval are required before a paid test. Offline simulations are independent of this.
2. Geometry is a conceptual educational reconstruction, not official Meta CAD or hidden model architecture. Toy weights are untrained; memory/agent data is synthetic. Public references are in `SOURCES.md`.
3. The quantizer is symmetric integer arithmetic rather than exact MX/FP8/BF16. Traffic/heat/sensor overlays are explanatory. Robot calibration markers are illustrative; no motor calibration, sensor processing, full-body collision, contact physics or dynamic balance is simulated.
4. Browser inspection establishes these local flows; physical devices, broad GPU/browser coverage and a formal accessibility audit remain unverified. Visual fidelity is not asserted to equal Lusion's production work.
5. The Three/R3F runtime remains a large cached chunk (~1.22 MB raw / 348 KB gzip). Labs are lazy chunks and repeated details use instancing; further runtime/device optimization remains possible.
6. Audio, exported GLB/CAD assets, video recording and public deployment are not included. The local application is the deliverable.

## Run

`npm.cmd run dev` → http://localhost:5173. Production review: build, then `PORT=8788 npm.cmd start` (PowerShell: `$env:PORT='8788'; npm.cmd start`). See `README.md`, `ARCHITECTURE.md`, `VALIDATION.md` and `DEMO.md`.
