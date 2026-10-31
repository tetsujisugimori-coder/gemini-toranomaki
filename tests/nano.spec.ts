import { test, expect, type Page } from "@playwright/test";
import { nanoKey } from "../src/nano-storage";
import {
  imagePrompt,
  tasks,
  regions,
  editPrompt,
  defaultEdit,
  repairPrompt,
  characterPrompt,
} from "../src/nano-data";
const stepNames = [
  "1. 画像生成工房",
  "2. 部分修正チャレンジ",
  "3. 画像の間違い探し",
  "4. キャラクターを育てる",
];
async function step(page: Page, n: number) {
  await page.getByRole("button", { name: stepNames[n], exact: true }).click();
  await expect(
    page.getByRole("heading", { name: `体験${n + 1}の操作` }),
  ).toBeFocused();
}
async function openChallenge(page: Page, n = 0, mode = 2) {
  await step(page, mode);
  await page.getByLabel("比較課題", { exact: true }).selectOption(String(n));
  await page
    .getByRole("radio", { name: "指定した部位だけが変わると思う", exact: true })
    .check();
  await page.getByRole("button", { name: "予想を固定して比較を開く" }).click();
  await expect(page.getByRole("slider")).toBeVisible();
}
async function submit(page: Page) {
  await page.getByRole("button", { name: "観察結果を確定" }).click();
  await expect(
    page.getByRole("heading", { name: "観察の答え合わせ" }),
  ).toBeFocused();
}
async function clipboard(page: Page, mode = "success") {
  await page.addInitScript((mode) => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: (text: string) => {
          const w = window as unknown as {
            copied: string;
            finish: () => void;
            reject: () => void;
          };
          w.copied = text;
          if (mode === "reject") return Promise.reject(Error("denied"));
          if (mode === "pending")
            return new Promise<void>((resolve, reject) => {
              w.finish = resolve;
              w.reject = () => reject(Error("denied"));
            });
          return Promise.resolve();
        },
      },
    });
  }, mode);
}
async function settle(page: Page, fail = false) {
  await page.evaluate((fail) => {
    const w = window as unknown as { finish: () => void; reject: () => void };
    (fail ? w.reject : w.finish)();
  }, fail);
}
async function stored(page: Page) {
  return page.evaluate(
    (key) => JSON.parse(localStorage.getItem(key) ?? "{}"),
    nanoKey,
  );
}
test("chapter navigation and intro connect to chapter7 while chapter10 stays planned", async ({
  page,
}) => {
  await page.goto("#curriculum");
  await page.locator(".chapter-row").nth(6).click();
  await expect(page.locator("h1")).toHaveText(
    "Nano Banana：画像生成と部分修正を試す",
  );
  await page.getByRole("link", { name: "第1章を学ぶ", exact: true }).click();
  await page.getByLabel("やりたいこと").selectOption("illustration");
  await page.locator(".map-results a").click();
  await expect(page).toHaveURL(/#chapter-7$/);
  await page.goto("#lab-image");
  await expect(
    page.getByRole("link", { name: /第7章 Nano Banana/ }),
  ).toBeVisible();
  await page.goto("#chapter-10");
  await expect(
    page.getByRole("heading", { name: "準備中", exact: true }),
  ).toBeVisible();
});
test("workshop predicts before display and renders four independent conditions with exact text", async ({
  page,
}) => {
  await clipboard(page);
  await page.goto("#chapter-7");
  await expect(page.locator(".nano-art")).toHaveCount(0);
  await page.getByLabel("主役", { exact: true }).selectOption("1");
  await page.getByLabel("背景", { exact: true }).selectOption("2");
  await page.getByLabel("画風", { exact: true }).selectOption("1");
  await page.getByLabel("構図", { exact: true }).selectOption("1");
  const p = imagePrompt({
    subject: 1,
    background: 2,
    style: 1,
    composition: 1,
  });
  await expect(page.getByRole("textbox", { name: "指示文全文" })).toHaveValue(
    p,
  );
  await page
    .getByRole("radio", { name: "選んだ主役・背景・画風・構図", exact: true })
    .check();
  await page
    .getByRole("button", { name: "条件を固定して模擬画像を表示" })
    .click();
  const art = page.locator(".nano-art");
  await expect(art).toHaveAttribute("data-subject", "ロボットの料理人");
  await expect(art).toHaveAttribute("data-style", "水彩画");
  await expect(art).toHaveAttribute("data-background", "未来都市のカフェ");
  await expect(art).toHaveAttribute("data-composition", "上半身");
  await expect(page.getByText(/目的に必要な主役・場面/)).toHaveCount(0);
  await page.getByRole("button", { name: "観察して理由を確認" }).click();
  await expect(page.getByText(/目的に必要な主役・場面/)).toBeVisible();
  await page.getByLabel("主役", { exact: true }).selectOption("1");
  await expect(art).toHaveCount(1);
  await page.getByRole("button", { name: "指示文を全文コピー" }).click();
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { copied: string }).copied),
    )
    .toBe(p);
  await page.getByLabel("主役", { exact: true }).selectOption("2");
  await expect(art).toHaveCount(0);
  await expect(page.getByText(/この本文のコピー成功履歴/)).toHaveCount(0);
  await page.getByLabel("主役", { exact: true }).selectOption("1");
  await expect(page.getByRole("textbox")).toHaveValue(p);
  await expect(page.getByText(/この本文のコピー成功履歴/)).toBeVisible();
});
for (let n = 0; n < 3; n++)
  test(`partial edit ${n} exact instruction, alignment and observation`, async ({
    page,
  }) => {
    await page.goto("#chapter-7");
    await openChallenge(page, n, 1);
    await expect(page.getByRole("textbox")).toHaveValue(
      editPrompt(n, {
        ...defaultEdit,
        target: regions.findIndex((r) => r.id === tasks[n].target),
        result: n,
      }),
    );
    const svgs = page.locator(".nano-stage svg");
    await expect(svgs).toHaveCount(2);
    const boxes = await svgs.evaluateAll((es) =>
      es.map((e) => {
        const b = e.getBoundingClientRect();
        return {
          x: b.x,
          y: b.y,
          w: b.width,
          h: b.height,
          viewBox: e.getAttribute("viewBox"),
        };
      }),
    );
    expect(boxes[0]).toEqual(boxes[1]);
    await page.getByRole("slider").focus();
    await page.keyboard.press("Home");
    await expect(page.getByRole("slider")).toHaveValue("0");
    await page.keyboard.press("End");
    await expect(page.getByRole("slider")).toHaveValue("100");
    await page.getByRole("button", { name: "変更前だけ", exact: true }).click();
    await expect(page.locator(".nano-stage")).toHaveAttribute(
      "data-view",
      "before",
    );
    await page.getByRole("button", { name: "変更後だけ", exact: true }).click();
    await page
      .getByRole("checkbox", {
        name: regions.find((r) => r.id === tasks[n].target)!.label,
        exact: true,
      })
      .check();
    await submit(page);
    await expect(
      page.getByRole("status").filter({ hasText: "観察は一致" }),
    ).toBeVisible();
    await expect
      .poll(async () => (await stored(page)).history)
      .toEqual([`edit:${tasks[n].id}`]);
    await page.getByLabel("比較課題", { exact: true }).selectOption(String(n));
    await expect(
      page.getByRole("heading", { name: "観察の答え合わせ" }),
    ).toBeVisible();
  });
