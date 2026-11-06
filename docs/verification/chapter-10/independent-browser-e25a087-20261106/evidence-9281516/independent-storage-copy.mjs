import {chromium,webkit} from '../candidate-9281516/node_modules/playwright/index.mjs';
import {readFile,writeFile} from 'node:fs/promises';
import {strict as assert} from 'node:assert';
const OUT='/workspace/chapter10-independent-20261106/candidate-evidence-9281516',URL='http://127.0.0.1:4276/gemini-toranomaki/#chapter-10',KEY='gemini-toranomaki:capstone:v1',PROGRESS='gemini-toranomaki:progress:v1';
const results=[];
const suffixes=['lab','exploration','services','services-practice','research','notebook','live','canvas','nano-banana','video-music','skills'];
const old=Object.fromEntries(suffixes.map((x,i)=>[`gemini-toranomaki:${x}:v1`,JSON.stringify({independentSyntheticOldRecord:i,completed:['chapter-1']})]));
for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true,...(engine==='webkit'?{executablePath:'/workspace/chapter10-independent-20261106/webkit-launch.sh'}:{})});
 const context=await b.newContext();const p=await context.newPage();const sel=n=>p.getByRole('combobox',{name:n,exact:true}),btn=n=>p.getByRole('button',{name:n,exact:true});const go=async n=>{await sel('総合演習の工程').selectOption(String(n));await p.waitForFunction(()=>document.activeElement?.id==='capstone-heading');};
 const get=()=>p.evaluate(()=>({...localStorage}));const saved=async()=>JSON.parse((await get())[KEY]||'null');
 try{
  await p.goto(URL);await p.evaluate(({old,PROGRESS})=>{for(const [k,v]of Object.entries(old))localStorage.setItem(k,v);localStorage.setItem(PROGRESS,JSON.stringify({completed:['chapter-1','chapter-9']}));},{old,PROGRESS});await p.reload();
  await go(1);await p.getByRole('textbox',{name:'追加の目的・完成条件（この画面だけ）',exact:true}).fill('PRIVATE_SENTINEL_FREE_TEXT');await go(4);await go(7);await p.getByRole('textbox',{name:'次に試すこと・自分の言葉で振り返る（保存しません）',exact:true}).fill('PRIVATE_SENTINEL_REFLECTION');await p.getByRole('checkbox',{name:'第10章の学習完了を自己申告する',exact:true}).check();
  let s=await get();assert.ok(!JSON.stringify(s).includes('PRIVATE_SENTINEL'));assert.deepEqual(JSON.parse(s[PROGRESS]).completed,['chapter-1','chapter-9','chapter-10']);for(const [k,v]of Object.entries(old))assert.equal(s[k],v);
  await btn('第10章の記録だけを初期化').click();await btn('初期化をキャンセル').click();assert.equal((await saved()).step,7);
  await btn('第10章の記録だけを初期化').click();await btn('第10章だけ削除する').click();s=await get();assert.equal(s[KEY],undefined);assert.deepEqual(JSON.parse(s[PROGRESS]).completed,['chapter-1','chapter-9']);for(const [k,v]of Object.entries(old))assert.equal(s[k],v);
  await go(3);const chapterBefore=(await get())[KEY];await btn('進捗を初期化').click();await btn('初期化する').click();s=await get();assert.equal(s[PROGRESS],undefined);assert.equal(s[KEY],chapterBefore);for(const [k,v]of Object.entries(old))assert.equal(s[k],v);
  await p.reload();assert.equal((await saved()).step,3);
  results.push({engine,test:'old-key-protection/privacy/scope/global-reset/reload',status:'PASS',protectedKeys:Object.keys(old)});
 }catch(e){results.push({engine,test:'old-key-protection',status:'FAIL',error:String(e),stack:e.stack});}
 await context.close();
 for(const failure of ['read','json','quota','remove','progress-write']){
  const c=await b.newContext();const page=await c.newPage();const record=JSON.parse(await readFile(`${OUT}/sequence/${engine}-ui-achieved-record.json`));
  try{
   await page.goto(URL);await page.evaluate(({KEY,PROGRESS,record,old})=>{localStorage.setItem(KEY,JSON.stringify({...record,step:1}));localStorage.setItem(PROGRESS,JSON.stringify({completed:['chapter-1','chapter-10']}));for(const[k,v]of Object.entries(old))localStorage.setItem(k,v)},{KEY,PROGRESS,record,old});
   if(failure==='json')await page.evaluate(k=>localStorage.setItem(k,'{bad'),KEY);
   if(failure==='read')await page.addInitScript(k=>{const get=Storage.prototype.getItem;Storage.prototype.getItem=function(key){if(key===k)throw Error('SIMULATED_READ_DENIAL');return get.call(this,key)}},KEY);
   await page.reload();
   if(['read','json'].includes(failure))assert.equal(await page.locator('.capstone').getByRole('alert').count(),1);
   if(['quota','remove','progress-write'].includes(failure)){
    await page.evaluate(({failure,KEY,PROGRESS})=>{if(failure==='remove'){const remove=Storage.prototype.removeItem;Storage.prototype.removeItem=function(k){if(k===KEY)throw Error('SIMULATED_REMOVE_DENIAL');return remove.call(this,k)}}else{const set=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){if(k===(failure==='quota'?KEY:PROGRESS))throw new DOMException('SIMULATED_QUOTA','QuotaExceededError');return set.call(this,k,v)}}},{failure,KEY,PROGRESS});
    if(failure==='quota'){await page.getByRole('combobox',{name:'演習テーマ',exact:true}).selectOption('business');assert.equal(await page.locator('.capstone').getByRole('alert').count(),1)}else{await page.getByRole('button',{name:'第10章の記録だけを初期化',exact:true}).click();await page.getByRole('button',{name:'第10章だけ削除する',exact:true}).click();assert.match(await page.locator('.capstone').innerText(),/古い記録が復活する可能性/)}
   }
   const bytes=await page.evaluate(()=>({...localStorage}));for(const[k,v]of Object.entries(old))assert.equal(bytes[k],v);
   results.push({engine,test:`storage-${failure}`,status:'PASS',notice:(await page.locator('.capstone').innerText()).slice(0,400)});
  }catch(e){results.push({engine,test:`storage-${failure}`,status:'FAIL',error:String(e),stack:e.stack})}await c.close();
 }
 for(const action of ['step','topic','ABA','mode','retry','reset','unmount','same-turn'])for(const failure of [false,true]){
  const c=await b.newContext();const page=await c.newPage();
  try{
   await page.addInitScript(()=>{window.calls=[];Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:text=>new Promise((resolve,reject)=>window.calls.push({text,resolve,reject}))}})});
   await page.goto(URL);const s=n=>page.getByRole('combobox',{name:n,exact:true}),bt=n=>page.getByRole('button',{name:n,exact:true});const step=async n=>{await s('総合演習の工程').selectOption(String(n));await page.waitForFunction(()=>document.activeElement?.id==='capstone-heading')};
   await step(4);const full=await page.getByRole('textbox',{name:'指示文全文',exact:true}).inputValue();await bt('指示文全文をコピー').click();assert.equal(await page.evaluate(()=>window.calls[0].text),full);
   if(action==='step')await step(3);
   if(action==='topic'){await step(1);await s('演習テーマ').selectOption('education');await step(4)}
   if(action==='ABA'){await page.getByRole('checkbox',{name:'目的・読者・形式',exact:true}).check();await page.getByRole('checkbox',{name:'目的・読者・形式',exact:true}).uncheck()}
   if(action==='mode')await s('演習方法').selectOption('1');
   if(action==='retry')await bt('この工程から再挑戦').click();
   if(action==='reset'){await bt('第10章の記録だけを初期化').click();await bt('第10章だけ削除する').click();await step(4)}
   if(action==='unmount'){await page.getByRole('link',{name:'第1章を学ぶ',exact:true}).click();await page.getByRole('link',{name:'第10章を学ぶ',exact:true}).click()}
   if(action==='same-turn')await page.evaluate(fail=>{const s=[...document.querySelectorAll('select')].find(x=>x.closest('label')?.textContent.includes('総合演習の工程'));s.value='3';s.dispatchEvent(new Event('change',{bubbles:true}));if(fail)window.calls[0].reject(Error('OLD'));else window.calls[0].resolve()},failure);
   await bt('指示文全文をコピー').click();
   if(action!=='same-turn')await page.evaluate(fail=>{if(fail)window.calls[0].reject(Error('OLD'));else window.calls[0].resolve()},failure);
   assert.equal(await bt('指示文全文をコピー').isDisabled(),true);assert.equal(await page.getByRole('region',{name:'組み立てた指示文',exact:true}).getByRole('status').innerText(),'');
   await page.evaluate(()=>window.calls[1].reject(Error('CURRENT_DENIAL')));await page.waitForFunction(()=>[...document.querySelectorAll('[role=status]')].some(e=>e.textContent.includes('コピーできませんでした')));
   assert.equal(await bt('指示文全文をコピー').isDisabled(),false);assert.deepEqual(await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).copied,KEY),[]);
   await bt('指示文全文をコピー').click();await page.evaluate(()=>window.calls[2].resolve());await page.waitForFunction(()=>[...document.querySelectorAll('[role=status]')].some(e=>e.textContent.includes('全文をコピーしました')));
   assert.equal((await page.evaluate(k=>JSON.parse(localStorage.getItem(k)).copied,KEY)).length,1);
   results.push({engine,test:`copy-${action}-old-${failure?'failure':'success'}-current-failure-retry`,status:'PASS'});
  }catch(e){await page.screenshot({path:`${OUT}/${engine}-copy-${action}-${failure}-failure.png`,fullPage:true});results.push({engine,test:`copy-${action}-${failure}`,status:'FAIL',error:String(e),stack:e.stack})}await c.close();
 }
 await b.close();
}
await writeFile(`${OUT}/independent-storage-copy.json`,JSON.stringify(results,null,2));console.log(JSON.stringify({cases:results.length,failures:results.filter(x=>x.status==='FAIL')},null,2));if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
