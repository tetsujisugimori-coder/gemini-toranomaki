import {chromium,webkit} from '../candidate-075a2ba/node_modules/playwright/index.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {strict as assert} from 'node:assert';
const OUT='/workspace/chapter10-independent-20261106/candidate-evidence-075a2ba',KEY='gemini-toranomaki:capstone:v1',URL='http://127.0.0.1:4275/gemini-toranomaki/#chapter-10';
const results=[];
for(const[engine,type]of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true,...(engine==='webkit'?{executablePath:'/workspace/chapter10-independent-20261106/webkit-launch.sh'}:{})});
 const record=JSON.parse(await readFile(`${OUT}/sequence/${engine}-ui-achieved-record.json`));
 const samples=[
 ['normal',JSON.stringify(record),false],
 ['normal-key-order',JSON.stringify(Object.fromEntries(Object.entries(record).reverse())),false],
 ['partial-valid',JSON.stringify({topic:'business',step:2,history:['history:2'],copied:['history:4']}),false],
 ['original-P2',JSON.stringify({achieved:[2,3,4,5,6,7],topic:'corrupt',created:'true'}),true],
 ['impossible-achievements',JSON.stringify({...record,created:false,history:['education:2'],copied:['history:4']}),true],
 ['invalid-boolean',JSON.stringify({...record,created:'true'}),true],
 ['invalid-artifact',JSON.stringify({...record,artifact:99}),true],
 ['invalid-answers',JSON.stringify({...record,research:[1,'2',0]}),true],
 ['unknown-property',JSON.stringify({...record,privateText:'SYNTHETIC_NOT_REAL_SECRET'}),true],
 ['primitive','42',true],['null','null',true],['array','[]',true],['invalid-JSON','{bad',true]
 ];
 for(const[name,raw,protectedExpected]of samples){
  const c=await b.newContext();const p=await c.newPage();const s=n=>p.getByRole('combobox',{name:n,exact:true}),bt=n=>p.getByRole('button',{name:n,exact:true});
  try{
   await p.goto(URL);await p.evaluate(({KEY,raw})=>{localStorage.setItem(KEY,raw);localStorage.setItem('gemini-toranomaki:research:v1','UNCHANGED_OTHER_RECORD');localStorage.setItem('gemini-toranomaki:progress:v1',JSON.stringify({completed:['chapter-1','chapter-9','chapter-10']}))},{KEY,raw});await p.reload();await p.locator('#capstone-heading').waitFor();
   const alerts=p.locator('.capstone').getByRole('alert');assert.equal(await alerts.count(),protectedExpected?1:0);
   assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),raw);
   if(name==='normal'||name==='normal-key-order'){
    assert.match(await p.getByRole('region',{name:'総合演習の現在位置',exact:true}).innerText(),/現在の模擬確認 8\/8/);
    await s('総合演習の工程').selectOption('6');assert.equal(await p.getByRole('region',{name:'再修正版の成果物',exact:true}).count(),1);
    const restored=await p.evaluate(k=>JSON.parse(localStorage.getItem(k)),KEY);assert.deepEqual(restored.quality,record.quality);assert.deepEqual(restored.trials,['initial','repair','final']);assert.deepEqual(restored.achieved,record.achieved);assert.equal(await alerts.count(),0);
   }else if(protectedExpected){
    assert.match(await alerts.innerText(),/元の保存データは保持/);
    const position=await p.getByRole('region',{name:'総合演習の現在位置',exact:true}).innerText();
    if(['original-P2','impossible-achievements','invalid-boolean','invalid-artifact','primitive','null','array','invalid-JSON'].includes(name))assert.ok(!position.includes('現在の模擬確認 6/8'));
    await s('総合演習の工程').selectOption('3');
    await p.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{}}}));
    await bt('指示文全文をコピー').click();await p.waitForFunction(()=>[...document.querySelectorAll('[role=status]')].some(x=>x.textContent.includes('全文をコピーしました')));
    assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),raw);await p.reload();assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),raw);
    await bt('第10章の記録だけを初期化').click();await bt('初期化をキャンセル').click();assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),raw);
    if(name==='original-P2'){
     await s('総合演習の工程').selectOption('6');assert.match(await p.locator('.cap-main').innerText(),/まだ初版がありません/);assert.match(await p.getByRole('region',{name:'総合演習の現在位置',exact:true}).innerText(),/現在の模擬確認 0\/8/);await p.locator('.capstone').screenshot({path:`${OUT}/${engine}-protected-P2-fixed.png`});
     await p.evaluate(k=>{const remove=Storage.prototype.removeItem;window.originalRemove=remove;Storage.prototype.removeItem=function(key){if(key===k)throw Error('SIMULATED_REMOVE_DENIED');return remove.call(this,key)}},KEY);
     await bt('第10章の記録だけを初期化').click();await bt('第10章だけ削除する').click();assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),raw);await s('総合演習の工程').selectOption('4');assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),raw);assert.match(await p.locator('.capstone').innerText(),/古い記録が復活/);
     await p.evaluate(()=>Storage.prototype.removeItem=window.originalRemove);
    }
    await bt('第10章の記録だけを初期化').click();await bt('第10章だけ削除する').click();assert.equal(await p.evaluate(k=>localStorage.getItem(k),KEY),null);
    await s('総合演習の工程').selectOption('1');await s('演習テーマ').selectOption('business');assert.equal(await alerts.count(),0);await p.reload();assert.equal(await alerts.count(),0);assert.equal(await s('演習テーマ').inputValue(),'business');
   }
   assert.equal(await p.evaluate(()=>localStorage.getItem('gemini-toranomaki:research:v1')),'UNCHANGED_OTHER_RECORD');
   results.push({engine,test:name,status:'PASS',protectedExpected});
  }catch(e){await p.screenshot({path:`${OUT}/${engine}-${name}-failure.png`,fullPage:true});results.push({engine,test:name,status:'FAIL',error:String(e),stack:e.stack})}await c.close();
 }
 await b.close();
}
await writeFile(`${OUT}/independent-restore-protection.json`,JSON.stringify(results,null,2));console.log(JSON.stringify({cases:results.length,failed:results.filter(x=>x.status==='FAIL')},null,2));if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
