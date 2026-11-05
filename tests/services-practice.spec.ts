import { test, expect, type Page } from "@playwright/test";
import { practiceKey } from "../src/services-practice-storage";
import {
  practicePrompts,
  executionPractice,
} from "../src/services-practice-data";
const route = "#chapter-2";
const step = async (page: Page, n: number) => {
  await page
    .getByRole("combobox", { name: "工程を選ぶ", exact: true })
    .selectOption(String(n));
  await expect(page.locator("#practice-heading")).toContainText(
    `STEP ${n < 4 ? n : 4}`,
  );
};
const saved = (page: Page) =>
  page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) || "{}"),
    practiceKey,
  );
async function clipboard(page: Page) {
  await page.addInitScript(() => {
    (
      window as unknown as {
        copies: { text: string; resolve: () => void; reject: () => void }[];
      }
    ).copies = [];
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) =>
          new Promise<void>((resolve, reject) => {
            (window as unknown as { copies: unknown[] }).copies.push({
              text,
              resolve,
              reject: () => reject(Error("denied")),
            });
          }),
      },
    });
  });
}
async function settle(page: Page, index: number, fail = false) {
  await page.evaluate(
    async ({ index, fail }) => {
      const c = (
        window as unknown as {
          copies: { resolve: () => void; reject: () => void }[];
        }
      ).copies[index];
      if (fail) c.reject();
      else c.resolve();
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => resolve()),
      );
    },
    { index, fail },
  );
}
test("default path, all environment choices, external links and staged task navigation", async ({
  page,
}) => {
  await page.goto(route);
  await expect(page.locator("#practice-heading")).toHaveText("STEP 0 学習環境");
  for (const [n, text] of [
    [0, "New split view"],
    [1, "Split screen"],
    [2, "別ウィンドウ"],
    [3, "Safari"],
    [4, "アプリ"],
  ] as const) {
    await page
      .getByRole("combobox", { name: "端末・ブラウザ", exact: true })
      .selectOption(String(n));
    await expect(
      page.locator(".services-practice .notice").last(),
    ).toContainText(text);
  }
  for (const [name, url] of [
    ["Gemini", "https://gemini.google.com/"],
    ["Gmail", "https://mail.google.com/"],
    ["Calendar", "https://calendar.google.com/"],
  ]) {
    const link = page
      .getByRole("navigation", { name: "実操作先" })
      .getByRole("link", { name: new RegExp(name) });
    await expect(link).toHaveAttribute("href", url);
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noreferrer");
  }
  await page.getByRole("button", { name: "次の工程 →" }).click();
  await expect(page.locator("#practice-heading")).toBeFocused();
  await expect(
    page.getByLabel("Gmailの件名欄に貼る文字列", { exact: true }),
  ).toHaveText("Gemini学習用・打ち合わせ案内");
  await step(page, 2);
  await expect(page.getByText(/Gemini手動練習・削除用/)).toBeVisible();
  await step(page, 3);
  await expect(page.getByText(/個人向け公式では/)).toBeVisible();
  await page.getByText("困ったとき・確認できないとき", { exact: true }).click();
  await expect(page.getByText(/利用不可は学習者の失敗/)).toBeVisible();
  await page.getByRole("button", { name: "← 前の工程" }).click();
  await expect(page.locator("#practice-heading")).toHaveText(
    "STEP 2 Calendarの準備",
  );
});
test("old records never become real completion; state survives return, retry/reset preserve every other key", async ({
  page,
}) => {
  await page.goto(route);
  await page.evaluate(() => {
    localStorage.setItem(
      "gemini-toranomaki:services:v1",
      '{"simulated":true,"tried":true,"calendarChecked":true,"copied":["real-registration"]}',
    );
    localStorage.setItem(
      "gemini-toranomaki:progress:v1",
      '{"completed":["chapter-1","chapter-2"]}',
    );
    localStorage.setItem("gemini-toranomaki:lab:v1", '{"ask":{"copied":true}}');
  });
  await page.reload();
  await expect(
    page.getByLabel("実操作を自分で実施した（自己申告）", { exact: true }),
  ).not.toBeChecked();
  await expect(
    page.getByLabel("実結果を自分で確認した（自己申告）", { exact: true }),
  ).not.toBeChecked();
  await step(page, 4);
  await page
    .getByLabel("実操作を自分で実施した（自己申告）", { exact: true })
    .check();
  await page
    .getByRole("combobox", { name: "未実施・保留の状態", exact: true })
    .selectOption("2");
  await page.getByRole("link", { name: "ホーム", exact: true }).click();
  await page.getByRole("link", { name: "第2章を学ぶ", exact: true }).click();
  await expect(page.locator("#practice-heading")).toHaveText(
    "STEP 4A メールを探す",
  );
  await expect(
    page.getByLabel("実操作を自分で実施した（自己申告）", { exact: true }),
  ).toBeChecked();
  await expect(
    page.getByRole("combobox", { name: "未実施・保留の状態", exact: true }),
  ).toHaveValue("2");
  await page.getByRole("button", { name: "この工程を再挑戦" }).click();
  expect((await saved(page)).performed).toEqual([4]);
  expect((await saved(page)).status).toEqual({ 4: 0 });
  await page.getByRole("button", { name: "模擬で事前練習・代替学習" }).click();
  await expect(
    page.getByRole("heading", { name: "模擬Gmail受信箱" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "実践教材へ", exact: true }).click();
  await expect(page.locator("#practice-heading")).toHaveText(
    "STEP 4A メールを探す",
  );
  const before = await page.evaluate(() =>
    Object.fromEntries(
      Object.keys(localStorage)
        .filter((k) => !k.includes("services-practice"))
        .map((k) => [k, localStorage.getItem(k)]),
    ),
  );
  await page.getByText("実践記録だけを初期化", { exact: true }).click();
  await expect(
    page.getByRole("button", { name: "実践記録を初期化する" }),
  ).toBeDisabled();
  await page.getByLabel("実践記録の初期化を確認した").check();
  await page.getByRole("button", { name: "実践記録を初期化する" }).click();
  await expect(page.locator("#practice-heading")).toHaveText("STEP 0 学習環境");
  expect(
    await page.evaluate(() =>
      Object.fromEntries(
        Object.keys(localStorage)
          .filter((k) => !k.includes("services-practice"))
          .map((k) => [k, localStorage.getItem(k)]),
      ),
    ),
  ).toEqual(before);
});
test("explicit preflight approval is transient, copy has full text and failure permits manual retry", async ({
  page,
}) => {
  await clipboard(page);
  await page.goto(route);
  await step(page, 6);
  const check = page.getByLabel(
    "今回提示された1件の全項目・目的・対象カレンダーと原文・重複なしを照合した（保存しない自己申告）",
    { exact: true },
  );
  await expect(page.getByLabel("実践・最終実行指示の全文")).toHaveCount(0);
  await page.getByRole("button", { name: "全文をコピー", exact: true }).click();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { copies: { text: string }[] }).copies[0].text,
    ),
  ).toBe(practicePrompts[6]);
  await settle(page, 0, true);
  await expect(page.locator(".services-practice .feedback")).toContainText(
    "手動でコピー",
  );
  expect((await saved(page)).copied).toEqual([]);
  await check.check();
  await page.getByRole("button", { name: "全文をコピー（最終実行）" }).click();
  await settle(page, 1);
  expect((await saved(page)).copied).toEqual(["execution"]);
  await expect(
    page.getByLabel("実操作を自分で実施した（自己申告）", { exact: true }),
  ).not.toBeChecked();
  await page.reload();
  await expect(check).not.toBeChecked();
  await expect(page.getByLabel("実践・最終実行指示の全文")).toHaveCount(0);
  await expect(
    page.locator(
      ".services-practice textarea, .services-practice input[type=text]",
    ),
  ).toHaveCount(0);
});
for (const action of [
  "step",
  "environment",
  "mode",
  "check",
  "status",
  "retry",
  "reset",
  "leave",
] as const)
  for (const failure of [false, true])
    test(`stale copy ${action} ${failure ? "failure" : "success"} does not overwrite record or newer copy`, async ({
      page,
    }) => {
      await clipboard(page);
      await page.goto(route);
      await step(page, 4);
      await page
        .getByRole("button", { name: "全文をコピー", exact: true })
        .click();
      if (action === "step") await step(page, 5);
      if (action === "environment") {
        await step(page, 0);
        await page
          .getByRole("combobox", { name: "端末・ブラウザ", exact: true })
          .selectOption("3");
        await step(page, 4);
      }
      if (action === "mode") {
        await page
          .getByRole("button", { name: "模擬で事前練習・代替学習" })
          .click();
        await page
          .getByRole("button", { name: "実践教材へ", exact: true })
          .click();
      }
      if (action === "check")
        await page
          .getByLabel("実結果を自分で確認した（自己申告）", { exact: true })
          .check();
      if (action === "status")
        await page
          .getByRole("combobox", { name: "未実施・保留の状態", exact: true })
          .selectOption("1");
      if (action === "retry")
        await page.getByRole("button", { name: "この工程を再挑戦" }).click();
      if (action === "reset") {
        await page.getByText("実践記録だけを初期化", { exact: true }).click();
        await page.getByLabel("実践記録の初期化を確認した").check();
        await page
          .getByRole("button", { name: "実践記録を初期化する" })
          .click();
        await step(page, 4);
      }
      if (action === "leave") {
        await page.getByRole("link", { name: "ホーム", exact: true }).click();
        await page
          .getByRole("link", { name: "第2章を学ぶ", exact: true })
          .click();
      }
      const nextCopy = page.getByRole("button", {
        name: "全文をコピー",
        exact: true,
      });
      await nextCopy.click();
      const before = await saved(page);
      await settle(page, 0, failure);
      expect(await saved(page)).toEqual(before);
      await expect(nextCopy).toBeDisabled();
      await expect(page.locator(".services-practice .feedback")).toHaveText("");
      await settle(page, 1);
      await expect(nextCopy).toBeEnabled();
      expect((await saved(page)).copied).toEqual([
        action === "step" ? "step-5" : "step-4",
      ]);
    });
