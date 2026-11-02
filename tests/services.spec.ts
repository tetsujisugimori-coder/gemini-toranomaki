import { test, expect, type Page } from "@playwright/test";
import { eventFields, reviewItems, troubles } from "../src/services-data";
import { servicesKey } from "../src/services-storage";
import { progressKey } from "../src/storage";

// Existing suite verifies the preserved mock/legacy path; new practice has its own suite.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('gemini-toranomaki:services-practice:v1'))
      localStorage.setItem('gemini-toranomaki:services-practice:v1', JSON.stringify({mode:'mock'}));
  });
});

const step = (page: Page, n: number) =>
  page.getByRole("button", { name: new RegExp(`^${n}\\. `) }).click();
const chapterComplete = (page: Page) =>
  page.getByLabel("第2章の学習を完了した（自己申告・実登録は不要）");
async function allowClipboard(page: Page) {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copied: string }).copied = text;
        },
      },
    }),
  );
}
async function copied(page: Page) {
  return page.evaluate(() => (window as unknown as { copied: string }).copied);
}
async function approveMock(page: Page) {
  await step(page, 4);
  await page.getByLabel("比較するケース").selectOption("correct");
  for (const item of reviewItems)
    await page.getByLabel(item, { exact: true }).check();
  await page.getByRole("button", { name: "確認済みの模擬内容で次へ" }).click();
}

test("fictional inbox, correction priority, field feedback and learning position restore", async ({
  page,
}) => {
  await page.goto("#chapter-2");
  await expect(page.locator("h1")).toHaveText("Googleサービス連携");
  await expect(
    page.getByRole("heading", { name: "模擬Gmail受信箱" }),
  ).toBeVisible();
  await page.getByRole("button", { name: /週末のお知らせ/ }).click();
  await expect(
    page.getByRole("region", { name: "選択した架空メール" }),
  ).toContainText("訂正ではありません");
  await page.getByRole("button", { name: /【訂正・確定】/ }).click();
  await expect(
    page.getByRole("region", { name: "選択した架空メール" }),
  ).toContainText("開催日：2026年10月31日");
  await page
    .getByLabel("一番新しい10月23日のお知らせ", { exact: true })
    .check();
  await expect(page.getByText(/10月23日は新しくても無関係/)).toBeVisible();
  await page.getByLabel("10月22日の訂正案内", { exact: true }).check();
  await page
    .getByRole("combobox", { name: "開催日", exact: true })
    .selectOption("2");
  await expect(page.getByText(/送信日と開催日は別/)).toBeVisible();
  for (const f of eventFields)
    await page
      .getByRole("combobox", { name: f.label, exact: true })
      .selectOption(String(f.answer));
  await expect(page.locator(".service-extracted")).toContainText("2026-10-31");
  await expect(page.getByText(/全項目が訂正本文と一致/)).toBeVisible();
  await step(page, 2);
  await expect(page.locator("#service-step-heading")).toBeFocused();
  await expect(page.getByText(/接続せず模擬演習だけで学べます/)).toBeVisible();
  await page.getByRole("link", { name: "ホーム", exact: true }).click();
  await page.getByRole("link", { name: "第2章を学ぶ", exact: true }).click();
  await expect(page.locator("#service-step-heading")).toContainText(
    "接続を理解する",
  );
  await step(page, 1);
  await expect(
    page.getByRole("button", { name: /【訂正・確定】/ }),
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("combobox", { name: "開催日", exact: true }),
  ).toHaveValue("1");
});

