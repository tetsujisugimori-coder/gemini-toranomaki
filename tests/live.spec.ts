import { test, expect, type Page } from "@playwright/test";
import {
  conversations,
  followups,
  frames,
  livePrompt,
  shareChoices,
  sharingCases,
} from "../src/live-data";
import { liveKey } from "../src/live-storage";
const step = async (p: Page, n: number) => {
  await p.getByRole("button", { name: new RegExp(`^${n}\\. `) }).click();
  await expect(p.locator("#live-step")).toBeFocused();
};
const complete = (p: Page) =>
  p.getByLabel("第5章の学習を完了した（自己申告）", { exact: true });
const record = (p: Page) =>
  p.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "null"), liveKey);
const copyButton = (p: Page) =>
  p.getByRole("button", { name: "発言例を全文コピー", exact: true });
const feedback = (p: Page) => p.locator(".live-chapter > .feedback").first();
async function reset(p: Page) {
  await p
    .getByRole("button", { name: "第5章の記録だけを初期化", exact: true })
    .click();
  await p
    .getByRole("button", { name: "第5章を初期化する", exact: true })
    .click();
}
async function clipboard(p: Page) {
  await p.addInitScript(() =>
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: async (text: string) => {
          (window as unknown as { copiedText: string }).copiedText = text;
        },
      },
    }),
  );
}
interface CopyCall {
  promise: Promise<void>;
  resolve: () => void;
  reject: (error: Error) => void;
}
type CopyWindow = Window & { liveCopies: CopyCall[] };
async function deferred(p: Page) {
  await p.addInitScript(() => {
    const calls: CopyCall[] = [];
    (window as CopyWindow).liveCopies = calls;
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: () => {
          const c = {} as CopyCall;
          c.promise = new Promise<void>((resolve, reject) => {
            c.resolve = resolve;
            c.reject = reject;
          });
          calls.push(c);
          return c.promise;
        },
      },
    });
  });
}
async function settle(p: Page, index: number, outcome: "success" | "failure") {
  await p.evaluate(
    async ({ index, outcome }) => {
      const c = (window as CopyWindow).liveCopies[index];
      if (outcome === "success") c.resolve();
      else c.reject(Error("denied"));
      await c.promise.catch(() => {});
      await new Promise<void>((r) => requestAnimationFrame(() => r()));
    },
    { index, outcome },
  );
}

