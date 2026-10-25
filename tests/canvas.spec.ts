import { test, expect, type Page } from "@playwright/test";
import {
  canvasChecks,
  canvasPrompt,
  canvasReferences,
  defaultCanvasSettings,
  quizFor,
  type QuizTopic,
} from "../src/canvas-data";
import { canvasKey } from "../src/canvas-storage";
const step = async (p: Page, n: number) => {
  await p.getByRole("button", { name: new RegExp(`^${n}\\. `) }).click();
  await expect(p.locator("#canvas-step")).toBeFocused();
};
const record = (p: Page) =>
  p.evaluate((k) => JSON.parse(localStorage.getItem(k) ?? "null"), canvasKey);
const prototype = (p: Page) =>
  p.getByRole("region", { name: "教材用クイズ試作品", exact: true });
const result = (p: Page) => p.getByLabel("現在の版の採点結果", { exact: true });
const grade = async (p: Page) => {
  await prototype(p)
    .getByRole("button", { name: "採点する", exact: true })
    .click();
  await expect(result(p).getByRole("heading")).toBeFocused();
};
const completion = (p: Page) =>
  p.getByLabel("第6章の学習を完了した（自己申告）", { exact: true });
async function understand(p: Page, id: "requirements" | "repair" | "proof") {
  const c = canvasChecks.find((c) => c.id === id)!;
  await p
    .getByRole("group", { name: c.question, exact: true })
    .getByLabel(c.options[c.answer], { exact: true })
    .check();
}
async function trial(p: Page) {
  await step(p, 2);
  await p
    .getByLabel("点数が出るかもしれない。実際に試す", { exact: true })
    .check();
}
async function repair(p: Page, mode = "unanswered") {
  await step(p, 3);
  await understand(p, "repair");
  await p
    .getByRole("combobox", { name: "修正の依頼内容", exact: true })
    .selectOption(mode);
  await p
    .getByRole("button", { name: "この修正案を固定試作品に反映", exact: true })
    .click();
}
async function preset(p: Page, label: string) {
  const summary = p.getByText(
    "境界条件を手早くセットする（正解パターンを含む）",
    { exact: true },
  );
  if (
    !(await summary
      .locator("..")
      .evaluate((el) => (el as HTMLDetailsElement).open))
  )
    await summary.click();
  await p
    .getByRole("button", { name: `${label}をセット`, exact: true })
    .click();
}
async function answer(p: Page, topic: QuizTopic, i: number, n: number) {
  await prototype(p)
    .getByRole("group", {
      name: `問題${i + 1}：${quizFor(topic).questions[i].text}`,
      exact: true,
    })
    .getByLabel(quizFor(topic).questions[i].options[n], { exact: true })
    .check();
}
async function reset(p: Page) {
  await p
    .getByRole("button", { name: "第6章の記録だけを初期化", exact: true })
    .click();
  await p
    .getByRole("button", { name: "第6章を初期化する", exact: true })
    .click();
}
async function clipboard(p: Page) {
  await p.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { canvasText: string }).canvasText = text;
        },
      },
    }),
  );
}

