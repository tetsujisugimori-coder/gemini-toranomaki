import { test, expect, type Page } from "@playwright/test";
import { capstoneKey, freshCapstone } from "../src/capstone-storage";
import { topicFor, type Topic, type Version } from "../src/capstone-data";
const select = (p: Page, label: string) =>
  p.getByRole("combobox", { name: label, exact: true });
const button = (p: Page, name: string) =>
  p.getByRole("button", { name, exact: true });
const saved = (p: Page) =>
  p.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "{}"),
    capstoneKey,
  );
async function step(p: Page, n: number) {
  await select(p, "総合演習の工程").selectOption(String(n));
  await expect(p.locator("#capstone-heading")).toHaveText(
    new RegExp(`^STEP ${n} `),
  );
}
async function confirm(p: Page) {
  await button(p, "この工程の固定課題を確認").click();
  await expect(
    p
      .locator(".capstone")
      .getByRole("status")
      .filter({ hasText: "この工程の固定課題を確認できました" }),
  ).toBeVisible();
}
async function candidate(p: Page, topic: Topic = "history") {
  await p.goto("#chapter-10");
  await step(p, 1);
  await select(p, "演習テーマ").selectOption(topic);
  await confirm(p);
  await step(p, 2);
  await select(p, "計画を見る前の予想").selectOption("1");
  for (const name of [
    "目的と対象読者",
    "対象時期・調査範囲",
    "一次資料と原文の確認",
    "不明点・反証の確認",
  ])
    await p.getByLabel(name, { exact: true }).check();
  await button(p, "模擬調査を実行").click();
  for (const [i, n] of [1, 2, 0].entries())
    await select(p, `主張${i + 1}と原文の関係`).selectOption(String(n));
  await confirm(p);
  await step(p, 3);
  await p.getByLabel("S3 出所不明のメモ", { exact: true }).check();
  await button(p, "変更前の回答を残す").click();
  await p.getByLabel("S3 出所不明のメモ", { exact: true }).uncheck();
  await button(p, "資料変更の比較を記録").click();
  await select(p, "Notebookの誤回答への判断").selectOption("2");
  await confirm(p);
  await step(p, 4);
  for (const name of [
    "目的・読者・形式",
    "選択資料と引用・原文照合",
    "完成条件と未確認事項",
    "変更箇所・維持条件・動作確認",
  ])
    await p.getByLabel(name, { exact: true }).check();
  await expect(
    p.getByRole("textbox", { name: "指示文全文", exact: true }),
  ).toHaveValue(new RegExp(topicFor(topic).purpose));
  await button(p, "固定初版を制作して比較する").click();
  await confirm(p);
}
async function trial(p: Page, v: Version, topic: Topic = "history") {
  const region = p.getByRole("region", {
      name: `${v === "initial" ? "初版" : v === "repair" ? "修正版1（退行あり）" : "再修正版"}の成果物`,
      exact: true,
    }),
    t = topicFor(topic);
  await region
    .getByRole("button", { name: "回答を未選択に戻す", exact: true })
    .click();
  await region.getByRole("button", { name: "回答を確認", exact: true }).click();
  if (v !== "repair")
    await expect(region.getByRole("status")).toHaveText(
      "回答を選んでください。",
    );
  for (const answer of t.options) {
    await region.getByLabel(answer, { exact: true }).check();
    await region
      .getByRole("button", { name: "回答を確認", exact: true })
      .click();
  }
  await expect(region.getByRole("status")).toHaveText(
    v === "repair"
      ? "（結果未表示）"
      : `正解。S1では${t.answer}と確認できます。`,
  );
}
async function quality(p: Page, v: Version) {
  const verdict =
      v === "initial"
        ? [0, 1, 1, 1, 1, 1, 2, 0, 0, 1]
        : v === "repair"
          ? [0, 1, 0, 0, 0, 1, 1, 1, 0, 0]
          : Array(10).fill(0),
    improvement =
      v === "initial"
        ? [0, 2, 1, 1, 1, 2, 3, 0, 0, 2]
        : v === "repair"
          ? [0, 3, 0, 0, 0, 3, 4, 3, 0, 0]
          : Array(10).fill(0);
  for (let i = 0; i < 10; i++) {
    await select(p, `${i + 1} 判定`).selectOption(String(verdict[i]));
    await select(p, `${i + 1} 根拠`).selectOption(String(i % 3));
    await select(p, `${i + 1} 改善案`).selectOption(String(improvement[i]));
    await button(p, `${i + 1} 根拠を照合`).click();
  }
  await expect(
    p
      .locator(".cap-quality")
      .getByRole("status")
      .filter({ hasText: "固定資料との照合OK" }),
  ).toHaveCount(10);
}
for (const topic of ["history", "education", "business"] as const)
  test(`end-to-end ${topic}: plan, sources, production, broken repair, retest and reflection`, async ({
    page,
  }) => {
    await candidate(page, topic);
    await step(page, 5);
    await trial(page, "initial", topic);
    await quality(page, "initial");
    await confirm(page);
    await step(page, 6);
    await button(page, "修正指示を適用").click();
    await expect(
      page
        .locator(".capstone")
        .getByRole("status")
        .filter({ hasText: "曖昧な指示" }),
    ).toBeVisible();
    await select(page, "修正指示の具体性").selectOption("1");
    await expect(
      page.getByRole("textbox", { name: "指示文全文", exact: true }),
    ).toHaveValue(/維持条件/);
    await button(page, "修正指示を適用").click();
    await trial(page, "repair", topic);
    await quality(page, "repair");
    await button(page, "退行も直した再修正版を確認").click();
    await trial(page, "final", topic);
    await quality(page, "final");
    await confirm(page);
    await button(page, "この工程から再挑戦").click();
    expect((await saved(page)).trials).toEqual(["initial"]);
    expect((await saved(page)).achieved).toContain(5);
    await select(page, "修正指示の具体性").selectOption("1");
    await button(page, "修正指示を適用").click();
    await trial(page, "repair", topic);
    await quality(page, "repair");
    await button(page, "退行も直した再修正版を確認").click();
    await trial(page, "final", topic);
    await quality(page, "final");
    await confirm(page);
    await step(page, 7);
    for (const axis of [
      "課題設定の明確さ",
      "調査と根拠の正確性",
      "資料整理の適切さ",
      "成果物の完成度",
      "問題発見・修正能力",
      "自分で説明できる理解度",
    ]) {
      await select(page, `${axis}の自己評価`).selectOption("1");
      await select(page, `${axis}の評価理由`).selectOption("1");
    }
    await page
      .getByRole("textbox", {
        name: "次に試すこと・自分の言葉で振り返る（保存しません）",
      })
      .fill("保存しない振り返り");
    await confirm(page);
    await page.getByLabel("第10章の学習完了を自己申告する").check();
    expect(JSON.stringify(await saved(page))).not.toContain(
      "保存しない振り返り",
    );
    await page.reload();
    await expect(page.locator("#capstone-heading")).toContainText("STEP 7");
    await expect(
      page.getByLabel("第10章の学習完了を自己申告する"),
    ).toBeChecked();
    await expect(
      page.getByRole("textbox", {
        name: "次に試すこと・自分の言葉で振り返る（保存しません）",
      }),
    ).toHaveValue("");
  });
