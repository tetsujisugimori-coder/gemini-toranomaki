import { test, expect } from "@playwright/test";
test("first experiment keeps the concrete fault undisclosed before observation and offers an optional hint", async ({
  page,
}) => {
  await page.goto("#chapter-6");
  await page.getByRole("button", { name: /^2\. / }).click();
  await page
    .getByLabel("未回答を不正解として点数が出る", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "予想を確定して試作品を開く", exact: true })
    .click();
  await expect(
    page.getByText(
      "この枠内の初期版には、未回答でも点数を出す教材用の改善課題があります。教材本体の採点エラーではありません。",
      { exact: true },
    ),
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", {
      name: "初期版：未回答でも採点される改善課題あり",
      exact: true,
    }),
  ).toHaveCount(0);
});

import { canvasKey } from "../src/canvas-storage";
import {
  canvasJudgments,
  defaultTimer,
  timerCopyId,
  timerPrompt,
} from "../src/canvas-workshop";
const step = async (page: import("@playwright/test").Page, n: number) => {
  await page.getByRole("button", { name: new RegExp(`^${n}\\. `) }).click();
  await expect(page.locator("#canvas-step")).toBeFocused();
};
const timer = (p: import("@playwright/test").Page) =>
  p.getByRole("region", { name: "教材用タイマー試作品", exact: true });
const workshop = (p: import("@playwright/test").Page) =>
  p.getByRole("region", { name: "指示で変える集中タイマー工房", exact: true });
const progress = (p: import("@playwright/test").Page) =>
  p.getByLabel("種類別の学習進捗", { exact: true });
const record = (p: import("@playwright/test").Page) =>
  p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), canvasKey);
const openPrompt = async (p: import("@playwright/test").Page) => {
  await p
    .getByText("任意：この指示を実Gemini Canvasで試す", { exact: true })
    .click();
};
const reset = async (p: import("@playwright/test").Page) => {
  await p
    .getByRole("button", { name: "第6章の記録だけを初期化", exact: true })
    .click();
  await p
    .getByRole("button", { name: "第6章を初期化する", exact: true })
    .click();
};

test("first prediction is fixed, an unexpected observation reveals the reason, and a new experiment clears old evidence", async ({
  page,
}) => {
  await page.goto("#chapter-6");
  await step(page, 2);
  await page
    .getByLabel("採点せず、未回答の案内が出る", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "予想を確定して試作品を開く", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "初期版：まず動作を観察しよう",
      exact: true,
    }),
  ).toBeFocused();
  await expect(page.getByLabel("初回の予想と観察")).toHaveCount(0);
  await expect(
    page.getByText("試した動作を依頼と比べる", { exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "採点する", exact: true }).click();
  await expect(page.getByLabel("初回の予想と観察")).toContainText(
    "予想と観察が違いました",
  );
  await expect(
    page.getByLabel("未回答を不正解として点数が出る", { exact: true }),
  ).toBeDisabled();
  await page.getByText("試した動作を依頼と比べる", { exact: true }).click();
  await expect(
    page.getByText(/初期版に未回答を検出する処理がないためです/),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "初回実験をやり直す", exact: true })
    .click();
  await expect(
    page
      .getByRole("group", {
        name: "初期版で全問未回答のまま採点したら？",
        exact: true,
      })
      .locator("legend"),
  ).toBeFocused();
  await expect(page.getByLabel("初回の予想と観察")).toHaveCount(0);
  await expect(page.getByLabel("現在の版の採点結果")).toHaveCount(0);
  await expect(
    page.getByLabel("採点せず、未回答の案内が出る", { exact: true }),
  ).toBeEnabled();
});

