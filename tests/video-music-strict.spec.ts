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
        entry: resolve("tests/fixtures/VideoMusicStrictHarness.tsx"),
        name: "VideoMusicStrictHarness",
        formats: ["iife"],
      },
    },
  });
  const output = Array.isArray(result) ? result[0] : result;
  if (!("output" in output)) throw Error("Missing output");
  const chunk = output.output.find((c) => c.type === "chunk");
  if (!chunk || chunk.type !== "chunk") throw Error("Missing bundle");
  harness = chunk.code;
});
test("development StrictMode does not duplicate video history or revive audio/copy after unmount", async ({
  page,
}) => {
  const epoch = new Date("2026-10-26T12:00:00Z");
  await page.clock.install({ time: epoch });
  await page.clock.pauseAt(new Date(epoch.getTime() + 1000));
  await page.route("**/__video-music-strict__", (r) =>
    r.fulfill({
      contentType: "text/html",
      body: '<!doctype html><html lang="ja"><div id="root"></div></html>',
    }),
  );
  await page.goto("__video-music-strict__#chapter-8");
  await page.evaluate(() => {
    const state = {
      created: 0,
      closed: 0,
      notes: 0,
      resume: () => {},
      copy: () => {},
    };
    (window as unknown as { videoMusicTest: typeof state }).videoMusicTest =
      state;
    class Context {
      state = "running";
      currentTime = 0;
      destination = {};
      constructor() {
        state.created++;
      }
      resume() {
        return new Promise<void>((r) => {
          state.resume = r;
        });
      }
      close() {
        state.closed++;
        return Promise.resolve();
      }
      createGain() {
        return {
          gain: {
            value: 0,
            setValueAtTime: () => {},
            linearRampToValueAtTime: () => {},
          },
          connect: () => {},
        };
      }
      createOscillator() {
        return {
          type: "sine",
          frequency: { value: 0 },
          connect: () => {},
          disconnect: () => {},
          stop: () => {},
          start: () => {
            state.notes++;
          },
        };
      }
    }
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: Context,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((r) => {
            state.copy = r;
          }),
      },
    });
  });
  await page.addScriptTag({ content: harness });
  await expect.poll(() => page.evaluate(() => window.videoMusicMounts)).toBe(2);
  const step = async (n: number) => {
    await page.locator(".service-steps button").nth(n).click();
    await expect(page.locator("#vm-step")).toBeFocused();
  };
  await page
    .getByRole("group", { name: "操作前の予想", exact: true })
    .getByRole("radio")
    .first()
    .check();
  await page
    .getByRole("button", { name: "予想を確定して動画を試す", exact: true })
    .click();
  await page.getByRole("button", { name: "動画を再生", exact: true }).click();
  await page.clock.runFor(1000);
  await expect(page.getByRole("timer")).toHaveText("再生位置：1.0 / 6秒");
  await page
    .getByLabel("この体験を閲覧した（自己記録）", { exact: true })
    .check();
  await page.clock.runFor(1000);
  await expect(page.getByRole("timer")).toHaveText("再生位置：2.0 / 6秒");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("gemini-toranomaki:video-music:v1")!)
          .history,
    ),
  ).toEqual(["video:v1"]);
  await step(2);
  await page
    .getByRole("group", { name: "操作前の予想", exact: true })
    .getByRole("radio")
    .first()
    .check();
  await page
    .getByRole("button", { name: "予想を確定して音の構成を開く", exact: true })
    .click();
  await page
    .getByRole("button", { name: "音声デモを再生・最初から", exact: true })
    .click();
  await page
    .getByRole("button", { name: "この指示文を全文コピー", exact: true })
    .click();
  await page
    .getByRole("button", { name: "教材表示を切替", exact: true })
    .click();
  await page.evaluate(() => {
    const x = (
      window as unknown as {
        videoMusicTest: { resume: () => void; copy: () => void };
      }
    ).videoMusicTest;
    x.resume();
    x.copy();
  });
  await page
    .getByRole("button", { name: "教材表示を切替", exact: true })
    .click();
  await expect.poll(() => page.evaluate(() => window.videoMusicMounts)).toBe(4);
  const state = await page.evaluate(
    () =>
      (
        window as unknown as {
          videoMusicTest: { created: number; closed: number; notes: number };
        }
      ).videoMusicTest,
  );
  expect(state.created).toBe(1);
  expect(state.closed).toBe(1);
  expect(state.notes).toBe(0);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("gemini-toranomaki:video-music:v1")!)
          .copied,
    ),
  ).toEqual([]);
  await expect(
    page.getByRole("button", { name: "音声デモを再生・最初から", exact: true }),
  ).toHaveCount(0);
});