test("all transitions, hints, environment modes, optional external reports and keyboard focus", async ({
  page,
}) => {
  await page.goto("#chapter-10");
  await expect(button(page, "← 前の工程")).toBeDisabled();
  for (let i = 0; i < 4; i++) {
    await select(page, "教材とサービスの配置").selectOption(String(i));
    await expect(page.locator(".cap-main")).toContainText(
      ["標準分割", "左右に並べ", "別タブ", "外部アプリ"][i],
    );
  }
  await select(page, "演習方法").selectOption("1");
  await select(page, "STEP 0 実サービスの現在の自己申告").selectOption("2");
  expect((await saved(page)).achieved).toEqual([]);
  for (const link of await page
    .getByRole("navigation", { name: "総合演習の外部サービス" })
    .getByRole("link")
    .all()) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
  }
  for (let i = 0; i < 8; i++) {
    await step(page, i);
    await expect(page.locator("#capstone-heading")).toBeFocused();
    await button(page, "ヒントを1段階開く").click();
    await button(page, "ヒントを1段階開く").click();
    await expect(button(page, "ヒントを1段階開く")).toBeDisabled();
    if (i < 7) {
      await button(page, "次の工程 →").focus();
      await page.keyboard.press("Enter");
      await expect(page.locator("#capstone-heading")).toContainText(
        `STEP ${i + 1}`,
      );
      await expect(page.locator("#capstone-heading")).toBeFocused();
    }
  }
  await expect(button(page, "次の工程 →")).toBeDisabled();
  await button(page, "← 前の工程").click();
  await expect(page.locator("#capstone-heading")).toContainText("STEP 6");
});
test("theme, format and requirement edits invalidate current conclusions while preserving history", async ({
  page,
}) => {
  await candidate(page);
  const old = await saved(page);
  await step(page, 1);
  await select(page, "成果物の形式").selectOption("1");
  let r = await saved(page);
  expect(r.created).toBe(false);
  expect(r.achieved).toEqual([]);
  expect(r.history).toEqual(old.history);
  await page.getByLabel("原文と出典IDを示す", { exact: true }).uncheck();
  r = await saved(page);
  expect(r.requirements).toEqual([1, 2]);
  await page
    .getByRole("textbox", { name: "追加の目的・完成条件（この画面だけ）" })
    .fill("秘密を保存しない追加条件");
  await step(page, 4);
  await page.getByLabel("目的・読者・形式", { exact: true }).check();
  await expect(
    page.getByRole("textbox", { name: "指示文全文", exact: true }),
  ).toHaveValue(/秘密を保存しない追加条件/);
  expect(JSON.stringify(await saved(page))).not.toContain(
    "秘密を保存しない追加条件",
  );
  await step(page, 1);
  await select(page, "演習テーマ").selectOption("business");
  await expect(
    page.getByRole("textbox", { name: "追加の目的・完成条件（この画面だけ）" }),
  ).toHaveValue("");
  expect((await saved(page)).history).toEqual(old.history);
});
test("source removal and unsupported answers invalidate downstream results, comparison is preserved on judgment", async ({
  page,
}) => {
  await candidate(page);
  await step(page, 3);
  await page
    .getByLabel("S1 青葉町読書室 開室記録（架空）", { exact: true })
    .uncheck();
  await expect(
    page.getByText("現在の資料からの回答", { exact: true }).locator(".."),
  ).toContainText("資料不足で保留");
  expect((await saved(page)).created).toBe(false);
  await select(page, "Notebookの誤回答への判断").selectOption("0");
  await button(page, "この工程の固定課題を確認").click();
  expect((await saved(page)).achieved).not.toContain(3);
  await button(page, "変更前の回答を残す").click();
  await page
    .getByLabel("S1 青葉町読書室 開室記録（架空）", { exact: true })
    .check();
  await button(page, "資料変更の比較を記録").click();
  await select(page, "Notebookの誤回答への判断").selectOption("2");
  expect((await saved(page)).compared).toBe(true);
  await confirm(page);
});
test("unoperated outcome is pending; AI declarations and wrong evidence cannot pass", async ({
  page,
}) => {
  await candidate(page);
  await step(page, 5);
  await select(page, "8 判定").selectOption("0");
  await select(page, "8 根拠").selectOption("1");
  await select(page, "8 改善案").selectOption("0");
  await button(page, "8 根拠を照合").click();
  await expect(page.locator(".cap-quality").nth(7)).toContainText("再確認");
  await select(page, "8 判定").selectOption("2");
  await select(page, "8 改善案").selectOption("3");
  await button(page, "8 根拠を照合").click();
  await expect(page.locator(".cap-quality").nth(7)).toContainText(
    "固定資料との照合OK",
  );
  await button(page, "この工程の固定課題を確認").click();
  expect((await saved(page)).achieved).not.toContain(5);
});
async function deferred(p: Page) {
  await p.addInitScript(() => {
    (
      window as unknown as {
        pending: unknown[];
      }
    ).pending = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) =>
          new Promise<void>((resolve, reject) =>
            (
              window as unknown as {
                pending: unknown[];
              }
            ).pending.push({ text, resolve, reject }),
          ),
      },
    });
  });
}
async function settle(p: Page, n: number, fail = false) {
  await p.evaluate(
    ({ n, fail }) => {
      const d = (
        window as unknown as {
          pending: {
            resolve: () => void;
            reject: (e: Error) => void;
          }[];
        }
      ).pending[n];
      if (fail) d.reject(Error("denied"));
      else d.resolve();
    },
    { n, fail },
  );
}
test("copy exact full text, pending status, failure and recovery", async ({
  page,
}) => {
  await deferred(page);
  await page.goto("#chapter-10");
  await step(page, 4);
  await button(page, "指示文全文をコピー").click();
  await expect(button(page, "指示文全文をコピー")).toBeDisabled();
  expect(
    await page.evaluate(
      () =>
        (
          window as unknown as {
            pending: {
              text: string;
            }[];
          }
        ).pending[0].text,
    ),
  ).toBe(
    await page
      .getByRole("textbox", { name: "指示文全文", exact: true })
      .inputValue(),
  );
  await settle(page, 0);
  await expect(
    page.getByRole("region", { name: "組み立てた指示文" }),
  ).toContainText("全文をコピーしました");
  await button(page, "指示文全文をコピー").click();
  await expect(
    page.getByRole("region", { name: "組み立てた指示文" }),
  ).not.toContainText("全文をコピーしました");
  await settle(page, 1, true);
  await expect(
    page.getByRole("region", { name: "組み立てた指示文" }),
  ).toContainText("コピーできませんでした");
  await button(page, "指示文全文をコピー").click();
  await settle(page, 2);
  await expect(
    page.getByRole("region", { name: "組み立てた指示文" }),
  ).toContainText("全文をコピーしました");
  expect((await saved(page)).copied).toEqual(["history:4"]);
});
for (const edit of [
  "step",
  "theme",
  "condition",
  "prompt",
  "mode",
  "retry",
  "reset",
  "leave",
] as const)
  for (const fail of [false, true])
    test(`stale copy ${fail ? "failure" : "success"} after ${edit} does not change current notice or overwrite newer request`, async ({
      page,
    }) => {
      await deferred(page);
      await page.goto("#chapter-10");
      await step(page, 4);
      await button(page, "指示文全文をコピー").click();
      if (edit === "step") await step(page, 3);
      if (edit === "theme" || edit === "condition") {
        await step(page, 1);
        if (edit === "theme")
          await select(page, "演習テーマ").selectOption("education");
        else
          await page
            .getByLabel("不明点と対象範囲を明示", { exact: true })
            .uncheck();
        await step(page, 4);
      }
      if (edit === "prompt")
        await page.getByLabel("目的・読者・形式", { exact: true }).check();
      if (edit === "mode") await select(page, "演習方法").selectOption("1");
      if (edit === "retry") await button(page, "この工程から再挑戦").click();
      if (edit === "reset") {
        await button(page, "第10章の記録だけを初期化").click();
        await button(page, "第10章だけ削除する").click();
        await step(page, 4);
      }
      if (edit === "leave") {
        await page
          .getByRole("link", { name: "第1章を学ぶ", exact: true })
          .click();
        await page
          .getByRole("link", { name: "第10章を学ぶ", exact: true })
          .click();
      }
      await button(page, "指示文全文をコピー").click();
      await settle(page, 0, fail);
      await expect(button(page, "指示文全文をコピー")).toBeDisabled();
      await expect(
        page.getByRole("region", { name: "組み立てた指示文" }),
      ).not.toContainText("コピーできませんでした");
      await settle(page, 1);
      await expect(
        page.getByRole("region", { name: "組み立てた指示文" }),
      ).toContainText("全文をコピーしました");
    });
