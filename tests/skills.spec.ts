import { test, expect } from "@playwright/test";

test("four experiences, persistent independent records and simulated comparison", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "gemini-toranomaki:progress:v1",
      JSON.stringify({ completed: ["chapter-1"] }),
    );
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copied: string }).copied = text;
        },
      },
    });
  });
  await page.goto("#chapter-9");
  await page.getByLabel("教え方").selectOption("2");
  await page.getByLabel("学習レベル").selectOption("2");
  await page.getByRole("button", { name: /3\. 回答を比較/ }).click();
  await expect(page.locator(".skills-result")).toContainText("イテラブル");
  await expect(page.getByText(/教え方「解説中心」/)).toBeVisible();
  await page.getByRole("button", { name: /2\. カスタム指示工房/ }).click();
  await page
    .getByRole("textbox", { name: "目的", exact: true })
    .fill("自分で考える力を育てるために支援する");
  await page.getByLabel("テンプレート").selectOption("文章添削AI");
  await page.getByLabel("テンプレート").selectOption("学習支援AI");
  await expect(
    page.getByRole("textbox", { name: "目的", exact: true }),
  ).toHaveValue("自分で考える力を育てるために支援する");
  await page.getByLabel("テンプレート").selectOption("学習支援AI");
  await expect(
    page.getByRole("textbox", { name: "目的", exact: true }),
  ).toHaveValue("自分で考える力を育てるために支援する");
  await page.getByRole("button", { name: "全文をコピー" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "コピーしました" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /4\. GemsからSkillsへ/ }).click();
  await page.getByLabel("すぐ答えを示す").check();
  await expect(page.getByText(/衝突: /)).toBeVisible();
  await page.getByLabel("対応形式と合計容量").check();
  await page.reload();
  await expect(page.getByLabel("対応形式と合計容量")).toBeChecked();
  await page.getByRole("button", { name: /2\. カスタム指示工房/ }).click();
  await expect(
    page.getByRole("textbox", { name: "目的", exact: true }),
  ).toHaveValue("自分で考える力を育てるために支援する");
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("gemini-toranomaki:progress:v1")!)
          .completed,
    ),
  ).toEqual(["chapter-1"]);
});
for (const width of [320, 375, 390, 1280])
  for (const theme of ["light", "dark"] as const)
    test(`chapter nine layout ${width} ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ colorScheme: theme });
      await page.goto("#chapter-9");
      for (const label of [
        /1\. AI家庭教師/,
        /2\. カスタム指示/,
        /3\. 回答/,
        /4\. Gems/,
      ]) {
        await page.getByRole("button", { name: label }).click();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
    });

test("keyboard and doubled text preserve navigation and reset; failed copy is announced", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw Error("denied");
        },
      },
    });
  });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("#chapter-9");
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  await page.getByRole("button", { name: /2\. カスタム指示工房/ }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("heading", { name: "カスタム指示工房" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "全文をコピー" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "コピーできませんでした" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "第9章の記録を初期化" }).click();
  await page.getByRole("button", { name: "キャンセル" }).click();
  await expect(
    page.getByRole("heading", { name: "カスタム指示工房" }),
  ).toBeVisible();
});

test("reset invalidates a pending copy even when the text is unchanged", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            (window as unknown as { finishCopy: () => void }).finishCopy =
              resolve;
          }),
      },
    });
  });
  await page.goto("#chapter-9");
  await page.getByRole("button", { name: "全文をコピー" }).click();
  await page.getByRole("button", { name: "第9章の記録を初期化" }).click();
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  await page.evaluate(() =>
    (window as unknown as { finishCopy: () => void }).finishCopy(),
  );
  await expect(
    page.getByRole("status").filter({ hasText: "コピーしました" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "全文をコピー" }),
  ).toBeEnabled();
});