test("Canvas is reachable from curriculum, navigation and chapter-one map; chapters seven through ten remain planned", async ({
  page,
}) => {
  await page.goto("#curriculum");
  await page.locator(".chapter-row").nth(5).click();
  await expect(page.locator("h1")).toHaveText("Canvas");
  await expect(page.locator("h1")).toBeFocused();
  await expect(
    page.getByText("簡単なWebアプリを作る", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "第1章を学ぶ", exact: true }).click();
  await page.getByLabel("やりたいこと").selectOption("app");
  await expect(page.locator(".map-results")).toContainText("学習できます");
  await page.locator(".map-results a").click();
  await expect(page.locator("h1")).toHaveText("Canvas");
  for (const n of [7, 8, 9, 10]) {
    await page.goto(`#chapter-${n}`);
    await expect(
      page.getByRole("heading", { name: "準備中", exact: true }),
    ).toBeVisible();
  }
});
test("requirements selection changes the full creation prompt and does not expose the completed specification before a judgment", async ({
  page,
}) => {
  await clipboard(page);
  await page.goto("#chapter-6");
  await expect(page.getByLabel("作成指示の全文", { exact: true })).toHaveCount(
    0,
  );
  await page.getByLabel(canvasChecks[0].options[0], { exact: true }).check();
  await expect(
    page.getByRole("status").filter({ hasText: "もう一度考えて" }),
  ).toBeVisible();
  await understand(page, "requirements");
  const settings = {
    topic: "evidence",
    audience: "review",
    feedback: "score",
  } as const;
  await page
    .getByRole("combobox", { name: "クイズのテーマ", exact: true })
    .selectOption(settings.topic);
  await page
    .getByRole("combobox", { name: "対象者", exact: true })
    .selectOption(settings.audience);
  await page
    .getByRole("combobox", { name: "採点後の結果表示", exact: true })
    .selectOption(settings.feedback);
  await expect(page.getByLabel("作成指示の全文", { exact: true })).toHaveText(
    canvasPrompt("create", settings, "unanswered"),
  );
  await page
    .getByRole("button", { name: "作成指示を全文コピー", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => (window as unknown as { canvasText: string }).canvasText,
    ),
  ).toBe(canvasPrompt("create", settings, "unanswered"));
  await expect(
    page.getByText(/この本文の過去のコピー成功：あり/),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "クイズのテーマ", exact: true }),
  ).toHaveValue("evidence");
  await expect(
    page.getByText(/この本文の過去のコピー成功：あり/),
  ).toBeVisible();
});
for (const topic of ["science", "evidence"] as const)
  test(`initial ${topic} quiz computes empty, partial, mixed, all correct/incorrect results and clears stale grades on real changes`, async ({
    page,
  }) => {
    await page.goto("#chapter-6");
    await page
      .getByRole("combobox", { name: "クイズのテーマ", exact: true })
      .selectOption(topic);
    await trial(page);
    await expect(result(page)).toHaveCount(0);
    await grade(page);
    await expect(result(page)).toContainText("0 / 3点");
    await expect(result(page)).toContainText("未回答を不正解として採点");
    for (const [label, score] of [
      ["一部回答", 1],
      ["全問回答・1問正解", 1],
      ["全問正解", 3],
      ["全問不正解", 0],
    ] as const) {
      await preset(page, label);
      await expect(result(page)).toHaveCount(0);
      await grade(page);
      await expect(result(page)).toContainText(`${score} / 3点`);
      await grade(page);
      await expect(result(page)).toContainText(`${score} / 3点`);
    }
    const correct = quizFor(topic).questions[0].answer;
    await answer(page, topic, 0, correct);
    await expect(result(page)).toHaveCount(0);
    await expect(
      prototype(page).getByText(/旧結果を解除しました/),
    ).toBeVisible();
    await grade(page);
    await expect(result(page)).toContainText("1 / 3点");
    await prototype(page)
      .getByRole("button", { name: "やり直す", exact: true })
      .click();
    await expect(result(page)).toHaveCount(0);
    await expect(
      prototype(page).locator('input[type="radio"]:checked'),
    ).toHaveCount(0);
    await expect(prototype(page).locator("legend").first()).toBeFocused();
  });
