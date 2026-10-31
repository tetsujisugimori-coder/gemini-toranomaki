import { test, expect } from "@playwright/test";

test("comparison discloses and respects the four reflected conditions", async ({ page }) => {
  await page.goto("#chapter-9");
  await page.getByRole("button", { name: /3\. 回答を比較/ }).click();
  await expect(page.getByText(/分野と間違いへの対応は比較本文に反映されません/)).toBeVisible();
  const questions = page.getByRole("combobox", { name: "質問", exact: true });
  const general = page.locator(".notice").filter({ has: page.getByRole("heading", { name: "一般的なAIの模擬回答" }) });
  const custom = page.locator(".skills-result");
  for (let i = 0; i < 4; i++) {
    await questions.selectOption(String(i));
    const beforeGeneral = await general.innerText();
    const beforeCustom = await custom.innerText();
    await page.getByRole("button", { name: /1\. AI家庭教師/ }).click();
    await page.getByLabel("学習分野").selectOption(String((i + 1) % 4));
    await page.getByLabel("間違いへの対応").selectOption(String((i + 1) % 2));
    await page.getByRole("button", { name: /3\. 回答を比較/ }).click();
    expect(await general.innerText()).toBe(beforeGeneral);
    expect(await custom.innerText()).toBe(beforeCustom);
  }
});
