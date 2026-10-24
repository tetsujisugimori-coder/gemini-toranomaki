import { test, expect, type Page } from "@playwright/test";
import {
  citationChoices,
  planLabels,
  questionCases,
  reportChecks,
  sourceChoices,
  studySources,
  type TopicId,
} from "../src/study-data";
import { freshResearch, notebookKey, researchKey } from "../src/study-storage";
const step = (p: Page, n: number) =>
  p.getByRole("button", { name: new RegExp(`^${n}\\. `) }).click();
const nav = async (p: Page, n: number) => {
  await p.getByRole("link", { name: `第${n}章を学ぶ`, exact: true }).click();
  await expect(p.locator("h1")).toHaveText(
    n === 3
      ? "Deep Research：調査計画から出典検証まで"
      : "Notebook：調査資料を学習教材に変える",
  );
};
const completion = (p: Page, n: number) =>
  p.getByLabel(`第${n}章の学習を完了した（自己申告）`, { exact: true });
const material = (p: Page, topic: TopicId, suffix: string) =>
  p.getByLabel(
    `資料に追加：${studySources(topic).find((s) => s.id === `${topic}-${suffix}`)!.title}`,
    { exact: true },
  );
async function reset(p: Page, chapter: number) {
  await p
    .getByRole("button", {
      name: `第${chapter}章の記録だけを初期化`,
      exact: true,
    })
    .click();
  await p
    .getByRole("button", { name: `第${chapter}章を初期化する`, exact: true })
    .click();
}
function ready(topic: TopicId = "energy") {
  return {
    ...freshResearch(topic),
    fixes: [true, true, true, true],
    sourceAnswers: Object.fromEntries(
      studySources(topic)
        .slice(0, 7)
        .map((s) => [s.id, s.judgment]),
    ),
    reportAnswers: Object.fromEntries(
      reportChecks(topic).map((c) => [c.id, c.answer]),
    ),
    step: 3,
  };
}
async function seedReady(p: Page, topic: TopicId = "energy") {
  await p.goto("#home");
  await p.evaluate(
    ({ key, record }) => localStorage.setItem(key, JSON.stringify(record)),
    { key: researchKey, record: ready(topic) },
  );
  await p.reload();
  await nav(p, 3);
}
async function simpleClipboard(p: Page) {
  await p.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copied: string }).copied = text;
        },
      },
    }),
  );
}