test("cosmetic repair keeps the fault, behavioral repair blocks missing questions, and version comparison shares answers but never transfers grades", async ({
  page,
}) => {
  await clipboard(page);
  await page.goto("#chapter-6");
  await trial(page);
  await grade(page);
  await preset(page, "一部回答");
  await grade(page);
  await expect(result(page)).toContainText("1 / 3点");
  await repair(page, "appearance");
  await expect(result(page)).toHaveCount(0);
  await expect(
    prototype(page).locator('input[type="radio"]:checked'),
  ).toHaveCount(1);
  await grade(page);
  await expect(result(page)).toContainText("1 / 3点");
  await page
    .getByRole("combobox", { name: "修正の依頼内容", exact: true })
    .selectOption("unanswered");
  await expect(result(page)).toContainText("1 / 3点");
  await expect(page.getByLabel("修正指示の全文", { exact: true })).toHaveText(
    canvasPrompt("repair", defaultCanvasSettings, "unanswered"),
  );
  await page
    .getByRole("button", { name: "修正指示を全文コピー", exact: true })
    .click();
  expect(
    await page.evaluate(
      () => (window as unknown as { canvasText: string }).canvasText,
    ),
  ).toBe(canvasPrompt("repair", defaultCanvasSettings, "unanswered"));
  await page
    .getByRole("button", { name: "この修正案を固定試作品に反映", exact: true })
    .click();
  await expect(result(page)).toHaveCount(0);
  await grade(page);
  await expect(result(page)).toContainText("未回答：問題2、問題3");
  await expect(result(page)).not.toContainText("/ 3点");
  await page.getByRole("button", { name: "問題2へ移動", exact: true }).click();
  await expect(prototype(page).locator("legend").nth(1)).toBeFocused();
  await prototype(page)
    .getByRole("button", { name: "修正前：初期版", exact: true })
    .click();
  await expect(result(page)).toContainText("1 / 3点");
  await prototype(page)
    .getByRole("button", { name: "修正後：修正版", exact: true })
    .click();
  await expect(result(page)).toContainText("未回答：問題2、問題3");
  for (const i of [1, 2])
    await answer(page, "science", i, quizFor("science").questions[i].answer);
  await expect(result(page)).toHaveCount(0);
  await expect(page.getByLabel("同じ回答条件での版別結果")).toContainText(
    "初期版：未採点",
  );
  await grade(page);
  await expect(result(page)).toContainText("3 / 3点");
  await prototype(page)
    .getByRole("button", { name: "やり直す", exact: true })
    .click();
  await expect(result(page)).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "問題2へ移動", exact: true }),
  ).toHaveCount(0);
});
test("same settings, version and repair preserve the running quiz; actual settings reset answers, grades and current verification but keep learning history", async ({
  page,
}) => {
  await page.goto("#chapter-6");
  await repair(page);
  await answer(page, "science", 0, 1);
  await grade(page);
  const before = await record(page);
  await page
    .getByRole("combobox", { name: "クイズのテーマ", exact: true })
    .selectOption("science");
  await page
    .getByRole("combobox", { name: "修正の依頼内容", exact: true })
    .selectOption("unanswered");
  await prototype(page)
    .getByRole("button", { name: "修正後：修正版", exact: true })
    .click();
  await page
    .getByRole("button", { name: "この修正案を固定試作品に反映", exact: true })
    .click();
  expect(await record(page)).toEqual(before);
  await expect(result(page)).toContainText("未回答：問題2、問題3");
  await page
    .getByRole("combobox", { name: "クイズのテーマ", exact: true })
    .selectOption("evidence");
  await expect(result(page)).toHaveCount(0);
  await expect(
    prototype(page).locator('input[type="radio"]:checked'),
  ).toHaveCount(0);
  expect((await record(page)).applied).toBeNull();
  expect((await record(page)).history).toEqual(before.history);
});
test("four verification tasks require real quiz operations and compare prediction with observed results; switching context removes current verification", async ({
  page,
}) => {
  await page.goto("#chapter-6");
  await repair(page);
  await step(page, 4);
  const check = page.getByRole("combobox", {
    name: "確かめる項目",
    exact: true,
  });
  const choices = [
    "未回答の問題番号が表示され、点数は出ない",
    "1点",
    "3点のまま",
    "回答・点数・未回答案内がすべて消える",
  ];
  for (const [i, id] of ["missing", "score", "repeat", "restart"].entries()) {
    await check.selectOption(id);
    await expect(page.getByLabel("予想と実操作の比較")).toHaveCount(0);
    await page
      .getByRole("group", {
        name: "この確認条件で起こることを予想する",
        exact: true,
      })
      .getByLabel(choices[i], { exact: true })
      .check();
    await page
      .getByRole("button", { name: "確認条件を試作品にセット", exact: true })
      .click();
    await expect(page.getByLabel("予想と実操作の比較")).toHaveCount(0);
    await grade(page);
    if (id === "repeat") {
      await expect(page.getByLabel("予想と実操作の比較")).toHaveCount(0);
      await grade(page);
    }
    if (id === "restart") {
      await expect(page.getByLabel("予想と実操作の比較")).toHaveCount(0);
      await prototype(page)
        .getByRole("button", { name: "やり直す", exact: true })
        .click();
    }
    await expect(page.getByLabel("予想と実操作の比較")).toContainText(
      "予想と観察が一致しました",
    );
  }
  await understand(page, "proof");
  await prototype(page)
    .getByRole("button", { name: "修正前：初期版", exact: true })
    .click();
  await expect(page.getByLabel("予想と実操作の比較")).toHaveCount(0);
  await expect(completion(page)).not.toBeChecked();
  await completion(page).check();
  await reset(page);
  await step(page, 4);
  await expect(check).toHaveValue("missing");
  await expect(page.getByLabel("予想と実操作の比較")).toHaveCount(0);
});
test("all three optional prompts match full text and OS references filter explicitly without claiming Google operation", async ({
  page,
}) => {
  await clipboard(page);
  await page.goto("#chapter-6");
  await step(page, 4);
  await page
    .getByText("任意：自分のGemini Canvasで作る", { exact: true })
    .click();
  for (const kind of ["create", "repair", "verify"] as const) {
    const title = {
      create: "作成指示",
      repair: "修正指示",
      verify: "確認手順",
    }[kind];
    await page
      .getByRole("combobox", { name: "コピーする内容", exact: true })
      .selectOption(kind);
    await expect(page.getByLabel(`${title}の全文`, { exact: true })).toHaveText(
      canvasPrompt(kind, defaultCanvasSettings, "unanswered"),
    );
    await page
      .getByRole("button", { name: `${title}を全文コピー`, exact: true })
      .click();
    expect(
      await page.evaluate(
        () => (window as unknown as { canvasText: string }).canvasText,
      ),
    ).toBe(canvasPrompt(kind, defaultCanvasSettings, "unanswered"));
  }
  const summary = page.getByText("公式Canvasの機能と教材の違い", {
    exact: true,
  });
  await summary.click();
  for (const os of ["pc", "ios", "android", "pc"] as const) {
    await page
      .getByRole("combobox", { name: "公式案内の端末", exact: true })
      .selectOption(os);
    const links = summary.locator("..").getByRole("link");
    await expect(links).toHaveText(
      canvasReferences
        .filter((r) => r.platform === "all" || r.platform === os)
        .map((r) => `${r.title} ↗（別タブ）`),
    );
  }
  expect((await record(page)).tried).toBe(false);
});
test("only fixed records restore; answers, grades and current verification do not survive reload or chapter leave", async ({
  page,
}) => {
  await page.goto("#chapter-6");
  await repair(page);
  await answer(page, "science", 0, 1);
  await grade(page);
  await completion(page).check();
  const before = await record(page);
  expect(before).not.toHaveProperty("answers");
  expect(before).not.toHaveProperty("score");
  await page.reload();
  await expect(result(page)).toHaveCount(0);
  await expect(
    prototype(page).locator('input[type="radio"]:checked'),
  ).toHaveCount(0);
  expect(await record(page)).toEqual(before);
  await expect(completion(page)).toBeChecked();
  await answer(page, "science", 0, 1);
  await grade(page);
  await page.getByRole("link", { name: "ホーム", exact: true }).click();
  await page.getByRole("link", { name: "第6章を学ぶ", exact: true }).click();
  await expect(
    prototype(page).locator('input[type="radio"]:checked'),
  ).toHaveCount(0);
  await expect(result(page)).toHaveCount(0);
});
test("chapter-only reset preserves old keys and completions; global reset still clears only completion", async ({
  page,
}) => {
  await page.goto("#home");
  const keys = [
    "lab",
    "exploration",
    "services",
    "research",
    "notebook",
    "live",
  ].map((k) => `gemini-toranomaki:${k}:v1`);
  await page.evaluate((keys) => {
    for (const key of keys)
      localStorage.setItem(key, JSON.stringify({ old: key }));
    localStorage.setItem(
      "gemini-toranomaki:progress:v1",
      JSON.stringify({
        completed: [
          "chapter-1",
          "chapter-2",
          "chapter-3",
          "chapter-4",
          "chapter-5",
        ],
      }),
    );
  }, keys);
  await page.reload();
  await page.getByRole("link", { name: "第6章を学ぶ", exact: true }).click();
  await understand(page, "requirements");
  await completion(page).check();
  await expect(page.getByText("6 / 10章", { exact: true })).toBeVisible();
  await reset(page);
  await expect(page.getByText("5 / 10章", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("button", { name: "第6章の記録だけを初期化", exact: true }),
  ).toBeFocused();
  expect(await record(page)).toBeNull();
  for (const key of keys)
    expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
      JSON.stringify({ old: key }),
    );
  await understand(page, "requirements");
  const before = await record(page);
  await page.getByRole("button", { name: "進捗を初期化", exact: true }).click();
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  expect(await record(page)).toEqual(before);
});
for (const deniedRead of [false, true])
  test(`storage failure and corrupt data (denied read=${deniedRead}) never prevent local grading or claim reset persistence`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key, deniedRead }) => {
        if (deniedRead)
          Object.defineProperty(window, "localStorage", {
            get() {
              throw Error("denied");
            },
          });
        else {
          localStorage.setItem(key, "{broken");
          Storage.prototype.setItem = () => {
            throw Error("quota");
          };
          Storage.prototype.removeItem = () => {
            throw Error("denied");
          };
        }
      },
      { key: canvasKey, deniedRead },
    );
    await page.goto("#chapter-6");
    await trial(page);
    await grade(page);
    await expect(result(page)).toContainText("0 / 3点");
    await reset(page);
    await expect(
      page.getByText(/画面内の第6章を初期化しましたが/),
    ).toBeVisible();
    await expect(page.getByText(/第6章の記録を保存できません/)).toBeVisible();
  });
