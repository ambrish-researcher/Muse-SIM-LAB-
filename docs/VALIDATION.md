# Validation — final construction rebuild

November 6, 2026. Local Windows, installed Chrome, Playwright MCP and Playwright Test. Final production regression completed against http://localhost:8788; no deployment or paid inference was performed.

## Evidence already observed

- Real Playwright MCP scene traversal confirmed zero mounted components at the start of each lab; partial sets grew to 22 Wonder, 20 chip and 32 robot components.
- The gateway had no lab component nodes. Prompt submission and textual suggestions invoked the same construction engine.
- The chip's default product was `[19,22;43,50]`. A checked robot task completed with the object placed, 6.00 m travelled and 7.75 seconds of simulation time. No page or console errors were reported in that workflow.
- Beginning, middle and final images were captured for each lab. See `docs/screenshots/{wonder,chip,robot}-{beginning,middle,final}.png`. New production regression captures replace these after later refinements.
- Unit tests: 40 passed in 7 suites. Final continuation results are recorded below.

## Reproduce

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
$env:PORT='8788'
npm.cmd start
# In another terminal:
$env:E2E_BASE_URL='http://localhost:8788'
npm.cmd run test:e2e
```

The browser suite uses reduced motion for full workflows and normal motion for a separate actual component-translation test. It does not bypass construction state or send paid requests. The connected MCP accepts `scripts/visual-qa.js` for responsive intro/gateway captures.

Provider authentication and billing, public deployment, physical-device performance and formal WCAG compliance remain unverified. Renderer intervals are local browser observations, not GPU-only timings or a portable frame-rate guarantee.


## November 6 continuation: verified existing implementation

Confirmed the existing checkout at `C:\Users\AMBRISH\muse-simlab`, remote `https://github.com/ambrish-researcher/Muse-SIM-LAB-.git`, branch `main`, initially clean. No clone, scaffold, redesign or replacement was performed.

### Focused corrections

- Wonder Research explanations now explicitly disclose fixed, untrained weights, consistent with Engineering explanations.
- Same-document hash changes now use existing launch/enter actions. Direct navigation between laboratories works without replacing the persistent Canvas; the listener is removed on unmount.
- Robot grasp-marker clicks in Experiment mode project onto the floor and use existing obstacle editing. Inspect mode retains component selection. Numerical controllers and protected-cell rules are unchanged.
- The robot regression now checks the Replans row's numeric value instead of requiring a presentation newline in concatenated DOM text.

The original browser run reproduced all three application issues. Subsequent runs verified each fix; the last remaining assertion failure was the newline mismatch, with an actual displayed replan count of 1.

### Final executed checks

| Command | Actual result |
|---|---|
| `npm.cmd run typecheck` | Passed |
| `npm.cmd run lint` | Passed, zero warnings |
| `npm.cmd test` | 40 passed in 7 suites |
| `npm.cmd run build` | Passed; existing large Three.js chunk warning remains |
| `E2E_BASE_URL=http://localhost:8788 npm.cmd run test:e2e` | 10 passed in 2.3 minutes |
| `git diff --check` | Passed |

Browser coverage includes gateway validation and actual component translation; empty/partial/complete assembly, synchronized inspection and restart in all three labs; Wonder attention, memory and agent recovery; chip editable multiplication, MAC operations and layers; robot 3D/grid edits, replanning, pick/place and six checked failures; offline API boundaries; graphics recovery; and all three mobile routes with no horizontal overflow. The existing suite refreshed `docs/screenshots/{wonder,chip,robot}-{beginning,middle,final,macro,mobile}.png` plus the chip rack image.

Separate Playwright MCP observations confirmed one persistent Canvas across a Robot-to-chip hash transition, 20 attached chip stages, and robot task status COMPLETE with object placed (7.00 m and 8.25 seconds of simulation time in that particular default run). Console errors and warnings were zero in the inspected session. One chip-view diagnostic sample at 1440x900 reported a 29.34 ms frame interval, 259 draw calls and 263,816 triangles; this is a local browser observation, not a cross-device performance guarantee.

`GET /api/health` returned HTTP 200, provider offline, liveEnabled false, authenticated false and billingBalanceKnown false. Live Nebius authentication/inference/billing remain unverified. No source credentials, paid calls, commits, pushes or public deployment were introduced. The conceptual geometry, untrained teaching models, integer quantizer and kinematic robotics limitations above remain applicable.