test("research conditions, plan comparison, all sources and report checks support a verified handoff without chapter completion", async ({
  page,
}) => {
  await simpleClipboard(page);
  await page.goto("#chapter-3");
  await page
    .getByRole("combobox", { name: "調査テーマ", exact: true })
    .selectOption("education");
  await page
    .getByRole("combobox", { name: "調査する地域", exact: true })
    .selectOption("world");
  await expect(page.getByText(/世界全体では範囲が広すぎます/)).toBeVisible();
  await page
    .getByRole("combobox", { name: "調査する地域", exact: true })
    .selectOption("japan");
  await page
    .getByRole("combobox", { name: "調査の目的", exact: true })
    .selectOption("decision");
  await page.getByRole("button", { name: "調査依頼文を全文コピー" }).click();
  expect(
    await page.evaluate(() => (window as unknown as { copied: string }).copied),
  ).toBe(await page.getByLabel("調査依頼文の全文").innerText());
  await step(page, 2);
  for (const label of planLabels)
    await page.getByLabel(label, { exact: true }).check();
  await expect(page.getByText(/4点を修正しました/)).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "変更前の模擬計画" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "あなたの改善後の計画" }),
  ).toBeVisible();
  await step(page, 3);
  for (const s of studySources("education").slice(0, 7)) {
    await page
      .getByRole("group", { name: "模擬出典を選ぶ" })
      .getByRole("button")
      .filter({ hasText: s.title })
      .click();
    await expect(
      page.getByRole("heading", { name: s.title, exact: true }),
    ).toBeFocused();
    await page
      .getByLabel(sourceChoices[(s.judgment + 1) % 3], { exact: true })
      .check();
    await expect(page.getByText(/もう一度考えてみましょう/)).toBeVisible();
    await page.getByLabel(sourceChoices[s.judgment], { exact: true }).check();
    await expect(
      page.getByRole("status").filter({ hasText: s.reason }),
    ).toContainText("正解です");
  }
  await step(page, 4);
  await expect(
    page.getByRole("button", { name: "この調査をNotebookで学ぶ →" }),
  ).toBeDisabled();
  for (const c of reportChecks("education")) {
    const group = page.getByRole("group", { name: c.question, exact: true });
    await group
      .getByLabel(c.options[(c.answer + 1) % 3], { exact: true })
      .check();
    await expect(group.getByRole("status")).toContainText("もう一度");
    await group.getByLabel(c.options[c.answer], { exact: true }).check();
    await expect(group.getByRole("status")).toContainText(c.reason);
  }
  await page.getByText("改善後のレポートと比較する", { exact: true }).click();
  await expect(page.locator("details pre")).toContainText("64%");
  await expect(completion(page, 3)).not.toBeChecked();
  await page
    .getByRole("button", { name: "この調査をNotebookで学ぶ →" })
    .click();
  await expect(page).toHaveURL(/#chapter-4$/);
  await expect(page.locator("h1")).toBeFocused();
  await expect(
    page.getByRole("combobox", { name: "Notebookのテーマ", exact: true }),
  ).toHaveValue("education");
  for (const id of ["public", "paper", "report"])
    await expect(material(page, "education", id)).toBeChecked();
  await expect(material(page, "education", "unknown")).not.toBeChecked();
  await expect(completion(page, 4)).not.toBeChecked();
  await page.reload();
  await expect(material(page, "education", "public")).toBeChecked();
  await expect(page.getByText(/第3章からの教材内引継ぎ/)).toBeVisible();
});

test("standalone notebook compares all citation cases and removes excluded sources from answers", async ({
  page,
}) => {
  await page.goto("#chapter-4");
  await expect(page.getByText(/第4章は単独で利用できます/)).toBeVisible();
  await material(page, "energy", "public").check();
  await material(page, "energy", "company").check();
  await step(page, 2);
  for (const q of questionCases) {
    await page
      .getByRole("combobox", { name: "模擬質問を選ぶ", exact: true })
      .selectOption(q.id);
    await page
      .getByRole("button", { name: "選択資料で質問する（模擬）" })
      .click();
    if (q.source) {
      await page.getByRole("button", { name: /^\[1\] 引用元を開く/ }).click();
      const source = studySources("energy").find(
        (s) => s.id === `energy-${q.source}`,
      )!;
      await expect(
        page.getByRole("heading", { name: source.title, exact: true }),
      ).toBeFocused();
      await expect(page.getByLabel("資料の原文")).toContainText(source.body);
    } else
      await expect(
        page.getByText(/2035年の全国の値は、選択資料だけでは答えられません/),
      ).toBeVisible();
    const group = page.getByRole("group", {
      name: "この回答と引用をどう判断する？",
    });
    await group
      .getByLabel(citationChoices[(q.answer + 1) % 4], { exact: true })
      .check();
    await expect(group.getByRole("status")).toContainText("もう一度");
    await group.getByLabel(citationChoices[q.answer], { exact: true }).check();
    await expect(group.getByRole("status")).toContainText("正解です");
  }
  await step(page, 1);
  await material(page, "energy", "public").uncheck();
  await step(page, 2);
  await page
    .getByRole("combobox", { name: "模擬質問を選ぶ", exact: true })
    .selectOption("correct");
  await page
    .getByRole("button", { name: "選択資料で質問する（模擬）" })
    .click();
  await expect(
    page.getByText(/この例に必要な資料は現在の参照対象にありません/),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /引用元を開く/ })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("group", { name: "この回答と引用をどう判断する？" }),
  ).toHaveCount(0);
});

