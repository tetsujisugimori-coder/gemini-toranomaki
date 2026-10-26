import { test, expect, type Page } from "@playwright/test";
import { build } from "vite";
import { resolve } from "node:path";
let harness: string;
test.beforeAll(async () => {
  // Existing Vite bundles the real component + development React for StrictMode.
  // No new package, production input, server, public file or saved artifact.
  const result = await build({
    configFile: false,
    logLevel: "silent",
    mode: "development",
    define: { "process.env.NODE_ENV": JSON.stringify("development") },
    build: {
      write: false,
      minify: false,
      lib: {
        entry: resolve("tests/fixtures/CanvasTimerHarness.tsx"),
        name: "CanvasTimerHarness",
        formats: ["iife"],
      },
    },
  });
  const output = Array.isArray(result) ? result[0] : result;
  if (!("output" in output)) throw Error("Expected in-memory bundle");
  const chunk = output.output.find((c) => c.type === "chunk");
  if (!chunk || chunk.type !== "chunk") throw Error("Missing harness chunk");
  harness = chunk.code;
});
const timer = (p: Page) =>
  p.getByRole("region", { name: "教材用タイマー試作品", exact: true });
const zeroCalls = (p: Page) =>
  p.evaluate(() => window.timerHarness.calls.filter((c) => c.id === "zero"));
async function mount(p: Page, strict: boolean) {
  await p.clock.install();
  await p.route("**/__canvas-timer-harness__", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="ja"><div id="root"></div></html>',
    }),
  );
  await p.goto("__canvas-timer-harness__");
  await p.evaluate((value) => {
    window.timerStrict = value;
  }, strict);
  await p.addScriptTag({ content: harness });
  await expect(timer(p)).toBeVisible();
  await expect
    .poll(() => p.evaluate(() => window.timerHarness.mounts))
    .toBe(strict ? 2 : 1);
  await expect
    .poll(() => p.evaluate(() => typeof window.timerHarness.callback))
    .toBe("function");
}
async function rerender(p: Page) {
  await p.evaluate(() => {
    window.timerHarness.previousCallback = window.timerHarness.callback;
  });
  await p.getByRole("button", { name: "親だけを再描画", exact: true }).click();
  await expect
    .poll(() =>
      p.evaluate(
        () =>
          window.timerHarness.callback !== window.timerHarness.previousCallback,
      ),
    )
    .toBe(true);
}
async function reachZero(p: Page, seconds = 10) {
  const previousCalls = (await zeroCalls(p)).length;
  await timer(p).getByRole("button", { name: "開始", exact: true }).click();
  await p.clock.runFor(seconds * 1000);
  await expect(timer(p)).toContainText("0秒への到達：1回");
  await expect.poll(() => zeroCalls(p)).toHaveLength(previousCalls + 1);
}
for (const strict of [false, true])
  test(`zero history is emitted once per stop event, never on parent/callback changes (StrictMode=${strict})`, async ({
    page,
  }) => {
    await mount(page, strict);
    await reachZero(page);
    expect(await zeroCalls(page)).toHaveLength(1);
    await rerender(page);
    await expect(timer(page)).toContainText("0秒への到達：1回");
    expect(await zeroCalls(page)).toHaveLength(1);
    await rerender(page);
    await page.clock.runFor(20_000);
    expect(await zeroCalls(page)).toHaveLength(1);
  });

for (const strict of [false, true])
  test(`each new loop event notifies once through start/pause/resume/reset and fresh callbacks (StrictMode=${strict})`, async ({
    page,
  }) => {
    await mount(page, strict);
    await page
      .getByRole("combobox", { name: "動作の指示", exact: true })
      .selectOption("loop");
    await page
      .getByRole("button", { name: "指示を固定タイマーに反映", exact: true })
      .click();
    await timer(page)
      .getByRole("button", { name: "開始", exact: true })
      .click();
    await reachZero(page); // Repeated start still creates only one interval.
    expect(await zeroCalls(page)).toHaveLength(1);
    await rerender(page);
    expect(await zeroCalls(page)).toHaveLength(1);
    await page.clock.runFor(10_000);
    await expect(timer(page)).toContainText("0秒への到達：2回");
    await expect.poll(() => zeroCalls(page)).toEqual([
      { id: "zero", revision: 0 },
      { id: "zero", revision: 1 },
    ]);
    await timer(page)
      .getByRole("button", { name: "一時停止", exact: true })
      .click();
    await rerender(page);
    await page.clock.runFor(20_000);
    expect(await zeroCalls(page)).toHaveLength(2);
    await timer(page)
      .getByRole("button", { name: "開始", exact: true })
      .click();
    await page.clock.runFor(10_000);
    await expect(timer(page)).toContainText("0秒への到達：3回");
    // History is emitted by an Effect after the timer state commits.
    await expect.poll(() => zeroCalls(page)).toHaveLength(3);
    await timer(page)
      .getByRole("button", { name: "タイマーをリセット", exact: true })
      .click();
    await expect(timer(page)).toContainText("0秒への到達：0回");
    await expect(timer(page)).toContainText("状態：停止中");
    await rerender(page);
    expect(await zeroCalls(page)).toHaveLength(3);
    await reachZero(page);
    expect(await zeroCalls(page)).toHaveLength(4);
    await page.clock.runFor(30_000);
    await expect(timer(page)).toContainText("0秒への到達：4回");
    await expect.poll(() => zeroCalls(page)).toHaveLength(7);
  });

