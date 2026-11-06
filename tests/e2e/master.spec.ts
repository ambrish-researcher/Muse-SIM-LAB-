import { test, expect, type Page } from "@playwright/test";
const totals = { wonder: 22, chip: 20, robot: 32 } as const;
type Lab = keyof typeof totals;
async function complete(page: Page, lab: Lab) {
  await page.goto(`/#${lab}`);
  await expect(page.getByTestId("construction-status")).toHaveAttribute(
    "data-attached",
    String(totals[lab]),
    { timeout: 35000 },
  );
  await expect(
    page.getByRole("button", { name: "Experiment", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
}
async function noPlayback(page: Page) {
  await expect(
    page.getByRole("button", { name: /^(play|pause|resume)(\s|$)/i }),
  ).toHaveCount(0);
  await expect(page.locator(".timeline-dock")).toHaveCount(0);
  await expect(page.getByLabel("Playback speed")).toHaveCount(0);
  await expect(page.getByLabel("Robot history")).toHaveCount(0);
}
test("abstract gateway, prompt recovery, visible component movement and genuine restart", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Enter SimLab", exact: true })
    .waitFor();
  await page.waitForTimeout(1200);
  const beforeArc = await page.evaluate(
    () => window.__MUSE_SCENE__!.cameraPosition,
  );
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(700);
  const afterArc = await page.evaluate(
    () => window.__MUSE_SCENE__!.cameraPosition,
  );
  expect(Math.abs(afterArc[0] - beforeArc[0])).toBeGreaterThan(0.2);
  await page.getByRole("button", { name: "Enter SimLab", exact: true }).click();
  await expect
    .poll(() => page.evaluate(() => window.__MUSE_SCENE__?.components.length))
    .toBe(0);
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByLabel("Describe a system to simulate").fill("Nvidia H100");
  await page
    .getByRole("button", { name: "Launch simulation", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("not supported");
  await page.getByLabel("Describe a system to simulate").fill("chip and robot");
  await page
    .getByRole("button", { name: "Launch simulation", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Choose one system");
  await page
    .getByLabel("Describe a system to simulate")
    .fill("wonder eppadi velai seiyum");
  await page
    .getByRole("button", { name: "Launch simulation", exact: true })
    .click();
  await page.waitForFunction(
    () =>
      window.__MUSE_SCENE__?.phase === "CONSTRUCTION" &&
      window.__MUSE_SCENE__.introduced === 0,
  );
  expect(await page.evaluate(() => window.__MUSE_SCENE__?.components)).toEqual(
    [],
  );
  await page.waitForFunction(
    () =>
      window.__MUSE_SCENE__?.introduced === 1 &&
      window.__MUSE_SCENE__.attached === 0,
  );
  const entering = await page.evaluate(
    () => window.__MUSE_SCENE__!.components[0].position,
  );
  await page.waitForFunction(() => window.__MUSE_SCENE__!.attached >= 1);
  const attached = await page.evaluate(
    () =>
      window.__MUSE_SCENE__!.components.find((p) => p.id === "tokens")!
        .position,
  );
  expect(
    Math.hypot(...entering.map((v, i) => v - attached[i])),
  ).toBeGreaterThan(0.1);
  await page
    .getByRole("button", { name: "Restart construction", exact: true })
    .click();
  await expect(page.getByTestId("construction-status")).toHaveAttribute(
    "data-introduced",
    "0",
  );
  await expect
    .poll(() => page.evaluate(() => window.__MUSE_SCENE__?.components.length))
    .toBe(0);
  await noPlayback(page);
  await page
    .getByRole("button", { name: "Return to gateway", exact: true })
    .click();
  await expect(page.getByLabel("Describe a system to simulate")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.__MUSE_SCENE__?.components.length))
    .toBe(0);
  expect(errors).toEqual([]);
});
for (const lab of Object.keys(totals) as Lab[])
  test(`${lab}: empty, partial, complete, synchronized inspection and restart`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto("/#gateway");
    await page
      .getByRole("button", {
        name:
          lab === "wonder"
            ? "01 Wonder"
            : lab === "chip"
              ? "02 MTIA 400"
              : "03 Robot Max",
        exact: true,
      })
      .click();
    await page.waitForFunction(
      () =>
        window.__MUSE_SCENE__?.phase === "CONSTRUCTION" &&
        window.__MUSE_SCENE__.introduced === 0,
    );
    await page.screenshot({ path: `docs/screenshots/${lab}-beginning.png` });
    expect(
      await page.evaluate(() => window.__MUSE_SCENE__?.components.length),
    ).toBe(0);
    const middle = Math.floor(totals[lab] / 2);
    await page.waitForFunction(
      (n) => (window.__MUSE_SCENE__?.attached ?? 0) >= n,
      middle,
    );
    await page.screenshot({ path: `docs/screenshots/${lab}-middle.png` });
    const ids = await page.evaluate(() => [
      ...new Set(window.__MUSE_SCENE__!.components.map((p) => p.id)),
    ]);
    expect(ids.length).toBeGreaterThanOrEqual(middle);
    expect(ids.length).toBeLessThan(totals[lab]);
    await expect(page.getByTestId("construction-status")).toHaveAttribute(
      "data-attached",
      String(totals[lab]),
      { timeout: 30000 },
    );
    await expect(
      page.getByRole("button", { name: "Experiment", exact: true }),
    ).toHaveAttribute("aria-pressed", "true");
    await page.waitForTimeout(1300);
    await page.screenshot({ path: `docs/screenshots/${lab}-final.png` });
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            new Set(window.__MUSE_SCENE__?.components.map((p) => p.id)).size,
        ),
      )
      .toBe(totals[lab]);
    await noPlayback(page);
    await page.getByRole("button", { name: "Inspect", exact: true }).click();
    const id = lab === "wonder" ? "query" : lab === "chip" ? "die1" : "head";
    await page.getByLabel("Select component").selectOption(id);
    const expected = await page.evaluate(
      (id) => window.__MUSE_SCENE__!.components.find((p) => p.id === id)!.name,
      id,
    );
    await expect(page.getByTestId("component-name")).toHaveText(expected);
    const beginner = await page
      .getByTestId("component-explanation")
      .innerText();
    await page.getByLabel("Explanation depth").selectOption("engineering");
    expect(
      await page.getByTestId("component-explanation").innerText(),
    ).not.toBe(beginner);
    await page.getByLabel("Explanation depth").selectOption("research");
    await expect(page.getByTestId("component-explanation")).toContainText(
      lab === "wonder" ? "untrained" : lab === "chip" ? "throughput" : "FABRIK",
    );
    await page.getByRole("button", { name: "Isolate", exact: true }).click();
    await expect
      .poll(() =>
        page.evaluate(
          (id) => window.__MUSE_SCENE__?.components.every((p) => p.id === id),
          id,
        ),
      )
      .toBe(true);
    await page.getByRole("button", { name: "Isolate", exact: true }).click();
    await page
      .getByRole("button", { name: "Focus selected component", exact: true })
      .click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `docs/screenshots/${lab}-macro.png` });
    await page
      .getByRole("button", { name: "Restart construction", exact: true })
      .click();
    await expect(page.getByTestId("construction-status")).toHaveAttribute(
      "data-introduced",
      "0",
    );
    await expect
      .poll(() => page.evaluate(() => window.__MUSE_SCENE__?.components.length))
      .toBe(0);
    expect(errors).toEqual([]);
  });