test("guide changes content with settings and uses selected sources for guide, audio and map", async ({
  page,
}) => {
  await simpleClipboard(page);
  await page.goto("#chapter-4");
  await material(page, "energy", "public").check();
  await material(page, "energy", "paper").check();
  await step(page, 3);
  const guide = page.getByLabel("学習ガイドの全文");
  const before = await guide.innerText();
  await page
    .getByRole("combobox", { name: "学習対象", exact: true })
    .selectOption("intermediate");
  await expect(guide).toContainText("判断の根拠");
  expect(await guide.innerText()).not.toBe(before);
  await page
    .getByRole("combobox", { name: "ガイドの形式", exact: true })
    .selectOption("qa");
  await expect(guide).toContainText("Q1：");
  await page
    .getByRole("combobox", { name: "詳しさ", exact: true })
    .selectOption("detailed");
  await expect(guide).toContainText("原文：");
  await page
    .getByRole("combobox", { name: "ガイドの形式", exact: true })
    .selectOption("quiz");
  await expect(guide).toContainText("解答例");
  await page.getByRole("button", { name: "学習ガイドを全文コピー" }).click();
  expect(
    await page.evaluate(() => (window as unknown as { copied: string }).copied),
  ).toBe(await guide.innerText());
  await step(page, 4);
  await expect(
    page.getByRole("heading", {
      name: "音声解説の構成と台本（音声未生成・再生不可）",
    }),
  ).toBeVisible();
  await expect(page.locator("audio")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: /^(再生|音声を再生)(する)?$/ }),
  ).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "音声解説の表示", exact: true })
    .selectOption("dialogue");
  await expect(page.getByText(/ホストB：24件の観察研究/)).toBeVisible();
  const map = page.getByLabel("資料と学びのマインドマップ");
  await map
    .getByRole("button", {
      name: "再生可能エネルギー・24件の観察と限界",
      exact: true,
    })
    .click();
  await expect(
    page.getByRole("region", { name: "マップで選んだ項目" }),
  ).toContainText("関連資料：energy-paper");
  await step(page, 1);
  await material(page, "energy", "paper").uncheck();
  await step(page, 3);
  await expect(guide).not.toContainText("24件");
  await step(page, 4);
  await expect(page.getByText(/ホストB：24件の観察研究/)).toHaveCount(0);
  await expect(map.getByRole("button", { name: /24件/ })).toHaveCount(0);
});

test("research changes and reset invalidate imported material while standalone notebooks remain independent", async ({
  page,
}) => {
  await seedReady(page);
  await page
    .getByRole("button", { name: "この調査をNotebookで学ぶ →" })
    .click();
  await completion(page, 4).check();
  await nav(page, 3);
  await page
    .getByRole("combobox", { name: "調査テーマ", exact: true })
    .selectOption("mobility");
  await nav(page, 4);
  await expect(page.getByText(/古い引継ぎ資料を無効/)).toBeVisible();
  await expect(
    page.getByText("現在の参照対象：0件・まだ資料がありません", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(completion(page, 4)).toBeChecked();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "Notebookのテーマ", exact: true }),
  ).toHaveValue("mobility");
  await expect(material(page, "mobility", "public")).not.toBeChecked();
  await page
    .getByRole("combobox", { name: "Notebookのテーマ", exact: true })
    .selectOption("education");
  await material(page, "education", "public").check();
  await nav(page, 3);
  await reset(page, 3);
  await nav(page, 4);
  await expect(material(page, "education", "public")).toBeChecked();
  await expect(completion(page, 4)).toBeChecked();
});