test("approval revoked during pending final copy cannot record success or restore approval", async ({
  page,
}) => {
  await clipboard(page);
  await page.goto(route);
  await step(page, 6);
  const check = page.getByLabel(
    "今回提示された1件の全項目・目的・対象カレンダーと原文・重複なしを照合した（保存しない自己申告）",
    { exact: true },
  );
  await check.check();
  await page.getByRole("button", { name: "全文をコピー（最終実行）" }).click();
  await check.uncheck();
  await settle(page, 0);
  expect((await saved(page)).copied).toEqual([]);
  await expect(page.getByLabel("実践・最終実行指示の全文")).toHaveCount(0);
});
for (const broken of [false, true])
  test(`storage ${broken ? "corrupt" : "denied"} retains in-memory learning and does not destroy other chapters`, async ({
    page,
  }) => {
    await page.goto(route);
    if (broken)
      await page.evaluate(
        (key) => localStorage.setItem(key, "{broken"),
        practiceKey,
      );
    else
      await page.addInitScript(() => {
        Storage.prototype.getItem = () => {
          throw Error("private");
        };
      });
    await page.reload();
    await expect(
      page.getByText(/第2章の実践記録を保存できません/),
    ).toBeVisible();
    await page.evaluate(() => {
      Storage.prototype.setItem = () => {
        throw Error("quota");
      };
    });
    await step(page, 7);
    await page
      .getByLabel("実結果を自分で確認した（自己申告）", { exact: true })
      .check();
    await expect(
      page.getByLabel("実結果を自分で確認した（自己申告）", { exact: true }),
    ).toBeChecked();
    await expect(page.getByText(/以前の記録が復活/)).toBeVisible();
  });