test("source comparison blocks old, ambiguous and duplicate plans, explains all six trouble answers", async ({
  page,
}) => {
  await page.goto("#chapter-2");
  await step(page, 4);
  await expect(
    page.getByRole("heading", { name: "カレンダーへ登録する候補（未登録）" }),
  ).toBeVisible();
  for (const [id, reason] of [
    ["old", "初回案内のまま"],
    ["ambiguous", "具体的な開始・終了時刻がありません"],
    ["duplicate", "新規追加を止め"],
  ]) {
    await page.getByLabel("比較するケース").selectOption(id);
    for (const item of reviewItems)
      await page.getByLabel(item, { exact: true }).check();
    await page
      .getByRole("button", { name: "確認済みの模擬内容で次へ" })
      .click();
    await expect(
      page.getByText(new RegExp(`まだ進めません.*${reason}`)),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "登録せず確認する", exact: true })
      .click();
    await expect(page.getByText(/^保留しました/)).toBeVisible();
  }
  await page.getByLabel("比較するケース").selectOption("correct");
  await page.getByRole("button", { name: "確認済みの模擬内容で次へ" }).click();
  await expect(page.getByText(/全項目を確認してから/)).toBeVisible();
  await expect(chapterComplete(page)).not.toBeChecked();
  for (const t of troubles) {
    const detail = page
      .locator("details")
      .filter({ has: page.locator("summary", { hasText: t.question }) });
    await detail.locator("summary").click();
    await detail.getByLabel(t.options[1 - t.answer], { exact: true }).check();
    await expect(detail.getByRole("status")).toContainText("もう一度");
    await detail.getByLabel(t.options[t.answer], { exact: true }).check();
    await expect(detail.getByRole("status")).toContainText(
      `正解です。 ${t.reason}`,
    );
  }
});

test("builder reflects conditions, copies full source, handles denial and revokes registration after changes", async ({
  page,
}) => {
  await allowClipboard(page);
  await page.goto("#chapter-2");
  await step(page, 3);
  await expect(page.getByLabel("登録依頼の全文")).toHaveCount(0);
  await page
    .getByRole("combobox", { name: "検索対象", exact: true })
    .selectOption("sender");
  await page
    .getByRole("combobox", { name: "検索期間（メール送信日）", exact: true })
    .selectOption("recent");
  await page.getByLabel("項目ごとの出典・送信日時・根拠の本文").uncheck();
  const search = page.getByLabel("検索指示の全文");
  await expect(search).toContainText("架空の学び係");
  await expect(search).toContainText("10月20日〜10月23日");
  await expect(search).toContainText("簡潔に整理");
  await page.getByRole("button", { name: "検索指示を全文コピー" }).click();
  expect(await copied(page)).toBe(await search.innerText());
  await expect(page.locator(".services .feedback")).toContainText(
    "送信や登録はしていません",
  );
  await approveMock(page);
  await expect(
    page.getByText("模擬確認：完了した記録あり（実登録ではありません）", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(chapterComplete(page)).not.toBeChecked();
  await page.getByRole("button", { name: "確認後の指示文へ戻る" }).click();
  await page.getByRole("button", { name: "登録依頼を全文コピー" }).click();
  expect(await copied(page)).toBe(
    await page.getByLabel("登録依頼の全文").innerText(),
  );
  expect(await copied(page)).toContain("実登録禁止");
  await page.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async () => {
          throw Error("denied");
        },
      },
    });
  });
  await page.getByRole("button", { name: "検索指示を全文コピー" }).click();
  await expect(page.locator(".services .feedback")).toContainText(
    "手動でコピー",
  );
  await expect(search).toBeVisible();
  await step(page, 4);
  await page.getByLabel("比較するケース").selectOption("duplicate");
  await step(page, 3);
  await expect(page.getByLabel("登録依頼の全文")).toHaveCount(0);
  await page.reload();
  await expect(page.getByLabel("登録依頼の全文")).toHaveCount(0);
});