test("chapter five is reachable from curriculum and chapter-one feature map while six remains planned", async ({
  page,
}) => {
  await page.goto("#curriculum");
  await page.locator(".chapter-row").nth(4).click();
  await expect(page.locator("h1")).toHaveText("Gemini Live");
  await expect(page.locator("h1")).toBeFocused();
  await expect(
    page.getByText("カメラで物を見せながら質問", { exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "第1章を学ぶ", exact: true }).click();
  await page.getByLabel("やりたいこと").selectOption("photo");
  const link = page
    .locator(".map-results")
    .getByRole("link", { name: /第5章/ });
  await expect(link).toContainText("学習できます");
  await link.click();
  await expect(page.locator("h1")).toBeFocused();
  await page.goto("#chapter-6");
  await expect(
    page.getByRole("heading", { name: "準備中", exact: true }),
  ).toBeVisible();
});

test("both conversation topics change substantively, explain why, and clear only the current check", async ({
  page,
}) => {
  await page.goto("#chapter-5");
  for (const c of conversations) {
    await page
      .getByRole("combobox", { name: "会話の題材", exact: true })
      .selectOption(c.id);
    await expect(page.getByText(c.initial, { exact: true })).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await page
        .getByRole("button", { name: followups[i], exact: true })
        .click();
      await expect(
        page.getByRole("heading", { name: "追加発言後の回答例", exact: true }),
      ).toBeFocused();
      await expect(
        page.getByText(c.replies[i][0], { exact: true }),
      ).toBeVisible();
      await expect(
        page.getByRole("status").filter({ hasText: c.replies[i][1] }),
      ).toBeVisible();
      expect((await record(page)).conversationAnswer).toBeNull();
      await page.getByLabel("短くなれば必ず正しい", { exact: true }).check();
      await expect(page.getByText(/もう一度考えてみましょう/)).toBeVisible();
      await page
        .getByLabel("変わった点と元の意味を比べ、不明な部分を聞き直す", {
          exact: true,
        })
        .check();
    }
  }
  await page.reload();
  await expect(
    page.getByRole("button", { name: followups[3], exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect((await record(page)).history).toHaveLength(8);
});

test("every static frame and text alternative agrees with visible evidence, resets current checks, and gates the answer key", async ({
  page,
}) => {
  await page.goto("#chapter-5");
  await step(page, 2);
  for (const f of frames) {
    await page.getByRole("button", { name: f.title, exact: true }).click();
    await expect(
      page.getByRole("heading", {
        name: `現在の条件：${f.title}（ライブ映像ではありません）`,
      }),
    ).toBeFocused();
    await expect(
      page.getByRole("button", { name: "答え合わせの正本を開く", exact: true }),
    ).toBeDisabled();
    await expect(
      page.getByText("答え合わせ専用の正本データ", { exact: true }),
    ).toHaveCount(0);
    const image = page.getByRole("img");
    await expect(image).toHaveAccessibleDescription(
      `${f.visible} ${f.unknown}`,
    );
    if (f.id !== "zoom") await expect(image).not.toContainText("48g");
    if (f.id === "blur")
      await expect(image).not.toContainText("ほしのこクッキー");
    if (f.id === "zoom")
      await expect(image).not.toContainText("ほしのこクッキー");
    await page
      .getByLabel("図の代わりに文字で判断する", { exact: true })
      .check();
    await expect(page.getByLabel("現在の表示の文字による代替")).toContainText(
      f.visible,
    );
    await expect(page.getByLabel("現在の表示の文字による代替")).toContainText(
      f.unknown,
    );
    const group = page.getByRole("group", { name: f.question, exact: true });
    await group
      .getByLabel(f.options[(f.answer + 1) % 3], { exact: true })
      .check();
    await expect(group.getByRole("status")).toContainText(f.reason);
    await expect(page.getByText(f.bad, { exact: true })).toBeVisible();
    await expect(page.getByText(f.good, { exact: true })).toBeVisible();
    await group.getByLabel(f.options[f.answer], { exact: true }).check();
    await expect(group.getByRole("status")).toContainText("正解です");
    await page
      .getByRole("button", { name: "答え合わせの正本を開く", exact: true })
      .click();
    await expect(page.locator("#live-truth")).toContainText("48g");
    await expect(page.locator("#live-truth")).toContainText(
      "今の映像条件で読み取った事実にはしません",
    );
    await page
      .getByLabel("図の代わりに文字で判断する", { exact: true })
      .uncheck();
  }
  await page.reload();
  await expect(
    page.getByText("答え合わせ専用の正本データ", { exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "答え合わせの正本を開く", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "ぼけている", exact: true }).click();
  expect((await record(page)).packageAnswer).toBeNull();
  expect(
    (await record(page)).history.filter((v: string) =>
      v.startsWith("package:"),
    ),
  ).toHaveLength(4);
});

test("sharing decisions depend on purpose, show planned exposure, and distinguish start, camera stop, screen stop and end", async ({
  page,
}) => {
  await page.goto("#chapter-5");
  await step(page, 3);
  for (const s of sharingCases) {
    await page
      .getByRole("combobox", { name: "画面を見せたい目的", exact: true })
      .selectOption(s.id);
    expect((await record(page)).stopAnswer).toBeNull();
    await expect(page.getByLabel("共有前の架空画面")).toContainText(s.extra);
    await expect(
      page.getByText(/実際の画面共有・範囲指定は行いません/),
    ).toBeVisible();
    const group = page.getByRole("group", {
      name: "この目的では、何をどう見せる？",
      exact: true,
    });
    for (let i = 0; i < 3; i++) {
      await group.getByLabel(shareChoices[i], { exact: true }).check();
      await expect(group.getByRole("status")).toContainText(s.reasons[i]);
    }
    await group.getByLabel(shareChoices[s.answer], { exact: true }).check();
    await expect(group.getByRole("status")).toContainText("正解です");
    await expect(page.getByLabel("選択後の共有前判断")).toContainText(
      s.answer === 1 ? s.required : "画面は共有しない",
    );
    await page
      .getByLabel(
        "開始時の共有範囲を確認し、カメラ・画面共有・会話終了を別々に確認する",
        { exact: true },
      )
      .check();
  }
});

test("optional practice separates iOS and Android guidance, copies full fixed speech, preserves copy on display changes, and permits simulation-only completion", async ({
  page,
}) => {
  await clipboard(page);
  await page.goto("#chapter-5");
  await step(page, 4);
  await page
    .getByText("選んだ端末の公式操作・利用条件", { exact: true })
    .click();
  await expect(
    page.getByText(/iPhone \/ iPad：Geminiモバイルアプリ/),
  ).toBeVisible();
  await copyButton(page).click();
  await expect(feedback(page)).toContainText("全文をコピーしました");
  expect(
    await page.evaluate(
      () => (window as unknown as { copiedText: string }).copiedText,
    ),
  ).toBe(livePrompt("package-v1"));
  await page
    .getByRole("combobox", { name: "案内する端末", exact: true })
    .selectOption("android");
  await expect(page.getByText(/Android：Geminiモバイルアプリ/)).toBeVisible();
  expect((await record(page)).copied).toEqual(["package-v1"]);
  await expect(
    page.getByText(/ミュートだけで映像が止まったと判断しません/),
  ).toBeVisible();
  await page
    .getByRole("combobox", { name: "実演習で自分が使う物", exact: true })
    .selectOption("cup-v1");
  await expect(
    page.getByText(/現在の本文のコピー成功記録：なし/),
  ).toBeVisible();
  await expect(page.getByLabel("実アプリ演習の発言例全文")).toContainText(
    "自分の身近なコップ",
  );
  await expect(
    page.getByRole("link", {
      name: "Geminiの公式サイトを開く ↗（別タブ・任意）",
      exact: true,
    }),
  ).toHaveAttribute("target", "_blank");
  await page
    .getByRole("button", {
      name: "実アプリを使わず模擬パッケージへ戻る",
      exact: true,
    })
    .click();
  await complete(page).check();
  expect((await record(page)).tried).toBe(false);
  await page.reload();
  await expect(complete(page)).toBeChecked();
  await expect(page.getByText("1 / 10章", { exact: true })).toBeVisible();
});

test("chapter-five reset preserves all old activity keys and completion; global reset still only clears completions", async ({
  page,
}) => {
  await page.goto("#home");
  const keys = ["lab", "exploration", "services", "research", "notebook"].map(
    (k) => `gemini-toranomaki:${k}:v1`,
  );
  await page.evaluate((keys) => {
    for (const key of keys)
      localStorage.setItem(key, JSON.stringify({ preserved: key }));
    localStorage.setItem(
      "gemini-toranomaki:progress:v1",
      JSON.stringify({
        completed: ["chapter-1", "chapter-2", "chapter-3", "chapter-4"],
      }),
    );
  }, keys);
  await page.reload();
  await page.getByRole("link", { name: "第5章を学ぶ", exact: true }).click();
  await page.getByRole("button", { name: followups[0], exact: true }).click();
  await complete(page).check();
  await expect(page.getByText("5 / 10章", { exact: true })).toBeVisible();
  await reset(page);
  await expect(
    page.getByRole("button", { name: "第5章の記録だけを初期化", exact: true }),
  ).toBeFocused();
  await expect(page.getByText("4 / 10章", { exact: true })).toBeVisible();
  expect(
    await page.evaluate((key) => localStorage.getItem(key), liveKey),
  ).toBeNull();
  for (const key of keys)
    expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(
      JSON.stringify({ preserved: key }),
    );
  await page.getByRole("button", { name: followups[1], exact: true }).click();
  const before = await record(page);
  await page.getByRole("button", { name: "進捗を初期化", exact: true }).click();
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  expect(await record(page)).toEqual(before);
});

for (const deniedRead of [false, true])
  test(`corrupt storage / denied read=${deniedRead} remains usable and failed reset reports possible restoration`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ key, deniedRead }) => {
        if (deniedRead)
          Object.defineProperty(window, "localStorage", {
            get() {
              throw Error("denied");
            },
          });
        else {
          localStorage.setItem(key, "{broken");
          Storage.prototype.setItem = () => {
            throw Error("quota");
          };
          Storage.prototype.removeItem = () => {
            throw Error("denied");
          };
        }
      },
      { key: liveKey, deniedRead },
    );
    await page.goto("#chapter-5");
    await page.getByRole("button", { name: followups[0], exact: true }).click();
    await expect(
      page.getByText(conversations[0].replies[0][0], { exact: true }),
    ).toBeVisible();
    await step(page, 2);
    await page.getByRole("button", { name: "ぼけている", exact: true }).click();
    await expect(page.getByRole("img")).toHaveAccessibleDescription(
      /一文字も判読できません/,
    );
    await reset(page);
    await expect(
      page.getByText(/画面内の第5章を初期化しましたが/),
    ).toBeVisible();
    await expect(
      page.getByText(/第5章をブラウザに保存できません/),
    ).toBeVisible();
  });

