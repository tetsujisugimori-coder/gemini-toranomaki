import { test, expect, type Page } from "@playwright/test";
import { practiceKey } from "../src/services-practice-storage";
import { practicePrompts } from "../src/services-practice-data";
const route = "#chapter-2";
const step = async (page: Page, n: number) => {
  await page
    .getByRole("combobox", { name: "工程を選ぶ", exact: true })
    .selectOption(String(n));
  await expect(page.locator("#practice-heading")).toContainText(
    `STEP ${n < 4 ? n : 4}`,
  );
};
const saved = (page: Page) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "{}"),
    practiceKey,
  );
async function clipboard(page: Page) {
  await page.addInitScript(() => {
    (
      window as unknown as {
        copies: { text: string; resolve: () => void; reject: () => void }[];
      }
    ).copies = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) =>
          new Promise<void>((resolve, reject) => {
            (window as unknown as { copies: unknown[] }).copies.push({
              text,
              resolve,
              reject: () => reject(Error("denied")),
            });
          }),
      },
    });
  });
}
async function settle(page: Page, index: number, fail = false) {
  await page.evaluate(
    async ({ index, fail }) => {
      const c = (
        window as unknown as {
          copies: { resolve: () => void; reject: () => void }[];
        }
      ).copies[index];
      if (fail) c.reject();
      else c.resolve();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    },
    { index, fail },
  );
}
test("default path, all environment choices, external links and staged task navigation", async ({
  page,
}) => {
  await page.goto(route);
  await expect(page.locator("#practice-heading")).toHaveText("STEP 0 学習環境");
  for (const [n, text] of [
    [0, "New split view"],
    [1, "Split screen"],
    [2, "別ウィンドウ"],
    [3, "Safari"],
    [4, "アプリ"],
  ] as const) {
    await page
      .getByRole("combobox", { name: "端末・ブラウザ", exact: true })
      .selectOption(String(n));
    await expect(
      page.locator(".services-practice .notice").last(),
    ).toContainText(text);
  }
  for (const [name, url] of [
    ["Gemini", "https://gemini.google.com/"],
    ["Gmail", "https://mail.google.com/"],
    ["Calendar", "https://calendar.google.com/"],
  ]) {
    const link = page
      .getByRole("navigation", { name: "実操作先" })
      .getByRole("link", { name: new RegExp(name) });
    await expect(link).toHaveAttribute("href", url);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
  }
  await page.getByRole("button", { name: "次の工程 →" }).click();
  await expect(page.locator("#practice-heading")).toBeFocused();
  await expect(page.getByLabel("実践・依頼文の全文")).toContainText(
    "Gemini学習用・打ち合わせ案内",
  );
  await step(page, 2);
  await expect(page.getByText(/Gemini手動練習・削除用/)).toBeVisible();
  await step(page, 3);
  await expect(page.getByText(/個人向け公式では/)).toBeVisible();
  await page.getByText("困ったとき・確認できないとき", { exact: true }).click();
  await expect(page.getByText(/利用不可は学習者の失敗/)).toBeVisible();
  await page.getByRole("button", { name: "← 前の工程" }).click();
  await expect(page.locator("#practice-heading")).toHaveText(
    "STEP 2 Calendarの準備",
  );
});
test("old records never become real completion; state survives return, retry/reset preserve every other key", async ({
  page,
}) => {
  await page.goto(route);
  await page.evaluate(() => {
    localStorage.setItem(
      "gemini-toranomaki:services:v1",
      '{"simulated":true,"tried":true,"calendarChecked":true,"copied":["real-registration"]}',
    );
    localStorage.setItem(
      "gemini-toranomaki:progress:v1",
      '{"completed":["chapter-1","chapter-2"]}',
    );
    localStorage.setItem("gemini-toranomaki:lab:v1", '{"ask":{"copied":true}}');
  });
  await page.reload();
  await expect(
    page.getByLabel("実操作を自分で実施した（自己申告）", { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel("実結果を自分で確認した（自己申告）", { exact: true }),
  ).not.toBeChecked();
  await step(page, 4);
  await page
    .getByLabel("実操作を自分で実施した（自己申告）", { exact: true })
    .check();
  await page
    .getByRole("combobox", { name: "未実施・保留の状態", exact: true })
    .selectOption("2");
  await page.getByRole("link", { name: "ホーム", exact: true }).click();
  await page.getByRole("link", { name: "第2章を学ぶ", exact: true }).click();
  await expect(page.locator("#practice-heading")).toHaveText(
    "STEP 4A メールを探す",
  );
  await expect(
    page.getByLabel("実操作を自分で実施した（自己申告）", { exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("combobox", { name: "未実施・保留の状態", exact: true }),
  ).toHaveValue("2");
  await page.getByRole("button", { name: "この工程を再挑戦" }).click();
  expect((await saved(page)).performed).toEqual([]);
  await page.getByRole("button", { name: "模擬で事前練習・代替学習" }).click();
  await expect(
    page.getByRole("heading", { name: "模擬Gmail受信箱" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "実践教材へ", exact: true }).click();
  await expect(page.locator("#practice-heading")).toHaveText(
    "STEP 4A メールを探す",
  );
  const before = await page.evaluate(() =>
    Object.fromEntries(
      Object.keys(localStorage)
        .filter((k) => !k.includes("services-practice"))
        .map((k) => [k, localStorage.getItem(k)]),
    ),
  );
  await page.getByText("実践記録だけを初期化", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "実践記録を初期化する" }),
  ).toBeDisabled();
  await page.getByLabel("実践記録の初期化を確認した").check();
  await page.getByRole("button", { name: "実践記録を初期化する" }).click();
  await expect(page.locator("#practice-heading")).toHaveText("STEP 0 学習環境");
  expect(
    await page.evaluate(() =>
      Object.fromEntries(
        Object.keys(localStorage)
          .filter((k) => !k.includes("services-practice"))
          .map((k) => [k, localStorage.getItem(k)]),
      ),
    ),
  ).toEqual(before);
});
test("explicit preflight approval is transient, copy has full text and failure permits manual retry", async ({
  page,
}) => {
  await clipboard(page);
  await page.goto(route);
  await step(page, 6);
  const check = page.getByLabel(
    "今回提示された1件の全項目・目的・対象カレンダーと原文・重複なしを照合した（保存しない自己申告）",
    { exact: true },
  );
  await expect(page.getByLabel("実践・最終実行指示の全文")).toHaveCount(0);
  await page.getByRole("button", { name: "全文をコピー", exact: true }).click();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { copies: { text: string }[] }).copies[0].text,
    ),
  ).toBe(practicePrompts[6]);
  await settle(page, 0, true);
  await expect(page.locator(".services-practice .feedback")).toContainText(
    "手動でコピー",
  );
  expect((await saved(page)).copied).toEqual([]);
  await check.check();
  await page.getByRole("button", { name: "全文をコピー（最終実行）" }).click();
  await settle(page, 1);
  expect((await saved(page)).copied).toEqual(["execution"]);
  await expect(
    page.getByLabel("実操作を自分で実施した（自己申告）", { exact: true }),
  ).not.toBeChecked();
  await page.reload();
  await expect(check).not.toBeChecked();
  await expect(page.getByLabel("実践・最終実行指示の全文")).toHaveCount(0);
  await expect(
    page.locator(
      ".services-practice textarea, .services-practice input[type=text]",
    ),
  ).toHaveCount(0);
});
for (const action of [
  "step",
  "environment",
  "mode",
  "check",
  "status",
  "retry",
  "reset",
  "leave",
] as const)
  for (const failure of [false, true])
    test(`stale copy ${action} ${failure ? "failure" : "success"} does not overwrite record or newer copy`, async ({
      page,
    }) => {
      await clipboard(page);
      await page.goto(route);
      await step(page, 4);
      await page
        .getByRole("button", { name: "全文をコピー", exact: true })
        .click();
      if (action === "step") await step(page, 5);
      if (action === "environment") {
        await step(page, 0);
        await page
          .getByRole("combobox", { name: "端末・ブラウザ", exact: true })
          .selectOption("3");
        await step(page, 4);
      }
      if (action === "mode") {
        await page
          .getByRole("button", { name: "模擬で事前練習・代替学習" })
          .click();
        await page
          .getByRole("button", { name: "実践教材へ", exact: true })
          .click();
      }
      if (action === "check")
        await page
          .getByLabel("実結果を自分で確認した（自己申告）", { exact: true })
          .check();
      if (action === "status")
        await page
          .getByRole("combobox", { name: "未実施・保留の状態", exact: true })
          .selectOption("1");
      if (action === "retry")
        await page.getByRole("button", { name: "この工程を再挑戦" }).click();
      if (action === "reset") {
        await page.getByText("実践記録だけを初期化", { exact: true }).click();
        await page.getByLabel("実践記録の初期化を確認した").check();
        await page
          .getByRole("button", { name: "実践記録を初期化する" })
          .click();
        await step(page, 4);
      }
      if (action === "leave") {
        await page.getByRole("link", { name: "ホーム", exact: true }).click();
        await page
          .getByRole("link", { name: "第2章を学ぶ", exact: true })
          .click();
      }
      const nextCopy = page.getByRole("button", {
        name: "全文をコピー",
        exact: true,
      });
      await nextCopy.click();
      const before = await saved(page);
      await settle(page, 0, failure);
      expect(await saved(page)).toEqual(before);
      await expect(nextCopy).toBeDisabled();
      await expect(page.locator(".services-practice .feedback")).toHaveText("");
      await settle(page, 1);
      await expect(nextCopy).toBeEnabled();
      expect((await saved(page)).copied).toEqual([
        action === "step" ? "step-5" : "step-4",
      ]);
    });
