import { test, expect } from "@playwright/test";

test("each tutor subject follows selected teaching conditions", async ({ page }) => {
  await page.goto("#chapter-9");
  const subject = page.getByLabel("学習分野");
  const level = page.getByLabel("学習レベル");
  const style = page.getByLabel("教え方");
  const length = page.getByLabel("回答の長さ");
  const format = page.getByRole("combobox", { name: "回答形式", exact: true });
  const mistakes = page.getByLabel("間違いへの対応");
  const panel = page.locator(".skills-grid").first();
  const hints = ["積が6", "主語 He", "最初に取り出される", "建物"];
  const advanced = ["判別式", "主語と定形動詞", "イテラブル", "縮尺の分母"];
  const detail = ["因子", "語尾がo", "空のリスト", "1万分の1"];
  for (let i = 0; i < 4; i++) {
    await subject.selectOption(String(i));
    for (const [value, phrase] of [["0", "身近な例"], ["1", "基本を確認"], ["2", advanced[i]]]) { await level.selectOption(value); await expect(panel).toContainText(phrase); }
    await style.selectOption("0"); await expect(panel).toContainText(hints[i]);
    await style.selectOption("1"); await expect(panel).toContainText("返答を確認して次のヒント");
    await style.selectOption("2"); await expect(panel).toContainText("解説中心");
    await length.selectOption("0"); await expect(panel).not.toContainText(detail[i]);
    await length.selectOption("1"); await expect(panel).toContainText("次の一歩");
    await length.selectOption("2"); await expect(panel).toContainText(detail[i]);
    await format.selectOption("0"); await expect(panel).toContainText("回答形式は文章");
    await format.selectOption("1"); await expect(panel).toContainText("1.");
    await format.selectOption("2"); await expect(panel).toContainText("練習:");
    await mistakes.selectOption("0"); await expect(panel).toContainText("もう一度、最初の手順");
    await mistakes.selectOption("1"); await expect(panel).toContainText("間違いの原因を一緒に確認");
    await subject.selectOption(String(i)); await expect(format).toHaveValue("2");
  }
  await page.getByRole("button", { name: "家庭教師の設定を初期化" }).click();
  await expect(subject).toHaveValue("0"); await expect(format).toHaveValue("0");
});