test("the fixed prototype does not send external requests or execute user-provided code", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:4173/")) external.push(r.url());
  });
  await page.goto("#chapter-6");
  await understand(page, "requirements");
  await trial(page);
  await grade(page);
  await repair(page);
  await grade(page);
  await step(page, 4);
  await understand(page, "proof");
  expect(external).toEqual([]);
  await expect(
    page.locator(
      '.canvas-chapter textarea,.canvas-chapter input[type="text"],.canvas-chapter input[type="file"],.canvas-chapter iframe',
    ),
  ).toHaveCount(0);
});
interface CopyCall {
  promise: Promise<void>;
  resolve: () => void;
  reject: (e: Error) => void;
}
type CopyWindow = Window & { canvasCopies: CopyCall[] };
async function deferred(p: Page) {
  await p.addInitScript(() => {
    const calls: CopyCall[] = [];
    (window as CopyWindow).canvasCopies = calls;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => {
          const c = {} as CopyCall;
          c.promise = new Promise<void>((resolve, reject) => {
            c.resolve = resolve;
            c.reject = reject;
          });
          calls.push(c);
          return c.promise;
        },
      },
    });
  });
}
async function settle(p: Page, i: number, outcome: "success" | "failure") {
  await p.evaluate(
    async ({ i, outcome }) => {
      const c = (window as CopyWindow).canvasCopies[i];
      if (outcome === "success") c.resolve();
      else c.reject(Error("denied"));
      await c.promise.catch(() => {});
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    },
    { i, outcome },
  );
}
const copyButton = (p: Page) =>
  p.getByRole("button", { name: "作成指示を全文コピー", exact: true });