test("incomplete edit conditions hold simulation and new conditions require fresh prediction", async ({
  page,
}) => {
  await page.goto("#chapter-7");
  await step(page, 1);
  await page.getByLabel(/維持する対象：/).uncheck();
  await page
    .getByRole("radio", { name: "指定した部位だけが変わると思う", exact: true })
    .check();
  await page.getByRole("button", { name: "予想を固定して比較を開く" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "保留" }),
  ).toBeVisible();
  await expect(page.locator(".nano-comparison")).toHaveCount(0);
  await page.getByLabel(/維持する対象：/).check();
  await expect(
    page.getByRole("button", { name: "予想を固定して比較を開く" }),
  ).toBeDisabled();
  await expect(page.getByText(/課題と指示の対象/)).toHaveCount(0);
});
for (let n = 0; n < 3; n++)
  test(`find ${n}: wrong/missing/extra answers, text alternative, repair and retry`, async ({
    page,
  }) => {
    await clipboard(page);
    await page.goto("#chapter-7");
    await step(page, 2);
    await page.getByLabel("比較課題", { exact: true }).selectOption(String(n));
    await expect(
      page.getByText(tasks[n].evidence, { exact: false }),
    ).toHaveCount(0);
    await openChallenge(page, n);
    await page
      .getByText("文字で観察する（画像の代替）", { exact: true })
      .click();
    await expect(page.getByText(/^変更後：帽子/)).toBeVisible();
    const target = regions.find((r) => r.id === tasks[n].target)!.label,
      other = regions.find((r) => r.id === tasks[n].unexpected)!.label;
    await page.getByRole("checkbox", { name: target, exact: true }).check();
    await submit(page);
    await expect(page.getByText(/もう一度、変更前後/)).toBeVisible();
    await expect(
      page.getByText(new RegExp(`見逃した箇所：${other}`)),
    ).toBeVisible();
    await page.getByRole("checkbox", { name: other, exact: true }).check();
    await expect(
      page.getByRole("heading", { name: "観察の答え合わせ" }),
    ).toHaveCount(0);
    await submit(page);
    await expect(
      page.getByText("観察は一致しています。", { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole("textbox")).toHaveValue(
      repairPrompt(n, [true, true, true, true]),
    );
    await page.getByRole("button", { name: "指示文を全文コピー" }).click();
    await expect(page.getByText(/この本文のコピー成功履歴/)).toBeVisible();
    await page
      .getByRole("checkbox", { name: "修正後の確認方法", exact: true })
      .uncheck();
    await expect(page.getByRole("textbox")).toHaveValue(
      repairPrompt(n, [true, true, true, false]),
    );
    await expect(page.getByText(/この本文のコピー成功履歴/)).toHaveCount(0);
    await page.getByRole("checkbox", { name: "耳", exact: true }).check();
    await submit(page);
    await expect(page.getByText(/変化していない部位の指摘：耳/)).toBeVisible();
    await page.getByRole("button", { name: "予想から再挑戦" }).click();
    await expect(
      page.getByRole("heading", { name: "観察の答え合わせ" }),
    ).toHaveCount(0);
    await expect(page.getByRole("slider")).toHaveCount(0);
    await expect(page.getByText(/前回の回答履歴/)).toBeVisible();
  });
test("scaled image pointer and keyboard selections match text answers, range uses pointer", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("#chapter-7");
  await openChallenge(page);
  const image = page.locator(".nano-pointing svg");
  await image.scrollIntoViewIfNeeded();
  const b = (await image.boundingBox())!;
  await page.mouse.click(
    b.x + (b.width * 300) / 600,
    b.y + (b.height * 108) / 440,
  );
  await expect(
    page.getByRole("checkbox", { name: "料理帽", exact: true }),
  ).toBeChecked();
  await page.getByRole("button", { name: "目を指摘", exact: true }).focus();
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("checkbox", { name: "目", exact: true }),
  ).toBeChecked();
  await submit(page);
  await expect(
    page.getByText("観察は一致しています。", { exact: true }),
  ).toBeVisible();
  const range = page.getByRole("slider");
  await range.scrollIntoViewIfNeeded();
  const rb = (await range.boundingBox())!;
  await page.mouse.click(rb.x + rb.width * 0.75, rb.y + rb.height / 2);
  expect(Number(await range.inputValue())).toBeGreaterThan(60);
  expect(Number(await range.inputValue())).toBeLessThan(90);
});
test("touch range and image regions use native pointer targets", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
      hasTouch: true,
      viewport: { width: 390, height: 844 },
    }),
    page = await context.newPage();
  await page.goto(baseURL + "#chapter-7");
  await openChallenge(page);
  const slider = page.getByRole("slider");
  await slider.scrollIntoViewIfNeeded();
  const b = (await slider.boundingBox())!;
  await page.touchscreen.tap(b.x + b.width * 0.25, b.y + b.height / 2);
  expect(Number(await slider.inputValue())).toBeLessThan(40);
  await page.getByRole("button", { name: "料理帽を指摘", exact: true }).tap();
  await expect(
    page.getByRole("checkbox", { name: "料理帽", exact: true }),
  ).toBeChecked();
  await context.close();
});
test("task histories stay separate, explanations and selection do not revive after switch/reload", async ({
  page,
}) => {
  await page.goto("#chapter-7");
  await openChallenge(page);
  await page.getByRole("checkbox", { name: "目", exact: true }).check();
  await submit(page);
  await page.getByLabel("比較課題", { exact: true }).selectOption("1");
  await expect(page.getByText(/前回の回答履歴/)).toHaveCount(0);
  await page.getByLabel("比較課題", { exact: true }).selectOption("0");
  await expect(page.getByText(/前回の回答履歴：目/)).toBeVisible();
  await expect(page.getByRole("slider")).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "画像の間違い探し", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("slider")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "観察の答え合わせ" }),
  ).toHaveCount(0);
  await expect
    .poll(async () => (await stored(page)).answers["find:hat-v1"])
    .toEqual(["eyes"]);
});
test("character all feature decisions, scenes and prompts stay separate from workshop", async ({
  page,
}) => {
  await page.goto("#chapter-7");
  await page.getByLabel("主役", { exact: true }).selectOption("2");
  await step(page, 3);
  await page.getByRole("checkbox", { name: "耳の特徴", exact: true }).uncheck();
  await expect(page.getByRole("textbox")).toHaveValue(
    characterPrompt([0, 1, 3, 4]),
  );
  for (const n of [0, 1, 2]) {
    await page
      .getByLabel("比較する場面", { exact: true })
      .selectOption(String(n));
    await page
      .getByRole("radio", { name: "必ず同じになる", exact: true })
      .check();
    await page
      .getByRole("button", { name: "予想を固定して場面を比較" })
      .click();
    await expect(page.locator(".nano-pair svg")).toHaveCount(2);
    const groups = page
      .locator("fieldset")
      .filter({ has: page.getByText(/は一致していますか？/) });
    await expect(groups).toHaveCount(5);
    for (let i = 0; i < 5; i++)
      await groups
        .nth(i)
        .getByRole("radio", {
          name: i === 0 && n === 2 ? "一致していない" : "一致している",
          exact: true,
        })
        .check();
    await page.getByRole("button", { name: "特徴の判断を確定" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "判断は一致" }),
    ).toBeVisible();
    if (n === 0) {
      await page.getByLabel("比較する場面", { exact: true }).selectOption("0");
      await expect(
        page.getByRole("status").filter({ hasText: "判断は一致" }),
      ).toBeVisible();
    }
  }
  await step(page, 0);
  await expect(page.getByLabel("主役", { exact: true })).toHaveValue("2");
});
test("copy refusal shows manual full text and no false history", async ({
  page,
}) => {
  await clipboard(page, "reject");
  await page.goto("#chapter-7");
  await page.getByRole("button", { name: "指示文を全文コピー" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "コピーできません" }),
  ).toBeVisible();
  await expect(page.getByRole("textbox")).toHaveAttribute("readonly", "");
  await expect.poll(async () => (await stored(page)).copied ?? []).toEqual([]);
});
for (const fail of [false, true])
  for (const action of ["text", "step", "reset", "leave"])
    test(`pending copy ${fail ? "failure" : "success"} after ${action} cannot record or notify`, async ({
      page,
    }) => {
      await clipboard(page, "pending");
      await page.goto("#chapter-7");
      await page.getByRole("button", { name: "指示文を全文コピー" }).click();
      await expect(
        page.getByRole("button", { name: "指示文を全文コピー" }),
      ).toBeDisabled();
      if (action === "text")
        await page.getByLabel("主役", { exact: true }).selectOption("1");
      if (action === "step") await step(page, 3);
      if (action === "reset") {
        await page.getByRole("button", { name: "第7章だけを初期化" }).click();
        await page.getByRole("button", { name: "第7章の記録を消す" }).click();
      }
      if (action === "leave") {
        await page
          .getByRole("link", { name: "第1章を学ぶ", exact: true })
          .click();
        await expect(page.locator("h1")).toHaveText("Geminiの画面とモデル選択");
      }
      await settle(page, fail);
      await expect(
        page.getByText(/全文をコピーしました|コピーできませんでした/),
      ).toHaveCount(0);
      expect((await stored(page)).copied ?? []).toEqual([]);
      if (action === "leave")
        await page
          .getByRole("link", { name: "第7章を学ぶ", exact: true })
          .click();
      await expect(
        page.getByRole("button", { name: "指示文を全文コピー" }),
      ).toBeEnabled();
    });
