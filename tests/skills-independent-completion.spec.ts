import { test, expect } from "@playwright/test";

const key = "gemini-toranomaki:skills:v1";
const progress = "gemini-toranomaki:progress:v1";
const fields = ["役割", "目的", "適用場面", "守るルール", "避ける行動", "回答形式", "期待される回答例"];
const migration = ["スキル名", "説明", "適用条件", "行動ルール", "出力形式", "使用例"];
const textbox = (page: import("@playwright/test").Page, name: string) => page.getByRole("textbox", { name, exact: true });
async function clipboard(page: import("@playwright/test").Page) {
  await page.addInitScript(() => Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: async (text: string) => { Object.assign(window, { captured: text }); } } }));
}
test("all workshop fields update preview, copy, drafts and quality branches", async ({ page }) => {
  await clipboard(page); await page.goto("#chapter-9");
  await page.getByRole("button", { name: /2\. カスタム指示/ }).click();
  for (let i = 0; i < fields.length; i++) {
    const value = `独立フィールド${i}の具体的な内容です`;
    await textbox(page, fields[i]).fill(value);
    await expect(textbox(page, "指示文全文")).toHaveValue(new RegExp(`${fields[i]}: ${value}`));
  }
  await page.getByRole("button", { name: "全文をコピー" }).click();
  const preview = await textbox(page, "指示文全文").inputValue();
  expect(await page.evaluate(() => (window as unknown as { captured: string }).captured)).toBe(preview);
  await page.getByLabel("テンプレート").selectOption("文章添削AI");
  await page.getByLabel("テンプレート").selectOption("学習支援AI"); await page.reload();
  for (let i = 0; i < fields.length; i++) await expect(textbox(page, fields[i])).toHaveValue(`独立フィールド${i}の具体的な内容です`);
  await textbox(page, "目的").fill("短"); await expect(page.getByText("目的: 具体化を検討")).toBeVisible();
  await textbox(page, "目的").fill("十分に具体的な目的を設定する"); await expect(page.getByText("目的: 内容あり")).toBeVisible();
  await textbox(page, "適用場面").fill("短"); await expect(page.getByText("適用場面: 具体化を検討")).toBeVisible();
  await textbox(page, "適用場面").fill("学習相談の質問を受けたとき"); await expect(page.getByText("適用場面: 内容あり")).toBeVisible();
  await textbox(page, "守るルール").fill("答えをすぐに示す"); await textbox(page, "避ける行動").fill("答えをすぐに示す");
  await expect(page.getByText(/矛盾の可能性/)).toBeVisible();
  await textbox(page, "避ける行動").fill("無関係な回答"); await expect(page.getByText(/矛盾: この単純規則では検出なし/)).toBeVisible();
  await textbox(page, "期待される回答例").fill(""); await expect(page.getByText("回答例: 未入力")).toBeVisible();
  await textbox(page, "期待される回答例").fill("例"); await expect(page.getByText("回答例: あり")).toBeVisible();
  await textbox(page, "役割").fill("長".repeat(2001)); await expect(page.getByText(/長さ: 2000文字超/)).toBeVisible();
  await textbox(page, "役割").fill("先生"); await expect(page.getByText("長さ: 2000文字以内")).toBeVisible();
});
test("every migration field is reflected in full copied text", async ({ page }) => {
  await clipboard(page); await page.goto("#chapter-9"); await page.getByRole("button", { name: /4\. GemsからSkillsへ/ }).click();
  const pairs: string[] = [];
  for (let i = 0; i < migration.length; i++) { const value = `移行用の独立入力${i}`; await textbox(page, migration[i]).fill(value); pairs.push(`${migration[i]}: ${value}`); }
  await expect(textbox(page, "指示文全文")).toHaveValue(pairs.join("\n"));
  await page.getByRole("button", { name: "全文をコピー" }).click();
  expect(await page.evaluate(() => (window as unknown as { captured: string }).captured)).toBe(pairs.join("\n"));
  await page.reload(); for (let i=0;i<migration.length;i++) await expect(textbox(page,migration[i])).toHaveValue(`移行用の独立入力${i}`);
});
test("invalid values and legacy-shaped partial record sanitize without touching other records", async ({ page }) => {
  await page.addInitScript(({key, progress}) => {
    if (sessionStorage.getItem("seeded")) return; sessionStorage.setItem("seeded", "yes");
    localStorage.setItem(key, JSON.stringify({ step: "3", tutor: [3, "2", 999, null, -1, 2], template: "unknown", edited: [42], selected: [true], mode: 99, question: -1, completed: [0, 0, 99], answers: {0: 1, 1: "x"}, alien: "unknown" }));
    localStorage.setItem(progress, JSON.stringify({completed:["chapter-1"]})); localStorage.setItem("gemini-toranomaki:lab:v1", "lab-sentinel"); localStorage.setItem("gemini-toranomaki:exploration:v1", "explore-sentinel");
  }, {key, progress});
  await page.goto("#chapter-9"); await expect(page.getByLabel("学習分野")).toHaveValue("3"); await expect(page.getByLabel("学習レベル")).toHaveValue("0"); await expect(page.getByLabel("教え方")).toHaveValue("0"); await expect(page.getByRole("combobox", {name:"回答形式",exact:true})).toHaveValue("2");
  await page.getByLabel("学習分野").selectOption("1"); await page.reload(); await expect(page.getByLabel("学習分野")).toHaveValue("1");
  expect(await page.evaluate((progress) => [JSON.parse(localStorage.getItem(progress)!).completed, localStorage.getItem("gemini-toranomaki:lab:v1"), localStorage.getItem("gemini-toranomaki:exploration:v1")], progress)).toEqual([["chapter-1"],"lab-sentinel","explore-sentinel"]);
});
for (const blocked of [key, progress]) test(`quota on ${blocked} allows interaction and preserves unrelated records after reset`, async ({page}) => {
  await page.goto("#chapter-9");
  await page.evaluate(({key,progress}) => { localStorage.setItem(key,JSON.stringify({tutor:[1,0,0,1,0,0]})); localStorage.setItem(progress,JSON.stringify({completed:["chapter-1","chapter-9"]})); localStorage.setItem("gemini-toranomaki:lab:v1","lab-sentinel"); localStorage.setItem("gemini-toranomaki:exploration:v1","explore-sentinel"); }, {key,progress});
  await page.reload(); await page.evaluate((blocked) => {const orig=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){if(k===blocked) throw new DOMException("quota", "QuotaExceededError"); return orig.call(this,k,v);};}, blocked);
  await page.getByRole("button",{name:"第9章の記録を初期化"}).click(); await page.getByRole("button",{name:"初期化する",exact:true}).click();
  await expect(page.getByText(/保存できません|保存はできません/).first()).toBeVisible();
  await page.getByLabel("学習分野").selectOption("3"); await expect(page.getByLabel("学習分野")).toHaveValue("3");
  expect(await page.evaluate((progress) => [JSON.parse(localStorage.getItem(progress)!).completed.includes("chapter-1"),localStorage.getItem("gemini-toranomaki:lab:v1"),localStorage.getItem("gemini-toranomaki:exploration:v1")], progress)).toEqual([true,"lab-sentinel","explore-sentinel"]);
  await page.reload(); if(blocked===key) await expect(page.getByLabel("学習分野")).toHaveValue("1"); else await expect(page.getByLabel("第9章を完了した")).toBeChecked();
});
test("legacy-shaped tutor-only saved data restores and gains defaults", async ({page}) => {
  await page.addInitScript((key) => { if (!sessionStorage.getItem("legacy-seeded")) {sessionStorage.setItem("legacy-seeded","1"); localStorage.setItem(key,JSON.stringify({tutor:[2,1,2,0,1,1]}));}},key);
  await page.goto("#chapter-9"); await expect(page.getByLabel("学習分野")).toHaveValue("2"); await expect(page.getByLabel("学習レベル")).toHaveValue("1"); await expect(page.getByLabel("教え方")).toHaveValue("2");
  await page.getByRole("button",{name:/2\. カスタム指示/}).click(); await expect(page.getByLabel("テンプレート")).toHaveValue("学習支援AI");
  await page.reload(); await expect(page.getByLabel("テンプレート")).toHaveValue("学習支援AI"); await page.getByRole("button",{name:/1\. AI家庭教師/}).click(); await expect(page.getByLabel("学習分野")).toHaveValue("2");
});
test("all comparison questions follow each teaching option", async ({page}) => {
  await page.goto("#chapter-9");
  const explanations=["次に2を入れ", "x=2または3", "He goes", "料理交換会"], hints=["最初に取り出される", "積が6", "主語 He", "誰に参加"], advanced=["イテラブル", "判別式", "定形動詞", "対象者・価値"], detail=["空のリスト", "因子", "語尾がo", "参加人数"];
  for(let i=0;i<4;i++) {
    await page.getByRole("button",{name:/1\. AI家庭教師/}).click();
    await page.getByLabel("学習レベル").selectOption("2"); await page.getByLabel("教え方").selectOption("0"); await page.getByLabel("回答の長さ").selectOption("2"); await page.getByRole("combobox",{name:"回答形式",exact:true}).selectOption("0");
    await page.getByRole("button",{name:/3\. 回答を比較/}).click(); await page.getByRole("combobox",{name:"質問",exact:true}).selectOption(String(i));
    const result=page.locator(".skills-result"); await expect(result).toContainText(hints[i]); await expect(result).toContainText(advanced[i]); await expect(result).toContainText(detail[i]);
    for(const [label,value,phrase] of [["学習レベル","0","身近な例"],["学習レベル","1","基本を確認"],["教え方","1","一緒に考えましょう"],["回答の長さ","1","次の一歩"],["回答形式","1","1."],["回答形式","2","練習:"]]) {
      await page.getByRole("button",{name:/1\. AI家庭教師/}).click(); await page.getByRole("combobox",{name:label,exact:true}).selectOption(value); await page.getByRole("button",{name:/3\. 回答を比較/}).click(); await expect(result).toContainText(phrase);
    }
    await expect(page.getByText(/教え方「対話中心」.*レベル「中級」.*長さ「標準」.*形式「問題演習」/)).toBeVisible();
    await page.getByRole("button",{name:/1\. AI家庭教師/}).click(); await page.getByLabel("教え方").selectOption("2"); await page.getByLabel("回答の長さ").selectOption("0"); await page.getByRole("button",{name:/3\. 回答を比較/}).click();
    await expect(result).toContainText(explanations[i]); await expect(result).not.toContainText(detail[i]); await expect(page.getByText(/教え方「解説中心」.*長さ「短い」/)).toBeVisible();
  }
});
test("switching or reselecting subjects preserves all other tutor choices", async ({page}) => {
  await page.goto("#chapter-9");
  const options: [string,string][]=[["学習レベル","2"],["教え方","1"],["回答の長さ","0"],["間違いへの対応","1"],["回答形式","2"]];
  for(const [name,value] of options) await page.getByRole("combobox",{name,exact:true}).selectOption(value);
  for(const subject of ["1","1","2","3","0"]) { await page.getByLabel("学習分野").selectOption(subject); for(const [name,value] of options) await expect(page.getByRole("combobox",{name,exact:true})).toHaveValue(value); }
});
