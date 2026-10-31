import { test, expect, type Page } from "@playwright/test";
import {
  defaultVideo,
  defaultMusic,
  videoPrompt,
  musicPrompt,
  faults,
  references,
} from "../src/video-music-data";
import { videoMusicKey } from "../src/video-music-storage";
const button = (p: Page, name: string) =>
  p.getByRole("button", { name, exact: true });
const chapter = (p: Page) => p.locator(".vm-chapter");
const video = (p: Page) =>
  p.getByRole("region", { name: "動画デモの操作", exact: true });
const audio = (p: Page) =>
  p.getByRole("region", { name: "音声デモの操作", exact: true });
async function fixedClock(p: Page) {
  const epoch = new Date("2026-10-26T12:00:00Z");
  await p.clock.install({ time: epoch });
  await p.clock.pauseAt(new Date(epoch.getTime() + 1000));
}
async function goto(p: Page) {
  await p.goto("#chapter-8");
  await expect(p.locator("h1")).toHaveText("動画・音楽生成");
  await expect(p.locator("h1")).toBeFocused();
}
async function step(p: Page, n: number) {
  await p.locator(".service-steps button").nth(n).click();
  await expect(p.locator("#vm-step")).toBeFocused();
}
async function forecast(p: Page) {
  await p
    .getByRole("group", { name: "操作前の予想", exact: true })
    .getByRole("radio")
    .first()
    .check();
}
async function openVideo(p: Page) {
  await forecast(p);
  await button(p, "予想を確定して動画を試す").click();
}
async function openAudio(p: Page) {
  await step(p, 2);
  await forecast(p);
  await button(p, "予想を確定して音の構成を開く").click();
}
const saved = (p: Page) =>
  p.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "null"),
    videoMusicKey,
  );
async function audioMock(
  p: Page,
  mode: "normal" | "defer" | "reject" | "absent" = "normal",
) {
  await p.addInitScript((mode) => {
    const state = {
      created: 0,
      closed: 0,
      started: 0,
      immediateStops: 0,
      resumes: 0,
      volumes: [] as number[],
      types: [] as string[],
      starts: [] as number[],
      resolves: [] as (() => void)[],
    };
    (window as unknown as { vmAudio: typeof state }).vmAudio = state;
    class Context {
      state = "suspended";
      currentTime = 0;
      destination = {};
      closed = false;
      constructor() {
        state.created++;
      }
      resume() {
        state.resumes++;
        if (mode === "reject") return Promise.reject(Error("denied"));
        if (mode === "defer")
          return new Promise<void>((resolve) =>
            state.resolves.push(() => {
              this.state = "running";
              resolve();
            }),
          );
        this.state = "running";
        return Promise.resolve();
      }
      close() {
        if (!this.closed) {
          state.closed++;
          this.closed = true;
        }
        this.state = "closed";
        return Promise.resolve();
      }
      createGain() {
        const gain = {
          value: 0,
          setValueAtTime: () => {},
          linearRampToValueAtTime: () => {},
        };
        state.volumes.push(0);
        Object.defineProperty(gain, "value", {
          set: (n: number) => {
            state.volumes.push(n);
          },
          get: () => 0,
        });
        return { gain, connect: () => {} };
      }
      createOscillator() {
        const osc = {
          type: "sine",
          frequency: { value: 0 },
          connect: () => {},
          disconnect: () => {},
          start: (when: number) => {
            state.started++;
            state.types.push(osc.type);
            state.starts.push(when);
          },
          stop: (when?: number) => {
            if (when === undefined) state.immediateStops++;
          },
        };
        return osc;
      }
    }
    Object.defineProperty(window, "AudioContext", {
      configurable: true,
      value: mode === "absent" ? undefined : Context,
    });
    Object.defineProperty(window, "webkitAudioContext", {
      configurable: true,
      value: undefined,
    });
  }, mode);
}
const sound = (p: Page) =>
  p.evaluate(() => {
    const s = (
      window as unknown as {
        vmAudio: {
          created: number;
          closed: number;
          started: number;
          immediateStops: number;
          resumes: number;
          volumes: number[];
          types: string[];
          starts: number[];
        };
      }
    ).vmAudio;
    return s;
  });
async function resolveAudio(p: Page) {
  await p.evaluate(() => {
    (
      window as unknown as { vmAudio: { resolves: (() => void)[] } }
    ).vmAudio.resolves.shift()?.();
  });
}
async function clipboard(
  p: Page,
  mode: "normal" | "reject" | "defer" = "normal",
) {
  await p.addInitScript((mode) => {
    const copies: string[] = [],
      pending: { resolve: () => void; reject: () => void }[] = [];
    (
      window as unknown as { vmCopies: string[]; vmPending: typeof pending }
    ).vmCopies = copies;
    (window as unknown as { vmPending: typeof pending }).vmPending = pending;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (s: string) => {
          copies.push(s);
          if (mode === "reject") return Promise.reject(Error("denied"));
          if (mode === "defer")
            return new Promise<void>((resolve, reject) =>
              pending.push({ resolve, reject: () => reject(Error("denied")) }),
            );
          return Promise.resolve();
        },
      },
    });
  }, mode);
}
async function settleCopy(p: Page, index: number, success: boolean) {
  await p.evaluate(
    ({ index, success }) => {
      const x = (
        window as unknown as {
          vmPending: { resolve: () => void; reject: () => void }[];
        }
      ).vmPending[index];
      if (success) x.resolve();
      else x.reject();
    },
    { index, success },
  );
}