test("optional real exercise stays separate and requires every manual confirmation without auto completion", async ({
  page,
}) => {
  await allowClipboard(page);
  await page.goto("#chapter-2");
  await step(page, 3);
  await page
    .getByLabel("任意の実アカウント演習（自分の非機密メール）", { exact: true })
    .check();
  await expect(page.getByLabel("検索指示の全文")).not.toContainText(
    "架空メール：",
  );
  await expect(page.getByLabel("検索指示の全文")).toContainText("過去30日間");
  await page.getByRole("button", { name: "検索指示を全文コピー" }).click();
  for (const item of reviewItems.slice(0, -1))
    await page.getByLabel(item, { exact: true }).check();
  await expect(page.getByLabel("登録前確認の全文")).toHaveCount(0);
  await page.getByLabel(reviewItems.at(-1)!, { exact: true }).check();
  await page.getByRole("button", { name: "登録前確認を全文コピー" }).click();
  expect(await copied(page)).toContain("対象カレンダーが未指定なら先に聞いて");
  expect(await copied(page)).toContain(
    "このメッセージでは予定の作成・変更・削除を一切実行しない",
  );
  await expect(page.getByLabel("最終実行指示の全文")).toHaveCount(0);
  await expect(chapterComplete(page)).not.toBeChecked();
  await expect(
    page.getByLabel(
      "任意：実際のGoogleカレンダーを開き、予定の実在と内容を確認した（自己申告）",
    ),
  ).not.toBeChecked();
  await page.getByLabel(reviewItems[0], { exact: true }).uncheck();
  await expect(page.getByLabel("登録前確認の全文")).toHaveCount(0);
  await page.getByLabel(reviewItems[0], { exact: true }).check();
  await page
    .getByRole("combobox", { name: "検索対象", exact: true })
    .selectOption("sender");
  await expect(page.getByLabel("登録前確認の全文")).toHaveCount(0);
});

test("old chapter data restores, chapter toggles are independent and lab/exploration records survive reset", async ({
  page,
}) => {
  await page.goto("#chapter-2");
  await page.evaluate(
    ({ progressKey }) => {
      localStorage.setItem(progressKey, '{"completed":["chapter-1"]}');
      localStorage.setItem(
        "gemini-toranomaki:lab:v1",
        '{"ask":{"copied":true}}',
      );
      localStorage.setItem(
        "gemini-toranomaki:exploration:v1",
        '{"visited":["attach"],"tried":[]}',
      );
    },
    { progressKey },
  );
  await page.reload();
  await expect(page.getByText("1 / 10章", { exact: true })).toBeVisible();
  await chapterComplete(page).check();
  await expect(page.getByText("2 / 10章", { exact: true })).toBeVisible();
  await page.getByRole("link", { name: "第1章を学ぶ", exact: true }).click();
  await expect(
    page.getByLabel("自分の画面で利用可能な機能を探した"),
  ).toBeChecked();
  await page.getByLabel("自分の画面で利用可能な機能を探した").uncheck();
  await page.getByRole("link", { name: "第2章を学ぶ", exact: true }).click();
  await expect(chapterComplete(page)).toBeChecked();
  await chapterComplete(page).uncheck();
  await expect(page.getByText("0 / 10章", { exact: true })).toBeVisible();
  await chapterComplete(page).check();
  await page.getByLabel("任意：実際のGeminiで検索を試した（自己申告）").check();
  await page.getByRole("button", { name: "進捗を初期化", exact: true }).click();
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  await expect(chapterComplete(page)).not.toBeChecked();
  await expect(
    page.getByLabel("任意：実際のGeminiで検索を試した（自己申告）"),
  ).toBeChecked();
  const keys = await page.evaluate(() => ({
    lab: localStorage.getItem("gemini-toranomaki:lab:v1"),
    explore: localStorage.getItem("gemini-toranomaki:exploration:v1"),
  }));
  expect(keys.lab).toBe('{"ask":{"copied":true}}');
  expect(keys.explore).toBe('{"visited":["attach"],"tried":[]}');
});

test("malformed data and failed writes preserve useful in-memory learning and announce storage failures", async ({
  page,
}) => {
  await page.goto("#chapter-2");
  await page.evaluate(
    ({ servicesKey, progressKey }) => {
      localStorage.setItem(servicesKey, "{broken");
      localStorage.setItem(
        progressKey,
        '{"completed":["chapter-1","chapter-10",null]}',
      );
    },
    { servicesKey, progressKey },
  );
  await page.reload();
  await expect(page.getByText(/第2章の記録を保存できません/)).toBeVisible();
  await expect(page.getByText("1 / 10章", { exact: true })).toBeVisible();
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw Error("quota");
    };
  });
  await page.getByRole("button", { name: /【訂正・確定】/ }).click();
  await expect(
    page.getByRole("region", { name: "選択した架空メール" }),
  ).toContainText("開催日：2026年10月31日");
  await step(page, 4);
  await page
    .getByRole("button", { name: "登録せず確認する", exact: true })
    .click();
  await expect(page.getByText(/^保留しました/)).toBeVisible();
  await chapterComplete(page).check();
  await expect(chapterComplete(page)).toBeChecked();
  await expect(page.locator("main > .feedback")).toContainText(
    "保存はできません",
  );
});

