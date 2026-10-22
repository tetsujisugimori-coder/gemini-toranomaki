import { expect, test, type Page } from "@playwright/test";

const labKey = "gemini-toranomaki:lab:v1";
const tried = "Geminiで実際に試した（自己申告）";
const applied = "条件を変え、別の題材への応用に取り組んだ（自己申告）";
const correct = "一条件ずつ変え、結果の違いと正確さを確認する";
const complete = { copied: false, tried: true, applied: true, check: 1 };

declare global {
  interface Window {
    deferredClipboard: {
      pending: { resolve: () => void; reject: () => void }[];
      writes: number;
      blockStorage: boolean;
    };
  }
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const control = {
      pending: [],
      writes: 0,
      blockStorage: false,
    } as Window["deferredClipboard"];
    window.deferredClipboard = control;
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: () =>
          new Promise<void>((resolve, reject) => {
            control.pending.push({
              resolve,
              reject: () => reject(new Error("clipboard denied")),
            });
          }),
      },
    });
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, value) {
      if (key === "gemini-toranomaki:lab:v1") {
        control.writes++;
        if (control.blockStorage) throw new Error("storage denied");
      }
      return setItem.call(this, key, value);
    };
  });
});

async function startCopy(page: Page) {
  await page
    .getByRole("button", { name: "プロンプト全文をコピー", exact: true })
    .click();
  await expect
    .poll(() => page.evaluate(() => window.deferredClipboard.pending.length))
    .toBe(1);
}
async function settleCopy(page: Page, success = true) {
  // Resolving the controlled promise queues copy's continuation before evaluate returns.
  await page.evaluate(async (success) => {
    const pending = window.deferredClipboard.pending.shift()!;
    if (success) pending.resolve();
    else pending.reject();
    await Promise.resolve();
  }, success);
}
async function recordLearning(page: Page) {
  await page.getByLabel(tried, { exact: true }).check();
  await page.getByLabel(applied, { exact: true }).check();
  await page.getByLabel(correct, { exact: true }).check();
}
async function expectLearning(page: Page) {
  await expect(page.getByLabel(tried, { exact: true })).toBeChecked();
  await expect(page.getByLabel(applied, { exact: true })).toBeChecked();
  await expect(page.getByLabel(correct, { exact: true })).toBeChecked();
}
async function choose(page: Page, id: string) {
  await page.getByRole("link", { name: "Gemini体験ラボ", exact: true }).click();
  await page.locator(`a[href="#lab-${id}"]`).click();
}
async function saved(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "{}"),
    labKey,
  );
}

test("pending copy preserves same-experience learning, storage and reload", async ({
  page,
}) => {
  await page.goto("#lab-ask");
  await startCopy(page);
  await recordLearning(page);
  await expect.poll(() => saved(page)).toEqual({ ask: complete });
  await settleCopy(page);
  await expectLearning(page);
  await expect
    .poll(() => saved(page))
    .toEqual({ ask: { ...complete, copied: true } });
  await page.reload();
  await expectLearning(page);
  await page.getByRole("link", { name: "Gemini体験ラボ", exact: true }).click();
  await expect(
    page.locator(".card").filter({ hasText: "質問してみる" }),
  ).toContainText("操作：コピー成功");
});

test("pending copy merges into its original experience without losing another experience", async ({
  page,
}) => {
  await page.goto("#lab-ask");
  await startCopy(page);
  await choose(page, "rewrite");
  await recordLearning(page);
  await settleCopy(page);
  await expectLearning(page);
  const expected = {
    ask: { copied: true, tried: false, applied: false, check: null },
    rewrite: complete,
  };
  await expect.poll(() => saved(page)).toEqual(expected);
  await page.reload();
  await expectLearning(page);
  await page.getByRole("link", { name: "Gemini体験ラボ", exact: true }).click();
  await expect(
    page.locator(".card").filter({ hasText: "質問してみる" }),
  ).toContainText("操作：コピー成功");
  await expect(
    page.locator(".card").filter({ hasText: "文章を変身させる" }),
  ).toContainText("固定チェック：正解");
});

for (const remount of [false, true]) {
  test(`copy completion after leaving lab is ignored (remounted=${remount})`, async ({
    page,
  }) => {
    await page.goto("#lab-ask");
    await recordLearning(page);
    await startCopy(page);
    await page.getByRole("link", { name: "ホーム", exact: true }).click();
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Gemini活用",
    );
    if (remount) {
      await choose(page, "quiz");
      await recordLearning(page);
    }
    const before = await saved(page);
    const writes = await page.evaluate(() => window.deferredClipboard.writes);
    await settleCopy(page);
    expect(await page.evaluate(() => window.deferredClipboard.writes)).toBe(
      writes,
    );
    expect(await saved(page)).toEqual(before);
    if (!remount) await choose(page, "quiz");
    else await expectLearning(page);
    await choose(page, "ask");
    await expectLearning(page);
    expect((await saved(page)).ask.copied).toBe(false);
    await page.reload();
    await expectLearning(page);
    expect(await saved(page)).toEqual(before);
  });
}

test("deferred failure keeps records; retry and learning continue when storage is denied", async ({
  page,
}) => {
  await page.goto("#lab-ask");
  await startCopy(page);
  await recordLearning(page);
  await settleCopy(page, false);
  await expect(
    page.getByText("コピーできませんでした。", { exact: false }),
  ).toBeVisible();
  await expectLearning(page);
  expect(await saved(page)).toEqual({ ask: complete });
  await page.evaluate(() => {
    window.deferredClipboard.blockStorage = true;
  });
  await startCopy(page);
  await page.getByLabel(tried, { exact: true }).uncheck();
  await settleCopy(page);
  await expect(
    page.getByText(
      "プロンプト全文をコピーしました。Geminiでの実行はまだ記録していません。",
      { exact: true },
    ),
  ).toBeVisible();
  await expect(
    page.getByText("保存できません。この画面内で学習を続けられます。", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByLabel(tried, { exact: true })).not.toBeChecked();
  await expect(page.getByLabel(applied, { exact: true })).toBeChecked();
  await expect(page.getByLabel(correct, { exact: true })).toBeChecked();
  await page.getByLabel(tried, { exact: true }).check();
  await expectLearning(page);
  expect(await saved(page)).toEqual({ ask: complete });
  await page.getByRole("link", { name: "Gemini体験ラボ", exact: true }).click();
  await expect(
    page.locator(".card").filter({ hasText: "質問してみる" }),
  ).toContainText("操作：コピー成功");
});

test("loading and remounting do not write progress", async ({ page }) => {
  await page.goto("#lab-ask");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "質問してみる",
  );
  expect(await page.evaluate(() => window.deferredClipboard.writes)).toBe(0);
  await page.getByRole("link", { name: "ホーム", exact: true }).click();
  await choose(page, "quiz");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "自分用クイズを作る",
  );
  expect(await page.evaluate(() => window.deferredClipboard.writes)).toBe(0);
  expect(await saved(page)).toEqual({});
});