test("Wonder computes attention, memory updates, validation recovery and results", async ({
  page,
}) => {
  await complete(page, "wonder");
  await page.getByLabel("Context tokens").fill("a b");
  await page.getByLabel("Query token").selectOption("1");
  await expect(
    page.locator(".experiment-content>.readout").first(),
  ).toContainText("weights = 1.0000");
  await page
    .getByRole("button", { name: "Generate token", exact: true })
    .click();
  await expect(page.getByLabel("Context tokens")).not.toHaveValue("a b");
  await page.getByLabel("Memory query").fill("robot target");
  await expect(page.locator(".memory-results")).toContainText("blue cube");
  await page.getByLabel("New synthetic fact").fill("The robot target is green");
  await page.getByRole("button", { name: "Add fact", exact: true }).click();
  await expect(page.locator(".memory-results")).toContainText("green");
  for (let i = 0; i < 7; i++)
    await page.getByRole("button", { name: "Step agent", exact: true }).click();
  await expect(page.locator(".event-log")).toContainText("Validation failed");
  await expect(
    page.getByRole("button", { name: "Approve demo action", exact: true }),
  ).toBeEnabled();
  await page
    .getByRole("button", { name: "Approve demo action", exact: true })
    .click();
  await expect(
    page.getByText("Safe workflow complete.", { exact: false }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Results", exact: true }).click();
  await expect(page.locator(".results-content pre")).toContainText(
    '"agent": "complete"',
  );
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Download actual results", exact: true })
    .click();
  expect((await download).suggestedFilename()).toBe("muse-wonder-results.json");
  await page
    .getByRole("button", { name: "Reset experiment", exact: true })
    .click();
  await page.getByRole("button", { name: "Experiment", exact: true }).click();
  await expect(page.getByLabel("Context tokens")).toHaveValue(
    "design intelligence simulate reality",
  );
});
test("chip computes edited products, runs MAC operations and exposes layers", async ({
  page,
}) => {
  await complete(page, "chip");
  await page.getByLabel("A row 1 column 1").fill("2");
  await expect(page.locator("output").first()).toHaveText("24");
  await page.getByRole("button", { name: "Step MAC", exact: true }).click();
  await expect(
    page.locator(".experiment-content>.readout").first(),
  ).toContainText("C[1,1]");
  await page.getByRole("button", { name: "Run compute", exact: true }).click();
  await expect(
    page.getByText("Operation 8 / 8", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Quantization bits").selectOption("8");
  await expect(
    page.locator(".readout").filter({ hasText: "RMSE" }),
  ).toBeVisible();
  await page.getByLabel("Matrix size").selectOption("4");
  await expect(page.locator("output")).toHaveCount(16);
  await page.getByRole("button", { name: "Inspect", exact: true }).click();
  const before = await page.evaluate(
    () =>
      window.__MUSE_SCENE__!.components.find((p) => p.id === "thermal")!
        .position[1],
  );
  await page.getByLabel("Exploded assembly").fill("1");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__MUSE_SCENE__!.components.find((p) => p.id === "thermal")!
            .position[1],
      ),
    )
    .toBeGreaterThan(before);
  await page.getByRole("button", { name: "X-ray", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "X-ray", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "X-ray", exact: true }).click();
  await page
    .getByRole("button", { name: "Rack infrastructure", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Rack infrastructure", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(1300);
  await page.screenshot({ path: "docs/screenshots/chip-rack.png" });
});
test("robot shares real world obstacle edits, replans, places and rejects failures", async ({
  page,
}) => {
  await complete(page, "robot");
  await page.waitForTimeout(1400);
  const cell = await page.evaluate(() =>
    window.__MUSE_SCENE__!.cells!.find((c) => c.col === 6 && c.row === 5)!,
  );
  await page.mouse.click(cell.x, cell.y);
  await expect(
    page.getByRole("button", { name: "Cell 7,6", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Cell 7,6", exact: true }).click();
  for (let i = 0; i < 4; i++)
    await page.getByRole("button", { name: "Step task", exact: true }).click();
  await expect(page.locator(".experiment-content>.readout")).toContainText(
    "NAVIGATE",
  );
  await page.getByRole("button", { name: "Cell 2,1", exact: true }).click();
  await expect(
    page.locator(".metrics-grid > span").filter({ hasText: "Replans" }).locator("b"),
  ).toHaveText("1");
  await page
    .getByRole("button", { name: "Run autonomous task", exact: true })
    .click();
  await expect(page.locator(".experiment-content>.readout")).toContainText(
    "COMPLETE",
    { timeout: 20000 },
  );
  await expect(page.locator(".metrics-grid")).toContainText("placed");
  await page.getByRole("button", { name: "Inspect", exact: true }).click();
  const before = await page.evaluate(
    () =>
      window.__MUSE_SCENE__!.components.find((p) => p.id === "head")!
        .position[1],
  );
  await page.getByLabel("Exploded assembly").fill("1");
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          window.__MUSE_SCENE__!.components.find((p) => p.id === "head")!
            .position[1],
      ),
    )
    .toBeGreaterThan(before);
  await page.getByRole("button", { name: "Experiment", exact: true }).click();
  for (const [button, reason] of [
    ["Test no route", "No route available"],
    ["Missing target", "Missing target"],
    ["Invalid grasp", "Invalid grasp distance"],
    ["Unreachable target", "Unreachable target"],
    ["Object moved", "Object moved"],
    ["Collision", "Collision"],
  ]) {
    await page
      .getByRole("button", { name: "Reset world", exact: true })
      .click();
    await page.getByRole("button", { name: button, exact: true }).click();
    await expect(page.locator(".experiment-content>.readout")).toContainText(
      reason,
    );
  }
});
test("server stays unpaid offline and validates request boundaries", async ({
  request,
}) => {
  const health = await request.get("/api/health");
  expect(health.ok()).toBe(true);
  const data = await health.json();
  expect(data.billingBalanceKnown).toBe(false);
  expect(data.liveEnabled).toBe(false);
  const response = await request.post("/api/explain", {
    data: {
      prompt: "why attention",
      lab: "wonder",
      chapter: 2,
      level: "research",
    },
  });
  expect(response.ok()).toBe(true);
  const reply = await response.json();
  expect(reply.sceneId).toBe("MW-03");
  expect(reply.source).toBe("offline");
  expect(
    (
      await request.post("/api/ask", { data: { prompt: "x".repeat(2001) } })
    ).status(),
  ).toBe(400);
  expect(
    (
      await request.post("/api/scene/interpret", {
        data: { prompt: "run code", lab: "arbitrary" },
      })
    ).status(),
  ).toBe(400);
});
test("quality settings and forced WebGL context loss offer recovery", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page
    .getByRole("button", { name: "Experience settings", exact: true })
    .click();
  await page.getByLabel("Render quality").selectOption("high");
  await expect(page.locator("canvas")).toHaveCount(1);
  await page.getByLabel("Render quality").selectOption("low");
  await page
    .getByRole("button", { name: "Close settings", exact: true })
    .click();
  await page.evaluate(() =>
    document
      .querySelector("canvas")!
      .getContext("webgl2")!
      .getExtension("WEBGL_lose_context")
      ?.loseContext(),
  );
  await expect(page.locator("#webgl-status")).toBeVisible();
  await page
    .locator("#webgl-status")
    .getByRole("button", { name: "Reload", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Enter SimLab", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("#webgl-status")).toBeHidden();
  expect(errors).toEqual([]);
});
test("mobile routes retain construction, controls and no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const lab of ["wonder", "chip", "robot"] as const) {
    await complete(page, lab);
    await expect(
      page.getByRole("button", { name: "Inspect", exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
    ).toBe(false);
    await expect(page.locator("#webgl-status")).toBeHidden();
    await noPlayback(page);
    await page.screenshot({ path: `docs/screenshots/${lab}-mobile.png` });
  }
});
