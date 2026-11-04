# Validation — final construction rebuild

November 5, 2026. Local Windows, installed Chrome, Playwright MCP and Playwright Test. Production verification is currently running; this file will record actual results before handoff.

## Evidence already observed

- Real Playwright MCP scene traversal confirmed zero mounted components at the start of each lab; partial sets grew to 22 Wonder, 20 chip and 32 robot components.
- The gateway had no lab component nodes. Prompt submission and textual suggestions invoked the same construction engine.
- The chip's default product was `[19,22;43,50]`. A checked robot task completed with the object placed, 6.00 m travelled and 7.75 seconds of simulation time. No page or console errors were reported in that workflow.
- Beginning, middle and final images were captured for each lab. See `docs/screenshots/{wonder,chip,robot}-{beginning,middle,final}.png`. New production regression captures replace these after later refinements.
- Unit tests: 40 passed in 7 suites. Fresh production browser regression, final lint/typecheck and renderer observations are pending below.

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
