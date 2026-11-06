# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: services-practice.spec.ts >> stale copy status failure does not overwrite record or newer copy
- Location: tests/services-practice.spec.ts:232:5

# Error details

```
Error: page.goto: Test ended.
Call log:
  - navigating to "http://127.0.0.1:4173/gemini-toranomaki/#chapter-2", waiting until "load"

```

# Test source

```ts
  136 |   await page.getByRole("link", { name: "ホーム", exact: true }).click();
  137 |   await page.getByRole("link", { name: "第2章を学ぶ", exact: true }).click();
  138 |   await expect(page.locator("#practice-heading")).toHaveText(
  139 |     "STEP 4A メールを探す",
  140 |   );
  141 |   await expect(
  142 |     page.getByLabel("実操作を自分で実施した（自己申告）", { exact: true }),
  143 |   ).toBeChecked();
  144 |   await expect(
  145 |     page.getByRole("combobox", { name: "未実施・保留の状態", exact: true }),
  146 |   ).toHaveValue("2");
  147 |   await page.getByRole("button", { name: "この工程を再挑戦" }).click();
  148 |   expect((await saved(page)).performed).toEqual([4]);
  149 |   expect((await saved(page)).status).toEqual({ 4: 0 });
  150 |   await page.getByRole("button", { name: "模擬で事前練習・代替学習" }).click();
  151 |   await expect(
  152 |     page.getByRole("heading", { name: "模擬Gmail受信箱" }),
  153 |   ).toBeVisible();
  154 |   await page.getByRole("button", { name: "実践教材へ", exact: true }).click();
  155 |   await expect(page.locator("#practice-heading")).toHaveText(
  156 |     "STEP 4A メールを探す",
  157 |   );
  158 |   const before = await page.evaluate(() =>
  159 |     Object.fromEntries(
  160 |       Object.keys(localStorage)
  161 |         .filter((k) => !k.includes("services-practice"))
  162 |         .map((k) => [k, localStorage.getItem(k)]),
  163 |     ),
  164 |   );
  165 |   await page.getByText("実践記録だけを初期化", { exact: true }).click();
  166 |   await expect(
  167 |     page.getByRole("button", { name: "実践記録を初期化する" }),
  168 |   ).toBeDisabled();
  169 |   await page.getByLabel("実践記録の初期化を確認した").check();
  170 |   await page.getByRole("button", { name: "実践記録を初期化する" }).click();
  171 |   await expect(page.locator("#practice-heading")).toHaveText("STEP 0 学習環境");
  172 |   expect(
  173 |     await page.evaluate(() =>
  174 |       Object.fromEntries(
  175 |         Object.keys(localStorage)
  176 |           .filter((k) => !k.includes("services-practice"))
  177 |           .map((k) => [k, localStorage.getItem(k)]),
  178 |       ),
  179 |     ),
  180 |   ).toEqual(before);
  181 | });
  182 | test("explicit preflight approval is transient, copy has full text and failure permits manual retry", async ({
  183 |   page,
  184 | }) => {
  185 |   await clipboard(page);
  186 |   await page.goto(route);
  187 |   await step(page, 6);
  188 |   const check = page.getByLabel(
  189 |     "今回提示された1件の全項目・目的・対象カレンダーと原文・重複なしを照合した（保存しない自己申告）",
  190 |     { exact: true },
  191 |   );
  192 |   await expect(page.getByLabel("実践・最終実行指示の全文")).toHaveCount(0);
  193 |   await page.getByRole("button", { name: "全文をコピー", exact: true }).click();
  194 |   expect(
  195 |     await page.evaluate(
  196 |       () =>
  197 |         (window as unknown as { copies: { text: string }[] }).copies[0].text,
  198 |     ),
  199 |   ).toBe(practicePrompts[6]);
  200 |   await settle(page, 0, true);
  201 |   await expect(page.locator(".services-practice .feedback")).toContainText(
  202 |     "手動でコピー",
  203 |   );
  204 |   expect((await saved(page)).copied).toEqual([]);
  205 |   await check.check();
  206 |   await page.getByRole("button", { name: "全文をコピー（最終実行）" }).click();
  207 |   await settle(page, 1);
  208 |   expect((await saved(page)).copied).toEqual(["execution"]);
  209 |   await expect(
  210 |     page.getByLabel("実操作を自分で実施した（自己申告）", { exact: true }),
  211 |   ).not.toBeChecked();
  212 |   await page.reload();
  213 |   await expect(check).not.toBeChecked();
  214 |   await expect(page.getByLabel("実践・最終実行指示の全文")).toHaveCount(0);
  215 |   await expect(
  216 |     page.locator(
  217 |       ".services-practice textarea, .services-practice input[type=text]",
  218 |     ),
  219 |   ).toHaveCount(0);
  220 | });
  221 | for (const action of [
  222 |   "step",
  223 |   "environment",
  224 |   "mode",
  225 |   "check",
  226 |   "status",
  227 |   "retry",
  228 |   "reset",
  229 |   "leave",
  230 | ] as const)
  231 |   for (const failure of [false, true])
  232 |     test(`stale copy ${action} ${failure ? "failure" : "success"} does not overwrite record or newer copy`, async ({
  233 |       page,
  234 |     }) => {
  235 |       await clipboard(page);
> 236 |       await page.goto(route);
      |                  ^ Error: page.goto: Test ended.
  237 |       await step(page, 4);
  238 |       await page
  239 |         .getByRole("button", { name: "全文をコピー", exact: true })
  240 |         .click();
  241 |       if (action === "step") await step(page, 5);
  242 |       if (action === "environment") {
  243 |         await step(page, 0);
  244 |         await page
  245 |           .getByRole("combobox", { name: "端末・ブラウザ", exact: true })
  246 |           .selectOption("3");
  247 |         await step(page, 4);
  248 |       }
  249 |       if (action === "mode") {
  250 |         await page
  251 |           .getByRole("button", { name: "模擬で事前練習・代替学習" })
  252 |           .click();
  253 |         await page
  254 |           .getByRole("button", { name: "実践教材へ", exact: true })
  255 |           .click();
  256 |       }
  257 |       if (action === "check")
  258 |         await page
  259 |           .getByLabel("実結果を自分で確認した（自己申告）", { exact: true })
  260 |           .check();
  261 |       if (action === "status")
  262 |         await page
  263 |           .getByRole("combobox", { name: "未実施・保留の状態", exact: true })
  264 |           .selectOption("1");
  265 |       if (action === "retry")
  266 |         await page.getByRole("button", { name: "この工程を再挑戦" }).click();
  267 |       if (action === "reset") {
  268 |         await page.getByText("実践記録だけを初期化", { exact: true }).click();
  269 |         await page.getByLabel("実践記録の初期化を確認した").check();
  270 |         await page
  271 |           .getByRole("button", { name: "実践記録を初期化する" })
  272 |           .click();
  273 |         await step(page, 4);
  274 |       }
  275 |       if (action === "leave") {
  276 |         await page.getByRole("link", { name: "ホーム", exact: true }).click();
  277 |         await page
  278 |           .getByRole("link", { name: "第2章を学ぶ", exact: true })
  279 |           .click();
  280 |       }
  281 |       const nextCopy = page.getByRole("button", {
  282 |         name: "全文をコピー",
  283 |         exact: true,
  284 |       });
  285 |       await nextCopy.click();
  286 |       const before = await saved(page);
  287 |       await settle(page, 0, failure);
  288 |       expect(await saved(page)).toEqual(before);
  289 |       await expect(nextCopy).toBeDisabled();
  290 |       await expect(page.locator(".services-practice .feedback")).toHaveText("");
  291 |       await settle(page, 1);
  292 |       await expect(nextCopy).toBeEnabled();
  293 |       expect((await saved(page)).copied).toEqual([
  294 |         action === "step" ? "step-5" : "step-4",
  295 |       ]);
  296 |     });
  297 | test("approval revoked during pending final copy cannot record success or restore approval", async ({
  298 |   page,
  299 | }) => {
  300 |   await clipboard(page);
  301 |   await page.goto(route);
  302 |   await step(page, 6);
  303 |   const check = page.getByLabel(
  304 |     "今回提示された1件の全項目・目的・対象カレンダーと原文・重複なしを照合した（保存しない自己申告）",
  305 |     { exact: true },
  306 |   );
  307 |   await check.check();
  308 |   await page.getByRole("button", { name: "全文をコピー（最終実行）" }).click();
  309 |   await check.uncheck();
  310 |   await settle(page, 0);
  311 |   expect((await saved(page)).copied).toEqual([]);
  312 |   await expect(page.getByLabel("実践・最終実行指示の全文")).toHaveCount(0);
  313 | });
  314 | for (const broken of [false, true])
  315 |   test(`storage ${broken ? "corrupt" : "denied"} retains in-memory learning and does not destroy other chapters`, async ({
  316 |     page,
  317 |   }) => {
  318 |     await page.goto(route);
  319 |     if (broken)
  320 |       await page.evaluate(
  321 |         (key) => localStorage.setItem(key, "{broken"),
  322 |         practiceKey,
  323 |       );
  324 |     else
  325 |       await page.addInitScript(() => {
  326 |         Storage.prototype.getItem = () => {
  327 |           throw Error("private");
  328 |         };
  329 |       });
  330 |     await page.reload();
  331 |     await expect(
  332 |       page.getByText(/第2章の実践記録を保存できません/),
  333 |     ).toBeVisible();
  334 |     await page.evaluate(() => {
  335 |       Storage.prototype.setItem = () => {
  336 |         throw Error("quota");
```