for (const width of [320, 375, 390, 640, 1280])
  test(`one-task layout ${width}px light/dark at 200% text without overflow`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.addInitScript(() =>
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async () => {} },
      }),
    );
    await page.goto(route);
    await expect(page.locator("h1")).toBeFocused();
    for (const theme of ["light", "dark"]) {
      await page.evaluate(
        (t) => (document.documentElement.dataset.theme = t),
        theme,
      );
      await page.addStyleTag({ content: "html {font-size:200%}" });
      for (let i = 0; i < 9; i++) {
        await step(page, i);
        if (i === 1) {
          for (const name of ["件名をコピー", "本文をコピー"]) {
            const button = page.getByRole("button", { name, exact: true });
            const bounds = await button.boundingBox();
            expect(bounds!.height).toBeGreaterThanOrEqual(44);
            expect(bounds!.width).toBeGreaterThanOrEqual(44);
            await button.focus();
            await page.keyboard.press("Enter");
            await expect(
              page.locator(".services-practice .feedback"),
            ).toContainText("コピーしました");
            await expect(button).toBeEnabled();
          }
        }
        if (i === 6)
          await page
            .getByLabel(
              "今回提示された1件の全項目・目的・対象カレンダーと原文・重複なしを照合した（保存しない自己申告）",
              { exact: true },
            )
            .check();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await expect(
          page.getByRole("navigation", { name: "実操作先" }),
        ).toBeVisible();
      }
    }
  });

