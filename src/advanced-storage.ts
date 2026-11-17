import {recipeIds, type RecipeId} from './advanced-data';
export const advancedKey='gemini-toranomaki:advanced:v1';
export interface Entry { option:number; step:number; viewed:boolean; simulated:boolean; answer:number; graded:boolean; real:number; checked:boolean; reflected:boolean; improvedReal:number; improvedChecked:boolean }
export type Records=Record<RecipeId,Entry>;
export const freshEntry=():Entry=>({option:0,step:0,viewed:false,simulated:false,answer:-1,graded:false,real:0,checked:false,reflected:false,improvedReal:0,improvedChecked:false});
export const freshRecords=():Records=>Object.fromEntries(recipeIds.map(id=>[id,freshEntry()])) as Records;
export function decode(raw:string|null):Records {
 if(raw===null)return freshRecords();
 const x:unknown=JSON.parse(raw);
 if(!x||typeof x!=='object'||Array.isArray(x))throw Error('structure');
 const o=x as Record<string,unknown>;if(o.version!==1||!o.records||typeof o.records!=='object'||Array.isArray(o.records))throw Error('version');
 const result=freshRecords();
 for(const id of recipeIds){
 const e=(o.records as Record<string,unknown>)[id];if(e===undefined)continue;
 if(!e||typeof e!=='object'||Array.isArray(e))throw Error('entry');
 const r=e as Record<string,unknown>;
 const validInt=(key:string,min:number,max:number)=>Number.isInteger(r[key])&&Number(r[key])>=min&&Number(r[key])<=max;
 if(!validInt('option',0,1)||!validInt('step',0,6)||!validInt('answer',-1,1)||!validInt('real',0,3)||!validInt('improvedReal',0,3))throw Error('range');
 for(const key of ['viewed','simulated','graded','checked','reflected','improvedChecked'])if(typeof r[key]!=='boolean')throw Error('type');
 if((r.graded&&r.answer===-1)||(r.checked&&r.real!==1)||(r.improvedChecked&&r.improvedReal!==1))throw Error('correlation');
 result[id]={option:r.option as number,step:r.step as number,answer:r.answer as number,real:r.real as number,viewed:r.viewed as boolean,simulated:r.simulated as boolean,graded:r.graded as boolean,checked:r.checked as boolean,reflected:r.reflected as boolean,improvedReal:r.improvedReal as number,improvedChecked:r.improvedChecked as boolean};
 }
 return result;
}
export function loadAdvanced(){try{return {records:decode(localStorage.getItem(advancedKey)),protected:false};}catch{return {records:freshRecords(),protected:true};}}
export function saveAdvanced(records:Records){try{localStorage.setItem(advancedKey,JSON.stringify({version:1,records}));return true;}catch{return false;}}
export function changeOption(e:Entry,option:number):Entry{return option===e.option?e:{...freshEntry(),viewed:e.viewed,step:e.step,option};}