test("repair disclosure is optional before discovery and hints never count as observation", async ({
  page,
}) => {
  await page.goto("#chapter-6");
  await step(page, 3);
  await expect(
    page.getByRole("combobox", { name: "修正の依頼内容", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("group", {
      name: "未回答で採点されたら、どんな修正依頼がよい？",
      exact: true,
    }),
  ).toHaveCount(0);
  await page
    .getByText("ヒントを開いて修正を先に試す（任意）", { exact: true })
    .click();
  await expect(
    page.getByText(/自分が観察した証拠ではありません/),
  ).toBeVisible();
  await expect(
    page.getByRole("group", {
      name: "未回答で採点されたら、どんな修正依頼がよい？",
      exact: true,
    }),
  ).toBeVisible();
  await expect(progress(page)).toContainText("クイズ採点 なし");
  await page
    .getByText("ヒントを開いて修正を先に試す（任意）", { exact: true })
    .click();
  await expect(
    page.getByRole("group", {
      name: "未回答で採点されたら、どんな修正依頼がよい？",
      exact: true,
    }),
  ).toHaveCount(0);
  await step(page, 4);
  await expect(
    page.getByRole("heading", {
      name: "初期版：まず動作を観察しよう",
      exact: true,
    }),
  ).toBeVisible();
});

test("timer instructions change the visible prototype only when applied, compare both versions, and preserve equal-condition runs", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("#chapter-6");
  const box = workshop(page);
  await box
    .getByRole("combobox", { name: "設定時間", exact: true })
    .selectOption("20");
  await box
    .getByRole("combobox", { name: "見た目の指示", exact: true })
    .selectOption("large");
  await box
    .getByRole("combobox", { name: "動作の指示", exact: true })
    .selectOption("loop");
  await expect(timer(page).getByLabel("残り秒数", { exact: true })).toHaveText(
    "10秒",
  );
  await box
    .getByRole("button", { name: "指示を固定タイマーに反映", exact: true })
    .click();
  await expect(timer(page).getByRole("heading")).toBeFocused();
  await expect(timer(page)).toContainText("20秒／大きな数字／繰り返す");
  await expect(timer(page).getByLabel("残り秒数", { exact: true })).toHaveCSS(
    "font-size",
    "40px",
  );
  await timer(page).getByRole("button", { name: "開始", exact: true }).click();
  await timer(page).getByRole("button", { name: "開始", exact: true }).click();
  await page.clock.runFor(1000);
  await expect(timer(page).getByLabel("残り秒数", { exact: true })).toHaveText(
    "19秒",
  );
  await box
    .getByRole("combobox", { name: "設定時間", exact: true })
    .selectOption("20");
  await box
    .getByRole("button", { name: "指示を固定タイマーに反映", exact: true })
    .click();
  await expect(timer(page).getByLabel("残り秒数", { exact: true })).toHaveText(
    "19秒",
  );
  await timer(page)
    .getByRole("button", { name: "一時停止", exact: true })
    .click();
  await page.clock.runFor(3000);
  await expect(timer(page).getByLabel("残り秒数", { exact: true })).toHaveText(
    "19秒",
  );
  await timer(page).getByRole("button", { name: "開始", exact: true }).click();
  await page.clock.runFor(19000);
  await expect(timer(page)).toContainText("0秒への到達：1回");
  await expect(timer(page).getByLabel("残り秒数", { exact: true })).toHaveText(
    "20秒",
  );
  await box.getByRole("button", { name: "変更前を操作", exact: true }).click();
  await expect(timer(page)).toContainText("10秒／標準の数字／0秒で停止");
  await timer(page).getByRole("button", { name: "開始", exact: true }).click();
  await page.clock.runFor(10000);
  await expect(timer(page).getByLabel("残り秒数", { exact: true })).toHaveText(
    "0秒",
  );
  await expect(timer(page)).toContainText("状態：停止中");
  await box.getByRole("button", { name: "変更後を操作", exact: true }).click();
  await expect(timer(page)).toContainText("状態：停止中");
  await timer(page)
    .getByRole("button", { name: "タイマーをリセット", exact: true })
    .click();
  await expect(timer(page)).toContainText("0秒への到達：0回");
  await expect(timer(page).getByLabel("残り秒数", { exact: true })).toHaveText(
    "20秒",
  );
  await expect(progress(page)).toContainText("タイマー開始 あり");
});

test("timer appearance-only change preserves the stop rule; chapter leave and reload never restore a running timer", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("#chapter-6");
  await workshop(page)
    .getByRole("combobox", { name: "見た目の指示", exact: true })
    .selectOption("large");
  await workshop(page)
    .getByRole("button", { name: "指示を固定タイマーに反映", exact: true })
    .click();
  await expect(timer(page)).toContainText("10秒／大きな数字／0秒で停止");
  await timer(page).getByRole("button", { name: "開始", exact: true }).click();
  await page.clock.runFor(10000);
  await expect(timer(page).getByLabel("残り秒数", { exact: true })).toHaveText(
    "0秒",
  );
  await timer(page)
    .getByRole("button", { name: "タイマーをリセット", exact: true })
    .click();
  await timer(page).getByRole("button", { name: "開始", exact: true }).click();
  await step(page, 2);
  await page.clock.runFor(20000);
  await step(page, 1);
  await expect(timer(page)).toContainText("状態：停止中");
  await expect(timer(page).getByLabel("残り秒数", { exact: true })).toHaveText(
    "10秒",
  );
  const saved = await record(page);
  expect(saved).not.toHaveProperty("runs");
  expect(saved.timer).not.toHaveProperty("running");
  await page.reload();
  await expect(timer(page)).toContainText("状態：停止中");
  expect((await record(page)).timerHistory).toEqual(saved.timerHistory);
});