const mailSubject = "Gemini学習用・打ち合わせ案内";
const mailBody =
  "これは架空の学習用メールです。実際の会議はありません。\n予定名：Gemini学習用・打ち合わせ\n日時：2026年12月15日 15:00〜15:30\nタイムゾーン：日本標準時（Asia/Tokyo、UTC+09:00）\n場所：架空の学習ルームA（実在しません）\n目的：Geminiでメール検索と予定確認の練習\n参加者の招待・通知は不要です。";
test("review P2-A separate mail fields copy exact text, share busy state and allow manual fallback", async ({
  page,
}) => {
  await clipboard(page);
  await page.goto(route);
  await step(page, 1);
  await expect(
    page.getByText(
      "宛先：Gmail側で自分のメールアドレスを入力します。教材には入力しません。",
      { exact: true },
    ),
  ).toBeVisible();
  const subject = page.getByRole("button", {
    name: "件名をコピー",
    exact: true,
  });
  const body = page.getByRole("button", { name: "本文をコピー", exact: true });
  await expect(subject).toBeVisible();
  await subject.focus();
  await page.keyboard.press("Enter");
  await expect(subject).toBeDisabled();
  await expect(body).toBeDisabled();
  expect(
    await page.evaluate(() =>
      (window as unknown as { copies: { text: string }[] }).copies.map(
        (c) => c.text,
      ),
    ),
  ).toEqual([mailSubject]);
  await settle(page, 0);
  await expect(page.locator(".services-practice .feedback")).toContainText(
    "コピーしました",
  );
  await expect(page.locator(".services-practice .feedback")).toContainText(
    "送信や実行はしていません",
  );
  expect((await saved(page)).copied).toEqual(["mail-subject"]);
  await body.click();
  expect(
    await page.evaluate(
      () =>
        (window as unknown as { copies: { text: string }[] }).copies[1].text,
    ),
  ).toBe(mailBody);
  await settle(page, 1, true);
  await expect(page.locator(".services-practice .feedback")).toContainText(
    "手動でコピー",
  );
  const manual = page.getByLabel("Gmailの本文欄に貼る文字列", { exact: true });
  await expect(manual).toHaveText(mailBody);
  await manual.focus();
  await expect(manual).toBeFocused();
  await page.evaluate(() => {
    const target = document.querySelector(
      '[aria-label="Gmailの本文欄に貼る文字列"]',
    );
    const range = document.createRange();
    range.selectNodeContents(target!);
    const selection = window.getSelection()!;
    selection.removeAllRanges();
    selection.addRange(range);
  });
  expect(await page.evaluate(() => window.getSelection()?.toString())).toBe(
    mailBody,
  );
  expect((await saved(page)).copied).toEqual(["mail-subject"]);
  await body.click();
  await settle(page, 2);
  expect((await saved(page)).copied).toEqual(["mail-subject", "mail-body"]);
  expect((await saved(page)).performed).toEqual([]);
  expect((await saved(page)).verified).toEqual([]);
});
for (const old of ["件名", "本文"])
  for (const failure of [false, true])
    test(`review P2-A stale ${old} ${failure ? "failure" : "success"} after step change cannot overwrite newer mail copy`, async ({
      page,
    }) => {
      await clipboard(page);
      await page.goto(route);
      await step(page, 1);
      await page
        .getByRole("button", { name: `${old}をコピー`, exact: true })
        .click();
      await step(page, 2);
      await step(page, 1);
      const next = page.getByRole("button", {
        name: old === "件名" ? "本文をコピー" : "件名をコピー",
        exact: true,
      });
      await next.click();
      const before = await saved(page);
      await settle(page, 0, failure);
      expect(await saved(page)).toEqual(before);
      await expect(next).toBeDisabled();
      await expect(page.locator(".services-practice .feedback")).toHaveText("");
      await settle(page, 1);
      expect((await saved(page)).copied).toEqual([
        old === "件名" ? "mail-body" : "mail-subject",
      ]);
      await expect(next).toBeEnabled();
    });
