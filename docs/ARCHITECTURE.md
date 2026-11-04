# Architecture

The final construction request replaces the former chapter playback mechanism.

- `src/construction/blueprints.ts`: 22/20/32 ordered component definitions. Each includes identity, purpose, principle, earlier parent, local anchor target, three explanation levels and classification. `constructionAt` is a deterministic empty/introduced/attached/completed state function.
- `src/construction/ConstructionTree.tsx`: parent-relative anchor hierarchy for Wonder and the chip. Unoccupied anchors contain no geometry.
- `src/engine/Subsystem.tsx`: future parts are not mounted. Introduced parts translate and rotate into their anchor, then remain attached. No whole-model scale/fade reveal is used. Robot geometry sits inside independent nested joint transforms; mirrored parts can enter with an offset within their stage.
- `src/experience/store.ts`: construction lifecycle, generation, completion and inspection settings. Restart clears counts and the clock, increments the generation and remounts the assembly. No playback flag or scrubber controls construction. Completion opens Experiment automatically.
- `src/experience/World.tsx`: persistent Canvas, centralized GSAP camera director, lazy lab assets, ready gate, frame clock, quality adaptation and graphics recovery. Camera shots alternate component views and wider views; focus uses actual visible mesh bounds. Models must mount before the construction clock advances.
- `src/labs`: original procedural geometry. Repeated chip/memory/rack structures use instances. Joint transforms parent robot links and hands. Attention weights, MAC records, route, IK and object state feed their respective render views.
- `src/experience/data.ts`: numerical/task state. Experiment reset is lab-specific and independent of inspection. Robot and MAC execution use discrete numerical steps, separate from animation interpolation.
- `src/simulation/advanced.ts`: pure deterministic transformer, memory retrieval, guarded agent, tiled multiplication, quantizer, A*, obstacle edit rules, FABRIK and checked robot controller. `src/simulation.ts` retains lower-level tested primitives.
- `src/experience/Experience.tsx` and `Experiments.tsx`: contextual controls, component references, input forms, actual results and provider status. Gateway routing is local; prompt and shortcuts call the same launch action. The gateway only mounts abstract geometry.
- `server`: validated same-origin API and server-only Nebius adapter. Key + explicit paid-test approval + pricing are required before inference. Default operation is unpaid curated mode. No provider response executes code or alters simulation algorithms.

The legacy `manifest.ts` scene references remain a constrained narration knowledge source. Its historical chapter helpers do not control the construction UI. Browser diagnostics expose actual scene traversal, visible component names/positions and projected grid cells for verification; they are not simulation authority.

`scripts/dev.mjs` starts API and Vite together. Production serves the compiled application and API from one Node origin. Vitest covers pure state/math/validation; Playwright verifies complete UI flows against that server.