test("three timer prompt kinds copy the entire selected specification and show separate success identities", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { qualityText: string }).qualityText = text;
        },
      },
    }),
  );
  await page.goto("#chapter-6");
  await openPrompt(page);
  const s = {
    ...defaultTimer,
    seconds: 20,
    look: "large",
    finish: "loop",
  } as const;
  await workshop(page)
    .getByRole("combobox", { name: "設定時間", exact: true })
    .selectOption("20");
  await workshop(page)
    .getByRole("combobox", { name: "見た目の指示", exact: true })
    .selectOption("large");
  await workshop(page)
    .getByRole("combobox", { name: "動作の指示", exact: true })
    .selectOption("loop");
  for (const kind of ["create", "repair", "verify"] as const) {
    await page
      .getByRole("combobox", { name: "タイマー用の指示", exact: true })
      .selectOption(kind);
    await expect(
      page.getByLabel("タイマー指示の全文", { exact: true }),
    ).toHaveText(timerPrompt(kind, s));
    await page
      .getByRole("button", { name: "タイマー指示を全文コピー", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => (window as unknown as { qualityText: string }).qualityText,
      ),
    ).toBe(timerPrompt(kind, s));
    expect((await record(page)).timerCopied).toContain(timerCopyId(kind, s));
  }
});

test("versioned failure judgments give reasons after answering and progress separates viewing, practice, judgment, real exercise and completion", async ({
  page,
}) => {
  await page.goto("#chapter-6");
  await expect(progress(page)).toContainText("閲覧の自己記録：0 / 4");
  await expect(progress(page)).toContainText("判断チェックの達成：0 / 3");
  for (const c of canvasJudgments) {
    await step(page, c.step + 1);
    const group = page.getByRole("group", { name: c.question, exact: true });
    await expect(group.getByRole("status")).toHaveCount(0);
    await group
      .getByLabel(c.options[(c.answer + 1) % 3], { exact: true })
      .check();
    await expect(group.getByRole("status")).toContainText("もう一度考えて");
    await expect(group.getByRole("status")).toContainText(c.reason);
    await group.getByLabel(c.options[c.answer], { exact: true }).check();
    await expect(group.getByRole("status")).toContainText("正解です");
    await page
      .getByLabel(`体験${c.step + 1}を閲覧した（自己記録）`, { exact: true })
      .check();
  }
  await expect(progress(page)).toContainText("閲覧の自己記録：3 / 4");
  await expect(progress(page)).toContainText("判断チェックの達成：3 / 3");
  await expect(progress(page)).toContainText("クイズ採点 なし");
  await expect(progress(page)).toContainText("実Gemini演習：未申告・任意");
  await expect(
    page.getByLabel("第6章の学習を完了した（自己申告）", { exact: true }),
  ).not.toBeChecked();
  await page
    .getByLabel("第6章の学習を完了した（自己申告）", { exact: true })
    .check();
  await page.reload();
  await expect(progress(page)).toContainText("判断チェックの達成：3 / 3");
  await expect(progress(page)).toContainText("章完了：完了の自己申告あり");
  await page
    .getByText("任意：自分のGemini Canvasで作る", { exact: true })
    .click();
  await page
    .getByLabel("自分のGeminiで試した（過去の自己申告）", { exact: true })
    .check();
  await expect(progress(page)).toContainText(
    "実Gemini演習：試した（自己申告）",
  );
});

