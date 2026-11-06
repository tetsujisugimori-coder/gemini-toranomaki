import {chromium,webkit} from '../candidate-557f12e/node_modules/playwright/index.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {strict as assert} from 'node:assert';
const OUT='/workspace/chapter10-independent-20261106/candidate-evidence-557f12e';
const record=JSON.parse(await readFile(`${OUT}/chromium-ui-achieved-record.json`));
const results=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true,...(engine==='webkit'?{executablePath:'/workspace/chapter10-independent-20261106/webkit-launch.sh'}:{})});
 const p=await b.newPage({viewport:{width:1280,height:900}});
 const sel=n=>p.getByRole('combobox',{name:n,exact:true});const btn=n=>p.getByRole('button',{name:n,exact:true});
 await p.goto('http://127.0.0.1:4173/gemini-toranomaki/#chapter-10');
 await p.evaluate(r=>localStorage.setItem('gemini-toranomaki:capstone:v1',JSON.stringify(r)),record);await p.reload();
 await sel('総合演習の工程').selectOption('6');
 await sel('検査する版').selectOption('1');
 const region=p.getByRole('region',{name:'修正版1（退行あり）の成果物',exact:true});
 await region.getByRole('radio',{name:'1924年',exact:true}).check();await region.getByRole('button',{name:'回答を確認',exact:true}).click();
 const observed=await region.getByRole('status').innerText();assert.equal(observed,'（結果未表示）');
 await region.screenshot({path:`${OUT}/${engine}-counterexample-repair-no-explanation.png`});
 const accepted=[];
 for(const i of [2,6]){
  await sel(`${i} 判定`).selectOption('0');
  const evidence= i===2?'選択した完成条件が本文に揃っている':'制作指示の対象・形式・根拠・完成条件を確認できる';
  await sel(`${i} 根拠`).selectOption({label:evidence});await sel(`${i} 改善案`).selectOption('0');await btn(`${i} 根拠を照合`).click();
  const text=await p.locator('.cap-quality').nth(i-1).innerText();assert.match(text,/固定資料との照合OK/);
  accepted.push({item:i,verdict:'適合',evidence,status:text});
  await p.locator('.cap-quality').nth(i-1).screenshot({path:`${OUT}/${engine}-counterexample-quality${i}-false-pass.png`});
 }
 results.push({engine,finding:'P2-RUBRIC',observed,requirements:record.requirements,prompt:record.prompt,accepted,expected:'確認問題と解説という選択済み完成条件を満たさない。項目2・6は要改善として根拠を返す。'});
 const corrupt={achieved:[2,3,4,5,6,7],topic:'corrupt',created:'true'};
 await p.evaluate(r=>localStorage.setItem('gemini-toranomaki:capstone:v1',JSON.stringify(r)),corrupt);await p.reload();
 const alertCount=await p.locator('.capstone').getByRole('alert').count();
 const position=await p.getByRole('region',{name:'総合演習の現在位置',exact:true}).innerText();
 assert.equal(alertCount,0);assert.match(position,/現在の模擬確認 6\/8/);
 await sel('総合演習の工程').selectOption('6');
 const noInitial=await p.locator('.cap-main').innerText();assert.match(noInitial,/まだ初版がありません/);
 const after=await p.evaluate(()=>JSON.parse(localStorage.getItem('gemini-toranomaki:capstone:v1')));
 await p.locator('.capstone').screenshot({path:`${OUT}/${engine}-counterexample-corrupt-achievement.png`});
 results.push({engine,finding:'P2-CORRUPT',input:corrupt,alertCount,position,noInitial,after,expected:'破損通知し不成立の現在達成を復元しない。過去の履歴と成立条件を照合した現在達成を区別する。'});
 await b.close();
}
await writeFile(`${OUT}/independent-counterexamples.json`,JSON.stringify(results,null,2));console.log(JSON.stringify(results.map(({engine,finding})=>({engine,finding,reproduced:true})),null,2));