test("review P2-B the visible real card and approval require purpose with the same twelve fields", async ({
  page,
}) => {
  await page.goto(route);
  await step(page, 6);
  const card = page.getByLabel("実践・依頼文の全文", { exact: true });
  await expect(card).toContainText("目的・予定の説明も必須");
  await expect(card).toContainText("対象となるメール1件（件名・送信日時）");
  await expect(card).toContainText("重複の可能性");
  await page
    .getByLabel(
      "今回提示された1件の全項目・目的・対象カレンダーと原文・重複なしを照合した（保存しない自己申告）",
      { exact: true },
    )
    .check();
  await expect(page.getByLabel("実践・最終実行指示の全文")).toContainText(
    "目的・予定の説明：【記入欄】",
  );
  await expect(page.getByLabel("実践・最終実行指示の全文")).toHaveText(
    executionPractice,
  );
  await step(page, 7);
  await expect(
    page.getByText(/Geminiの「作成しました」だけでは確認完了にしません/),
  ).toBeVisible();
});
test("review P3 past history and current status remain distinct through retry and reload", async ({
  page,
}) => {
  await page.goto(route);
  await page.evaluate(
    (key) =>
      localStorage.setItem(
        key,
        JSON.stringify({
          step: 4,
          performed: [4],
          verified: [4],
          status: { 4: 1 },
          copied: ["step-1"],
        }),
      ),
    practiceKey,
  );
  await page.reload();
  const history = page.getByRole("group", {
    name: "これまでの学習記録（自己申告・外部結果は教材未検証）",
    exact: true,
  });
  await expect(history).toBeVisible();
  await expect(
    history.getByLabel("実操作を自分で実施した（自己申告）", { exact: true }),
  ).toBeChecked();
  await expect(
    history.getByLabel("実結果を自分で確認した（自己申告）", { exact: true }),
  ).toBeChecked();
  const current = page.getByRole("group", {
    name: "現在の学習状態",
    exact: true,
  });
  await expect(current.getByRole("combobox")).toHaveValue("1");
  await expect(
    page.getByText(
      "過去に実操作・結果確認をした後、現在は利用できない場合もあります。再挑戦しても過去の記録は残ります。",
      { exact: true },
    ),
  ).toBeVisible();
  await page.getByText("実践・模擬の記録一覧", { exact: true }).click();
  const row = page
    .locator(".services-practice li")
    .filter({ hasText: "STEP 4A メールを探す：" });
  await expect(row).toContainText(
    "これまでの学習記録：実操作 自己申告あり／結果確認 自己申告あり",
  );
  await expect(row).toContainText("現在の学習状態：利用できず未実施");
  await page
    .getByRole("button", { name: "この工程を再挑戦", exact: true })
    .click();
  expect((await saved(page)).performed).toEqual([4]);
  expect((await saved(page)).verified).toEqual([4]);
  expect((await saved(page)).status).toEqual({ 4: 0 });
  expect((await saved(page)).copied).toEqual(["step-1"]);
  await page.reload();
  await expect(history.getByRole("checkbox").first()).toBeChecked();
  await expect(current.getByRole("combobox")).toHaveValue("0");
});

