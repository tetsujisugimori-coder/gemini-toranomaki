import { test, expect } from "@playwright/test";
import { features, goals } from "../src/exploration-data";
const key = "gemini-toranomaki:exploration:v1";
test("all mock entrances reveal details, keyboard works, records restore without completing chapter", async ({
  page,
}) => {
  await page.goto("#chapter-1");
  const mock = page.getByRole("group", { name: "Geminiの模擬画面" });
  await expect(
    page.getByText("＋の付いたボタンを1つ選ぶと", { exact: false }),
  ).toBeVisible();
  for (const f of features) {
    const button = mock.getByRole("button", { name: f.name, exact: false });
    await button.focus();
    await page.keyboard.press("Enter");
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#feature-detail h3")).toHaveText(f.name);
    await expect(page.locator("#feature-detail h3")).toBeFocused();
    await expect(page.locator("#feature-detail")).toContainText(f.task);
  }
  await page
    .getByRole("button", { name: "実画面で課題を確認したと記録" })
    .click();
  await page.reload();
  await expect(
    page.getByText("探索済み 12 / 12 · 実画面の課題確認 1 件"),
  ).toBeVisible();
  await expect(page.getByRole("checkbox")).not.toBeChecked();
  await mock.getByRole("button", { name: "その他のツール" }).click();
  await expect(
    page.getByRole("button", { name: "課題の確認済みを取り消す" }),
  ).toHaveAttribute("aria-pressed", "true");
});
test("purpose and reverse map show reasons, alternatives and real chapter overview links", async ({
  page,
}) => {
  await page.goto("#chapter-1");
  for (const g of goals) {
    await page.getByLabel("やりたいこと").selectOption(g.id);
    await expect(page.locator(".map-recommendation")).toHaveCount(
      g.recommendations.length,
    );
    for (const r of g.recommendations) {
      await expect(page.locator(".map-results")).toContainText(r.name);
      await expect(page.locator(".map-results")).toContainText(r.reason);
      await expect(page.locator(".map-results")).toContainText(r.first);
    }
  }
  await page.getByLabel("やりたいこと").selectOption("app");
  await page.locator(".map-results a").click();
  await expect(page).toHaveURL(/#chapter-6$/);
  await expect(
    page.getByRole("heading", { name: "Canvas", exact: true }),
  ).toBeVisible();
  await page.goto("#chapter-9");
  await expect(
    page.getByRole("heading", { name: "準備中", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "第1章を学ぶ", exact: true }).click();
  await page.getByRole("button", { name: "機能から探す", exact: true }).click();
  await page.getByLabel("入口の機能").selectOption("attach");
  await expect(page.locator(".map-results")).toContainText("PDFを要約したい");
  await expect(page.locator(".map-results")).toContainText(
    "写真について質問したい",
  );
  await page.getByLabel("入口の機能").selectOption("history");
  await expect(
    page.getByText(/このマップの8つの目的には直接対応/),
  ).toBeVisible();
});
test("exploration reset is independent and denied storage remains usable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "gemini-toranomaki:progress:v1",
      '{"completed":["chapter-1"]}',
    );
    localStorage.setItem(
      "gemini-toranomaki:lab:v1",
      '{"question":{"copied":true}}',
    );
  });
  await page.goto("#chapter-1");
  await page
    .getByRole("group", { name: "Geminiの模擬画面" })
    .getByRole("button", { name: "入力欄" })
    .click();
  await page
    .getByRole("button", { name: "探索記録だけを初期化", exact: true })
    .click();
  await page.getByRole("button", { name: "探索の初期化をキャンセル" }).click();
  await expect(page.getByText(/探索済み 1 \/ 12/)).toBeVisible();
  await page
    .getByRole("button", { name: "探索記録だけを初期化", exact: true })
    .click();
  await page.getByRole("button", { name: "探索記録の初期化を実行" }).click();
  expect(
    await page.evaluate((k) => JSON.parse(localStorage.getItem(k)!), key),
  ).toEqual({ visited: [], tried: [] });
  await expect(page.getByRole("checkbox")).toBeChecked();
  expect(
    await page.evaluate(() => localStorage.getItem("gemini-toranomaki:lab:v1")),
  ).toContain("copied");
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw Error("denied");
    };
  });
  await page
    .getByRole("group", { name: "Geminiの模擬画面" })
    .getByRole("button", { name: "入力欄" })
    .click();
  await expect(
    page.getByText(/保存できません。この画面内では操作できます/),
  ).toBeVisible();
  await expect(page.locator("#feature-detail h3")).toHaveText("入力欄");
});
for (const width of [320, 375, 600, 780, 1280])
  test(`explorer fits ${width}px in both themes`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const colorScheme of ["light", "dark"] as const) {
      await page.emulateMedia({ colorScheme });
      await page.goto("#chapter-1");
      await page.reload();
      await page
        .getByRole("group", { name: "Geminiの模擬画面" })
        .getByRole("button", { name: "モデル選択" })
        .click();
      await page.getByLabel("やりたいこと").selectOption("pdf");
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: `test-results/exploration-${test.info().project.name}-${width}-${colorScheme}.png`,
        fullPage: true,
      });
    }
  });

for (const width of [375, 1280])
  test(`repeat selection and return preserve the exploration focus loop at ${width}px`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 812 });
    await page.goto("#chapter-1");
    const mock = page.getByRole("group", { name: "Geminiの模擬画面" });
    const selected = mock.getByRole("button", { name: "モデル選択" });
    const heading = page.locator("#feature-detail h3");
    await selected.click();
    await expect(heading).toBeFocused();
    await selected.click();
    await expect(heading).toBeFocused();
    await expect(heading).toBeInViewport();
    await expect(page.getByText(/探索済み 1 \/ 12/)).toBeVisible();
    await page.keyboard.press("Tab");
    await expect(
      page.getByRole("button", { name: "入口の選択へ戻る" }),
    ).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(selected).toBeFocused();
    await expect(selected).toBeInViewport();
    await page.keyboard.press("Tab");
    await expect(mock.getByRole("button", { name: "入力欄" })).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(heading).toHaveText("入力欄");
    await expect(heading).toBeFocused();
  });