test("same text display changes preserve copied success and do not duplicate history", async ({
  page,
}) => {
  await clipboard(page);
  await page.goto("#chapter-7");
  await openChallenge(page, 0, 1);
  await page.getByRole("button", { name: "指示文を全文コピー" }).click();
  await expect(page.getByText(/この本文のコピー成功履歴/)).toBeVisible();
  await page.getByRole("button", { name: "変更前だけ", exact: true }).click();
  await expect(page.getByText(/この本文のコピー成功履歴/)).toBeVisible();
  await page.getByRole("checkbox", { name: "料理帽", exact: true }).check();
  await submit(page);
  await submit(page);
  expect((await stored(page)).history).toEqual(["edit:hat-v1"]);
  expect((await stored(page)).copied).toHaveLength(1);
});
for (const failure of ["quota", "read", "corrupt"])
  test(`storage ${failure} stays usable and does not alter existing chapter records`, async ({
    page,
  }) => {
    await page.addInitScript(
      ({ failure, key }) => {
        localStorage.setItem(
          "gemini-toranomaki:canvas:v1",
          '{"history":["old"]}',
        );
        if (failure === "corrupt") localStorage.setItem(key, "{bad");
        if (failure === "quota") {
          localStorage.setItem(key, JSON.stringify({ image: { subject: 2 } }));
          Storage.prototype.setItem = () => {
            throw new DOMException("quota", "QuotaExceededError");
          };
        }
        if (failure === "read")
          Object.defineProperty(window, "localStorage", {
            get() {
              throw Error("denied");
            },
          });
      },
      { failure, key: nanoKey },
    );
    await page.goto("#chapter-7");
    if (failure !== "quota")
      await expect(page.getByRole("alert")).toContainText("保存できません");
    await page.getByLabel("背景", { exact: true }).selectOption("1");
    await expect(page.getByLabel("背景", { exact: true })).toHaveValue("1");
    if (failure !== "corrupt")
      await expect(page.getByRole("alert")).toContainText("旧記録が復帰");
    if (failure === "quota") {
      await page.reload();
      await expect(page.getByLabel("主役", { exact: true })).toHaveValue("2");
      await expect(page.getByLabel("背景", { exact: true })).toHaveValue("0");
    }
    if (failure !== "read")
      expect(
        await page.evaluate(() =>
          localStorage.getItem("gemini-toranomaki:canvas:v1"),
        ),
      ).toBe('{"history":["old"]}');
  });
