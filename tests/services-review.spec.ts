import { test, expect, type Page } from "@playwright/test";
import { reviewItems } from "../src/services-data";
import { servicesKey } from "../src/services-storage";

// Existing suite verifies the preserved mock/legacy path; new practice has its own suite.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('gemini-toranomaki:services-practice:v1'))
      localStorage.setItem('gemini-toranomaki:services-practice:v1', JSON.stringify({mode:'mock'}));
  });
});

const step = (page: Page, n: number) =>
  page.getByRole("button", { name: new RegExp(`^${n}\\. `) }).click();
async function approveMock(page: Page) {
  await step(page, 4);
  await page.getByLabel("比較するケース").selectOption("correct");
  for (const item of reviewItems)
    await page.getByLabel(item, { exact: true }).check();
  await page.getByRole("button", { name: "確認済みの模擬内容で次へ" }).click();
  await step(page, 3);
}
interface PendingCopy {
  text: string;
  resolve: () => void;
  reject: (reason: Error) => void;
  promise: Promise<void>;
}
type CopyWindow = Window & { reviewCopies: PendingCopy[] };
async function deferredClipboard(page: Page) {
  await page.addInitScript(() => {
    const calls: PendingCopy[] = [];
    (window as CopyWindow).reviewCopies = calls;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => {
          const call = { text } as PendingCopy;
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
async function settle(
  page: Page,
  index: number,
  outcome: "success" | "failure",
) {
  await page.evaluate(
    async ({ index, outcome }) => {
      const call = (window as CopyWindow).reviewCopies[index];
      if (outcome === "success") call.resolve();
      else call.reject(Error("clipboard denied"));
      await call.promise.catch(() => {});
      // Wait for React to render the awaited clipboard result before asserting absence.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    },
    { index, outcome },
  );
}
const saved = (page: Page) =>
  page.evaluate((key) => localStorage.getItem(key), servicesKey);

for (const action of ["hold", "case", "check", "mode", "leave"] as const)
  for (const outcome of ["success", "failure"] as const)
    test(`${action} ignores stale registration copy ${outcome} and supports rechecking`, async ({
      page,
    }) => {
      await deferredClipboard(page);
      await page.goto("#chapter-2");
      await approveMock(page);
      await page
        .getByRole("button", { name: "登録依頼を全文コピー", exact: true })
        .click();
      expect(
        await page.evaluate(() => (window as CopyWindow).reviewCopies[0].text),
      ).toContain("実登録禁止");
      if (action === "mode") {
        await page
          .getByLabel("任意の実アカウント演習（自分の非機密メール）", {
            exact: true,
          })
          .check();
      } else if (action === "leave") {
        await page.getByRole("link", { name: "ホーム", exact: true }).click();
        await page
          .getByRole("link", { name: "第2章を学ぶ", exact: true })
          .click();
      } else {
        await step(page, 4);
        if (action === "hold")
          await page
            .getByRole("button", { name: "登録せず確認する", exact: true })
            .click();
        if (action === "case")
          await page.getByLabel("比較するケース").selectOption("duplicate");
        if (action === "check")
          await page.getByLabel(reviewItems[0], { exact: true }).uncheck();
      }
      const before = await saved(page);
      await settle(page, 0, outcome);
      expect(await saved(page)).toBe(before);
      await expect(page.locator(".services .feedback")).toHaveText("");
      if (action === "hold")
        await expect(page.getByText(/^保留しました/)).toBeVisible();
      if (action === "case")
        await expect(page.getByLabel("比較するケース")).toHaveValue(
          "duplicate",
        );
      if (action === "check")
        await expect(
          page.getByLabel(reviewItems[0], { exact: true }),
        ).not.toBeChecked();
      await step(page, 3);
      await page
        .getByLabel("模擬演習（架空メールを指示文に含める）", { exact: true })
        .check();
      await approveMock(page);
      const copy = page.getByRole("button", {
        name: "登録依頼を全文コピー",
        exact: true,
      });
      await expect(copy).toBeEnabled();
      await copy.click();
      await expect(copy).toBeDisabled();
      await settle(page, 1, "success");
      await expect(copy).toBeEnabled();
      await expect(page.locator(".services .feedback")).toContainText(
        "全文コピーしました",
      );
      expect(JSON.parse((await saved(page))!).copied).toEqual([
        "mock-registration",
      ]);
    });

const finalReviewLabel =
  "Geminiが提示した1件の全項目と、原文で確認した情報が一致した（自己申告）";
async function realPreflight(page: Page) {
  await step(page, 3);
  await page
    .getByLabel("任意の実アカウント演習（自分の非機密メール）", { exact: true })
    .check();
  for (const item of reviewItems)
    await page.getByLabel(item, { exact: true }).check();
}

test("real flow separates preflight from explicit final approval, preserves legacy history, and never asks for private inputs", async ({
  page,
}) => {
  await deferredClipboard(page);
  await page.goto("#chapter-2");
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        '{"copied":["real-registration"],"tried":true}',
      ),
    servicesKey,
  );
  await page.reload();
  await realPreflight(page);
  await expect(page.getByText(/任意・旧登録依頼（履歴）/)).toBeVisible();
  await expect(page.getByLabel("最終実行指示の全文")).toHaveCount(0);
  const preflight = page.getByLabel("登録前確認の全文");
  await expect(preflight).toContainText("全項目を提示して返答を止め");
  await expect(preflight).toContainText("複数候補、対象不明、情報不足");
  await expect(preflight).toContainText(
    "このメッセージでは予定の作成・変更・削除を一切実行しない",
  );
  await page.getByRole("button", { name: "登録前確認を全文コピー" }).click();
  expect(
    await page.evaluate(() => (window as CopyWindow).reviewCopies[0].text),
  ).toBe(await preflight.innerText());
  await settle(page, 0, "success");
  expect(JSON.parse((await saved(page))!).copied).toEqual([
    "real-registration",
    "real-preflight",
  ]);
  await expect(page.getByLabel("最終実行指示の全文")).toHaveCount(0);
  await page.getByLabel(finalReviewLabel, { exact: true }).check();
  const final = page.getByLabel("最終実行指示の全文");
  await expect(final).toContainText(
    "全項目が提示済みの対象1件と完全に一致する場合に限り",
  );
  await expect(final).toContainText(
    "テンプレートのままでは最終承認は成立しません",
  );
  await expect(
    page.locator(".services textarea, .services input[type=text]"),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "最終実行指示を全文コピー" }).click();
  expect(
    await page.evaluate(() => (window as CopyWindow).reviewCopies[1].text),
  ).toBe(await final.innerText());
  await settle(page, 1, "success");
  expect(JSON.parse((await saved(page))!).copied).toEqual([
    "real-registration",
    "real-preflight",
    "real-execution",
  ]);
  await expect(
    page.getByLabel("第2章の学習を完了した（自己申告・実登録は不要）"),
  ).not.toBeChecked();
  await expect(
    page.getByLabel(
      "任意：実際のGoogleカレンダーを開き、予定の実在と内容を確認した（自己申告）",
    ),
  ).not.toBeChecked();
  await page.getByLabel(reviewItems[0], { exact: true }).uncheck();
  await expect(final).toHaveCount(0);
  await page.getByLabel(reviewItems[0], { exact: true }).check();
  await expect(
    page.getByLabel(finalReviewLabel, { exact: true }),
  ).not.toBeChecked();
  await page.getByLabel(finalReviewLabel, { exact: true }).check();
  await page
    .getByRole("combobox", { name: "検索対象", exact: true })
    .selectOption("sender");
  await expect(final).toHaveCount(0);
  await page.reload();
  await realPreflight(page);
  await expect(
    page.getByLabel(finalReviewLabel, { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel("任意：実際のGeminiで検索を試した（自己申告）"),
  ).toBeChecked();
});

for (const outcome of ["success", "failure"] as const)
  test(`final-review change ignores old ${outcome}, protects a newer copy and permits retry after a current failure`, async ({
    page,
  }) => {
    await deferredClipboard(page);
    await page.goto("#chapter-2");
    await realPreflight(page);
    await page.getByLabel(finalReviewLabel, { exact: true }).check();
    await page
      .getByRole("button", { name: "最終実行指示を全文コピー" })
      .click();
    await page.getByLabel(finalReviewLabel, { exact: true }).uncheck();
    const copy = page.getByRole("button", { name: "検索指示を全文コピー" });
    await copy.click();
    const before = await saved(page);
    await settle(page, 0, outcome);
    expect(await saved(page)).toBe(before);
    await expect(page.locator(".services .feedback")).toHaveText("");
    await expect(page.getByLabel("最終実行指示の全文")).toHaveCount(0);
    await expect(copy).toBeDisabled();
    await settle(page, 1, "failure");
    await expect(copy).toBeEnabled();
    await expect(page.locator(".services .feedback")).toContainText(
      "手動でコピー",
    );
    expect(JSON.parse((await saved(page))!).copied).toEqual([]);
    await copy.click();
    await settle(page, 2, "success");
    await expect(copy).toBeEnabled();
    expect(JSON.parse((await saved(page))!).copied).toEqual(["real-search"]);
  });

for (const width of [320, 375, 390])
  test(`optional Gemini link and final confirmation fit ${width}px with keyboard and both themes`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("#chapter-2");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await step(page, 3);
    await expect(
      page.getByRole("link", {
        name: "Geminiを開く ↗（別タブ）",
        exact: true,
      }),
    ).toHaveCount(0);
    await realPreflight(page);
    const link = page.getByRole("link", {
      name: "Geminiを開く ↗（別タブ）",
      exact: true,
    });
    await expect(link).toHaveAttribute("href", "https://gemini.google.com/");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
    await expect(
      page.getByText(/ログイン・実連携の成功を教材は保証しません/),
    ).toBeVisible();
    await page.getByLabel(finalReviewLabel, { exact: true }).check();
    for (const theme of ["light", "dark"]) {
      if (theme === "dark")
        await page
          .getByRole("button", { name: "ダークテーマに切り替え" })
          .click();
      await link.focus();
      await expect(link).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("combobox", { name: "検索対象", exact: true }),
      ).toBeFocused();
      await page.getByLabel("最終実行指示の全文").focus();
      await page.keyboard.press("Tab");
      await expect(
        page.getByRole("button", { name: "最終実行指示を全文コピー" }),
      ).toBeFocused();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    }
  });