test("legacy answers stay legacy, malformed additions cannot earn credit, and chapter reset preserves other keys", async ({
  page,
}) => {
  await page.addInitScript((k) => {
    localStorage.setItem(
      k,
      JSON.stringify({
        step: 0,
        understanding: { requirements: 1, repair: 2, proof: 0 },
        history: ["science:initial:scored"],
        judgments: { requirements: 1, "brief-v1": 9 },
        viewed: [-1, 5],
        timer: { seconds: 20 },
        timerHistory: ["private"],
        copied: ["create-v1:science:beginner:reason"],
      }),
    );
    localStorage.setItem("gemini-toranomaki:live:v1", "preserve-live");
  }, canvasKey);
  await page.goto("#chapter-6");
  await expect(progress(page)).toContainText("判断チェックの達成：0 / 3");
  await expect(progress(page)).toContainText("閲覧の自己記録：0 / 4");
  const saved = await record(page);
  expect(saved.understanding).toEqual({ requirements: 1, repair: 2, proof: 0 });
  await page.getByLabel("体験1を閲覧した（自己記録）", { exact: true }).check();
  expect((await record(page)).copied).toEqual(saved.copied);
  await reset(page);
  await expect(progress(page)).toContainText("判断チェックの達成：0 / 3");
  await expect(progress(page)).toContainText("閲覧の自己記録：0 / 4");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("gemini-toranomaki:live:v1"),
    ),
  ).toBe("preserve-live");
});

for (const action of ["condition", "reset", "step", "leave"] as const)
  for (const outcome of ["success", "failure"] as const)
    test(`timer copy ignores stale ${outcome} after ${action} and never writes old success`, async ({
      page,
    }) => {
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: () =>
              new Promise<void>((resolve, reject) => {
                (
                  window as unknown as {
                    qualityResolve: () => void;
                    qualityReject: () => void;
                  }
                ).qualityResolve = resolve;
                (
                  window as unknown as { qualityReject: () => void }
                ).qualityReject = () => reject(Error("denied"));
              }),
          },
        }),
      );
      await page.goto("#chapter-6");
      await openPrompt(page);
      await page
        .getByRole("button", { name: "タイマー指示を全文コピー", exact: true })
        .click();
      if (action === "condition")
        await workshop(page)
          .getByRole("combobox", { name: "設定時間", exact: true })
          .selectOption("20");
      if (action === "reset") await reset(page);
      if (action === "step") await step(page, 2);
      if (action === "leave") await page.goto("#chapter-1");
      await page.evaluate((o) => {
        const w = window as unknown as {
          qualityResolve: () => void;
          qualityReject: () => void;
        };
        if (o === "success") w.qualityResolve();
        else w.qualityReject();
      }, outcome);
      await expect(
        page.getByText(/全文をコピーしました|コピーできませんでした/),
      ).toHaveCount(0);
      expect((await record(page))?.timerCopied ?? []).toEqual([]);
      if (action === "leave") await page.goto("#chapter-6");
      if (action === "step") await step(page, 1);
      if (action === "reset") await openPrompt(page);
      if (action === "leave" || action === "step") await openPrompt(page);
      await expect(
        page.getByRole("button", {
          name: "タイマー指示を全文コピー",
          exact: true,
        }),
      ).toBeEnabled();
    });