test("version switch preserves each consumed event, stops both runs and does not replay old zero counts", async ({
  page,
}) => {
  await mount(page, true);
  await reachZero(page);
  expect(await zeroCalls(page)).toHaveLength(1);
  await page.getByRole("button", { name: "変更前を操作", exact: true }).click();
  expect(await zeroCalls(page)).toHaveLength(1);
  await reachZero(page);
  expect(await zeroCalls(page)).toHaveLength(2);
  await page.getByRole("button", { name: "変更後を操作", exact: true }).click();
  await expect(timer(page)).toContainText("0秒への到達：1回");
  await rerender(page);
  await page.clock.runFor(20_000);
  expect(await zeroCalls(page)).toHaveLength(2);
  await page.getByRole("button", { name: "変更前を操作", exact: true }).click();
  expect(await zeroCalls(page)).toHaveLength(2);
  await timer(page)
    .getByRole("button", { name: "タイマーをリセット", exact: true })
    .click();
  await reachZero(page);
  expect(await zeroCalls(page)).toHaveLength(3);
  await page.getByRole("button", { name: "変更後を操作", exact: true }).click();
  expect(await zeroCalls(page)).toHaveLength(3);
});

test("actual instruction application resets both event baselines; selection and equal reapplication do not replay events", async ({
  page,
}) => {
  await mount(page, true);
  await reachZero(page);
  expect(await zeroCalls(page)).toHaveLength(1);
  await page
    .getByRole("combobox", { name: "設定時間", exact: true })
    .selectOption("20");
  await expect(timer(page).getByRole("timer")).toHaveText("0秒");
  expect(await zeroCalls(page)).toHaveLength(1);
  await page
    .getByRole("button", { name: "指示を固定タイマーに反映", exact: true })
    .click();
  await expect(timer(page).getByRole("timer")).toHaveText("20秒");
  await expect(timer(page)).toContainText("状態：停止中");
  await expect(timer(page)).toContainText("0秒への到達：0回");
  expect(await zeroCalls(page)).toHaveLength(1);
  await reachZero(page, 20);
  expect(await zeroCalls(page)).toHaveLength(2);
  await page
    .getByRole("button", { name: "指示を固定タイマーに反映", exact: true })
    .click();
  await expect(timer(page)).toContainText("0秒への到達：1回");
  expect(await zeroCalls(page)).toHaveLength(2);
  await page.getByRole("button", { name: "変更前を操作", exact: true }).click();
  await expect(timer(page)).toContainText("状態：停止中");
  await expect(timer(page)).toContainText("0秒への到達：0回");
  await reachZero(page);
  expect(await zeroCalls(page)).toHaveLength(3);
  await page.getByRole("button", { name: "変更後を操作", exact: true }).click();
  expect(await zeroCalls(page)).toHaveLength(3);
});

for (const strict of [false, true])
  test(`unmount/reopen cleans the interval and cannot reuse old events (StrictMode=${strict})`, async ({
    page,
  }) => {
    await mount(page, strict);
    await page
      .getByRole("combobox", { name: "動作の指示", exact: true })
      .selectOption("loop");
    await page
      .getByRole("button", { name: "指示を固定タイマーに反映", exact: true })
      .click();
    await timer(page)
      .getByRole("button", { name: "開始", exact: true })
      .click();
    await page.clock.runFor(2000);
    await expect(timer(page).getByRole("timer")).toHaveText("8秒");
    await page
      .getByRole("button", { name: "教材を閉じる", exact: true })
      .click();
    await expect(timer(page)).toHaveCount(0);
    await page.clock.runFor(30_000);
    expect(await zeroCalls(page)).toHaveLength(0);
    expect(await page.evaluate(() => window.timerHarness.cleanups)).toBe(
      strict ? 2 : 1,
    );
    await page
      .getByRole("button", { name: "教材を再表示", exact: true })
      .click();
    await expect(timer(page)).toContainText("状態：停止中");
    await expect(timer(page)).toContainText("0秒への到達：0回");
    await reachZero(page);
    expect(await zeroCalls(page)).toHaveLength(1);
    await page
      .getByRole("button", { name: "教材を閉じる", exact: true })
      .click();
    await page.clock.runFor(30_000);
    await page
      .getByRole("button", { name: "教材を再表示", exact: true })
      .click();
    await rerender(page);
    expect(await zeroCalls(page)).toHaveLength(1);
    await reachZero(page);
    expect(await zeroCalls(page)).toHaveLength(2);
  });