test("chapter7 reset and global completion reset protect old records and independent completions", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!sessionStorage.getItem("seeded")) {
      localStorage.setItem(
        "gemini-toranomaki:progress:v1",
        JSON.stringify({ completed: ["chapter-1", "chapter-6"] }),
      );
      localStorage.setItem(
        "gemini-toranomaki:canvas:v1",
        '{"history":["old"]}',
      );
      localStorage.setItem("gemini-toranomaki:lab:v1", '{"old":true}');
      sessionStorage.setItem("seeded", "true");
    }
  });
  await page.goto("#chapter-7");
  await page.getByLabel(/第7章を学習した/).check();
  await page.getByLabel("主役", { exact: true }).selectOption("2");
  await page.getByRole("button", { name: "第7章だけを初期化" }).click();
  await page.getByRole("button", { name: "キャンセル", exact: true }).click();
  await expect(page.getByLabel("主役", { exact: true })).toHaveValue("2");
  await page.getByRole("button", { name: "第7章だけを初期化" }).click();
  await page.getByRole("button", { name: "第7章の記録を消す" }).click();
  await expect(
    page.getByRole("button", { name: "第7章だけを初期化" }),
  ).toBeFocused();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("gemini-toranomaki:progress:v1")!)
          .completed,
    ),
  ).toEqual(["chapter-1", "chapter-6"]);
  expect(
    await page.evaluate(() =>
      localStorage.getItem("gemini-toranomaki:canvas:v1"),
    ),
  ).toBe('{"history":["old"]}');
  await page.getByLabel("主役", { exact: true }).selectOption("1");
  await page.getByRole("button", { name: "進捗を初期化", exact: true }).click();
  await page.getByRole("button", { name: "初期化する", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("主役", { exact: true })).toHaveValue("1");
});
for (const width of [320, 375, 390, 1280])
  test(`both themes, keyboard, reduced motion and no overflow ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("#chapter-7");
    await expect(page.locator("html")).toHaveAttribute(
      "data-theme",
      /^(light|dark)$/,
    );
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
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      for (const s of [0, 1, 2, 3]) {
        await step(page, s);
        if (s === 2) {
          await page
            .getByRole("radio", {
              name: "指定した部位だけが変わると思う",
              exact: true,
            })
            .check();
          await page
            .getByRole("button", { name: "予想を固定して比較を開く" })
            .click();
          await page.getByRole("slider").focus();
          await page.keyboard.press("End");
          await expect(page.getByRole("slider")).toHaveValue("100");
        }
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
      }
    }
  });
test("official links follow explicit OS and simulation sends no external requests", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (
      !r.url().startsWith("http://127.0.0.1:4173/") &&
      !r.url().startsWith("data:")
    )
      requests.push(r.url());
  });
  await page.goto("#chapter-7");
  await page
    .getByText("任意：自分のGeminiで試す・公式情報", { exact: true })
    .click();
  for (const [n, os] of [
    [0, "Desktop"],
    [1, "iOS"],
    [2, "Android"],
  ] as const) {
    await page
      .getByLabel("公式案内の端末", { exact: true })
      .selectOption(String(n));
    const links = page
      .locator(".nano-chapter details")
      .filter({ has: page.getByLabel("公式案内の端末", { exact: true }) })
      .locator("a");
    await expect(links).toHaveCount(3);
    await expect(links.nth(1)).toHaveAttribute(
      "href",
      new RegExp(`Platform%3D${os}`),
    );
    await expect(links.nth(2)).toHaveText(/共通/);
  }
  await openChallenge(page);
  expect(requests).toEqual([]);
});

test("review regression: descriptions match robot, cat and visible crop", async ({
  page,
}) => {
  await page.goto("#chapter-7");
  await page.getByLabel("主役", { exact: true }).selectOption("1");
  await page
    .getByRole("radio", { name: "選んだ主役・背景・画風・構図", exact: true })
    .check();
  await page
    .getByRole("button", { name: "条件を固定して模擬画像を表示" })
    .click();
  await expect(page.locator(".nano-art desc")).toContainText("四角い顔");
  await expect(page.locator(".nano-art desc")).not.toContainText(
    "毛色は黄茶色",
  );
  await page.getByLabel("主役", { exact: true }).selectOption("2");
  await page.getByLabel("構図", { exact: true }).selectOption("2");
  await page
    .getByRole("radio", { name: "選んだ主役・背景・画風・構図", exact: true })
    .check();
  await page
    .getByRole("button", { name: "条件を固定して模擬画像を表示" })
    .click();
  await expect(page.locator(".nano-art desc")).toContainText("紫系");
  await expect(page.locator(".nano-art desc")).toContainText("確認できません");
  await expect(page.locator(".nano-art desc")).not.toContainText(
    "リンゴは1個ある",
  );
});
test("review regression: all text alternative targets remain at least 44px at 375px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("#chapter-7");
  await openChallenge(page);
  for (const label of await page.locator(".nano-region-options label").all()) {
    const b = (await label.boundingBox())!;
    expect(b.height).toBeGreaterThanOrEqual(44);
  }
});
test("review regression: character feedback identifies the actual incorrect feature", async ({
  page,
}) => {
  await page.goto("#chapter-7");
  await step(page, 3);
  await page
    .getByRole("radio", { name: "必ず同じになる", exact: true })
    .check();
  await page.getByRole("button", { name: "予想を固定して場面を比較" }).click();
  for (let i = 0; i < 5; i++)
    await page
      .locator(`input[name=character-answer-${i}]`)
      .nth(i === 2 ? 1 : 0)
      .check();
  await page.getByRole("button", { name: "特徴の判断を確定" }).click();
  await expect(
    page.getByRole("status").filter({ hasText: "もう一度" }),
  ).toContainText("耳の特徴");
});
test("review regression: restaurant preserves the base apron color", async ({
  page,
}) => {
  await page.goto("#chapter-7");
  await step(page, 3);
  await page.getByLabel("比較する場面", { exact: true }).selectOption("1");
  await page
    .getByRole("radio", { name: "必ず同じになる", exact: true })
    .check();
  await page.getByRole("button", { name: "予想を固定して場面を比較" }).click();
  const fills = await page.locator(".nano-pair svg").evaluateAll((svgs) =>
    svgs.map((svg) =>
      Array.from(svg.querySelectorAll("path"))
        .find((p) => p.getAttribute("d")?.startsWith("M259 224"))
        ?.getAttribute("fill"),
    ),
  );
  expect(fills).toEqual(["#e7b35b", "#e7b35b"]);
});
test("review regression: photo scene visually changes the kitchen and pose", async ({
  page,
}) => {
  await page.goto("#chapter-7");
  await step(page, 3);
  await page.getByLabel("比較する場面", { exact: true }).selectOption("2");
  await page
    .getByRole("radio", { name: "必ず同じになる", exact: true })
    .check();
  await page.getByRole("button", { name: "予想を固定して場面を比較" }).click();
  const after = page.locator(".nano-pair svg").nth(1);
  await expect(
    after.locator('path[d="M0 321h154v22H0M409 321h191v22H409"]'),
  ).toHaveCount(0);
  await expect(after.locator("[data-photo-backdrop]")).toHaveCount(1);
  await expect(after.locator("desc")).toContainText("手を振る");
});
for (const failOld of [false, true])
  test(`newer copy survives old ${failOld ? "failure" : "success"} after text changes`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const pending: { resolve: () => void; reject: () => void }[] = [];
      (window as unknown as { pending: typeof pending }).pending = pending;
      Object.defineProperty(navigator, "clipboard", {
        value: {
          writeText: () =>
            new Promise<void>((resolve, reject) =>
              pending.push({ resolve, reject: () => reject(Error("denied")) }),
            ),
        },
      });
    });
    await page.goto("#chapter-7");
    await page.getByRole("button", { name: "指示文を全文コピー" }).click();
    await page.getByLabel("主役", { exact: true }).selectOption("1");
    await page.getByRole("button", { name: "指示文を全文コピー" }).click();
    await expect
      .poll(() =>
        page.evaluate(
          () => (window as unknown as { pending: unknown[] }).pending.length,
        ),
      )
      .toBe(2);
    await page.evaluate((fail) => {
      const p = (
        window as unknown as {
          pending: { resolve: () => void; reject: () => void }[];
        }
      ).pending[0];
      (fail ? p.reject : p.resolve)();
    }, failOld);
    await expect(
      page.getByRole("button", { name: "指示文を全文コピー" }),
    ).toBeDisabled();
    expect((await stored(page)).copied ?? []).toEqual([]);
    await page.evaluate(() =>
      (
        window as unknown as { pending: { resolve: () => void }[] }
      ).pending[1].resolve(),
    );
    await expect(page.getByText(/この本文のコピー成功履歴/)).toBeVisible();
    expect((await stored(page)).copied).toHaveLength(1);
  });
for (const failure of ["chapter", "progress"])
  test(`partial reset ${failure} failure reports old records may return`, async ({
    page,
  }) => {
    await page.goto("#chapter-7");
    await page.getByLabel("主役", { exact: true }).selectOption("2");
    await page.getByLabel(/第7章を学習した/).check();
    await page.evaluate(
      ({ key, failure }) => {
        const remove = Storage.prototype.removeItem,
          set = Storage.prototype.setItem;
        Storage.prototype.removeItem = function (k) {
          if (failure === "chapter" && k === key) throw Error("denied");
          return remove.call(this, k);
        };
        Storage.prototype.setItem = function (k, v) {
          if (failure === "progress" && k === "gemini-toranomaki:progress:v1")
            throw Error("denied");
          return set.call(this, k, v);
        };
      },
      { key: nanoKey, failure },
    );
    await page.getByRole("button", { name: "第7章だけを初期化" }).click();
    await page.getByRole("button", { name: "第7章の記録を消す" }).click();
    await expect(
      page.getByRole("status").filter({ hasText: "削除を確認できません" }),
    ).toBeVisible();
    await expect(page.getByLabel("主役", { exact: true })).toHaveValue("0");
    await expect(page.getByLabel(/第7章を学習した/)).not.toBeChecked();
    await page.reload();
    await expect(page.getByLabel("主役", { exact: true })).toHaveValue(
      failure === "chapter" ? "2" : "0",
    );
    await expect(page.getByLabel(/第7章を学習した/)).toBeChecked({
      checked: failure === "progress",
    });
  });
test("200 percent text preserves narrow controls and observation alternatives", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("#chapter-7");
  await page.addStyleTag({ content: "html { font-size:200%; }" });
  await openChallenge(page);
  await page.getByText("文字で観察する（画像の代替）", { exact: true }).click();
  await page.getByRole("checkbox", { name: "料理帽", exact: true }).check();
  await page.getByRole("checkbox", { name: "目", exact: true }).check();
  await submit(page);
  await expect(
    page.getByText("観察は一致しています。", { exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
