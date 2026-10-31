import { test, expect, type Page } from "@playwright/test";
const chapter = "gemini-toranomaki:skills:v1",
  progress = "gemini-toranomaki:progress:v1";
async function workshop(page: Page) {
  await page.goto("#chapter-9");
  await page.getByRole("button", { name: /2\. カスタム指示/ }).click();
}
async function pending(page: Page) {
  await page.addInitScript(() => {
    const calls: { text: string; resolve: () => void; reject: () => void }[] =
      [];
    Object.assign(window, { copyCalls: calls });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) =>
          new Promise<void>((resolve, reject) =>
            calls.push({
              text,
              resolve,
              reject: () => reject(Error("denied")),
            }),
          ),
      },
    });
  });
}
async function settle(page: Page, i: number, ok: boolean) {
  await page.evaluate(
    ({ i, ok }) => {
      const c = (
        window as unknown as {
          copyCalls: { resolve: () => void; reject: () => void }[];
        }
      ).copyCalls[i];
      if (ok) c.resolve();
      else c.reject();
    },
    { i, ok },
  );
}
test("ABA text edit: stale success or failure cannot alter the newer pending copy", async ({
  page,
}) => {
  await pending(page);
  await workshop(page);
  const field = page.getByRole("textbox", { name: "目的", exact: true }),
    button = page.getByRole("button", { name: "全文をコピー" });
  const original = await field.inputValue();
  await button.click();
  await field.fill("別の目的を具体的に設定します");
  await field.fill(original);
  await button.click();
  await settle(page, 0, true);
  await expect(button).toBeDisabled();
  await expect(
    page.getByRole("status").filter({ hasText: "コピーしました" }),
  ).toHaveCount(0);
  await settle(page, 1, false);
  await expect(
    page.getByRole("status").filter({ hasText: "コピーできませんでした" }),
  ).toBeVisible();
  await button.click();
  await field.fill("最後の目的を具体的に設定します");
  await button.click();
  await settle(page, 3, true);
  await settle(page, 2, false);
  await expect(
    page.getByRole("status").filter({ hasText: "コピーしました" }),
  ).toBeVisible();
  const texts = await page.evaluate(() =>
    (window as unknown as { copyCalls: { text: string }[] }).copyCalls.map(
      (c) => c.text,
    ),
  );
  expect(texts[3]).toContain("最後の目的を具体的に設定します");
});
test("pending copy is invalidated across template, experience and reset", async ({
  page,
}) => {
  await pending(page);
  await workshop(page);
  const button = page.getByRole("button", { name: "全文をコピー" });
  await button.click();
  await page.getByLabel("テンプレート").selectOption("文章添削AI");
  await button.click();
  await settle(page, 0, false);
  await expect(button).toBeDisabled();
  await settle(page, 1, true);
  await expect(
    page.getByRole("status").filter({ hasText: "コピーしました" }),
  ).toBeVisible();
  await button.click();
  await page.getByRole("button", { name: /1\. AI家庭教師/ }).click();
  await page.getByRole("button", { name: /2\. カスタム指示/ }).click();
  await button.click();
  await settle(page, 2, true);
  await expect(button).toBeDisabled();
  await settle(page, 3, true);
  await button.click();
  await page.getByRole("button", { name: "第9章の記録を初期化" }).click();
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  await settle(page, 4, false);
  await expect(
    page.getByRole("status").filter({ hasText: "コピーできませんでした" }),
  ).toHaveCount(0);
});
for (const blocked of [chapter, progress])
  test(`reset reports partial failure when ${blocked} cannot be written`, async ({
    page,
  }) => {
    await page.goto("#chapter-9");
    await page.evaluate(
      ({ chapter, progress }) => {
        localStorage.setItem(
          chapter,
          JSON.stringify({ tutor: [1, 0, 0, 1, 0, 0] }),
        );
        localStorage.setItem(
          progress,
          JSON.stringify({ completed: ["chapter-1", "chapter-9"] }),
        );
        localStorage.setItem("gemini-toranomaki:lab:v1", "protected-lab");
        localStorage.setItem(
          "gemini-toranomaki:exploration:v1",
          "protected-explore",
        );
      },
      { chapter, progress },
    );
    await page.reload();
    await page.evaluate((blocked) => {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === blocked) throw Error("quota");
        return original.call(this, k, v);
      };
    }, blocked);
    await page.getByRole("button", { name: "第9章の記録を初期化" }).click();
    await page.getByRole("button", { name: "初期化する", exact: true }).click();
    if (blocked === chapter)
      await expect(
        page.getByRole("alert").filter({ hasText: "保存できません" }),
      ).toBeVisible();
    else await expect(page.getByText(/保存はできません/)).toBeVisible();
    expect(
      await page.evaluate(() => [
        localStorage.getItem("gemini-toranomaki:lab:v1"),
        localStorage.getItem("gemini-toranomaki:exploration:v1"),
      ]),
    ).toEqual(["protected-lab", "protected-explore"]);
    await page.reload();
    if (blocked === chapter)
      await expect(page.getByLabel("学習分野")).toHaveValue("1");
    else await expect(page.getByLabel("第9章を完了した")).toBeChecked();
  });