test("approval revoked during pending final copy cannot record success or restore approval", async ({
  page,
}) => {
  await clipboard(page);
  await page.goto(route);
  await step(page, 6);
  const check = page.getByLabel(
    "今回提示された1件の全項目・目的・対象カレンダーと原文・重複なしを照合した（保存しない自己申告）",
    { exact: true },
  );
  await check.check();
  await page.getByRole("button", { name: "全文をコピー（最終実行）" }).click();
  await check.uncheck();
  await settle(page, 0);
  expect((await saved(page)).copied).toEqual([]);
  await expect(page.getByLabel("実践・最終実行指示の全文")).toHaveCount(0);
});
for (const broken of [false, true])
  test(`storage ${broken ? "corrupt" : "denied"} retains in-memory learning and does not destroy other chapters`, async ({
    page,
  }) => {
    await page.goto(route);
    if (broken)
      await page.evaluate(
        (key) => localStorage.setItem(key, "{broken"),
        practiceKey,
      );
    else
      await page.addInitScript(() => {
        Storage.prototype.getItem = () => {
          throw Error("private");
        };
      });
    await page.reload();
    await expect(
      page.getByText(/第2章の実践記録を保存できません/),
    ).toBeVisible();
    await page.evaluate(() => {
      Storage.prototype.setItem = () => {
        throw Error("quota");
      };
    });
    await step(page, 7);
    await page
      .getByLabel("実結果を自分で確認した（自己申告）", { exact: true })
      .check();
    await expect(
      page.getByLabel("実結果を自分で確認した（自己申告）", { exact: true }),
    ).toBeChecked();
    await expect(page.getByText(/以前の記録が復活/)).toBeVisible();
  });
for (const width of [320, 375, 390, 640, 1280])
  test(`one-task layout ${width}px light/dark at 200% text without overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(route);
    await expect(page.locator("h1")).toBeFocused();
    for (const theme of ["light", "dark"]) {
      await page.evaluate(
        (t) => (document.documentElement.dataset.theme = t),
        theme,
      );
      await page.addStyleTag({ content: "html {font-size:200%}" });
      for (let i = 0; i < 9; i++) {
        await step(page, i);
        if (i === 6)
          await page
            .getByLabel(
              "今回提示された1件の全項目・目的・対象カレンダーと原文・重複なしを照合した（保存しない自己申告）",
              { exact: true },
            )
            .check();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await expect(
          page.getByRole("navigation", { name: "実操作先" }),
        ).toBeVisible();
      }
    }
  });