test("four experiences never request media permissions, record, recognize speech or send external data", async ({
  page,
}) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (!r.url().startsWith("http://127.0.0.1:4173/")) external.push(r.url());
  });
  await page.addInitScript(() => {
    const w = window as unknown as {
      forbidden: string[];
      MediaRecorder: unknown;
      SpeechRecognition: unknown;
      webkitSpeechRecognition: unknown;
    };
    w.forbidden = [];
    const forbidden = (name: string) => () => {
      w.forbidden.push(name);
      throw Error("unexpected " + name);
    };
    Object.defineProperty(navigator, "mediaDevices", {
      configurable: true,
      value: {
        getUserMedia: forbidden("camera/mic"),
        getDisplayMedia: forbidden("screen"),
      },
    });
    w.MediaRecorder = forbidden("record");
    w.SpeechRecognition = forbidden("speech");
    w.webkitSpeechRecognition = forbidden("speech-webkit");
  });
  await page.goto("#chapter-5");
  for (let n = 1; n <= 4; n++) {
    await step(page, n);
    if (n === 1)
      await page
        .getByRole("button", { name: followups[0], exact: true })
        .click();
    if (n === 2) {
      await page
        .getByRole("button", { name: "ぼけている", exact: true })
        .click();
      await page.getByLabel(frames[2].options[2], { exact: true }).check();
      await page
        .getByRole("button", { name: "答え合わせの正本を開く", exact: true })
        .click();
    }
    if (n === 3)
      await page.getByLabel(shareChoices[1], { exact: true }).check();
    if (n === 4)
      await page
        .getByLabel("自分のアプリで試した（自己申告）", { exact: true })
        .check();
  }
  expect(
    await page.evaluate(
      () => (window as unknown as { forbidden: string[] }).forbidden,
    ),
  ).toEqual([]);
  expect(external).toEqual([]);
  await expect(
    page.locator(
      ".live-chapter audio,.live-chapter video,.live-chapter input[type=file],.live-chapter textarea,.live-chapter input[type=text]",
    ),
  ).toHaveCount(0);
});

