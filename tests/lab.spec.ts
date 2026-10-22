import { expect, test } from "@playwright/test";
test("all experiences generate, compare, copy, retry and keep chapter data", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copied: string }).copied = text;
        },
      },
    });
    localStorage.setItem(
      "gemini-toranomaki:progress:v1",
      JSON.stringify({ completed: ["chapter-1"] }),
    );
  });
  await page.goto("#lab");
  for (const [id, title] of [
    ["ask", "質問してみる"],
    ["rewrite", "文章を変身させる"],
    ["image", "想像を画像にする"],
    ["quiz", "自分用クイズを作る"],
  ]) {
    await page.locator(`a[href="#lab-${id}"]`).click();
    await expect(
      page.getByRole("heading", { level: 1, name: title }),
    ).toBeVisible();
    const prompt = page.getByLabel("現在のプロンプト全文", { exact: true });
    const before = await prompt.innerText();
    await page
      .getByRole("button", { name: "現在の指示を「変更前」に保持" })
      .click();
    const input = page.locator("textarea").nth(1);
    await input.fill("別の題材で試す");
    await expect(prompt).not.toHaveText(before);
    await expect(
      page
        .getByRole("heading", { name: "変更前のプロンプト", exact: true })
        .locator("..")
        .locator("pre"),
    ).toHaveText(before);
    await page
      .getByRole("button", { name: "プロンプト全文をコピー", exact: true })
      .click();
    expect(
      await page.evaluate(
        () => (window as unknown as { copied: string }).copied,
      ),
    ).toBe(await prompt.innerText());
    await expect(
      page.getByLabel("Geminiで実際に試した（自己申告）", { exact: true }),
    ).not.toBeChecked();
    await page
      .getByLabel("Geminiで実際に試した（自己申告）", { exact: true })
      .check();
    await page
      .getByLabel("一条件ずつ変え、結果の違いと正確さを確認する", {
        exact: true,
      })
      .check();
    await expect(page.getByText("正解です。", { exact: false })).toBeVisible();
    if (id === "image") {
      await page.getByLabel("一部だけ変更する追加指示を表示").check();
      await expect(prompt).toContainText("先ほどの画像");
    }
    await page.getByRole("button", { name: "元の設定に戻す" }).click();
    await expect(prompt).toHaveText(before);
    await page
      .getByRole("link", { name: "イントロに戻り、別の体験を選ぶ" })
      .click();
  }
  await page.reload();
  await expect(
    page.getByText("操作：コピー成功", { exact: false }),
  ).toHaveCount(4);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("gemini-toranomaki:progress:v1"),
    ),
  ).toContain("chapter-1");
  expect(
    await page.evaluate(() => localStorage.getItem("gemini-toranomaki:lab:v1")),
  ).not.toContain("別の題材");
  await page.getByRole("link", { name: "第1章へ進む", exact: false }).click();
  await expect(
    page.getByRole("heading", { level: 1, name: "Geminiの画面とモデル選択" }),
  ).toBeVisible();
  await page.goBack();
  await expect(
    page.getByRole("heading", { level: 1, name: "Gemini体験ラボ" }),
  ).toBeVisible();
});
test("copy failure recovers, storage denial permits learning, checks explain errors", async ({
  page,
}) => {
  await page.addInitScript(() => {
    let calls = 0;
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: async () => {
          if (++calls === 1) throw Error("denied");
        },
      },
    });
    Storage.prototype.setItem = () => {
      throw Error("denied");
    };
  });
  await page.goto("#lab-ask");
  await page
    .getByRole("button", { name: "プロンプト全文をコピー", exact: true })
    .click();
  await expect(
    page.getByText("コピーできませんでした。", { exact: false }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "プロンプト全文をコピー", exact: true })
    .click();
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
  await page
    .getByLabel("一度に全条件を変え、コピーだけで理解済みにする")
    .check();
  await expect(
    page.getByText("もう一度考えてみましょう。", { exact: false }),
  ).toBeVisible();
  await page.goto("#lab");
  await page
    .getByLabel("出典を開き、発行元・日付・本文が主張を支えるか確かめる")
    .check();
  await expect(
    page.getByText("出典自体が存在しない場合", { exact: false }),
  ).toBeVisible();
});
for (const width of [375, 390, 1280])
  test(`lab layouts and keyboard ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of [
      "lab",
      "lab-ask",
      "lab-rewrite",
      "lab-image",
      "lab-quiz",
    ]) {
      await page.goto(`#${route}`);
      await expect(page.locator("h1")).toBeVisible();
      for (let theme = 0; theme < 2; theme++) {
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.getByRole("button", { name: /テーマに切り替え/ }).click();
      }
    }
    await page.goto("#lab-quiz");
    await page.keyboard.press("Tab");
    await page.getByLabel("難易度", { exact: true }).focus();
    await page.keyboard.press("ArrowDown");
    await expect(
      page.getByLabel("現在のプロンプト全文", { exact: true }),
    ).toContainText("標準");
  });