test("same-topic revalidation requires explicit retransfer, invalidates on revision and reload, and rejects malformed imports", async ({
  page,
}) => {
  await seedReady(page);
  await page
    .getByRole("button", { name: "この調査をNotebookで学ぶ →" })
    .click();
  await nav(page, 3);
  await step(page, 2);
  await page.getByLabel(planLabels[0], { exact: true }).uncheck();
  await page.getByLabel(planLabels[0], { exact: true }).check();
  await step(page, 4);
  await nav(page, 4);
  await expect(material(page, "energy", "public")).not.toBeChecked();
  await nav(page, 3);
  await page
    .getByRole("button", { name: "この調査をNotebookで学ぶ →" })
    .click();
  await expect(material(page, "energy", "public")).toBeChecked();
  await page.evaluate((key) => {
    const n = JSON.parse(localStorage.getItem(key)!);
    n.origin.revision = "bad";
    localStorage.setItem(key, JSON.stringify(n));
  }, notebookKey);
  await page.reload();
  await expect(page.getByText(/古い引継ぎ資料を無効/)).toBeVisible();
  await expect(material(page, "energy", "public")).not.toBeChecked();
});

test("individual resets preserve old chapters, lab and exploration; global reset still removes only chapter completions", async ({
  page,
}) => {
  await page.goto("#home");
  await page.evaluate(() => {
    localStorage.setItem(
      "gemini-toranomaki:progress:v1",
      '{"completed":["chapter-1","chapter-2"]}',
    );
    localStorage.setItem("gemini-toranomaki:lab:v1", '{"ask":{"copied":true}}');
    localStorage.setItem(
      "gemini-toranomaki:exploration:v1",
      '{"visited":["model"]}',
    );
  });
  await page.reload();
  await nav(page, 3);
  await completion(page, 3).check();
  await nav(page, 4);
  await material(page, "energy", "public").check();
  await completion(page, 4).check();
  await expect(page.getByText("4 / 10章", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "第4章の記録だけを初期化", exact: true })
    .click();
  await page.getByRole("button", { name: "キャンセル", exact: true }).click();
  await expect(material(page, "energy", "public")).toBeChecked();
  await reset(page, 4);
  await expect(
    page.getByRole("button", { name: "第4章の記録だけを初期化", exact: true }),
  ).toBeFocused();
  await expect(page.getByText("3 / 10章", { exact: true })).toBeVisible();
  await material(page, "energy", "public").check();
  await page.getByRole("button", { name: "進捗を初期化", exact: true }).click();
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  await expect(page.getByText("0 / 10章", { exact: true })).toBeVisible();
  await expect(material(page, "energy", "public")).toBeChecked();
  const values = await page.evaluate(() => ({
    lab: localStorage.getItem("gemini-toranomaki:lab:v1"),
    explore: localStorage.getItem("gemini-toranomaki:exploration:v1"),
  }));
  expect(values.lab).toBe('{"ask":{"copied":true}}');
  expect(values.explore).toBe('{"visited":["model"]}');
});

test("denied storage still allows an in-memory handoff and reset failure does not claim persistence", async ({
  page,
}) => {
  await seedReady(page, "education");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw Error("denied");
    };
    Storage.prototype.removeItem = () => {
      throw Error("denied");
    };
  });
  await page
    .getByRole("button", { name: "この調査をNotebookで学ぶ →" })
    .click();
  await expect(material(page, "education", "public")).toBeChecked();
  await expect(page.getByText(/第4章の記録を保存できません/)).toBeVisible();
  await reset(page, 4);
  await expect(
    page.getByText(/画面内の第4章を初期化しましたが、保存領域の更新に失敗/),
  ).toBeVisible();
  await expect(
    page.getByText("第4章の記録と章完了を初期化しました。", { exact: true }),
  ).toHaveCount(0);
  await expect(material(page, "energy", "public")).not.toBeChecked();
});

