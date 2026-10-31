import { test, expect } from "@playwright/test";

test("four draft copies track edits across switches and reload", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { Object.assign(window, { capturedCopy: text }); } } });
  });
  await page.goto("#chapter-9");
  await page.getByRole("button", { name: /2\. カスタム指示/ }).click();
  const template = page.getByLabel("テンプレート");
  const goal = page.getByRole("textbox", { name: "目的", exact: true });
  const names = ["学習支援AI", "文章添削AI", "プログラミング学習メンター", "アイデア発想支援AI"];
  for (let i = 0; i < names.length; i++) {
    await template.selectOption(names[i]);
    await goal.fill(`独立検証用の目的 ${i} を具体的に示します`);
    await template.selectOption(names[i]);
    await expect(goal).toHaveValue(`独立検証用の目的 ${i} を具体的に示します`);
    await expect(page.getByText("目的: 内容あり")).toBeVisible();
    await page.getByRole("button", { name: "全文をコピー" }).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { capturedCopy: string }).capturedCopy)).toContain(`独立検証用の目的 ${i}`);
  }
  await page.reload();
  for (let i = 0; i < names.length; i++) {
    await template.selectOption(names[i]);
    await expect(goal).toHaveValue(`独立検証用の目的 ${i} を具体的に示します`);
  }
  await expect(page.getByText(/AIの理解や矛盾の不存在を保証しません/)).toBeVisible();
});