test("chapter eight is reachable from navigation, curriculum and chapter-one music map; ten remains planned", async ({
  page,
}) => {
  await page.goto("#curriculum");
  await page.locator(".chapter-row").nth(7).click();
  await expect(button(page, "予想を確定して動画を試す")).toBeDisabled();
  await expect(
    page.getByRole("heading", { name: "準備中", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: "第1章を学ぶ", exact: true }).click();
  await page.getByLabel("やりたいこと").selectOption("music");
  await page.locator('.map-results a[href="#chapter-8"]').first().click();
  await expect(page.locator("h1")).toHaveText("動画・音楽生成");
  for (const n of [10]) {
    await page.goto(`#chapter-${n}`);
    await expect(
      page.getByRole("heading", { name: "準備中", exact: true }),
    ).toBeVisible();
  }
  await page.getByRole("link", { name: "第8章を学ぶ", exact: true }).click();
  await expect(chapter(page)).toBeVisible();
});
test("director requires a prediction before revealing frames; no autoplay, fixed prediction and hints", async ({
  page,
}) => {
  await goto(page);
  await expect(page.locator(".vm-scene")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "動画の予想と観察" }),
  ).toHaveCount(0);
  await page.getByText("ヒント：動きのどこを見る？", { exact: true }).click();
  await expect(
    page.getByText(/開始・中盤・終了の順序、手と器具/),
  ).toBeVisible();
  await openVideo(page);
  await expect(video(page)).toContainText("停止中");
  await expect(
    page.getByRole("group", { name: "操作前の予想" }).getByRole("radio").last(),
  ).toBeDisabled();
  await expect(
    page.getByRole("region", { name: "動画の予想と観察" }),
  ).toHaveCount(0);
  await button(page, "場面2：調理").click();
  await expect(
    page.getByRole("region", { name: "動画の予想と観察" }),
  ).toBeVisible();
  await button(page, "予想を変えて再挑戦").click();
  await expect(video(page)).toHaveCount(0);
  await expect(
    page
      .getByRole("group", { name: "操作前の予想" })
      .getByRole("radio")
      .first(),
  ).not.toBeChecked();
});
test("video actually advances, pauses, resumes, ends and restarts without duplicate timers", async ({
  page,
}) => {
  await fixedClock(page);
  await goto(page);
  await openVideo(page);
  await button(page, "動画を再生").click();
  await page.clock.runFor(1000);
  await expect(video(page).getByRole("timer")).toHaveText(
    "再生位置：1.0 / 6秒",
  );
  await button(page, "動画を一時停止").click();
  await page.clock.runFor(2000);
  await expect(video(page).getByRole("timer")).toContainText("1.0 /");
  await button(page, "動画を再開").click();
  await page.clock.runFor(5000);
  await expect(video(page).getByRole("status")).toContainText("再生終了");
  await expect(video(page).locator("svg")).toHaveAttribute("data-scene", "2");
  await expect(button(page, "動画を再生")).toBeDisabled();
  await button(page, "最初から再生").click();
  await page.clock.runFor(1000);
  await expect(video(page).getByRole("timer")).toContainText("1.0 /");
  await button(page, "動画を停止").click();
  await page.clock.runFor(10000);
  await expect(video(page).getByRole("timer")).toContainText("0.0 /");
  expect((await saved(page)).history).toEqual(["video:v1"]);
});
test("motion, camera, duration and order alter SVG transforms and prompt, same selections retain state", async ({
  page,
}) => {
  await goto(page);
  await openVideo(page);
  await button(page, "場面2：調理").click();
  const initial = await video(page).locator("svg").innerHTML();
  await page.getByLabel("主役の動作", { exact: true }).selectOption("0");
  await expect(video(page)).toBeVisible();
  await page.getByLabel("主役の動作", { exact: true }).selectOption("1");
  await expect(video(page)).toHaveCount(0);
  await page.getByLabel("カメラの動き", { exact: true }).selectOption("1");
  await page.getByLabel("動作速度・長さ", { exact: true }).selectOption("1");
  await page.getByLabel("時間的な順序", { exact: true }).selectOption("1");
  await page.getByLabel("背景の演出", { exact: true }).selectOption("1");
  await openVideo(page);
  await button(page, "場面2：完成").click();
  expect(await video(page).locator("svg").innerHTML()).not.toBe(initial);
  await expect(video(page).locator("svg")).toHaveAttribute("data-scene", "2");
  await expect(video(page).getByRole("timer")).toContainText("/ 9秒");
  await expect(
    page.getByRole("textbox", { name: "videoの指示文全文", exact: true }),
  ).toHaveValue(
    videoPrompt({ action: 1, camera: 1, speed: 1, background: 1, order: 1 }),
  );
});
test("video seek supports keyboard and pointer; static frames and reduced motion remain usable", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await goto(page);
  await openVideo(page);
  await expect(button(page, "動画を再生")).toBeDisabled();
  const slider = page.getByRole("slider", { name: "動画の時間位置" });
  await slider.focus();
  await page.keyboard.press("End");
  await expect(slider).toHaveValue("6");
  await expect(video(page).locator("svg")).toHaveAttribute("data-scene", "2");
  await page.keyboard.press("Home");
  await expect(slider).toHaveValue("0");
  const box = await slider.boundingBox();
  await page.mouse.click(box!.x + box!.width * 0.5, box!.y + box!.height / 2);
  await expect(video(page).locator("svg")).toHaveAttribute("data-scene", "1");
  await button(page, "場面3：完成").click();
  await expect(video(page).getByRole("timer")).toContainText("5.0 /");
  await button(page, "最初から表示").click();
  await expect(video(page).getByRole("status")).toContainText("停止中");
});
test("visibility and route departure pause motion and never restore a playing timeline", async ({
  page,
}) => {
  await fixedClock(page);
  await goto(page);
  await openVideo(page);
  await button(page, "動画を再生").click();
  await page.clock.runFor(1000);
  await page.evaluate(() => {
    Object.defineProperty(document, "hidden", {
      configurable: true,
      value: true,
    });
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.clock.runFor(2000);
  await expect(video(page).getByRole("timer")).toContainText("1.0 /");
  await page.getByRole("link", { name: "第7章を学ぶ", exact: true }).click();
  await expect(page.locator("h1")).toContainText("Nano Banana");
  await page.clock.runFor(10000);
  await goto(page);
  await expect(video(page)).toHaveCount(0);
  await openVideo(page);
  await expect(video(page).getByRole("timer")).toContainText("0.0 /");
});
for (const [index, t] of faults.entries())
  test(`fault ${t.id}: same-time visual/text evidence, missed/extra/keep/time grading and retry`, async ({
    page,
  }) => {
    await goto(page);
    await step(page, 1);
    await page
      .getByLabel("比較課題", { exact: true })
      .selectOption(String(index));
    await expect(
      page.getByRole("region", { name: "動画の判定結果" }),
    ).toHaveCount(0);
    const before = page.getByRole("img", {
        name: "正常な動画のフレーム",
        exact: true,
      }),
      after = page.getByRole("img", {
        name: "検証する動画のフレーム",
        exact: true,
      });
    await expect(before).toHaveAttribute("data-slot", "0");
    await expect(after).toHaveAttribute("data-slot", "0");
    await button(page, "場面2を比較").click();
    await expect(before).toHaveAttribute("data-slot", "1");
    await expect(after).toHaveAttribute("data-slot", "1");
    if (index === 0)
      await expect(after).toHaveAttribute("data-shirt", "blue-stripes");
    if (index === 1) await expect(after).toHaveAttribute("data-pan", "false");
    if (index === 2) await expect(after).toHaveAttribute("data-x", "80");
    await button(page, "観察した内容で回答を確定").click();
    await expect(
      page.getByRole("region", { name: "動画の判定結果" }),
    ).toContainText("変更の見逃し：" + t.description);
    const targets = page.getByRole("group", {
      name: "直す必要がある変化はどこ？（複数選択可）",
    });
    await targets
      .getByRole("checkbox", { name: t.description, exact: true })
      .check();
    await targets
      .getByRole("checkbox", { name: "顔・耳", exact: true })
      .check();
    await expect(
      page.getByRole("region", { name: "動画の判定結果" }),
    ).toHaveCount(0);
    const keep = page.getByRole("group", {
      name: "修正時に維持するものは？（顔・窓も確認）",
    });
    await keep.getByRole("checkbox", { name: "顔・耳", exact: true }).check();
    await keep.getByRole("checkbox", { name: "窓の外", exact: true }).check();
    await page
      .getByRole("group", { name: "不整合を確認した場面" })
      .getByRole("radio", { name: "場面2", exact: true })
      .check();
    await button(page, "観察した内容で回答を確定").click();
    await expect(
      page.getByRole("region", { name: "動画の判定結果" }),
    ).toContainText("余分な指摘：顔・耳");
    await targets
      .getByRole("checkbox", { name: "顔・耳", exact: true })
      .uncheck();
    await button(page, "観察した内容で回答を確定").click();
    await expect(
      page.getByRole("region", { name: "動画の判定結果" }),
    ).toContainText("変更対象・維持対象・時間位置を確認できました");
    expect(
      (await saved(page)).history.filter((x: string) => x === `find:${t.id}`),
    ).toHaveLength(1);
    await button(page, "観察から再挑戦").click();
    await expect(
      page.getByRole("region", { name: "動画の判定結果" }),
    ).toHaveCount(0);
    await expect(
      targets.getByRole("checkbox", { name: t.description, exact: true }),
    ).not.toBeChecked();
    await page.reload();
    await expect(
      page.getByRole("region", { name: "動画の判定結果" }),
    ).toHaveCount(0);
  });
test("comparison task changes clear current evidence but preserve past answer history", async ({
  page,
}) => {
  await goto(page);
  await step(page, 1);
  await button(page, "観察した内容で回答を確定").click();
  await page.getByLabel("比較課題", { exact: true }).selectOption("0");
  await expect(
    page.getByRole("region", { name: "動画の判定結果" }),
  ).toBeVisible();
  await page.getByLabel("比較課題", { exact: true }).selectOption("1");
  await expect(
    page.getByRole("region", { name: "動画の判定結果" }),
  ).toHaveCount(0);
  await page.getByLabel("比較課題", { exact: true }).selectOption("0");
  await expect(
    page.getByRole("region", { name: "動画の判定結果" }),
  ).toHaveCount(0);
  expect((await saved(page)).history).toContain("find:costume-v1");
});
test("music API is user-initiated, bounded, changes tempo/waveform and ends", async ({
  page,
}) => {
  await audioMock(page);
  await fixedClock(page);
  await goto(page);
  await openAudio(page);
  expect((await sound(page)).created).toBe(0);
  await button(page, "音声デモを再生・最初から").click();
  await expect(audio(page).getByRole("status")).toContainText("再生処理中");
  expect((await sound(page)).started).toBe(8);
  expect(Math.max(...(await sound(page)).volumes)).toBeLessThanOrEqual(0.06);
  await page.clock.runFor(4200);
  await expect(audio(page).getByRole("status")).toContainText("再生処理が終了");
  expect((await sound(page)).created).toBe((await sound(page)).closed);
  await page.getByLabel("テンポ", { exact: true }).selectOption("0");
  await page.getByLabel("楽器・音色", { exact: true }).selectOption("2");
  await forecast(page);
  await button(page, "予想を確定して音の構成を開く").click();
  await button(page, "音声デモを再生・最初から").click();
  const state = await sound(page);
  expect(state.types.at(-1)).toBe("sawtooth");
  expect(state.starts[9] - state.starts[8]).toBe(0.75);
  await button(page, "音声デモを停止").click();
  await expect(audio(page).getByRole("status")).toContainText("停止中");
  expect((await sound(page)).created).toBe((await sound(page)).closed);
});
test("replay stops old audio, same music selection preserves display, actual change disposes it", async ({
  page,
}) => {
  await audioMock(page);
  await goto(page);
  await openAudio(page);
  await button(page, "音声デモを再生・最初から").click();
  await expect.poll(async () => (await sound(page)).started).toBe(8);
  await button(page, "音声デモを再生・最初から").click();
  await expect.poll(async () => (await sound(page)).started).toBe(16);
  expect((await sound(page)).created - (await sound(page)).closed).toBe(1);
  await page.getByLabel("テンポ", { exact: true }).selectOption("1");
  await expect(audio(page)).toBeVisible();
  await page.getByLabel("テンポ", { exact: true }).selectOption("2");
  await expect(audio(page)).toHaveCount(0);
  expect((await sound(page)).created).toBe((await sound(page)).closed);
  await forecast(page);
  await button(page, "予想を確定して音の構成を開く").click();
  await button(page, "変更前の音を確認").click();
  await expect(audio(page)).toContainText("120 BPM");
  await button(page, "変更後の音を確認").click();
  await expect(audio(page)).toContainText("150 BPM");
});
for (const mode of ["absent", "reject"] as const)
  test(`music ${mode} has a silent route without claiming audible success`, async ({
    page,
  }) => {
    await audioMock(page, mode);
    await goto(page);
    await openAudio(page);
    await button(page, "音声デモを再生・最初から").click();
    await expect(audio(page).getByRole("status")).toContainText(
      "音声を開始できません",
    );
    await button(page, "無音の構成を確認する").click();
    expect((await saved(page)).history).toContain("rhythm:v1");
    expect((await saved(page)).history).not.toContain("audio-api:v1");
    await page.getByLabel("第8章を学習した", { exact: false }).check();
    await expect(page.getByText("1 / 10章", { exact: true })).toBeVisible();
  });
test("mute stops current sound and prevents replay; visual beat selection does not assert hearing", async ({
  page,
}) => {
  await audioMock(page);
  await goto(page);
  await openAudio(page);
  await button(page, "音声デモを再生・最初から").click();
  await expect.poll(async () => (await sound(page)).started).toBe(8);
  await page
    .getByLabel("無音で学ぶ（音声をミュート）", { exact: true })
    .check();
  await expect(button(page, "音声デモを再生・最初から")).toBeDisabled();
  expect((await sound(page)).created).toBe((await sound(page)).closed);
  await audio(page)
    .getByRole("button", { name: /^音3・/ })
    .click();
  await expect(
    audio(page).getByRole("button", { name: /^音3・/ }),
  ).toHaveAttribute("aria-pressed", "true");
  expect((await saved(page)).heard).toBe(false);
});
for (const action of [
  "stop",
  "condition",
  "step",
  "reset",
  "hidden",
  "route",
] as const)
  test(`deferred audio resume after ${action} cannot schedule stale notes or change state`, async ({
    page,
  }) => {
    await audioMock(page, "defer");
    await goto(page);
    await openAudio(page);
    await button(page, "音声デモを再生・最初から").click();
    await expect(audio(page).getByRole("status")).toContainText("準備中");
    if (action === "stop") await button(page, "音声デモを停止").click();
    if (action === "condition")
      await page.getByLabel("テンポ", { exact: true }).selectOption("2");
    if (action === "step") await step(page, 0);
    if (action === "reset") {
      await button(page, "第8章だけを初期化").click();
      await button(page, "第8章の記録を消す").click();
    }
    if (action === "hidden")
      await page.evaluate(() => {
        Object.defineProperty(document, "hidden", {
          configurable: true,
          value: true,
        });
        document.dispatchEvent(new Event("visibilitychange"));
      });
    if (action === "route")
      await page
        .getByRole("link", { name: "第7章を学ぶ", exact: true })
        .click();
    await resolveAudio(page);
    expect((await sound(page)).started).toBe(0);
    expect((await sound(page)).created).toBe((await sound(page)).closed);
    expect((await saved(page))?.history ?? []).not.toContain("audio-api:v1");
    await expect(
      page.getByText("音声：再生処理中", { exact: true }),
    ).toHaveCount(0);
  });
test("mix predictions are fixed; separate video/audio and previous/modified combinations agree", async ({
  page,
}) => {
  await audioMock(page);
  await goto(page);
  await step(page, 3);
  await expect(video(page)).toHaveCount(0);
  await page
    .getByRole("group", { name: "どんな印象になると予想する？" })
    .getByRole("radio")
    .first()
    .check();
  await button(page, "予想を確定して演出を試す").click();
  await expect(
    page
      .getByRole("group", { name: "どんな印象になると予想する？" })
      .getByRole("radio")
      .last(),
  ).toBeDisabled();
  await expect(video(page)).toBeVisible();
  await expect(audio(page)).toContainText("120 BPM");
  await page
    .getByRole("radio", { name: "予想と違ったので条件を変えたい", exact: true })
    .check();
  await expect(page.getByText(/判断：条件を変えて再比較/)).toBeVisible();
  await page.getByLabel("映像と音の組合せ", { exact: true }).selectOption("1");
  await expect(video(page)).toHaveCount(0);
  await page
    .getByRole("group", { name: "どんな印象になると予想する？" })
    .getByRole("radio")
    .last()
    .check();
  await button(page, "予想を確定して演出を試す").click();
  await expect(audio(page)).toContainText("150 BPM");
  await button(page, "修正前の組合せ").click();
  await expect(audio(page)).toContainText("120 BPM");
  await button(page, "修正後の組合せ").click();
  await expect(audio(page)).toContainText("150 BPM");
});
test("mix can explicitly use workshop video and music settings instead of presets", async ({
  page,
}) => {
  await goto(page);
  await page.getByLabel("カメラの動き", { exact: true }).selectOption("2");
  await step(page, 2);
  await page.getByLabel("テンポ", { exact: true }).selectOption("0");
  await page
    .getByLabel("ボーカル（指示文のみ）", { exact: true })
    .selectOption("1");
  await step(page, 3);
  await page.getByLabel("映像と音の組合せ", { exact: true }).selectOption("3");
  await expect(
    page.getByRole("textbox", { name: "mix-videoの指示文全文", exact: true }),
  ).toHaveValue(videoPrompt({ ...defaultVideo, camera: 2 }));
  await expect(
    page.getByRole("textbox", { name: "mix-musicの指示文全文", exact: true }),
  ).toHaveValue(musicPrompt({ ...defaultMusic, tempo: 0, vocal: 1 }));
});
test("full prompt copies match builder conditions and failure retains manual text", async ({
  page,
}) => {
  await clipboard(page);
  await goto(page);
  const box = page.getByRole("textbox", {
    name: "videoの指示文全文",
    exact: true,
  });
  await expect(box).toHaveValue(videoPrompt(defaultVideo));
  await chapter(page)
    .getByRole("button", { name: "この指示文を全文コピー", exact: true })
    .click();
  await expect(chapter(page)).toContainText("全文をコピーしました");
  expect(
    await page.evaluate(
      () => (window as unknown as { vmCopies: string[] }).vmCopies[0],
    ),
  ).toBe(videoPrompt(defaultVideo));
  await step(page, 2);
  await expect(
    page.getByRole("textbox", { name: "musicの指示文全文", exact: true }),
  ).toHaveValue(musicPrompt(defaultMusic));
});
test("clipboard rejection never adds success and manual full text remains selectable", async ({
  page,
}) => {
  await clipboard(page, "reject");
  await goto(page);
  await chapter(page)
    .getByRole("button", { name: "この指示文を全文コピー", exact: true })
    .click();
  await expect(chapter(page)).toContainText("コピーできませんでした");
  expect((await saved(page))?.copied ?? []).toEqual([]);
  await page
    .getByRole("textbox", { name: "videoの指示文全文", exact: true })
    .focus();
  await page.keyboard.press("ControlOrMeta+A");
  expect(
    await page
      .getByRole("textbox", { name: "videoの指示文全文", exact: true })
      .inputValue(),
  ).toBe(videoPrompt(defaultVideo));
});
for (const success of [true, false])
  for (const action of ["body", "step", "reset", "route"] as const)
    test(`stale copy ${success ? "success" : "failure"} after ${action} never updates newer display or history`, async ({
      page,
    }) => {
      await clipboard(page, "defer");
      await goto(page);
      const copy = chapter(page).getByRole("button", {
        name: "この指示文を全文コピー",
        exact: true,
      });
      await copy.click();
      await expect(copy).toBeDisabled();
      if (action === "body")
        await page
          .getByLabel("カメラの動き", { exact: true })
          .selectOption("1");
      if (action === "step") await step(page, 2);
      if (action === "reset") {
        await button(page, "第8章だけを初期化").click();
        await button(page, "第8章の記録を消す").click();
      }
      if (action === "route")
        await page
          .getByRole("link", { name: "第7章を学ぶ", exact: true })
          .click();
      await settleCopy(page, 0, success);
      expect((await saved(page))?.copied ?? []).toEqual([]);
      await expect(
        page.getByText(
          "全文をコピーしました。実サービスへの送信や実行はしていません。",
          { exact: true },
        ),
      ).toHaveCount(0);
      await expect(
        page.getByText(/コピーできませんでした。全文を選択/),
      ).toHaveCount(0);
      if (action !== "route") {
        await expect(
          chapter(page).getByRole("button", {
            name: "この指示文を全文コピー",
            exact: true,
          }),
        ).toBeEnabled();
      }
    });
test("old copy cannot end a newer copy; same non-body operations preserve matching success", async ({
  page,
}) => {
  await clipboard(page, "defer");
  await goto(page);
  const copy = chapter(page).getByRole("button", {
    name: "この指示文を全文コピー",
    exact: true,
  });
  await copy.click();
  await page.getByLabel("カメラの動き", { exact: true }).selectOption("1");
  await expect(copy).toBeEnabled();
  await copy.click();
  await settleCopy(page, 0, true);
  await expect(copy).toBeDisabled();
  expect((await saved(page)).copied).toEqual([]);
  await settleCopy(page, 1, true);
  await expect(copy).toBeEnabled();
  expect((await saved(page)).copied).toHaveLength(1);
  await page
    .getByLabel("この体験を閲覧した（自己記録）", { exact: true })
    .check();
  await page.getByLabel("カメラの動き", { exact: true }).selectOption("1");
  await expect(chapter(page)).toContainText(
    "この本文のコピー成功履歴があります",
  );
  await page.getByLabel("カメラの動き", { exact: true }).selectOption("2");
  await expect(chapter(page)).not.toContainText(
    "この本文のコピー成功履歴があります",
  );
});
test("chapter-specific reset preserves previous chapters, lab and exploration, including reload", async ({
  page,
}) => {
  const old = Object.fromEntries(
    [
      "services",
      "research",
      "notebook",
      "live",
      "canvas",
      "nano-banana",
      "lab",
      "exploration",
    ].map((x) => [`gemini-toranomaki:${x}:v1`, JSON.stringify({ fixture: x })]),
  );
  await page.addInitScript((old) => {
    for (const [k, v] of Object.entries(old)) localStorage.setItem(k, v);
    localStorage.setItem(
      "gemini-toranomaki:progress:v1",
      JSON.stringify({
        completed: Array.from({ length: 7 }, (_, i) => `chapter-${i + 1}`),
      }),
    );
  }, old);
  await goto(page);
  await page.getByLabel("カメラの動き", { exact: true }).selectOption("2");
  await page.getByLabel("第8章を学習した", { exact: false }).check();
  await expect(page.getByText("8 / 10章", { exact: true })).toBeVisible();
  await button(page, "第8章だけを初期化").click();
  await button(page, "キャンセル").click();
  await expect(page.getByLabel("カメラの動き", { exact: true })).toHaveValue(
    "2",
  );
  await button(page, "第8章だけを初期化").click();
  await button(page, "第8章の記録を消す").click();
  await expect(button(page, "第8章だけを初期化")).toBeFocused();
  expect(await saved(page)).toBeNull();
  await expect(page.getByText("7 / 10章", { exact: true })).toBeVisible();
  for (const [k, v] of Object.entries(old))
    expect(await page.evaluate((k) => localStorage.getItem(k), k)).toBe(v);
});
test("fixed conditions and histories restore while predictions, frame positions and playback do not", async ({
  page,
}) => {
  await goto(page);
  await page.getByLabel("カメラの動き", { exact: true }).selectOption("2");
  await openVideo(page);
  await button(page, "場面2：調理").click();
  await page
    .getByLabel("この体験を閲覧した（自己記録）", { exact: true })
    .check();
  await page.reload();
  await expect(page.getByLabel("カメラの動き", { exact: true })).toHaveValue(
    "2",
  );
  await expect(video(page)).toHaveCount(0);
  await expect(
    page.getByLabel("この体験を閲覧した（自己記録）", { exact: true }),
  ).toBeChecked();
  expect((await saved(page)).history).toContain("video:v1");
  expect(await saved(page)).not.toHaveProperty("time");
});
for (const mode of ["corrupt", "denied", "quota"] as const)
  test(`storage ${mode} still permits all fixed learning and warns honestly`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ mode, key }) => {
        if (mode === "corrupt") localStorage.setItem(key, "{bad");
        else {
          const get = Storage.prototype.getItem,
            set = Storage.prototype.setItem;
          Storage.prototype.getItem = function (k) {
            if (mode === "denied" && k === key) throw Error("blocked");
            return get.call(this, k);
          };
          Storage.prototype.setItem = function (k, v) {
            if (k === key)
              throw new DOMException("quota", "QuotaExceededError");
            return set.call(this, k, v);
          };
        }
      },
      { mode, key: videoMusicKey },
    );
    await goto(page);
    if (mode !== "quota")
      await expect(chapter(page).getByRole("alert")).toBeVisible();
    await page.getByLabel("カメラの動き", { exact: true }).selectOption("1");
    if (mode !== "corrupt")
      await expect(chapter(page).getByRole("alert")).toContainText(
        "再読み込みで旧記録",
      );
    await openVideo(page);
    await button(page, "場面2：調理").click();
    await expect(video(page)).toBeVisible();
    await step(page, 1);
    await button(page, "観察した内容で回答を確定").click();
    await expect(
      page.getByRole("region", { name: "動画の判定結果" }),
    ).toBeVisible();
  });
