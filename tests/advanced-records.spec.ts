import {test,expect} from '@playwright/test';
const key='gemini-toranomaki:advanced:v1';
for (const target of [2,7]) test(`P2 unviewed navigation ${target} persists honestly`,async({page})=>{
 await page.goto('#advanced-A');
 await page.evaluate(()=>localStorage.setItem('gemini-toranomaki:progress:v1','{"completed":["chapter-1"]}'));
 await page.getByRole('button',{name:target===2?'2. 予想とヒント':'7. 振り返り',exact:true}).click();
 await expect(page.getByText(/^閲覧：未記録/)).toBeVisible();
 await page.getByRole('button',{name:'前へ',exact:true}).click();
 await page.getByRole('button',{name:'次へ',exact:true}).click();
 await page.reload();await expect(page.getByText(/^閲覧：未記録/)).toBeVisible();
 await page.locator('nav[aria-label="応用編レシピ"] a').nth(1).click();
 await page.getByRole('button',{name:'資料を閲覧したと記録'}).click();
 await page.locator('nav[aria-label="応用編レシピ"] a').first().click();
 await expect(page.getByText(/^閲覧：未記録/)).toBeVisible();
 expect(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)!).records.A.viewed,key)).toBe(false);
 expect(await page.evaluate(()=>localStorage.getItem('gemini-toranomaki:progress:v1'))).toBe('{"completed":["chapter-1"]}');
});
test('P2 explicit viewed survives navigation and reset clears only recipe',async({page})=>{
 await page.goto('#advanced-B');await page.getByRole('button',{name:'資料を閲覧したと記録'}).click();
 await page.locator('nav[aria-label="応用編レシピ"] a').first().click();
 await page.getByRole('button',{name:'資料を閲覧したと記録'}).click();
 await page.getByRole('button',{name:'7. 振り返り',exact:true}).click();await page.reload();
 await expect(page.getByText(/^閲覧：記録あり/)).toBeVisible();
 await page.getByRole('button',{name:'このレシピだけ初期化',exact:true}).click();await page.getByRole('button',{name:'初期化を実行',exact:true}).click();
 await expect(page.getByText(/^閲覧：未記録/)).toBeVisible();
 await page.locator('nav[aria-label="応用編レシピ"] a').nth(1).click();await expect(page.getByText(/^閲覧：記録あり/)).toBeVisible();
});
test('P3 improvement is edited in Gemini after copying exact displayed text',async({page})=>{
 await page.goto('#advanced-A');await page.getByRole('button',{name:'5. 依頼を改善',exact:true}).click();
 await expect(page.getByText(/Gemini側で必要に応じて編集/)).toBeVisible();
 await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async(t:string)=>{(window as unknown as {copyText:string}).copyText=t;}}}));
 const text=await page.getByTestId('advanced-prompt').textContent();await page.getByRole('button',{name:'依頼文を全文コピー'}).click();
 expect(await page.evaluate(()=>(window as unknown as {copyText:string}).copyText)).toBe(text);
});