for (const action of ["object", "reset", "leave"] as const)
  for (const outcome of ["success", "failure"] as const)
    test(`pending copy ${outcome} after ${action} cannot update current record and permits retry`, async ({
      page,
    }) => {
      await deferred(page);
      await page.goto("#chapter-5");
      await step(page, 4);
      await copyButton(page).click();
      if (action === "object")
        await page
          .getByRole("combobox", { name: "実演習で自分が使う物", exact: true })
          .selectOption("cup-v1");
      if (action === "reset") await reset(page);
      if (action === "leave") {
        await page.getByRole("link", { name: "ホーム", exact: true }).click();
        await page
          .getByRole("link", { name: "第5章を学ぶ", exact: true })
          .click();
      }
      const before = await record(page);
      await settle(page, 0, outcome);
      expect(await record(page)).toEqual(before);
      await expect(feedback(page)).toHaveText("");
      await step(page, 4);
      await expect(copyButton(page)).toBeEnabled();
      await copyButton(page).click();
      await settle(page, 1, "success");
      await expect(feedback(page)).toContainText("全文をコピーしました");
    });

for (const outcome of ["success", "failure"] as const)
  test(`same-text display changes retain pending copy and an older ${outcome} cannot disturb a newer copy`, async ({
    page,
  }) => {
    await deferred(page);
    await page.goto("#chapter-5");
    await step(page, 4);
    await copyButton(page).click();
    await page
      .getByRole("combobox", { name: "案内する端末", exact: true })
      .selectOption("android");
    await step(page, 2);
    await page
      .getByLabel("図の代わりに文字で判断する", { exact: true })
      .check();
    await settle(page, 0, "success");
    expect((await record(page)).copied).toEqual(["package-v1"]);
    expect((await record(page)).platform).toBe("android");
    expect((await record(page)).step).toBe(1);
    await step(page, 4);
    await copyButton(page).click();
    await page
      .getByRole("combobox", { name: "実演習で自分が使う物", exact: true })
      .selectOption("cup-v1");
    await copyButton(page).click();
    await settle(page, 1, outcome);
    await expect(copyButton(page)).toBeDisabled();
    await expect(feedback(page)).toHaveText("");
    expect((await record(page)).copied).toEqual(["package-v1"]);
    await settle(page, 2, "success");
    await expect(copyButton(page)).toBeEnabled();
    expect((await record(page)).copied).toEqual(["package-v1", "cup-v1"]);
  });