for (const key of [videoMusicKey, "gemini-toranomaki:progress:v1", "both"])
  test(`partial reset failure of ${key} is not reported as complete deletion`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key, chapterKey }) => {
        if (!sessionStorage.getItem("vm-reset-seeded")) {
          localStorage.setItem(
            chapterKey,
            JSON.stringify({ step: 0, tried: true }),
          );
          localStorage.setItem(
            "gemini-toranomaki:progress:v1",
            JSON.stringify({ completed: ["chapter-1", "chapter-8"] }),
          );
          sessionStorage.setItem("vm-reset-seeded", "1");
        }
        const remove = Storage.prototype.removeItem,
          set = Storage.prototype.setItem;
        Storage.prototype.removeItem = function (k) {
          if (
            k === key ||
            (key === "both" &&
              [chapterKey, "gemini-toranomaki:progress:v1"].includes(k))
          )
            throw Error("denied");
          return remove.call(this, k);
        };
        Storage.prototype.setItem = function (k, v) {
          if ((k === key || key === "both") && k.endsWith("progress:v1"))
            throw Error("denied");
          return set.call(this, k, v);
        };
      },
      { key, chapterKey: videoMusicKey },
    );
    await goto(page);
    await button(page, "第8章だけを初期化").click();
    await button(page, "第8章の記録を消す").click();
    await expect(chapter(page)).toContainText(
      "保存済み記録の削除を確認できません",
    );
    await expect(
      page.getByLabel("第8章を学習した", { exact: false }),
    ).not.toBeChecked();
    await page.reload();
    await expect(
      page.getByLabel("任意の実Gemini演習を試した（自己申告）", {
        exact: true,
      }),
    ).toBeChecked({ checked: key === videoMusicKey || key === "both" });
    await expect(
      page.getByLabel("第8章を学習した", { exact: false }),
    ).toBeChecked({ checked: key !== videoMusicKey });
    expect(
      await page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("gemini-toranomaki:progress:v1")!)
            .completed,
      ),
    ).toContain("chapter-1");
  });
