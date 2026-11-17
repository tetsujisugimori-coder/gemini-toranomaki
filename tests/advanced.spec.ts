import {test,expect} from '@playwright/test';
const key='gemini-toranomaki:advanced:v1';
for(const id of ['A','B','C','D','E','F'])test(`advanced ${id} complete learning route`,async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(`#advanced-${id}`);
 await expect(page.locator('h1')).toContainText(id+'：');
 await page.getByRole('button',{name:'資料を閲覧したと記録'}).click();
 await page.getByRole('button',{name:'2. 予想とヒント',exact:true}).click();
 await page.getByRole('button',{name:'次のヒント',exact:true}).click();
 await page.getByRole('button',{name:'3. 実践する',exact:true}).click();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(text:string)=>{(window as unknown as {copied:string}).copied=text;}}}));
 const text=await page.getByTestId('advanced-prompt').textContent();
 await page.getByRole('button',{name:'依頼文を全文コピー'}).click();
 await expect(page.getByText('全文をコピーしました。実サービスへの送信や実行はしていません。',{exact:true})).toBeVisible();
 expect(await page.evaluate(()=>(window as unknown as {copied:string}).copied)).toBe(text);
 await page.getByLabel('実操作の状態（自己申告）').selectOption('1');
 await page.getByRole('button',{name:'4. 結果を確かめる',exact:true}).click();
 await page.getByText('考えた後で正本を開く',{exact:true}).click();
 await page.locator('input[type=radio]').nth(id==='B'?0:1).check();
 await page.getByRole('button',{name:'固定問題を判定'}).click();
 await expect(page.getByText(/^固定問題は正答/)).toBeVisible();
 await page.getByLabel('実Geminiの結果を元資料で確認した',{exact:false}).check();
 await page.getByRole('button',{name:'5. 依頼を改善',exact:true}).click();
 await expect(page.getByTestId('advanced-prompt')).toContainText('改善指示：');
 await expect(page.getByLabel('実操作の状態（自己申告）')).toHaveValue('0');
 await page.getByLabel('実操作の状態（自己申告）').selectOption('1');
 await page.getByRole('button',{name:'6. 前後を比較',exact:true}).click();
 await page.getByRole('button',{name:'模擬の前後を比較したと記録'}).click();
 await page.getByRole('button',{name:'7. 振り返り',exact:true}).click();
 await page.getByLabel('振り返りを行った（自己申告）').check();
 await page.reload();await expect(page.getByLabel('振り返りを行った（自己申告）')).toBeChecked();
 await page.getByRole('link',{name:'レシピ一覧へ戻る',exact:true}).click();await expect(page.locator('h1')).toHaveText('応用編：実践レシピ');expect(errors).toEqual([]);
});
test('stale copy, same condition, changed condition, reset, route leave',async({page})=>{
 await page.goto('#advanced-A');await page.getByRole('button',{name:'3. 実践する',exact:true}).click();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:()=>new Promise<void>(resolve=>{(window as unknown as {release:()=>void}).release=resolve;})}}));
 await page.getByRole('button',{name:'依頼文を全文コピー'}).click();
 await page.getByLabel('比較条件',{exact:true}).selectOption('1');
 await page.evaluate(()=>(window as unknown as {release:()=>void}).release());
 await expect(page.getByText('全文をコピーしました。実サービスへの送信や実行はしていません。',{exact:true})).toHaveCount(0);
 await page.getByLabel('実操作の状態（自己申告）').selectOption('1');
 await page.getByLabel('比較条件',{exact:true}).selectOption('1');await expect(page.getByLabel('実操作の状態（自己申告）')).toHaveValue('1');
 await page.getByRole('button',{name:'依頼文を全文コピー'}).click();await page.getByRole('button',{name:'このレシピだけ初期化',exact:true}).click();await page.getByRole('button',{name:'初期化を実行',exact:true}).click();
 await page.evaluate(()=>(window as unknown as {release:()=>void}).release());await expect(page.getByText('全文をコピーしました。実サービスへの送信や実行はしていません。',{exact:true})).toHaveCount(0);
 await page.getByRole('button',{name:'3. 実践する',exact:true}).click();await page.getByRole('button',{name:'依頼文を全文コピー'}).click();await page.getByRole('link',{name:'レシピ一覧へ戻る',exact:true}).click();await page.evaluate(()=>(window as unknown as {release:()=>void}).release());await expect(page.getByText('全文をコピーしました。実サービスへの送信や実行はしていません。',{exact:true})).toHaveCount(0);
});
test('copy failure offers manual text and never marks external done',async({page})=>{
 await page.goto('#advanced-C');await page.getByRole('button',{name:'3. 実践する',exact:true}).click();await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw Error('denied');}}}));await page.getByRole('button',{name:'依頼文を全文コピー'}).click();await expect(page.getByText(/^コピーできませんでした。/)).toBeVisible();await expect(page.getByLabel('実操作の状態（自己申告）')).toHaveValue('0');
});
test('corrupt raw preserved; recovery scoped; storage failure usable',async({page})=>{
 await page.goto('#advanced');await page.evaluate(k=>{localStorage.setItem(k,'{bad');localStorage.setItem('gemini-toranomaki:progress:v1','{"completed":["chapter-1"]}');},key);await page.goto('#advanced-D');await page.reload();await page.getByRole('button',{name:'資料を閲覧したと記録'}).click();expect(await page.evaluate(k=>localStorage.getItem(k),key)).toBe('{bad');
 await page.getByText('保存回復の初期化を確認する',{exact:true}).click();await page.getByRole('button',{name:'応用編全体を初期化して保存回復',exact:true}).click();await expect(page.getByRole('heading',{name:'課題と材料',exact:true})).toBeFocused();expect(await page.evaluate(()=>localStorage.getItem('gemini-toranomaki:progress:v1'))).toBe('{"completed":["chapter-1"]}');
 await page.evaluate(()=>{Storage.prototype.setItem=()=>{throw new DOMException('full','QuotaExceededError');};});await page.getByRole('button',{name:'資料を閲覧したと記録'}).click();await expect(page.getByText(/^保存できません。/)).toBeVisible();await page.getByRole('button',{name:'次へ',exact:true}).click();await expect(page.getByRole('heading',{name:'予想とヒント',exact:true})).toBeVisible();
});
for(const width of [320,375,390,1280])for(const dark of [false,true])test(`advanced layout ${width} dark=${dark}`,async({page})=>{
 await page.setViewportSize({width,height:900});await page.emulateMedia({colorScheme:dark?'dark':'light',reducedMotion:'reduce'});await page.goto('#advanced-E');
 await page.evaluate(()=>{document.documentElement.style.fontSize='200%';});
 expect(await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).fontSize))).toBe(32);
 for(const n of [0,1,2,3,4,5,6]){await page.getByRole('button',{name:`${n+1}. ${['課題と材料','予想とヒント','実践する','結果を確かめる','依頼を改善','前後を比較','振り返り'][n]}`,exact:true}).click();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBe(true);}
 await page.getByRole('button',{name:'6. 前後を比較',exact:true}).click();
 await page.getByRole('button',{name:'前へ',exact:true}).focus();await page.keyboard.press('Tab');await expect(page.getByRole('button',{name:'次へ',exact:true})).toBeFocused();await page.keyboard.press('Shift+Tab');await expect(page.getByRole('button',{name:'前へ',exact:true})).toBeFocused();await page.keyboard.press('Space');await expect(page.getByRole('heading',{name:'依頼を改善',exact:true})).toBeFocused();
});

test('reset at initial step restores focus without a stage change',async({page})=>{
 await page.goto('#advanced-A');await page.getByRole('button',{name:'このレシピだけ初期化',exact:true}).click();await page.getByRole('button',{name:'初期化を実行',exact:true}).click();await expect(page.getByRole('heading',{name:'課題と材料',exact:true})).toBeFocused();
});
