import { test, expect } from "@playwright/test";
test("navigation, lesson, copy, quiz, progress and reset", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copied: string }).copied = text;
        },
      },
    });
  });
  await page.goto("");
  await page.getByRole("link", { name: "全10章・機能一覧" }).click();
  await expect(page.locator(".chapter-row")).toHaveCount(10);
  await page.locator(".chapter-row").nth(7).click();
  await expect(
    page.getByRole("heading", { name: "準備中", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "第1章を学ぶ", exact: true }).click();
  await page.getByText("1. 別画面でGeminiを開く", { exact: true }).click();
  await expect(page.getByText(/この教材を残したまま/)).toBeVisible();
  await page.getByText("プロンプト全文を表示", { exact: true }).click();
  await expect(page.locator("pre")).toContainText("Geminiを初めて使います");
  await page.getByRole("button", { name: "プロンプト全文をコピー" }).click();
  await expect(page.getByRole("status").last()).toContainText("コピーしました");
  expect(
    await page.evaluate(() => (window as unknown as { copied: string }).copied),
  ).toContain("断定しないでください");
  await page.getByLabel("Geminiの回答だけで利用可能だと判断する").check();
  await expect(page.getByText(/もう一度考えて/)).toBeVisible();
  await page
    .getByLabel(
      "自分の画面と公式情報を確認し、プラン・端末などの違いを考慮する",
    )
    .check();
  await expect(page.getByText(/正解です/)).toBeVisible();
  await page.getByRole("checkbox").check();
  await page.reload();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await expect(page.getByText("1 / 10章", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "進捗を初期化", exact: true }).click();
  await page.getByRole("button", { name: "キャンセル" }).click();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByRole("button", { name: "進捗を初期化", exact: true }).click();
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
});
test("blocked storage and clipboard provide feedback", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, "localStorage", {
      get() {
        throw Error("blocked");
      },
    });
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          throw Error("denied");
        },
      },
    });
  });
  await page.goto("#chapter-1");
  await page.getByRole("checkbox").check();
  await expect(page.getByText(/ブラウザに保存できません/)).toBeVisible();
  await page.getByRole("button", { name: "プロンプト全文をコピー" }).click();
  await expect(page.getByRole("status").last()).toContainText(
    "コピーできませんでした",
  );
});
for (const width of [375, 390, 1280])
  test(`layout and keyboard at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("");
    await expect(page.locator(".brand")).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(page.getByRole("link", { name: "本文へ移動" })).toBeFocused();
    for (const theme of ["light", "dark"]) {
      await page.emulateMedia({ colorScheme: theme as "light" | "dark" });
      await page.reload();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.screenshot({
        path: `test-results/${test.info().project.name}-${width}-${theme}.png`,
        fullPage: true,
      });
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.goto("#chapter-1");
      await page.getByText("プロンプト全文を表示", { exact: true }).click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.goto("");
    }
  });

for (const route of ["home", "chapter-1"]) {
  test(`skip link preserves ${route} URL, reload and back history`, async ({
    page,
  }) => {
    await page.goto("#curriculum");
    await page
      .getByRole("link", {
        name: route === "home" ? "ホーム" : "第1章を学ぶ",
        exact: true,
      })
      .click();
    const title = page.locator("h1");
    const heading =
      route === "home" ? "Gemini活用虎の巻" : "Geminiの画面とモデル選択";
    // Hash changes before React commits the destination view. Wait for the
    // intended page rather than capturing the previous page's heading.
    await expect(title).toHaveText(heading);
    const url = page.url();
    const skip = page.getByRole("link", { name: "本文へ移動" });
    // Shift+Tab from the brand reaches the skip link on both engines.
    await page.locator(".brand").focus();
    await page.keyboard.press("Shift+Tab");
    await expect(skip).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(page.locator("main")).toBeFocused();
    expect(page.url()).toBe(url);
    await expect(title).toHaveText(heading);
    await page.reload();
    await expect(title).toHaveText(heading);
    expect(page.url()).toBe(url);
    await page.goBack();
    await expect(page).toHaveURL(/#curriculum$/);
    await expect(title).toHaveText("全10章・機能一覧");
  });
}

test("legacy #main URLs recover to home without a missing-page route", async ({
  page,
}) => {
  await page.goto("#main");
  await expect(page).toHaveURL(/#home$/);
  await expect(page.locator("h1")).toContainText("Gemini活用");
  await page.reload();
  await expect(page.locator("h1")).toContainText("Gemini活用");
  await page.getByRole("link", { name: "第1章を学ぶ", exact: true }).click();
  await page.evaluate(() => {
    location.hash = "main";
  });
  await expect(page).toHaveURL(/#home$/);
  await expect(page.locator("h1")).toContainText("Gemini活用");
  await page.goBack();
  await expect(page).toHaveURL(/#chapter-1$/);
  await expect(page.locator("h1")).toHaveText("Geminiの画面とモデル選択");
});

test("failed deletion warns of restored data after reload and permits temporary progress", async ({
  page,
}) => {
  await page.addInitScript(() => {
    // Keep real, readable persistent storage; only deletion fails.
    Storage.prototype.removeItem = () => {
      throw Error("deletion denied");
    };
  });
  await page.goto("#chapter-1");
  await page.getByRole("checkbox").check();
  await page.reload();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByRole("button", { name: "進捗を初期化", exact: true }).click();
  await page.getByRole("button", { name: "キャンセル" }).click();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await page.getByRole("button", { name: "進捗を初期化", exact: true }).click();
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await expect(page.locator(".feedback")).toContainText("保存領域の削除に失敗");
  await expect(page.locator(".feedback")).toContainText(
    "再読み込みすると古い進捗が復活する可能性",
  );
  await expect(page.locator(".feedback")).not.toHaveText(
    "進捗を初期化しました。",
  );
  await page.reload();
  await expect(page.getByRole("checkbox")).toBeChecked();
  // In-memory reset remains useful even when all writes subsequently fail.
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw Error("write denied");
    };
  });
  await page.getByRole("button", { name: "進捗を初期化", exact: true }).click();
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  await page.getByRole("checkbox").check();
  await expect(page.getByRole("checkbox")).toBeChecked();
  await expect(page.locator(".feedback")).toContainText(
    "この画面内で進捗を更新しました",
  );
});