test("scoped reset cancel/confirm, reload and global progress reset protect other records", async ({
  page,
}) => {
  await page.goto("#chapter-10");
  await page.evaluate(
    ({ key }) => {
      localStorage.setItem("gemini-toranomaki:research:v1", "old-research");
      localStorage.setItem("gemini-toranomaki:skills:v1", "old-skills");
      localStorage.setItem(
        "gemini-toranomaki:progress:v1",
        JSON.stringify({ completed: ["chapter-1", "chapter-9", "chapter-10"] }),
      );
      localStorage.setItem(
        key,
        JSON.stringify({ topic: "business", step: 7, history: ["business:2"] }),
      );
    },
    { key: capstoneKey },
  );
  await page.reload();
  await button(page, "第10章の記録だけを初期化").click();
  await button(page, "初期化をキャンセル").click();
  await expect(button(page, "第10章の記録だけを初期化")).toBeFocused();
  expect((await saved(page)).topic).toBe("business");
  await button(page, "第10章の記録だけを初期化").click();
  await button(page, "第10章だけ削除する").click();
  await expect(button(page, "第10章の記録だけを初期化")).toBeFocused();
  expect(
    await page.evaluate(() =>
      localStorage.getItem("gemini-toranomaki:research:v1"),
    ),
  ).toBe("old-research");
  expect(
    await page.evaluate(() =>
      localStorage.getItem("gemini-toranomaki:skills:v1"),
    ),
  ).toBe("old-skills");
  await expect(page.getByText("2 / 10章", { exact: true })).toBeVisible();
  await step(page, 3);
  await button(page, "進捗を初期化").click();
  await button(page, "初期化する").click();
  expect((await saved(page)).step).toBe(3);
  await page.reload();
  await expect(page.locator("#capstone-heading")).toContainText("STEP 3");
  await expect(page.getByText("0 / 10章", { exact: true })).toBeVisible();
});
for (const failure of [
  "corrupt",
  "denied",
  "remove",
  "progress-write",
] as const)
  test(`storage ${failure} reports exact limits and allows continued learning`, async ({
    page,
  }) => {
    await page.goto("#chapter-10");
    await step(page, 1);
    await select(page, "演習テーマ").selectOption("business");
    if (failure === "corrupt") {
      await page.evaluate(
        (key) => localStorage.setItem(key, "{bad"),
        capstoneKey,
      );
      await page.reload();
      await expect(page.locator(".capstone").getByRole("alert")).toBeVisible();
    } else if (failure === "denied") {
      await page.evaluate(() => {
        Storage.prototype.setItem = () => {
          throw Error("denied");
        };
      });
      await step(page, 2);
      await expect(page.locator(".capstone").getByRole("alert")).toBeVisible();
    } else {
      await page.evaluate((which) => {
        if (which === "remove")
          Storage.prototype.removeItem = () => {
            throw Error("denied");
          };
        else {
          const set = Storage.prototype.setItem;
          Storage.prototype.setItem = function (k, v) {
            if (k === "gemini-toranomaki:progress:v1") throw Error("denied");
            set.call(this, k, v);
          };
        }
      }, failure);
      await button(page, "第10章の記録だけを初期化").click();
      await button(page, "第10章だけ削除する").click();
      await expect(page.locator(".capstone")).toContainText(
        "古い記録が復活する可能性",
      );
      await page.reload();
      if (failure === "remove")
        expect((await saved(page)).topic).toBe("business");
    }
    await step(page, 4);
    await button(page, "固定初版を制作して比較する").click();
    await expect(
      page.getByRole("region", { name: "初版の成果物", exact: true }),
    ).toBeVisible();
  });