const feedback = (p: Page) => p.locator(".canvas-chapter > .feedback").first();
for (const action of ["topic", "audience", "reset", "leave"] as const)
  for (const outcome of ["success", "failure"] as const)
    test(`creation copy ${outcome} after ${action} is ignored and retry works`, async ({
      page,
    }) => {
      await deferred(page);
      await page.goto("#chapter-6");
      await understand(page, "requirements");
      await copyButton(page).click();
      if (action === "topic")
        await page
          .getByRole("combobox", { name: "クイズのテーマ", exact: true })
          .selectOption("evidence");
      if (action === "audience")
        await page
          .getByRole("combobox", { name: "対象者", exact: true })
          .selectOption("review");
      if (action === "reset") await reset(page);
      if (action === "leave") {
        await page.getByRole("link", { name: "ホーム", exact: true }).click();
        await page
          .getByRole("link", { name: "第6章を学ぶ", exact: true })
          .click();
      }
      const before = await record(page);
      await settle(page, 0, outcome);
      expect(await record(page)).toEqual(before);
      await expect(feedback(page)).toHaveText("");
      await understand(page, "requirements");
      await expect(copyButton(page)).toBeEnabled();
      await copyButton(page).click();
      await settle(page, 1, "success");
      await expect(feedback(page)).toContainText("全文をコピーしました");
    });