test("corrupt or refused storage remains usable and no private input is required", async ({
  page,
}) => {
  await page.goto("#home");
  await page.evaluate(
    ({ researchKey, notebookKey }) => {
      localStorage.setItem(researchKey, "{broken");
      localStorage.setItem(notebookKey, "{broken");
    },
    { researchKey, notebookKey },
  );
  await page.reload();
  await nav(page, 3);
  await expect(page.getByText(/第3章の記録を保存できません/)).toBeVisible();
  await page
    .getByRole("combobox", { name: "調査テーマ", exact: true })
    .selectOption("mobility");
  await nav(page, 4);
  await material(page, "energy", "public").check();
  await expect(material(page, "energy", "public")).toBeChecked();
  await expect(
    page.locator(
      ".study-chapters input[type=file],.study-chapters input[type=text],.study-chapters textarea",
    ),
  ).toHaveCount(0);
});

interface DeferredCopy {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
}
type CopyWindow = Window & { studyCopies: DeferredCopy[] };
async function deferredClipboard(p: Page) {
  await p.addInitScript(() => {
    const calls: DeferredCopy[] = [];
    (window as CopyWindow).studyCopies = calls;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => {
          const call = {} as DeferredCopy;
          call.promise = new Promise<void>((resolve, reject) => {
            call.resolve = resolve;
            call.reject = reject;
          });
          calls.push(call);
          return call.promise;
        },
      },
    });
  });
}
async function settle(p: Page, index: number, outcome: "success" | "failure") {
  await p.evaluate(
    async ({ index, outcome }) => {
      const call = (window as CopyWindow).studyCopies[index];
      if (outcome === "success") call.resolve();
      else call.reject(Error("denied"));
      await call.promise.catch(() => {});
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    },
    { index, outcome },
  );
}
async function prepareCopy(p: Page, chapter: 3 | 4) {
  if (chapter === 3) await step(p, 1);
  else {
    await step(p, 1);
    const topic = (await p
      .getByRole("combobox", { name: "Notebookのテーマ", exact: true })
      .inputValue()) as TopicId;
    await material(p, topic, "public").check();
    await step(p, 3);
  }
  return p.getByRole("button", {
    name: chapter === 3 ? "調査依頼文を全文コピー" : "学習ガイドを全文コピー",
    exact: true,
  });
}
for (const chapter of [3, 4] as const)
  for (const action of ["theme", "settings", "reset", "leave"] as const)
    for (const outcome of ["success", "failure"] as const)
      test(`chapter ${chapter} ignores ${outcome} after ${action} and permits a new copy`, async ({
        page,
      }) => {
        await deferredClipboard(page);
        await page.goto(`#chapter-${chapter}`);
        const copy = await prepareCopy(page, chapter);
        await copy.click();
        if (action === "theme")
          await page
            .getByRole("combobox", {
              name: chapter === 3 ? "調査テーマ" : "Notebookのテーマ",
              exact: true,
            })
            .selectOption("mobility");
        if (action === "settings")
          await page
            .getByRole("combobox", {
              name: chapter === 3 ? "対象期間" : "学習対象",
              exact: true,
            })
            .selectOption(chapter === 3 ? "any" : "intermediate");
        if (action === "reset") await reset(page, chapter);
        if (action === "leave") {
          await page.getByRole("link", { name: "ホーム", exact: true }).click();
          await nav(page, chapter);
        }
        const key = chapter === 3 ? researchKey : notebookKey;
        const before = await page.evaluate(
          (key) => localStorage.getItem(key),
          key,
        );
        await settle(page, 0, outcome);
        expect(
          await page.evaluate((key) => localStorage.getItem(key), key),
        ).toBe(before);
        await expect(page.locator(".study-workspace .feedback")).toHaveText("");
        const retry = await prepareCopy(page, chapter);
        await expect(retry).toBeEnabled();
        await retry.click();
        await settle(page, 1, "success");
        await expect(retry).toBeEnabled();
        await expect(page.locator(".study-workspace .feedback")).toContainText(
          "全文をコピーしました",
        );
        expect(
          await page.evaluate(
            (key) => JSON.parse(localStorage.getItem(key)!).copied,
            key,
          ),
        ).toBe(true);
      });