for (const width of [320, 375, 390, 1280])
  test(`quality additions fit ${width}px in both themes and enlarged text with keyboard operation`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 950 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("#chapter-6");
    for (const theme of ["light", "dark"]) {
      if (theme === "dark")
        await page
          .getByRole("button", { name: "ダークテーマに切り替え", exact: true })
          .click();
      await page.addStyleTag({ content: "html { font-size: 200%; }" });
      await workshop(page)
        .getByRole("combobox", { name: "見た目の指示", exact: true })
        .selectOption("large");
      await workshop(page)
        .getByRole("button", { name: "指示を固定タイマーに反映", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await expect(timer(page).getByRole("heading")).toBeFocused();
      await timer(page)
        .getByRole("button", { name: "開始", exact: true })
        .focus();
      await page.keyboard.press("Enter");
      await expect(timer(page)).toContainText("状態：進行中");
      await timer(page)
        .getByRole("button", { name: "一時停止", exact: true })
        .click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await expect(progress(page)).toBeVisible();
    }
  });

for (const outcome of ["success", "failure"] as const)
  test(`a newer timer copy keeps its busy state and identity after an older ${outcome}`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const calls: { resolve: () => void; reject: () => void }[] = [];
      (window as unknown as { qualityCalls: typeof calls }).qualityCalls =
        calls;
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: {
          writeText: () =>
            new Promise<void>((resolve, reject) =>
              calls.push({ resolve, reject: () => reject(Error("denied")) }),
            ),
        },
      });
    });
    await page.goto("#chapter-6");
    await openPrompt(page);
    const copy = page.getByRole("button", {
      name: "タイマー指示を全文コピー",
      exact: true,
    });
    await copy.click();
    await workshop(page)
      .getByRole("combobox", { name: "設定時間", exact: true })
      .selectOption("20");
    await copy.click();
    await page.evaluate((o) => {
      const calls = (
        window as unknown as {
          qualityCalls: { resolve: () => void; reject: () => void }[];
        }
      ).qualityCalls;
      if (o === "success") calls[0].resolve();
      else calls[0].reject();
    }, outcome);
    await expect(copy).toBeDisabled();
    expect((await record(page)).timerCopied).toEqual([]);
    await page.evaluate(() =>
      (
        window as unknown as { qualityCalls: { resolve: () => void }[] }
      ).qualityCalls[1].resolve(),
    );
    await expect(copy).toBeEnabled();
    expect((await record(page)).timerCopied).toEqual([
      timerCopyId("create", { ...defaultTimer, seconds: 20 }),
    ]);
    await expect(workshop(page)).toContainText("全文をコピーしました");
    // Unrelated viewing changes and equal selections keep this body-success record.
    await workshop(page)
      .getByRole("combobox", { name: "設定時間", exact: true })
      .selectOption("20");
    await page
      .getByLabel("体験1を閲覧した（自己記録）", { exact: true })
      .check();
    await expect(workshop(page)).toContainText(
      "この本文の過去のコピー成功：あり",
    );
  });

for (const action of ["reset", "step"] as const)
  for (const outcome of ["success", "failure"] as const)
    test(`atomic ${action} prevents timer copy ${outcome} from repopulating a new chapter instance`, async ({
      page,
    }) => {
      await page.addInitScript(() =>
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: {
            writeText: () =>
              new Promise<void>((resolve, reject) => {
                (
                  window as unknown as {
                    finishQuality: () => void;
                    failQuality: () => void;
                  }
                ).finishQuality = resolve;
                (window as unknown as { failQuality: () => void }).failQuality =
                  () => reject(Error("denied"));
              }),
          },
        }),
      );
      await page.goto("#chapter-6");
      await openPrompt(page);
      await page
        .getByRole("button", { name: "タイマー指示を全文コピー", exact: true })
        .click();
      if (action === "reset")
        await page
          .getByRole("button", { name: "第6章の記録だけを初期化", exact: true })
          .click();
      await page.evaluate(
        ({ action, outcome }) => {
          const button = Array.from(document.querySelectorAll("button")).find(
            (b) =>
              action === "reset"
                ? b.textContent === "第6章を初期化する"
                : /^2\. /.test(b.textContent ?? ""),
          );
          if (!button) throw Error("button missing");
          button.click();
          const w = window as unknown as {
            finishQuality: () => void;
            failQuality: () => void;
          };
          if (outcome === "success") w.finishQuality();
          else w.failQuality();
        },
        { action, outcome },
      );
      await expect(
        page.getByText(/全文をコピーしました|コピーできませんでした/),
      ).toHaveCount(0);
      expect((await record(page))?.timerCopied ?? []).toEqual([]);
    });

