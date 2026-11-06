import { chromium, webkit } from '../candidate-557f12e/node_modules/playwright/index.mjs';
import { strict as assert } from 'node:assert';
import { writeFile, mkdir } from 'node:fs/promises';
const OUT='/workspace/chapter10-independent-20261106/candidate-evidence-557f12e';
const URL='http://127.0.0.1:4173/gemini-toranomaki/#chapter-10';
const KEY='gemini-toranomaki:capstone:v1';
const results=[];
const good=(v)=>({initial:[[0,0],[1,2],[1,1],[1,1],[1,1],[1,2],[2,3],[0,0],[0,0],[1,2]],repair:[[0,0],[0,0],[0,0],[0,0],[0,0],[0,0],[1,4],[1,3],[0,0],[0,0]],final:Array.from({length:10},()=>[0,0])}[v]);
for(const [engine,type] of Object.entries({chromium,webkit})){
 const browser=await type.launch({headless:true,...(engine==='webkit'?{executablePath:'/workspace/chapter10-independent-20261106/webkit-launch.sh'}:{})});
 const page=await browser.newPage({viewport:{width:1280,height:900}});
 const errs=[];page.on('pageerror',e=>errs.push(String(e)));
 const sel=(name)=>page.getByRole('combobox',{name,exact:true});
 const btn=(name)=>page.getByRole('button',{name,exact:true});
 const saved=()=>page.evaluate(k=>JSON.parse(localStorage.getItem(k)||'null'),KEY);
 const go=async n=>{await sel('総合演習の工程').selectOption(String(n));assert.equal(await page.locator('#capstone-heading').textContent(),`STEP ${n} ${['環境を準備','課題と完成条件','調査と出典照合','資料を整理','制作指示と初版','品質を検証','改善と再検証','評価と振り返り'][n]}`);assert.equal(await page.locator('#capstone-heading').evaluate(e=>e===document.activeElement),true);};
 const confirm=async n=>{await btn('この工程の固定課題を確認').click();assert.ok((await saved()).achieved.includes(n),`stage ${n} should be achieved`);};
 const notes=[];
 try{
  await page.goto(URL);
  assert.match(await page.locator('h1').innerText(),/総合演習/);
  await sel('教材とサービスの配置').selectOption('3');
  await sel('演習方法').selectOption('1');
  await sel('STEP 0 実サービスの現在の自己申告').selectOption('2');
  assert.deepEqual((await saved()).achieved,[]);
  await confirm(0);
  assert.equal((await saved()).real[0],2);
  await go(1); await confirm(1);
  await page.getByRole('textbox',{name:'追加の目的・完成条件（この画面だけ）',exact:true}).fill('INDEPENDENT_PRIVATE_SENTINEL 条件を保存しない');
  await go(2);
  await btn('模擬調査を実行').click();assert.equal((await saved()).researched,false);
  await sel('計画を見る前の予想').selectOption('0');
  for(const n of ['目的と対象読者','対象時期・調査範囲','一次資料と原文の確認','不明点・反証の確認']) await page.getByRole('checkbox',{name:n,exact:true}).check();
  await btn('模擬調査を実行').click();
  assert.match(await page.locator('.cap-main').innerText(),/1923年/);
  assert.match(await page.locator('.cap-context').innerText(),/1924年4月/);
  for(const [i,value] of [1,2,0].entries())await sel(`主張${i+1}と原文の関係`).selectOption(String(value));
  await confirm(2);
  await go(3);
  await page.getByRole('checkbox',{name:'S1 青葉町読書室 開室記録（架空）',exact:true}).uncheck();
  assert.match(await page.locator('.cap-main').innerText(),/資料不足で保留/);
  await btn('変更前の回答を残す').click();
  await page.getByRole('checkbox',{name:'S1 青葉町読書室 開室記録（架空）',exact:true}).check();
  await btn('資料変更の比較を記録').click();
  await sel('Notebookの誤回答への判断').selectOption('0');await btn('この工程の固定課題を確認').click();assert.ok(!(await saved()).achieved.includes(3));
  await sel('Notebookの誤回答への判断').selectOption('2');await confirm(3);
  await go(4);
  for(const n of ['目的・読者・形式','選択資料と引用・原文照合','完成条件と未確認事項','変更箇所・維持条件・動作確認'])await page.getByRole('checkbox',{name:n,exact:true}).check();
  assert.match(await page.getByRole('textbox',{name:'指示文全文',exact:true}).inputValue(),/INDEPENDENT_PRIVATE_SENTINEL/);
  await btn('固定初版を制作して比較する').click();await confirm(4);
  async function trials(v){
   const names={initial:'初版',repair:'修正版1（退行あり）',final:'再修正版'};
   const region=page.getByRole('region',{name:`${names[v]}の成果物`,exact:true});
   await region.getByRole('button',{name:'回答を確認',exact:true}).click();
   assert.equal(await region.getByRole('status').textContent(),v==='repair'?'（結果未表示）':'回答を選んでください。');
   await region.getByRole('radio',{name:'1924年',exact:true}).check();await region.getByRole('button',{name:'回答を確認',exact:true}).click();
   assert.equal(await region.getByRole('status').textContent(),v==='repair'?'（結果未表示）':'正解。S1では1924年と確認できます。');
   await region.getByRole('radio',{name:'1923年',exact:true}).check();await region.getByRole('button',{name:'回答を確認',exact:true}).click();
   assert.equal(await region.getByRole('status').textContent(),v==='repair'?'（結果未表示）':'不正解。S1では1924年。原文を読み直しましょう。');
   assert.ok((await saved()).trials.includes(v));
   notes.push({version:v,observed:await region.innerText()});
  }
  async function grade(v){for(const [i,[verdict,improvement]] of good(v).entries()){
    await sel(`${i+1} 判定`).selectOption(String(verdict));
    // Find semantic evidence text independently; decoys are not evidence.
    const options=await sel(`${i+1} 根拠`).locator('option').allTextContents();
    const actual=options.find(x=>!['選んでください','AIが『すべて成功』と報告した','見た目がきれいで使えそう','資料を読んでいないが多分正しい'].includes(x));
    assert.ok(actual); await sel(`${i+1} 根拠`).selectOption({label:actual});
    await sel(`${i+1} 改善案`).selectOption(String(improvement));await btn(`${i+1} 根拠を照合`).click();
    assert.match(await page.locator('.cap-quality').nth(i).innerText(),/固定資料との照合OK/);
  }}
  await go(5);
  await sel('8 判定').selectOption('0');await sel('8 根拠').selectOption({label:'AIが『すべて成功』と報告した'});await sel('8 改善案').selectOption('0');await btn('8 根拠を照合').click();assert.match(await page.locator('.cap-quality').nth(7).innerText(),/再確認/);
  await sel('8 判定').selectOption('2');const unknownOptions=await sel('8 根拠').locator('option').allTextContents();await sel('8 根拠').selectOption({label:unknownOptions.find(x=>x.includes('まだ操作していない'))});await sel('8 改善案').selectOption('3');await btn('8 根拠を照合').click();assert.match(await page.locator('.cap-quality').nth(7).innerText(),/固定資料との照合OK/);
  await trials('initial');await grade('initial');await confirm(5);
  await go(6);await sel('修正指示の具体性').selectOption('1');await btn('修正指示を適用').click();await trials('repair');await grade('repair');
  await page.getByRole('region',{name:'修正版1（退行あり）の成果物',exact:true}).screenshot({path:`${OUT}/${engine}-repair-observed.png`});
  await btn('退行も直した再修正版を確認').click();await trials('final');await grade('final');await confirm(6);
  await page.getByRole('region',{name:'再修正版の成果物',exact:true}).screenshot({path:`${OUT}/${engine}-final-observed.png`});
  await go(7);
  const axes=['課題設定の明確さ','調査と根拠の正確性','資料整理の適切さ','成果物の完成度','問題発見・修正能力','自分で説明できる理解度'];
  for(const axis of axes){await sel(`${axis}の自己評価`).selectOption('1');await sel(`${axis}の評価理由`).selectOption('1');}
  await page.getByRole('textbox',{name:'次に試すこと・自分の言葉で振り返る（保存しません）',exact:true}).fill('INDEPENDENT_PRIVATE_SENTINEL 振り返り');await confirm(7);
  await page.getByRole('checkbox',{name:'第10章の学習完了を自己申告する',exact:true}).check();
  const complete=await saved();await writeFile(`${OUT}/${engine}-ui-achieved-record.json`,JSON.stringify(complete,null,2));
  assert.equal(JSON.stringify(await page.evaluate(()=>({...localStorage}))).includes('INDEPENDENT_PRIVATE_SENTINEL'),false);
  await page.reload();assert.equal(await page.getByRole('textbox',{name:'次に試すこと・自分の言葉で振り返る（保存しません）',exact:true}).inputValue(),'');
  assert.ok(await page.getByRole('checkbox',{name:'第10章の学習完了を自己申告する',exact:true}).isChecked());
  assert.deepEqual((await saved()).achieved,complete.achieved);
  await go(3);await page.getByRole('checkbox',{name:'S1 青葉町読書室 開室記録（架空）',exact:true}).uncheck();
  const changed=await saved();assert.equal(changed.created,false);assert.deepEqual(changed.trials,[]);assert.ok(!changed.achieved.includes(6));assert.deepEqual(changed.history,complete.history);
  results.push({engine,status:'PASS',notes,errors:errs,completeAchievements:complete.achieved});
 }catch(e){await page.screenshot({path:`${OUT}/${engine}-independent-failure.png`,fullPage:true});results.push({engine,status:'FAIL',error:String(e),stack:e.stack,notes,errors:errs});}
 await browser.close();
}
await writeFile(`${OUT}/independent-sequence.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(({engine,status,error})=>({engine,status,error})),null,2));
if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