for (const os of ["pc", "ios", "android"] as const)
  test(`official ${os} links use explicit targets plus the common source`, async ({
    page,
  }) => {
    await goto(page);
    await page
      .getByText("任意：自分のGeminiで試す・公式情報", { exact: true })
      .click();
    await page
      .getByLabel("公式案内の端末", { exact: true })
      .selectOption(String(["pc", "ios", "android"].indexOf(os)));
    const panel = chapter(page).locator("details").last();
    const expected = references.filter((r) => r.os === os || r.os === "all");
    for (const r of expected)
      await expect(
        panel.getByRole("link", { name: r.title + " ↗", exact: true }),
      ).toHaveAttribute("href", r.url);
    await expect(panel.getByRole("link")).toHaveCount(4);
  });
for (const width of [320, 375, 390, 1280])
  test(`video/music ${width}px both themes, 200 percent text, keyboard and touch-sized controls`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await audioMock(page, "absent");
    await goto(page);
    for (const theme of ["light", "dark"]) {
      await page.evaluate(
        (theme) => (document.documentElement.dataset.theme = theme),
        theme,
      );
      await page.evaluate(
        () => (document.documentElement.style.fontSize = "200%"),
      );
      await openVideo(page);
      await button(page, "場面2：調理").focus();
      await page.keyboard.press("Enter");
      await expect(video(page).locator("svg")).toHaveAttribute(
        "data-slot",
        "1",
      );
      await step(page, 1);
      await button(page, "場面2を比較").click();
      await step(page, 2);
      await forecast(page);
      await button(page, "予想を確定して音の構成を開く").click();
      await button(page, "無音の構成を確認する").click();
      await step(page, 3);
      await page
        .getByRole("group", { name: "どんな印象になると予想する？" })
        .getByRole("radio")
        .first()
        .check();
      await button(page, "予想を確定して演出を試す").click();
      await expect(video(page)).toBeVisible();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await step(page, 0);
    }
  });
