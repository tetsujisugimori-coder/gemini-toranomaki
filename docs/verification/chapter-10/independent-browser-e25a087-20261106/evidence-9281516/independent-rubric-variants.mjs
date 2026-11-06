import {chromium,webkit} from '../candidate-9281516/node_modules/playwright/index.mjs';
import {writeFile} from 'node:fs/promises';
import {strict as assert} from 'node:assert';
const OUT='/workspace/chapter10-independent-20261106/candidate-evidence-9281516',URL='http://127.0.0.1:4276/gemini-toranomaki/#chapter-10';
const cases=[['history',0,[0,1,2]],['history',1,[]],['education',1,[2]],['education',0,[0,1]],['business',2,[0,1,2]],['business',2,[0,1]]];
const names=['原文と出典IDを示す','不明点と対象範囲を明示','確認問題と解説を付ける'];const results=[];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true,...(engine==='webkit'?{executablePath:'/workspace/chapter10-independent-20261106/webkit-launch.sh'}:{})});
 for(const[topic,artifact,requirements]of cases){
  const c=await b.newContext();const p=await c.newPage();const s=n=>p.getByRole('combobox',{name:n,exact:true}),bt=n=>p.getByRole('button',{name:n,exact:true});const observed=[];
  try{
   await p.goto(URL);await s('総合演習の工程').selectOption('1');await s('演習テーマ').selectOption(topic);await s('成果物の形式').selectOption(String(artifact));
   for(let i=0;i<3;i++)await p.getByRole('checkbox',{name:names[i],exact:true}).setChecked(requirements.includes(i));
   await s('総合演習の工程').selectOption('4');
   for(const name of ['目的・読者・形式','選択資料と引用・原文照合','完成条件と未確認事項','変更箇所・維持条件・動作確認'])await p.getByRole('checkbox',{name,exact:true}).check();
   await bt('固定初版を制作して比較する').click();await s('総合演習の工程').selectOption('5');
   for(const version of ['initial','repair','final']){
    if(version==='repair'){await s('総合演習の工程').selectOption('6');await s('修正指示の具体性').selectOption('1');await bt('修正指示を適用').click()}
    if(version==='final')await bt('退行も直した再修正版を確認').click();
    const name={initial:'初版',repair:'修正版1（退行あり）',final:'再修正版'}[version];const region=p.getByRole('region',{name:`${name}の成果物`,exact:true});
    const quiz=artifact===0||requirements.includes(2);assert.equal(await region.getByRole('button',{name:'回答を確認',exact:true}).count(),quiz?1:0);
    let output='対象外';if(quiz){await region.getByRole('radio').last().check();await region.getByRole('button',{name:'回答を確認',exact:true}).click();output=await region.getByRole('status').innerText();assert.ok(version==='repair'?output==='（結果未表示）':output.startsWith('正解。'))}
    const expected2=version==='initial'?requirements.some(x=>x===0||x===1)?1:0:version==='repair'&&requirements.includes(2)?1:0;
    const expected6=version==='initial'?1:version==='repair'&&quiz?1:0;
    const improvements=[expected2?(version==='repair'?3:2):0,expected6?(version==='repair'?3:2):0];
    for(const [index,item]of [2,6].entries()){
     const expected=index===0?expected2:expected6;
     const options=await s(`${item} 根拠`).locator('option').allTextContents();const evidence=options.find(x=>!['選んでください','AIが『すべて成功』と報告した','見た目がきれいで使えそう','資料を読んでいないが多分正しい'].includes(x));assert.ok(evidence);
     await s(`${item} 根拠`).selectOption({label:evidence});await s(`${item} 改善案`).selectOption(String(improvements[index]));await s(`${item} 判定`).selectOption(String(expected));await bt(`${item} 根拠を照合`).click();assert.match(await p.locator('.cap-quality').nth(item-1).innerText(),/固定資料との照合OK/);
     await s(`${item} 判定`).selectOption(String(expected===0?1:0));await bt(`${item} 根拠を照合`).click();assert.match(await p.locator('.cap-quality').nth(item-1).innerText(),/再確認/);
    }
    observed.push({version,quiz,output,expectedCompleteness:expected2,expectedInstructionCompliance:expected6});
   }
   results.push({engine,topic,artifact,requirements,status:'PASS',observed});
  }catch(e){await p.screenshot({path:`${OUT}/${engine}-${topic}-${artifact}-${requirements.join('')}-rubric-failure.png`,fullPage:true});results.push({engine,topic,artifact,requirements,status:'FAIL',error:String(e),stack:e.stack,observed})}await c.close();
 }
 await b.close();
}
await writeFile(`${OUT}/independent-rubric-variants.json`,JSON.stringify(results,null,2));console.log(JSON.stringify({cases:results.length,failed:results.filter(x=>x.status==='FAIL')},null,2));if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