for (const chapter of [3, 4] as const)
  test(`chapter ${chapter} copy failure permits manual copy and retry`, async ({
    page,
  }) => {
    await deferredClipboard(page);
    await page.goto(`#chapter-${chapter}`);
    const copy = await prepareCopy(page, chapter);
    await copy.click();
    await settle(page, 0, "failure");
    await expect(copy).toBeEnabled();
    await expect(page.locator(".study-workspace .feedback")).toContainText(
      "手動でコピー",
    );
    await expect(
      page.getByLabel(chapter === 3 ? "調査依頼文の全文" : "学習ガイドの全文"),
    ).toBeVisible();
    await copy.click();
    await settle(page, 1, "success");
    await expect(page.locator(".study-workspace .feedback")).toContainText(
      "全文をコピーしました",
    );
  });

test("chapter navigation and reload retain heading focus, and no reset control steals focus", async ({
  page,
}) => {
  await page.goto("#chapter-3");
  await expect(page.locator("h1")).toBeFocused();
  for (const chapter of [4, 3, 4]) {
    await nav(page, chapter);
    await expect(page.locator("h1")).toBeFocused();
    expect(
      await page.locator("h1").evaluate((el) => {
        const b = el.getBoundingClientRect();
        return b.bottom > 0 && b.top < innerHeight;
      }),
    ).toBe(true);
    await page.reload();
    await expect(page.locator("h1")).toBeFocused();
    await expect(
      page.getByRole("button", {
        name: `第${chapter}章の記録だけを初期化`,
        exact: true,
      }),
    ).not.toBeFocused();
  }
});

for (const width of [320, 375, 390, 1280])
  test(`research and notebook fit ${width}px with both themes and keyboard paths`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("#chapter-3");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    for (const theme of ["light", "dark"]) {
      if (theme === "dark")
        await page
          .getByRole("button", { name: "ダークテーマに切り替え" })
          .click();
      for (const chapter of [3, 4]) {
        await nav(page, chapter);
        if (chapter === 4) {
          await step(page, 1);
          await material(page, "energy", "public").check();
        }
        for (let n = 1; n <= 4; n++) {
          const button = page.getByRole("button", {
            name: new RegExp(`^${n}\\. `),
          });
          await button.focus();
          await page.keyboard.press("Enter");
          await expect(
            page.locator(chapter === 3 ? "#research-step" : "#notebook-step"),
          ).toBeFocused();
          if (chapter === 3 && n === 3) {
            const source = page
              .getByRole("group", { name: "模擬出典を選ぶ" })
              .getByRole("button")
              .first();
            await source.focus();
            await page.keyboard.press("Enter");
            await expect(
              page.getByRole("heading", {
                name: "再生可能エネルギー・2025年の架空標本集計",
                exact: true,
              }),
            ).toBeFocused();
          }
          if (chapter === 4 && n === 4) {
            const node = page
              .getByLabel("資料と学びのマインドマップ")
              .getByRole("button", {
                name: "再生可能エネルギー・2025年の架空標本集計",
                exact: true,
              });
            await node.focus();
            await page.keyboard.press("Enter");
            await expect(
              page
                .getByRole("region", { name: "マップで選んだ項目" })
                .getByRole("heading"),
            ).toBeFocused();
          }
          expect(
            await page.evaluate(
              () => document.documentElement.scrollWidth <= innerWidth,
            ),
          ).toBe(true);
        }
      }
    }
  });