test("all nine tasks support forward/back keyboard navigation and return from an external tab", async ({
  page,
  context,
}) => {
  await page.goto(route);
  await expect(page.locator("h1")).toBeFocused();
  const labels = [
    "STEP 0 学習環境",
    "STEP 1 Gmailの準備",
    "STEP 2 Calendarの準備",
    "STEP 3 Geminiの接続準備",
    "STEP 4A メールを探す",
    "STEP 4B 原メールと照合",
    "STEP 4C 予定作成を依頼",
    "STEP 4D 実登録を確認",
    "STEP 4E 依頼を改善",
  ];
  await expect(
    page.getByRole("button", { name: "← 前の工程", exact: true }),
  ).toBeDisabled();
  for (let n = 1; n < 9; n++) {
    await page.getByRole("button", { name: "次の工程 →", exact: true }).focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#practice-heading")).toHaveText(labels[n]);
    await expect(page.locator("#practice-heading")).toBeFocused();
  }
  await expect(
    page.getByRole("button", { name: "次の工程 →", exact: true }),
  ).toBeDisabled();
  for (let n = 7; n >= 0; n--) {
    await page.getByRole("button", { name: "← 前の工程", exact: true }).click();
    await expect(page.locator("#practice-heading")).toHaveText(labels[n]);
    await expect(page.locator("#practice-heading")).toBeFocused();
  }
  await step(page, 1);
  // Local stub verifies tab/return behavior without accessing a real Google account.
  await context.route("https://mail.google.com/**", (route) =>
    route.fulfill({
      contentType: "text/html",
      body: "<h1>External tab test stub</h1>",
    }),
  );
  const opened = page.waitForEvent("popup");
  await page.getByRole("link", { name: "Gmailを開く ↗", exact: true }).click();
  const popup = await opened;
  await expect(popup.locator("h1")).toHaveText("External tab test stub");
  await popup.close();
  await page.bringToFront();
  await expect(page.locator("#practice-heading")).toHaveText(labels[1]);
  await page.reload();
  await expect(page.locator("#practice-heading")).toHaveText(labels[1]);
});
for (const width of [320, 375])
  test(`P3 targeted mail notifications stay local and invalidate at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await clipboard(page);
    await page.goto(route);
    await step(page, 1);
    const subject = page.getByRole("button", { name: "件名をコピー", exact: true });
    const body = page.getByRole("button", { name: "本文をコピー", exact: true });
    const subjectArea = subject.locator("..");
    const bodyArea = body.locator("..");
    await subject.click();
    await settle(page, 0);
    await expect(subjectArea.getByRole("status")).toContainText("件名をコピーしました");
    await expect(subjectArea.getByRole("status")).toContainText("送信や実行はしていません");
    await expect(subjectArea.getByRole("status")).toBeInViewport();
    await body.click();
    await expect(subjectArea.getByRole("status")).toBeEmpty();
    await expect(bodyArea.getByRole("status")).not.toContainText("コピーしました");
    await settle(page, 1, true);
    await expect(bodyArea.getByRole("status")).toContainText("本文をコピーできませんでした");
    await expect(bodyArea.getByRole("status")).toContainText("本文の全文を選択して手動でコピー");
    await expect(bodyArea.getByRole("status")).toBeInViewport();
    expect((await saved(page)).copied).toEqual(["mail-subject"]);
    await body.click();
    await expect(bodyArea.getByRole("status")).toBeEmpty();
    await settle(page, 2);
    await expect(bodyArea.getByRole("status")).toContainText("本文をコピーしました");
    await subject.click();
    await step(page, 2);
    await step(page, 1);
    await body.click();
    await settle(page, 4);
    const notice = await bodyArea.getByRole("status").textContent();
    await settle(page, 3, true);
    await expect(bodyArea.getByRole("status")).toHaveText(notice!);
    await step(page, 2);
    await step(page, 1);
    await expect(page.locator(".services-practice .feedback")).toBeEmpty();
    await subject.click();
    await settle(page, 5, true);
    await expect(subjectArea.getByRole("status")).toContainText("件名をコピーできませんでした");
    await expect(subjectArea.getByRole("status")).toContainText("件名の全文を選択して手動でコピー");
  });