test("fixed chapter operations make no external requests or capture/permission calls", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:4173/")) external.push(r.url());
  });
  await page.addInitScript(() => {
    const fail = () => {
      throw Error("unexpected capture");
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: { getUserMedia: fail, getDisplayMedia: fail },
    });
  });
  await goto(page);
  await openVideo(page);
  await button(page, "場面2：調理").click();
  await step(page, 1);
  await button(page, "観察した内容で回答を確定").click();
  await step(page, 2);
  await forecast(page);
  await button(page, "予想を確定して音の構成を開く").click();
  await button(page, "無音の構成を確認する").click();
  await step(page, 3);
  expect(external).toEqual([]);
});

test("touch input can select a scene and seek without separate mouse-only controls", async ({
  browser,
}) => {
  const context = await browser.newContext({
    hasTouch: true,
    viewport: { width: 375, height: 900 },
  });
  const p = await context.newPage();
  try {
    await p.goto("http://127.0.0.1:4173/gemini-toranomaki/#chapter-8");
    await expect(p.locator("h1")).toBeFocused();
    await forecast(p);
    await button(p, "予想を確定して動画を試す").tap();
    await button(p, "場面2：調理").tap();
    await expect(video(p).locator("svg")).toHaveAttribute("data-slot", "1");
    await p.getByRole("slider", { name: "動画の時間位置" }).tap();
    await expect(video(p).getByRole("status")).toContainText("一時停止");
    expect(
      await p.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    await context.close();
  }
});
test("real browser Web Audio can be started and closed without mocks; audibility is not asserted", async ({
  page,
}) => {
  await goto(page);
  await openAudio(page);
  await button(page, "音声デモを再生・最初から").click();
  await expect(audio(page).getByRole("status")).toContainText(
    "音声：再生処理中",
  );
  await button(page, "音声デモを停止").click();
  await expect(audio(page).getByRole("status")).toHaveText("音声：停止中");
});

for (const [index, t] of faults.entries())
  test(`repair ${t.id} never presents wrong guesses as verified evidence`, async ({
    page,
  }) => {
    await goto(page);
    await step(page, 1);
    await page
      .getByLabel("比較課題", { exact: true })
      .selectOption(String(index));
    await button(page, "場面2を比較").click();
    const target = page.getByRole("group", {
        name: "直す必要がある変化はどこ？（複数選択可）",
      }),
      keep = page.getByRole("group", {
        name: "修正時に維持するものは？（顔・窓も確認）",
      }),
      frames = page.getByRole("group", { name: "不整合を確認した場面" });
    await target.getByRole("checkbox", { name: "顔・耳", exact: true }).check();
    await keep.getByRole("checkbox", { name: "顔・耳", exact: true }).check();
    await keep.getByRole("checkbox", { name: "窓の外", exact: true }).check();
    await frames.getByRole("radio", { name: "場面1", exact: true }).check();
    await button(page, "観察した内容で回答を確定").click();
    await expect(
      page.getByRole("region", { name: "動画の判定結果" }),
    ).toContainText("もう一度");
    await expect(
      page.getByRole("textbox", { name: "repairの指示文全文", exact: true }),
    ).toHaveCount(0);
    await target
      .getByRole("checkbox", { name: "顔・耳", exact: true })
      .uncheck();
    await target
      .getByRole("checkbox", { name: t.description, exact: true })
      .check();
    await frames.getByRole("radio", { name: "場面2", exact: true }).check();
    await button(page, "観察した内容で回答を確定").click();
    const text = await page
      .getByRole("textbox", { name: "repairの指示文全文", exact: true })
      .inputValue();
    expect(text).toContain("確認した時間位置：場面2");
    expect(text).toContain(`確認した対象：${t.description}`);
    expect(text).not.toContain("確認した時間位置：場面1");
  });

test("same-turn condition change cancels pending audio before any stale oscillator can start", async ({
  page,
}) => {
  await audioMock(page, "defer");
  await goto(page);
  await openAudio(page);
  await button(page, "音声デモを再生・最初から").click();
  const id = await page
    .getByLabel("テンポ", { exact: true })
    .getAttribute("id");
  await page.evaluate((id) => {
    const select = document.getElementById(id!) as HTMLSelectElement;
    select.value = "2";
    select.dispatchEvent(new Event("change", { bubbles: true }));
    (
      window as unknown as { vmAudio: { resolves: (() => void)[] } }
    ).vmAudio.resolves.shift()?.();
  }, id);
  await expect(audio(page)).toHaveCount(0);
  expect((await sound(page)).started).toBe(0);
  expect((await sound(page)).created).toBe((await sound(page)).closed);
});
for (const success of [true, false])
  test(`same-turn text change rejects stale clipboard ${success ? "success" : "failure"}`, async ({
    page,
  }) => {
    await clipboard(page, "defer");
    await goto(page);
    await chapter(page)
      .getByRole("button", { name: "この指示文を全文コピー", exact: true })
      .click();
    const id = await page
      .getByLabel("カメラの動き", { exact: true })
      .getAttribute("id");
    await page.evaluate(
      ({ id, success }) => {
        const select = document.getElementById(id!) as HTMLSelectElement;
        select.value = "1";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        const pending = (
          window as unknown as {
            vmPending: { resolve: () => void; reject: () => void }[];
          }
        ).vmPending[0];
        if (success) pending.resolve();
        else pending.reject();
      },
      { id, success },
    );
    await expect(
      chapter(page).getByRole("button", {
        name: "この指示文を全文コピー",
        exact: true,
      }),
    ).toBeEnabled();
    expect((await saved(page)).copied).toEqual([]);
    await expect(chapter(page)).not.toContainText("全文をコピーしました");
    await expect(chapter(page)).not.toContainText("コピーできませんでした");
  });

for (const n of [0, 2, 3])
  test(`opening experience ${n + 1} by keyboard moves focus to its newly visible observation heading`, async ({
    page,
  }) => {
    await goto(page);
    if (n) await step(page, n);
    if (n === 3)
      await page
        .getByRole("group", { name: "どんな印象になると予想する？" })
        .getByRole("radio")
        .first()
        .check();
    else await forecast(page);
    const labels = [
      "予想を確定して動画を試す",
      "",
      "予想を確定して音の構成を開く",
      "予想を確定して演出を試す",
    ];
    await button(page, labels[n]).focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("heading", {
        name:
          n === 0
            ? "動画の観察と再生"
            : n === 2
              ? "音の観察と再生"
              : "組合せの観察と再生",
        exact: true,
      }),
    ).toBeFocused();
  });

test("changing reduced-motion pauses a running video without changing an idle or ended state", async ({
  page,
}) => {
  await fixedClock(page);
  await goto(page);
  await openVideo(page);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(video(page).getByRole("status")).toContainText("停止中");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await button(page, "動画を再生").click();
  await page.clock.runFor(1000);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(video(page).getByRole("status")).toContainText("一時停止");
  await page.clock.runFor(1000);
  await expect(video(page).getByRole("timer")).toContainText("1.0 /");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await button(page, "最初から再生").click();
  await page.clock.runFor(6000);
  await expect(video(page).getByRole("status")).toContainText("再生終了");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await expect(video(page).getByRole("status")).toContainText("再生終了");
});