test("timer copy denial offers manual fallback and succeeds on an explicit retry", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          if (!(window as unknown as { allowQuality: boolean }).allowQuality)
            throw Error("denied");
        },
      },
    }),
  );
  await page.goto("#chapter-6");
  await openPrompt(page);
  const copy = page.getByRole("button", {
    name: "タイマー指示を全文コピー",
    exact: true,
  });
  await copy.click();
  await expect(workshop(page)).toContainText("手動でコピー");
  expect((await record(page))?.timerCopied ?? []).toEqual([]);
  await page.evaluate(
    () =>
      ((window as unknown as { allowQuality: boolean }).allowQuality = true),
  );
  await copy.click();
  expect((await record(page)).timerCopied).toEqual([
    timerCopyId("create", defaultTimer),
  ]);
});

test("new fixed selections remain usable on quota failure and reload warns about restoring only old fixed records", async ({
  page,
}) => {
  await page.goto("#chapter-6");
  await page.getByLabel("体験1を閲覧した（自己記録）", { exact: true }).check();
  const old = await record(page);
  await page.evaluate(
    () =>
      (Storage.prototype.setItem = () => {
        throw new DOMException("quota", "QuotaExceededError");
      }),
  );
  await workshop(page)
    .getByRole("combobox", { name: "設定時間", exact: true })
    .selectOption("20");
  await workshop(page)
    .getByRole("button", { name: "指示を固定タイマーに反映", exact: true })
    .click();
  await expect(timer(page)).toContainText("20秒／標準の数字");
  await timer(page).getByRole("button", { name: "開始", exact: true }).click();
  await expect(timer(page)).toContainText("状態：進行中");
  await expect(page.getByText(/第6章の記録を保存できません/)).toContainText(
    "旧記録に戻る",
  );
  expect(await record(page)).toEqual(old);
  await page.reload();
  await expect(
    workshop(page).getByRole("combobox", { name: "設定時間", exact: true }),
  ).toHaveValue("10");
  await expect(timer(page)).toContainText("状態：停止中");
  expect(await record(page)).toEqual(old);
});