for (const outcome of ["success", "failure"] as const)
  test(`same-text choices preserve copying and an older ${outcome} cannot overwrite a newer pending copy`, async ({
    page,
  }) => {
    await deferred(page);
    await page.goto("#chapter-6");
    await understand(page, "requirements");
    await copyButton(page).click();
    await page
      .getByRole("combobox", { name: "クイズのテーマ", exact: true })
      .selectOption("science");
    await settle(page, 0, "success");
    expect((await record(page)).copied).toHaveLength(1);
    await copyButton(page).click();
    await page
      .getByRole("combobox", { name: "採点後の結果表示", exact: true })
      .selectOption("score");
    await copyButton(page).click();
    await settle(page, 1, outcome);
    await expect(copyButton(page)).toBeDisabled();
    await expect(feedback(page)).toHaveText("");
    await settle(page, 2, "success");
    await expect(copyButton(page)).toBeEnabled();
    expect((await record(page)).copied).toHaveLength(2);
  });
for (const action of ["reset", "hash"] as const)
  for (const outcome of ["success", "failure"] as const)
    test(`atomic ${action} and copy ${outcome} cannot restore old records`, async ({
      page,
    }) => {
      await deferred(page);
      await page.goto("#chapter-6");
      await understand(page, "requirements");
      await copyButton(page).click();
      if (action === "reset")
        await page
          .getByRole("button", { name: "第6章の記録だけを初期化", exact: true })
          .click();
      const before = await record(page);
      await page.evaluate(
        async ({ action, outcome }) => {
          if (action === "reset")
            [...document.querySelectorAll("button")]
              .find((b) => b.textContent === "第6章を初期化する")!
              .click();
          else location.hash = "chapter-5";
          const c = (window as CopyWindow).canvasCopies[0];
          if (outcome === "success") c.resolve();
          else c.reject(Error("denied"));
          await c.promise.catch(() => {});
          await new Promise<void>((r) => requestAnimationFrame(() => r()));
        },
        { action, outcome },
      );
      expect(await record(page)).toEqual(action === "reset" ? null : before);
    });
