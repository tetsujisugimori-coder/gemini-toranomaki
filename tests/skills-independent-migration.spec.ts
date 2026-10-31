import { test, expect } from "@playwright/test";

test("migration copy and three fixed-rule candidate sets", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { Object.assign(window, { copiedMigration: text }); } } }));
  await page.goto("#chapter-9");
  await page.getByRole("button", { name: /4\. GemsからSkillsへ/ }).click();
  const comparison = page.locator("details").first();
  await comparison.locator("summary").click();
  await expect(comparison).toContainText("再利用可能");
  await comparison.locator("summary").click();
  await expect(comparison).not.toHaveAttribute("open", "");
  await page.getByRole("textbox", { name: "スキル名", exact: true }).fill("独立検証用");
  await page.getByRole("textbox", { name: "使用例", exact: true }).fill("小さな例を確認します");
  await page.getByRole("button", { name: "全文をコピー" }).click();
  const copy = await page.evaluate(() => (window as unknown as { copiedMigration: string }).copiedMigration);
  expect(copy).toContain("スキル名: 独立検証用"); expect(copy).toContain("使用例: 小さな例を確認します");
  await expect(page.getByText(/Gemini内部の判定ではありません/)).toBeVisible();
  await page.getByLabel("選び方").selectOption("1");
  const q = page.getByRole("combobox", { name: "質問", exact: true });
  await q.selectOption("0"); await expect(page.getByText(/適用候補: プログラミング家庭教師、やさしい日本語、段階的ヒント/)).toBeVisible();
  await q.selectOption("1"); await expect(page.getByText(/適用候補: やさしい日本語、すぐ答えを示す/)).toBeVisible();
  await q.selectOption("2"); await expect(page.getByText("適用候補: なし")).toBeVisible();
  await page.getByLabel("選び方").selectOption("0");
  await page.getByLabel("段階的ヒント", { exact: true }).check();
  await page.getByLabel("すぐ答えを示す", { exact: true }).check();
  await expect(page.getByText(/衝突: ヒントを出す指示/)).toBeVisible();
});