test("past incomplete grading and old knowledge answers never restore a current first discovery", async ({
  page,
}) => {
  await page.addInitScript(
    (k) =>
      localStorage.setItem(
        k,
        JSON.stringify({
          step: 1,
          history: ["science:initial:incomplete-scored"],
          understanding: { repair: 2 },
        }),
      ),
    canvasKey,
  );
  await page.goto("#chapter-6");
  await expect(page.getByLabel("初回の予想と観察")).toHaveCount(0);
  await expect(
    page.getByText("試した動作を依頼と比べる", { exact: true }),
  ).toHaveCount(0);
  await page
    .getByLabel("採点せず、未回答の案内が出る", { exact: true })
    .check();
  await page
    .getByRole("button", { name: "予想を確定して試作品を開く", exact: true })
    .click();
  await expect(
    page.getByRole("heading", {
      name: "初期版：まず動作を観察しよう",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel("現在の版の採点結果")).toHaveCount(0);
  await expect(progress(page)).toContainText("クイズ採点 あり");
  await page.reload();
  await expect(page.getByLabel("初回の予想と観察")).toHaveCount(0);
  await expect(
    page.getByRole("region", { name: "教材用クイズ試作品", exact: true }),
  ).toHaveCount(0);
});

test("a timer stopped at zero requires reset before another start in both comparison versions", async ({
  page,
}) => {
  await page.clock.install();
  await page.goto("#chapter-6");
  await expect(
    timer(page).getByRole("timer", { name: "残り秒数", exact: true }),
  ).toHaveAttribute("aria-live", "off");
  for (const version of ["変更後を操作", "変更前を操作"]) {
    await workshop(page)
      .getByRole("button", { name: version, exact: true })
      .click();
    await timer(page)
      .getByRole("button", { name: "開始", exact: true })
      .click();
    await page.clock.runFor(10000);
    await expect(
      timer(page).getByLabel("残り秒数", { exact: true }),
    ).toHaveText("0秒");
    await expect(
      timer(page).getByRole("button", { name: "開始", exact: true }),
    ).toBeDisabled();
    await expect(timer(page)).toContainText("リセットしてから開始");
    await expect(timer(page).getByRole("status")).toContainText("状態：停止中");
    await timer(page)
      .getByRole("button", { name: "タイマーをリセット", exact: true })
      .click();
    await expect(
      timer(page).getByRole("button", { name: "開始", exact: true }),
    ).toBeEnabled();
  }
});

test("new judgment activities precede the explanatory legacy checks without forcing an answer", async ({
  page,
}) => {
  const { canvasChecks } = await import("../src/canvas-data");
  await page.goto("#chapter-6");
  for (const c of canvasJudgments) {
    await step(page, c.step + 1);
    if (c.step === 2)
      await page
        .getByText("ヒントを開いて修正を先に試す（任意）", { exact: true })
        .click();
    const scenario = page.getByRole("group", { name: c.question, exact: true });
    const old = page.getByRole("group", {
      name: canvasChecks[c.step === 0 ? 0 : c.step === 2 ? 1 : 2].question,
      exact: true,
    });
    const before = await scenario.evaluate(
      (node, question) => {
        const legend = Array.from(document.querySelectorAll("legend")).find(
          (el) => el.textContent === question,
        );
        if (!legend) throw Error("legacy question missing");
        return Boolean(
          node.compareDocumentPosition(legend) &
            Node.DOCUMENT_POSITION_FOLLOWING,
        );
      },
      await old.locator("legend").textContent(),
    );
    expect(before).toBe(true);
    await expect(scenario.locator("input:checked")).toHaveCount(0);
    await expect(scenario.getByRole("status")).toHaveCount(0);
  }
});

test("first-discovery comparison is removed when the shared quiz answers, run or applied version change", async ({
  page,
}) => {
  for (const action of ["answer", "restart", "apply"]) {
    await page.goto("#chapter-1");
    await expect(page.locator("h1")).toHaveText("Geminiの画面とモデル選択");
    await expect(page.locator("h1")).toBeFocused();
    await page.goto("#chapter-6");
    await expect(page.locator("h1")).toHaveText("Canvas");
    await expect(page.locator("h1")).toBeFocused();
    await step(page, 2);
    await page
      .getByLabel("採点せず、未回答の案内が出る", { exact: true })
      .check();
    await page
      .getByRole("button", { name: "予想を確定して試作品を開く", exact: true })
      .click();
    await page.getByRole("button", { name: "採点する", exact: true }).click();
    await expect(page.getByLabel("初回の予想と観察")).toContainText(
      "予想と観察が違いました",
    );
    if (action === "answer")
      await page
        .getByRole("region", { name: "教材用クイズ試作品", exact: true })
        .getByLabel("100℃", { exact: true })
        .check();
    if (action === "restart")
      await page.getByRole("button", { name: "やり直す", exact: true }).click();
    if (action === "apply") {
      await step(page, 3);
      await page
        .getByLabel("観察した動作・期待する動作・維持する機能を伝える", {
          exact: true,
        })
        .check();
      await page
        .getByRole("button", {
          name: "この修正案を固定試作品に反映",
          exact: true,
        })
        .click();
      await step(page, 2);
    }
    await expect(page.getByLabel("初回の予想と観察")).toHaveCount(0);
  }
});