test("copy rejection shows manual fallback and a new successful copy adds the matching fixed text record", async ({
  page,
}) => {
  await deferred(page);
  await page.goto("#chapter-6");
  await understand(page, "requirements");
  await copyButton(page).click();
  await settle(page, 0, "failure");
  await expect(feedback(page)).toContainText("手動でコピー");
  expect((await record(page)).copied).toEqual([]);
  await copyButton(page).click();
  await settle(page, 1, "success");
  expect((await record(page)).copied).toHaveLength(1);
});
for (const width of [320, 375, 390, 1280])
  test(`Canvas ${width}px supports both themes and keyboard focus without horizontal overflow`, async ({
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
      for (let n = 1; n <= 4; n++) {
        const button = page.getByRole("button", {
          name: new RegExp(`^${n}\\. `),
        });
        await button.focus();
        await page.keyboard.press("Enter");
        await expect(page.locator("#canvas-step")).toBeFocused();
        if (n === 1) await understand(page, "requirements");
        if (n === 2) {
          await page
            .getByLabel("点数が出るかもしれない。実際に試す", { exact: true })
            .check();
          await prototype(page)
            .getByRole("button", { name: "採点する", exact: true })
            .focus();
          await page.keyboard.press("Enter");
          await expect(result(page).getByRole("heading")).toBeFocused();
        }
        if (n === 3) {
          await understand(page, "repair");
          await page
            .getByRole("button", {
              name: "この修正案を固定試作品に反映",
              exact: true,
            })
            .click();
          await grade(page);
          if (
            await page
              .getByRole("button", { name: "問題1へ移動", exact: true })
              .count()
          ) {
            await page
              .getByRole("button", { name: "問題1へ移動", exact: true })
              .focus();
            await page.keyboard.press("Enter");
            await expect(
              prototype(page).locator("legend").first(),
            ).toBeFocused();
          }
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
    }
  });

test("failed save and deletion warn honestly and reload restores only the old fixed record, never a quiz score", async ({
  page,
}) => {
  await page.goto("#chapter-6");
  await page
    .getByRole("combobox", { name: "クイズのテーマ", exact: true })
    .selectOption("evidence");
  await understand(page, "requirements");
  const old = await record(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw Error("quota");
    };
    Storage.prototype.removeItem = () => {
      throw Error("denied");
    };
  });
  await page
    .getByRole("combobox", { name: "クイズのテーマ", exact: true })
    .selectOption("science");
  await trial(page);
  await grade(page);
  await reset(page);
  await expect(page.getByText(/画面内の第6章を初期化しましたが/)).toBeVisible();
  expect(await record(page)).toEqual(old);
  await page.reload();
  await expect(
    page.getByRole("combobox", { name: "クイズのテーマ", exact: true }),
  ).toHaveValue("evidence");
  expect(await record(page)).toEqual(old);
  await trial(page);
  await expect(result(page)).toHaveCount(0);
});
for (const outcome of ["success", "failure"] as const)
  test(`repair selection invalidates old ${outcome} without affecting the unapplied prototype or a new copy`, async ({
    page,
  }) => {
    await deferred(page);
    await page.goto("#chapter-6");
    await repair(page, "appearance");
    await grade(page);
    const copy = page.getByRole("button", {
      name: "修正指示を全文コピー",
      exact: true,
    });
    await copy.click();
    await page
      .getByRole("combobox", { name: "修正の依頼内容", exact: true })
      .selectOption("unanswered");
    await copy.click();
    const before = await record(page);
    await settle(page, 0, outcome);
    expect(await record(page)).toEqual(before);
    expect((await record(page)).applied).toBe("appearance");
    await expect(result(page)).toContainText("0 / 3点");
    await expect(copy).toBeDisabled();
    await settle(page, 1, "success");
    await expect(copy).toBeEnabled();
    expect((await record(page)).copied).toHaveLength(1);
  });
