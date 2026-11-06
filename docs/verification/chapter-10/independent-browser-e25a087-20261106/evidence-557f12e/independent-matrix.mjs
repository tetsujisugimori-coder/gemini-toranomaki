import {chromium,webkit} from '../candidate-557f12e/node_modules/playwright/index.mjs';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {strict as assert} from 'node:assert';
const OUT='/workspace/chapter10-independent-20261106/candidate-evidence-557f12e';await mkdir(`${OUT}/matrix`,{recursive:true});
const results=[];
for(const [engine,type] of Object.entries({chromium,webkit})){
 const b=await type.launch({headless:true,...(engine==='webkit'?{executablePath:'/workspace/chapter10-independent-20261106/webkit-launch.sh'}:{})});
 const record=JSON.parse(await readFile(`${OUT}/sequence-run2/${engine}-ui-achieved-record.json`));
 for(const width of [1280,320,375,390])for(const theme of ['light','dark'])for(const scale of [100,200]){
  const context=await b.newContext({viewport:{width,height:900},colorScheme:theme,reducedMotion:'reduce'});const p=await context.newPage();
  const errors=[];p.on('pageerror',e=>errors.push(String(e)));const states=[];
  try{
   await p.addInitScript(r=>localStorage.setItem('gemini-toranomaki:capstone:v1',JSON.stringify({...r,step:0,mode:1})),record);
   await p.goto('http://127.0.0.1:4274/gemini-toranomaki/#chapter-10');
   await p.evaluate(v=>document.documentElement.style.fontSize=`${v}%`,scale);
   assert.equal(await p.locator('html').getAttribute('data-theme'),theme);
   assert.equal(await p.evaluate(()=>getComputedStyle(document.documentElement).fontSize),scale===200?'32px':'16px');
   assert.equal(await p.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches),true);
   for(let n=0;n<8;n++){
    const control=p.getByRole('combobox',{name:'総合演習の工程',exact:true});await control.selectOption(String(n));await p.waitForFunction(()=>document.activeElement?.id==='capstone-heading');
    const bounds=await p.locator('.capstone').evaluate(root=>({width:innerWidth,scrollWidth:document.documentElement.scrollWidth,outside:[...root.querySelectorAll('button,select,textarea,input,fieldset')].map(el=>({tag:el.tagName,label:el.getAttribute('aria-label')||el.textContent?.slice(0,50),x:el.getBoundingClientRect().x,right:el.getBoundingClientRect().right,width:el.getBoundingClientRect().width})).filter(r=>r.width>0&&(r.x<-.5||r.right>innerWidth+.5))}));
    states.push({step:n,...bounds});assert.equal(bounds.scrollWidth,width);assert.deepEqual(bounds.outside,[]);
    if(n===5){
     await p.getByRole('combobox',{name:'8 根拠',exact:true}).focus();await p.keyboard.press('Tab');
     assert.match(await p.evaluate(()=>document.activeElement?.closest('label')?.textContent||''),/8 改善案/);
     if((width===320&&scale===200&&theme==='dark')||(width===1280&&scale===100&&theme==='light')){
      await p.locator('.cap-quality').nth(7).screenshot({path:`${OUT}/matrix/${engine}-${width}-${theme}-${scale}-quality.png`});
     }
    }
    if(n===6){
     await p.getByRole('button',{name:'検査する版を見る',exact:true}).focus();await p.keyboard.press('Enter');assert.equal(await p.getByRole('button',{name:'検査する版を見る',exact:true}).getAttribute('aria-pressed'),'true');
     if((width===375&&scale===200&&theme==='light')||(width===390&&scale===100&&theme==='dark'))await p.getByRole('region',{name:'再修正版の成果物',exact:true}).screenshot({path:`${OUT}/matrix/${engine}-${width}-${theme}-${scale}-artifact.png`});
    }
   }
   const reset=p.getByRole('button',{name:'第10章の記録だけを初期化',exact:true});await reset.focus();await p.keyboard.press('Enter');await p.getByRole('button',{name:'初期化をキャンセル',exact:true}).focus();await p.keyboard.press('Enter');await p.waitForFunction(()=>document.activeElement?.textContent==='第10章の記録だけを初期化');
   results.push({engine,width,theme,scale,status:'PASS',states,errors});
  }catch(e){await p.screenshot({path:`${OUT}/matrix/${engine}-${width}-${theme}-${scale}-failure.png`,fullPage:true});results.push({engine,width,theme,scale,status:'FAIL',error:String(e),stack:e.stack,states,errors});}
  await context.close();
 }
 await b.close();
}
await writeFile(`${OUT}/independent-matrix.json`,JSON.stringify(results,null,2));console.log(JSON.stringify({cases:results.length,failed:results.filter(x=>x.status==='FAIL'),pageErrors:results.flatMap(x=>x.errors)},null,2));if(results.some(x=>x.status==='FAIL'))process.exitCode=1;