test("pending clipboard completion after leaving chapter does not add records or overwrite current activity", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () =>
          new Promise<void>((resolve) => {
            (window as unknown as { resolveCopy: () => void }).resolveCopy =
              resolve;
          }),
      },
    }),
  );
  await page.goto("#chapter-2");
  await step(page, 3);
  await page.getByRole("button", { name: "検索指示を全文コピー" }).click();
  await page.getByRole("link", { name: "ホーム", exact: true }).click();
  await page.getByRole("link", { name: "第2章を学ぶ", exact: true }).click();
  await page.getByLabel("任意：実際のGeminiで検索を試した（自己申告）").check();
  await page.evaluate(() =>
    (window as unknown as { resolveCopy: () => void }).resolveCopy(),
  );
  await expect
    .poll(() =>
      page.evaluate(
        (key) => JSON.parse(localStorage.getItem(key)!).tried,
        servicesKey,
      ),
    )
    .toBe(true);
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).copied,
      servicesKey,
    ),
  ).toEqual([]);
});

test("same-chapter pending copies merge newer activity and condition changes allow a fresh retry", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const pending: (() => void)[] = [];
    (window as unknown as { pendingCopies: (() => void)[] }).pendingCopies =
      pending;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => new Promise<void>((resolve) => pending.push(resolve)),
      },
    });
  });
  await page.goto("#chapter-2");
  await step(page, 3);
  const button = page.getByRole("button", { name: "検索指示を全文コピー" });
  await button.click();
  await page.getByLabel("任意：実際のGeminiで検索を試した（自己申告）").check();
  await page.evaluate(() =>
    (window as unknown as { pendingCopies: (() => void)[] }).pendingCopies[0](),
  );
  await expect(button).toBeEnabled();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).tried,
      servicesKey,
    ),
  ).toBe(true);
  await button.click();
  await page
    .getByLabel("任意の実アカウント演習（自分の非機密メール）", { exact: true })
    .check();
  await page.evaluate(() =>
    (window as unknown as { pendingCopies: (() => void)[] }).pendingCopies[1](),
  );
  await expect(button).toBeEnabled();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).copied,
      servicesKey,
    ),
  ).toEqual(["mock-search"]);
  await button.click();
  await page.evaluate(() =>
    (window as unknown as { pendingCopies: (() => void)[] }).pendingCopies[2](),
  );
  await expect(button).toBeEnabled();
  expect(
    await page.evaluate(
      (key) => JSON.parse(localStorage.getItem(key)!).copied,
      servicesKey,
    ),
  ).toEqual(["mock-search", "real-search"]);
});

for (const width of [320, 375, 390, 1280])
  test(`all experiences fit ${width}px in both themes and preserve keyboard focus`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("#chapter-2");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    for (const theme of ["light", "dark"]) {
      if ((await page.locator("html").getAttribute("data-theme")) !== theme)
        await page
          .getByRole("button", {
            name:
              theme === "dark"
                ? "ダークテーマに切り替え"
                : "ライトテーマに切り替え",
          })
          .click();
      for (let n = 1; n <= 4; n++) {
        const nav = page.getByRole("button", { name: new RegExp(`^${n}\\. `) });
        await nav.focus();
        await page.keyboard.press("Enter");
        await expect(page.locator("#service-step-heading")).toContainText(
          `体験${n}`,
        );
        if (n !== 1 || theme === "dark")
          await expect(page.locator("#service-step-heading")).toBeFocused();
        if (n === 1) {
          await page.getByRole("button", { name: /【訂正・確定】/ }).focus();
          await page.keyboard.press("Enter");
          await expect(
            page.getByRole("region", { name: "選択した架空メール" }),
          ).toContainText("10月31日");
        }
        if (n === 3)
          await expect(page.getByLabel("検索指示の全文")).toBeVisible();
        if (n === 4)
          await page
            .locator("summary")
            .filter({ hasText: "登録後にGoogleカレンダー" })
            .click();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
    }
  });