test("four subjects retain answers through reselect, switch and reset", async ({
  page,
}) => {
  await page.goto("#chapter-9");
  const subject = page.getByLabel("学習分野"),
    level = page.getByLabel("学習レベル"),
    style = page.getByLabel("教え方"),
    length = page.getByLabel("回答の長さ"),
    format = page.getByRole("combobox", { name: "回答形式", exact: true });
  const preview = page.locator(".skills-grid").first();
  const hints = ["積が6", "主語 He", "最初に取り出される", "建物"],
    details = ["因子", "語尾がo", "空のリスト", "1万分の1"];
  for (let i = 0; i < 4; i++) {
    await subject.selectOption(String(i));
    await style.selectOption("0");
    await expect(preview).toContainText(hints[i]);
    await style.selectOption("2");
    await length.selectOption("2");
    await expect(preview).toContainText(details[i]);
    await level.selectOption("2");
    await format.selectOption("2");
    await expect(preview).toContainText("練習:");
    await subject.selectOption(String(i));
    await expect(format).toHaveValue("2");
  }
  await page.getByRole("button", { name: "家庭教師の設定を初期化" }).click();
  await expect(subject).toHaveValue("0");
  await expect(level).toHaveValue("0");
  await expect(format).toHaveValue("0");
  await page.getByRole("button", { name: /2\. カスタム指示/ }).click();
  await page.getByRole("button", { name: /1\. AI家庭教師/ }).click();
  await expect(subject).toHaveValue("0");
});
test("read denial warns while interactions remain available", async ({
  page,
}) => {
  await page.addInitScript((key) => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (k) {
      if (k === key) throw Error("read denied");
      return original.call(this, k);
    };
  }, chapter);
  await page.goto("#chapter-9");
  await expect(
    page.getByRole("alert").filter({ hasText: "保存できません" }),
  ).toBeVisible();
  await page.getByLabel("学習分野").selectOption("3");
  await expect(page.getByText(/回答例（地図の縮尺を教えて）/)).toBeVisible();
});
test("malformed chapter data warns and separate drafts survive switching and reload", async ({
  page,
}) => {
  await page.goto("#chapter-9");
  await page.evaluate((key) => localStorage.setItem(key, "{broken"), chapter);
  await page.reload();
  await expect(
    page.getByRole("alert").filter({ hasText: "保存できません" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /2\. カスタム指示/ }).click();
  const field = page.getByRole("textbox", { name: "目的", exact: true });
  await field.fill("学習者に合う説明を考える目的です");
  await page.getByLabel("テンプレート").selectOption("文章添削AI");
  await field.fill("文章の読みやすさを改善する目的です");
  await page.reload();
  await expect(field).toHaveValue("文章の読みやすさを改善する目的です");
  await page.getByLabel("テンプレート").selectOption("学習支援AI");
  await expect(field).toHaveValue("学習者に合う説明を考える目的です");
});
test("keyboard radio and checkbox remain usable at doubled text", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("#chapter-9");
  await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
  const radio = page.getByLabel("段階的なヒントを出す");
  await radio.focus();
  await expect(radio).toBeFocused();
  await page.keyboard.press("Space");
  await expect(radio).toBeChecked();
  await expect(page.getByText(/正解です/)).toBeVisible();
  const checkbox = page.getByLabel("この体験を完了した");
  await checkbox.focus();
  await page.keyboard.press("Space");
  await expect(checkbox).toBeChecked();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