for (const width of [320, 375, 390, 1280])
  for (const theme of ["light", "dark"] as const)
    test(`layout ${width} ${theme}: 200 percent text, reduced motion, all stages and keyboard`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: "reduce" });
      await page.addInitScript(
        ({ key, r }) => localStorage.setItem(key, JSON.stringify(r)),
        {
          key: capstoneKey,
          r: {
            ...freshCapstone(),
            created: true,
            applied: true,
            repairStyle: 1,
            version: "repair",
          },
        },
      );
      await page.goto("#chapter-10");
      await page.evaluate(() => {
        document.documentElement.style.fontSize = "200%";
      });
      for (let n = 0; n < 8; n++) {
        await step(page, n);
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        expect(
          await page.locator(".capstone").evaluate(
            (root) =>
              Array.from(
                root.querySelectorAll("button,select,textarea"),
              ).filter((el) => {
                const r = el.getBoundingClientRect();
                return r.width > 0 && (r.left < 0 || r.right > innerWidth + 1);
              }).length,
          ),
        ).toBe(0);
      }
      await step(page, 5);
      await expect(page.locator(".cap-comparison .cap-artifact")).toHaveCount(2);
      await select(page, "検査する版").focus();
      await page.keyboard.press("ArrowDown");
      await page.keyboard.press("Enter");
      await button(page, "検査する版を見る").focus();
      await page.keyboard.press("Enter");
      await expect(button(page, "検査する版を見る")).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      await select(page, "演習方法").selectOption("1");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    });

