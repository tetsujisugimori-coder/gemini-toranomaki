import {describe,it,expect} from 'vitest';
import {recipes,promptFor,salesSummary} from './advanced-data';
import {decode,changeOption,freshEntry,freshRecords} from './advanced-storage';
describe('advanced contract',()=>{
 it('six unique independent recipes with full material and answer',()=>{expect(new Set(recipes.map(r=>r.id)).size).toBe(6);for(const r of recipes){expect(r.materials.length).toBeGreaterThan(0);expect(r.answers[r.correct]).toBeTruthy();expect(r.hints.length).toBe(2);expect(promptFor(r,0,true)).toContain(r.improve);}});
 it('CSV independent integer totals and denominator',()=>{expect(salesSummary(true)).toEqual({total:17000,count:5,missing:1,largeShare:12000/17000*100});expect(salesSummary(false).total).toBe(17300);});
 it('missing previous version cannot leak into prompt',()=>{const f=recipes[5];expect(promptFor(f,1,false)).not.toContain('[F1]');expect(promptFor(f,1,false)).toContain('比較不能');});
 it('same option preserves, real changes invalidate',()=>{const e={...freshEntry(),graded:true,answer:1,checked:true,real:1};expect(changeOption(e,0)).toBe(e);expect(changeOption(e,1)).toEqual({...freshEntry(),option:1});});
 it('default and valid records roundtrip',()=>{const r=freshRecords();r.B.real=1;r.B.checked=true;expect(decode(JSON.stringify({version:1,records:r}))).toEqual(r);expect(decode(null)).toEqual(freshRecords());});
 for(const bad of ['{','null','[]','{}','{"version":1,"records":[]}', '{"version":2,"records":{}}','{"version":1,"records":{"A":null}}'])it('reject corrupt '+bad,()=>expect(()=>decode(bad)).toThrow());
 for(const [field,value] of [['real',9],['checked','yes'],['answer',NaN],['option',-1],['step',7]])it('reject invalid '+field,()=>{const r=freshRecords();Object.assign(r.A,{[field as string]:value});expect(()=>decode(JSON.stringify({version:1,records:r}))).toThrow();});
 it('does not promote incomplete external self report',()=>{const r=freshRecords();r.A.checked=true;expect(()=>decode(JSON.stringify({version:1,records:r}))).toThrow();});
 it('cannot grade unanswered fixed question',()=>{const r=freshRecords();r.A.graded=true;expect(()=>decode(JSON.stringify({version:1,records:r}))).toThrow();});
 it('ignores arbitrary content fields, never restores free text',()=>{const r=freshRecords();Object.assign(r.A,{secret:'private'});expect(JSON.stringify(decode(JSON.stringify({version:1,records:r})))).not.toContain('private');});
});
