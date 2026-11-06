# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: capstone.spec.ts >> layout 390 light: 200 percent text, reduced motion, all stages and keyboard
- Location: tests/capstone.spec.ts:549:5

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator: locator('#capstone-heading')
Expected pattern: /^STEP 1 /
Error: Test ended.

Call log:
  - Expect "toHaveText" locator('#capstone-heading') with timeout 5000ms
  - waiting for locator('#capstone-heading')
  - Test ended.

```

# Test source

```ts
  1   | import { test, expect, type Page } from "@playwright/test";
  2   | import { capstoneKey, freshCapstone } from "../src/capstone-storage";
  3   | import { topicFor, type Topic, type Version } from "../src/capstone-data";
  4   | const select = (p: Page, label: string) =>
  5   |   p.getByRole("combobox", { name: label, exact: true });
  6   | const button = (p: Page, name: string) =>
  7   |   p.getByRole("button", { name, exact: true });
  8   | const saved = (p: Page) =>
  9   |   p.evaluate(
  10  |     (key) => JSON.parse(localStorage.getItem(key) || "{}"),
  11  |     capstoneKey,
  12  |   );
  13  | async function step(p: Page, n: number) {
  14  |   await select(p, "総合演習の工程").selectOption(String(n));
> 15  |   await expect(p.locator("#capstone-heading")).toHaveText(
      |                                                ^ Error: expect(locator).toHaveText(expected) failed
  16  |     new RegExp(`^STEP ${n} `),
  17  |   );
  18  | }
  19  | async function confirm(p: Page) {
  20  |   await button(p, "この工程の固定課題を確認").click();
  21  |   await expect(
  22  |     p
  23  |       .locator(".capstone")
  24  |       .getByRole("status")
  25  |       .filter({ hasText: "この工程の固定課題を確認できました" }),
  26  |   ).toBeVisible();
  27  | }
  28  | async function candidate(p: Page, topic: Topic = "history") {
  29  |   await p.goto("#chapter-10");
  30  |   await step(p, 1);
  31  |   await select(p, "演習テーマ").selectOption(topic);
  32  |   await confirm(p);
  33  |   await step(p, 2);
  34  |   await select(p, "計画を見る前の予想").selectOption("1");
  35  |   for (const name of [
  36  |     "目的と対象読者",
  37  |     "対象時期・調査範囲",
  38  |     "一次資料と原文の確認",
  39  |     "不明点・反証の確認",
  40  |   ])
  41  |     await p.getByLabel(name, { exact: true }).check();
  42  |   await button(p, "模擬調査を実行").click();
  43  |   for (const [i, n] of [1, 2, 0].entries())
  44  |     await select(p, `主張${i + 1}と原文の関係`).selectOption(String(n));
  45  |   await confirm(p);
  46  |   await step(p, 3);
  47  |   await p.getByLabel("S3 出所不明のメモ", { exact: true }).check();
  48  |   await button(p, "変更前の回答を残す").click();
  49  |   await p.getByLabel("S3 出所不明のメモ", { exact: true }).uncheck();
  50  |   await button(p, "資料変更の比較を記録").click();
  51  |   await select(p, "Notebookの誤回答への判断").selectOption("2");
  52  |   await confirm(p);
  53  |   await step(p, 4);
  54  |   for (const name of [
  55  |     "目的・読者・形式",
  56  |     "選択資料と引用・原文照合",
  57  |     "完成条件と未確認事項",
  58  |     "変更箇所・維持条件・動作確認",
  59  |   ])
  60  |     await p.getByLabel(name, { exact: true }).check();
  61  |   await expect(
  62  |     p.getByRole("textbox", { name: "指示文全文", exact: true }),
  63  |   ).toHaveValue(new RegExp(topicFor(topic).purpose));
  64  |   await button(p, "固定初版を制作して比較する").click();
  65  |   await confirm(p);
  66  | }
  67  | async function trial(p: Page, v: Version, topic: Topic = "history") {
  68  |   const region = p.getByRole("region", {
  69  |       name: `${v === "initial" ? "初版" : v === "repair" ? "修正版1（退行あり）" : "再修正版"}の成果物`,
  70  |       exact: true,
  71  |     }),
  72  |     t = topicFor(topic);
  73  |   await region
  74  |     .getByRole("button", { name: "回答を未選択に戻す", exact: true })
  75  |     .click();
  76  |   await region.getByRole("button", { name: "回答を確認", exact: true }).click();
  77  |   if (v !== "repair")
  78  |     await expect(region.getByRole("status")).toHaveText(
  79  |       "回答を選んでください。",
  80  |     );
  81  |   for (const answer of t.options) {
  82  |     await region.getByLabel(answer, { exact: true }).check();
  83  |     await region
  84  |       .getByRole("button", { name: "回答を確認", exact: true })
  85  |       .click();
  86  |   }
  87  |   await expect(region.getByRole("status")).toHaveText(
  88  |     v === "repair"
  89  |       ? "（結果未表示）"
  90  |       : `正解。S1では${t.answer}と確認できます。`,
  91  |   );
  92  | }
  93  | async function quality(p: Page, v: Version) {
  94  |   const verdict =
  95  |       v === "initial"
  96  |         ? [0, 1, 1, 1, 1, 1, 2, 0, 0, 1]
  97  |         : v === "repair"
  98  |           ? [0, 1, 0, 0, 0, 1, 1, 1, 0, 0]
  99  |           : Array(10).fill(0),
  100 |     improvement =
  101 |       v === "initial"
  102 |         ? [0, 2, 1, 1, 1, 2, 3, 0, 0, 2]
  103 |         : v === "repair"
  104 |           ? [0, 3, 0, 0, 0, 3, 4, 3, 0, 0]
  105 |           : Array(10).fill(0);
  106 |   for (let i = 0; i < 10; i++) {
  107 |     await select(p, `${i + 1} 判定`).selectOption(String(verdict[i]));
  108 |     await select(p, `${i + 1} 根拠`).selectOption(String(i % 3));
  109 |     await select(p, `${i + 1} 改善案`).selectOption(String(improvement[i]));
  110 |     await button(p, `${i + 1} 根拠を照合`).click();
  111 |   }
  112 |   await expect(
  113 |     p
  114 |       .locator(".cap-quality")
  115 |       .getByRole("status")
```