test("independent P2-1: unavailable explanations fail completeness and instruction checks, then recover", async ({
  page,
}) => {
  await candidate(page);
  await step(page, 6);
  await select(page, "修正指示の具体性").selectOption("1");
  await button(page, "修正指示を適用").click();
  await trial(page, "repair");
  for (const i of [2, 6]) {
    await select(page, `${i} 判定`).selectOption("0");
    await select(page, `${i} 根拠`).selectOption(String((i - 1) % 3));
    await select(page, `${i} 改善案`).selectOption("0");
    await button(page, `${i} 根拠を照合`).click();
    await expect(page.locator(".cap-quality").nth(i - 1)).toContainText(
      "再確認",
    );
    await select(page, `${i} 判定`).selectOption("1");
    await select(page, `${i} 改善案`).selectOption("3");
    await button(page, `${i} 根拠を照合`).click();
    await expect(page.locator(".cap-quality").nth(i - 1)).toContainText(
      "固定資料との照合OK",
    );
    await expect(page.locator(".cap-quality").nth(i - 1)).toContainText(
      i === 2 ? "解説を表示できない" : "反応しない確認ボタン",
    );
  }
  await button(page, "退行も直した再修正版を確認").click();
  await trial(page, "final");
  for (const i of [2, 6]) {
    await select(page, `${i} 判定`).selectOption("0");
    await select(page, `${i} 根拠`).selectOption(String((i - 1) % 3));
    await select(page, `${i} 改善案`).selectOption("0");
    await button(page, `${i} 根拠を照合`).click();
    await expect(page.locator(".cap-quality").nth(i - 1)).toContainText(
      "固定資料との照合OK",
    );
  }
});
for (const corrupt of ["invalid-context", "impossible-achievements"] as const)
  test(`independent P2-2 ${corrupt}: protect raw storage through operations until explicit scoped reset`, async ({
    page,
  }) => {
    const raw = JSON.stringify(
      corrupt === "invalid-context"
        ? { achieved: [2, 3, 4, 5, 6, 7], topic: "corrupt", created: "true" }
        : {
            ...freshCapstone(),
            achieved: [2, 3, 4, 5, 6, 7],
            history: ["education:2"],
            copied: ["history:4"],
          },
    );
    await page.addInitScript(
      ({ key, raw }) => {
        if (!sessionStorage.getItem("capstone-seeded")) {
          localStorage.setItem(key, raw);
          localStorage.setItem(
            "gemini-toranomaki:research:v1",
            "other-chapter-original",
          );
          sessionStorage.setItem("capstone-seeded", "1");
        }
        Object.defineProperty(navigator, "clipboard", {
          configurable: true,
          value: { writeText: async () => {} },
        });
      },
      { key: capstoneKey, raw },
    );
    await page.goto("#chapter-10");
    await expect(page.locator(".capstone").getByRole("alert")).toContainText(
      "元の保存データは保持",
    );
    await expect(
      page.getByText(/現在位置 STEP 0.*現在の模擬確認 0\/8/),
    ).toBeVisible();
    await step(page, 3);
    await button(page, "指示文全文をコピー").click();
    await expect(
      page.getByRole("region", { name: "組み立てた指示文" }),
    ).toContainText("全文をコピーしました");
    expect(
      await page.evaluate((key) => localStorage.getItem(key), capstoneKey),
    ).toBe(raw);
    await page.reload();
    await expect(page.locator(".capstone").getByRole("alert")).toContainText(
      "自動で上書きしません",
    );
    await button(page, "第10章の記録だけを初期化").click();
    await button(page, "初期化をキャンセル").click();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), capstoneKey),
    ).toBe(raw);
    await button(page, "第10章の記録だけを初期化").click();
    await button(page, "第10章だけ削除する").click();
    expect(
      await page.evaluate((key) => localStorage.getItem(key), capstoneKey),
    ).toBeNull();
    await step(page, 1);
    await select(page, "演習テーマ").selectOption("business");
    expect((await saved(page)).topic).toBe("business");
    expect(
      await page.evaluate(() =>
        localStorage.getItem("gemini-toranomaki:research:v1"),
      ),
    ).toBe("other-chapter-original");
    await page.reload();
    await expect(page.locator(".capstone").getByRole("alert")).toHaveCount(0);
  });
test("unreadable existing data is not overwritten even if writes would be permitted", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    const get = Storage.prototype.getItem,
      set = Storage.prototype.setItem;
    localStorage.setItem(key, "unreadable-original");
    (window as unknown as { capWrites: number }).capWrites = 0;
    Storage.prototype.getItem = function (k) {
      if (k === key) throw Error("read denied");
      return get.call(this, k);
    };
    Storage.prototype.setItem = function (k, v) {
      if (k === key) (window as unknown as { capWrites: number }).capWrites++;
      set.call(this, k, v);
    };
  }, capstoneKey);
  await page.goto("#chapter-10");
  await step(page, 2);
  expect(
    await page.evaluate(
      () => (window as unknown as { capWrites: number }).capWrites,
    ),
  ).toBe(0);
  await button(page, "第10章の記録だけを初期化").click();
  await button(page, "第10章だけ削除する").click();
  await step(page, 3);
  expect(
    await page.evaluate(
      () => (window as unknown as { capWrites: number }).capWrites,
    ),
  ).toBe(1);
});