for (const action of ["reset", "hash"] as const)
  for (const outcome of ["success", "failure"] as const)
    test(`atomic ${action} and copy ${outcome} do not resurrect records`, async ({
      page,
    }) => {
      await deferred(page);
      await page.goto("#chapter-5");
      await step(page, 4);
      await copyButton(page).click();
      if (action === "reset")
        await page
          .getByRole("button", { name: "第5章の記録だけを初期化", exact: true })
          .click();
      const before = await record(page);
      await page.evaluate(
        async ({ action, outcome }) => {
          if (action === "reset")
            [...document.querySelectorAll("button")]
              .find((b) => b.textContent === "第5章を初期化する")!
              .click();
          else location.hash = "chapter-4";
          const c = (window as CopyWindow).liveCopies[0];
          if (outcome === "success") c.resolve();
          else c.reject(Error("denied"));
          await c.promise.catch(() => {});
          await new Promise<void>((r) => requestAnimationFrame(() => r()));
        },
        { action, outcome },
      );
      expect(await record(page)).toEqual(action === "reset" ? null : before);
      if (action === "reset") await expect(feedback(page)).toHaveText("");
      else {
        await page
          .getByRole("link", { name: "第5章を学ぶ", exact: true })
          .click();
        await expect(feedback(page)).toHaveText("");
      }
    });

test("current copy failure supports manual copy and retry without claiming success", async ({
  page,
}) => {
  await deferred(page);
  await page.goto("#chapter-5");
  await step(page, 4);
  await copyButton(page).click();
  await settle(page, 0, "failure");
  await expect(feedback(page)).toContainText("手動でコピー");
  expect((await record(page)).copied).toEqual([]);
  await expect(copyButton(page)).toBeEnabled();
  await copyButton(page).click();
  await settle(page, 1, "success");
  expect((await record(page)).copied).toEqual(["package-v1"]);
});

for (const width of [320, 375, 390, 1280])
  test(`live experiences fit ${width}px in both themes with keyboard and focus`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ colorScheme: "light" });
    await page.goto("#chapter-5");
    for (const theme of ["light", "dark"]) {
      if (theme === "dark")
        await page
          .getByRole("button", { name: "ダークテーマに切り替え", exact: true })
          .click();
      for (let n = 1; n <= 4; n++) {
        const b = page.getByRole("button", { name: new RegExp(`^${n}\\. `) });
        await b.focus();
        await page.keyboard.press("Enter");
        await expect(page.locator("#live-step")).toBeFocused();
        if (n === 1) {
          const follow = page.getByRole("button", {
            name: followups[0],
            exact: true,
          });
          await follow.focus();
          await page.keyboard.press("Enter");
          await expect(
            page.getByRole("heading", {
              name: "追加発言後の回答例",
              exact: true,
            }),
          ).toBeFocused();
        }
        if (n === 2) {
          const frame = page.getByRole("button", {
            name: "一部が隠れている",
            exact: true,
          });
          await frame.focus();
          await page.keyboard.press("Enter");
          await expect(
            page.getByRole("heading", { name: /現在の条件：一部が隠れている/ }),
          ).toBeFocused();
          await page.getByLabel(frames[3].options[1], { exact: true }).check();
          await page
            .getByRole("button", {
              name: "答え合わせの正本を開く",
              exact: true,
            })
            .click();
        }
        if (n === 3)
          await page.getByLabel(shareChoices[1], { exact: true }).check();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
    }
  });

test("failed writes and deletion keep temporary learning usable, cancel restores focus, and reload accurately restores the old saved record", async ({
  page,
}) => {
  await page.goto("#chapter-5");
  await page.getByRole("button", { name: followups[0], exact: true }).click();
  await complete(page).check();
  const old = await record(page);
  await page.evaluate(() => {
    Storage.prototype.setItem = () => {
      throw Error("quota");
    };
    Storage.prototype.removeItem = () => {
      throw Error("denied");
    };
  });
  await page.getByRole("button", { name: followups[3], exact: true }).click();
  await expect(
    page.getByText(conversations[0].replies[3][0], { exact: true }),
  ).toBeVisible();
  expect(await record(page)).toEqual(old);
  const resetButton = page.getByRole("button", {
    name: "第5章の記録だけを初期化",
    exact: true,
  });
  await resetButton.click();
  await page.getByRole("button", { name: "キャンセル", exact: true }).click();
  await expect(resetButton).toBeFocused();
  await expect(complete(page)).toBeChecked();
  await reset(page);
  await expect(complete(page)).not.toBeChecked();
  await expect(page.getByText(/画面内の第5章を初期化しましたが/)).toBeVisible();
  await page.reload();
  await expect(complete(page)).toBeChecked();
  await expect(
    page.getByRole("button", { name: followups[0], exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  expect(await record(page)).toEqual(old);
});