for (const chapter of [3, 4] as const)
  for (const outcome of ["success", "failure"] as const)
    test(`chapter ${chapter} ignores copy ${outcome} when hash changes in the same event turn`, async ({
      page,
    }) => {
      await deferredClipboard(page);
      await page.goto(`#chapter-${chapter}`);
      const copy = await prepareCopy(page, chapter);
      await copy.click();
      const key = chapter === 3 ? researchKey : notebookKey;
      const before = await page.evaluate(
        (key) => localStorage.getItem(key),
        key,
      );
      await page.evaluate(
        async ({ chapter, outcome }) => {
          location.hash = chapter === 3 ? "chapter-4" : "chapter-3";
          const c = (window as CopyWindow).studyCopies[0];
          if (outcome === "success") c.resolve();
          else c.reject(Error("denied"));
          await c.promise.catch(() => {});
          await new Promise<void>((r) => requestAnimationFrame(() => r()));
        },
        { chapter, outcome },
      );
      await expect(page.locator("h1")).toHaveText(
        chapter === 3
          ? "Notebook：調査資料を学習教材に変える"
          : "Deep Research：調査計画から出典検証まで",
      );
      expect(await page.evaluate((key) => localStorage.getItem(key), key)).toBe(
        before,
      );
      await expect(page.locator(".study-workspace .feedback")).toHaveText("");
    });

for (const chapter of [3, 4] as const)
  for (const outcome of ["success", "failure"] as const)
    test(`chapter ${chapter} reset and copy ${outcome} in the same event turn never resurrect records`, async ({
      page,
    }) => {
      await deferredClipboard(page);
      await page.goto(`#chapter-${chapter}`);
      const copy = await prepareCopy(page, chapter);
      await copy.click();
      await page
        .getByRole("button", {
          name: `第${chapter}章の記録だけを初期化`,
          exact: true,
        })
        .click();
      await page.evaluate(
        async ({ chapter, outcome }) => {
          const button = [...document.querySelectorAll("button")].find(
            (b) => b.textContent === `第${chapter}章を初期化する`,
          )!;
          button.click();
          const c = (window as CopyWindow).studyCopies[0];
          if (outcome === "success") c.resolve();
          else c.reject(Error("denied"));
          await c.promise.catch(() => {});
          await new Promise<void>((r) => requestAnimationFrame(() => r()));
        },
        { chapter, outcome },
      );
      const key = chapter === 3 ? researchKey : notebookKey;
      expect(
        await page.evaluate((key) => localStorage.getItem(key), key),
      ).toBeNull();
      await expect(page.locator(".study-workspace .feedback")).toHaveText("");
    });

test("unresolved research conditions stay visible beside a disabled transfer even after fixed checks pass", async ({
  page,
}) => {
  await seedReady(page);
  await step(page, 1);
  await page
    .getByRole("combobox", { name: "対象期間", exact: true })
    .selectOption("any");
  await step(page, 4);
  await expect(
    page.getByRole("button", { name: "この調査をNotebookで学ぶ →" }),
  ).toBeDisabled();
  await expect(page.getByText(/対象期間が不明確です/)).toBeVisible();
  await page.getByRole("button", { name: "体験1の条件を見直す" }).click();
  await expect(
    page.getByRole("combobox", { name: "対象期間", exact: true }),
  ).toBeVisible();
});

for (const failedKey of [researchKey, notebookKey])
  test(`partial persistence failure on ${failedKey} never restores stale imported sources`, async ({
    page,
  }) => {
    await seedReady(page);
    await page
      .getByRole("button", { name: "この調査をNotebookで学ぶ →" })
      .click();
    await page.evaluate((key) => {
      const previous = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === key) throw Error("one key denied");
        return previous.call(this, k, v);
      };
    }, failedKey);
    await nav(page, 3);
    await page
      .getByRole("combobox", { name: "調査テーマ", exact: true })
      .selectOption("mobility");
    await nav(page, 4);
    await expect(
      page.getByText("現在の参照対象：0件・まだ資料がありません", {
        exact: true,
      }),
    ).toBeVisible();
    await page.reload();
    await expect(page.getByText(/古い引継ぎ資料を無効/)).toBeVisible();
    await expect(
      page.getByText("現在の参照対象：0件・まだ資料がありません", {
        exact: true,
      }),
    ).toBeVisible();
    await expect(material(page, "mobility", "public")).not.toBeChecked();
  });
