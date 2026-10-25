import { test, expect } from "@playwright/test";
import { build } from "vite";
import { resolve } from "node:path";
let harness: string;
test.beforeAll(async () => {
  const result = await build({
    configFile: false,
    logLevel: "silent",
    mode: "development",
    define: { "process.env.NODE_ENV": JSON.stringify("development") },
    build: {
      write: false,
      minify: false,
      lib: {
        entry: resolve("tests/fixtures/NanoStrictHarness.tsx"),
        name: "NanoStrictHarness",
        formats: ["iife"],
      },
    },
  });
  const output = Array.isArray(result) ? result[0] : result;
  if (!("output" in output)) throw Error("Missing output");
  const chunk = output.output.find((c) => c.type === "chunk");
  if (!chunk || chunk.type !== "chunk") throw Error("Missing chunk");
  harness = chunk.code;
});
test("development StrictMode replay does not duplicate actions or revive stale copy after unmount", async ({
  page,
}) => {
  await page.route("**/__nano-strict__", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="ja"><div id="root"></div></html>',
    }),
  );
  await page.goto("__nano-strict__#chapter-7");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            (window as unknown as { finish: () => void }).finish = resolve;
          }),
      },
    });
  });
  await page.addScriptTag({ content: harness });
  await expect.poll(() => page.evaluate(() => window.nanoMounts)).toBe(2);
  await page
    .getByRole("radio", { name: "選んだ主役・背景・画風・構図", exact: true })
    .check();
  await page
    .getByRole("button", { name: "条件を固定して模擬画像を表示" })
    .click();
  const key = "gemini-toranomaki:nano-banana:v1";
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).history,
      key,
    ),
  ).toEqual(["workshop:v1"]);
  await page.getByRole("button", { name: "指示文を全文コピー" }).click();
  await expect(
    page.getByRole("button", { name: "指示文を全文コピー" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "教材表示を切替" }).click();
  await page.evaluate(() =>
    (window as unknown as { finish: () => void }).finish(),
  );
  await page.getByRole("button", { name: "教材表示を切替" }).click();
  await expect.poll(() => page.evaluate(() => window.nanoMounts)).toBe(4);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).copied,
      key,
    ),
  ).toEqual([]);
  await expect(
    page.getByRole("button", { name: "指示文を全文コピー" }),
  ).toBeEnabled();
  await expect(page.getByRole("img")).toHaveCount(0);
  await page.getByRole("button", { name: "第7章だけを初期化" }).click();
  await page.getByRole("button", { name: "第7章の記録を消す" }).click();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), key),
  ).toBeNull();
});
