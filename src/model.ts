export type Exercise={id:string;name:string;muscle:string;category:string;equipment:string;weight:number;unit:'lbs'|'kg';load:'total'|'per dumbbell'|'bodyweight'|'not applicable';sets:number;reps:string;notes:string};
export type PlanExercise={id:string;exerciseId:string;name:string;weight:number;unit:string;load:string;sets:number;reps:string};
export type SetLog={id:string;weight:number;reps:number;warmup:boolean;done:boolean};
export type Session={id:string;date:string;day:number;title:string;started:string;completed?:string;notes:string;exercises:(PlanExercise&{logs:SetLog[]})[];cardio:{distance:number;duration:number;incline:number;speed:number;unit:'miles'|'km'}};
export type Habit={id:string;name:string;target:number;unit:string;enabled:boolean;days:number[];optional:boolean};
export type Daily={values:Record<string,number>;overrides:Record<string,boolean>;meals:Record<string,{eaten:boolean;protein:boolean;notes:string}>;notes:string};
export type Metric={id:string;date:string;kind:string;value:number;unit:string};
export type Photo={id:string;date:string;view:string;notes:string;data:string};
export type State={version:1;welcomed:boolean;exercises:Exercise[];templates:Record<number,PlanExercise[]>;sessions:Session[];days:Record<string,Daily>;metrics:Metric[];photos:Photo[];habits:Habit[];settings:{start:string;weightUnit:'lbs'|'kg';measureUnit:'in'|'cm';waterUnit:'oz'|'L';theme:'dark'|'light';proteinMode:'simple'|'detailed';protein:number;targetWeight:number;defaultSets:number;defaultReps:string;schedule:string[]}};
export const titles=['Rest & recharge','Chest + Back A','Shoulders + Arms A','Legs + Core','Chest + Back B','Shoulders + Arms B','Light home workout'];
export const uid=()=>crypto.randomUUID();
export const dateKey=(date=new Date())=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
export const parseDate=(s:string)=>new Date(s+'T12:00:00');
export function shift(s:string,n:number){const d=parseDate(s);d.setDate(d.getDate()+n);return dateKey(d)}
export function weekDates(s:string){const d=parseDate(s);return Array.from({length:7},(_,i)=>shift(s,-((d.getDay()+6)%7)+i))}
export const emptyDay=():Daily=>({values:{},overrides:{},meals:{},notes:''});
export function initialState():State{return {version:1,welcomed:false,exercises:[],templates:{},sessions:[],days:{},metrics:[],photos:[],settings:{start:'2026-11-16',weightUnit:'lbs',measureUnit:'in',waterUnit:'oz',theme:'dark',proteinMode:'simple',protein:140,targetWeight:163,defaultSets:3,defaultReps:'8–12',schedule:titles},habits:[
{id:'workout',name:'Scheduled workout',target:1,unit:'',enabled:true,days:[1,2,3,4,5],optional:false},
{id:'cardio',name:'Post-workout cardio',target:1,unit:'',enabled:true,days:[1,2,4,5],optional:false},
{id:'steps',name:'Daily steps',target:7000,unit:'steps',enabled:true,days:[0,1,2,3,4,5,6],optional:false},
{id:'morning',name:'Morning walk',target:1,unit:'',enabled:true,days:[0,1,2,3,4,5,6],optional:false},
{id:'lunch',name:'After-lunch walk',target:1,unit:'',enabled:true,days:[0,1,2,3,4,5,6],optional:false},
{id:'standing',name:'Standing desk',target:90,unit:'min',enabled:true,days:[0,1,2,3,4,5,6],optional:false},
{id:'protein',name:'Protein goal met',target:1,unit:'',enabled:true,days:[0,1,2,3,4,5,6],optional:false},
{id:'water',name:'Hydration',target:128,unit:'oz',enabled:true,days:[0,1,2,3,4,5,6],optional:false},
{id:'sleep',name:'Sleep',target:7,unit:'hrs',enabled:true,days:[0,1,2,3,4,5,6],optional:false}]}}
export function activeHabits(s:State,date:string){return s.habits.filter(h=>h.enabled&&h.days.includes(parseDate(date).getDay()))}
export function habitDone(s:State,date:string,h:Habit){const d=s.days[date]||emptyDay();return d.overrides[h.id]??((d.values[h.id]||0)>=h.target)}
export function consistency(s:State,dates:string[]){let done=0,total=0;dates.forEach(date=>activeHabits(s,date).filter(h=>!h.optional).forEach(h=>{total++;if(habitDone(s,date,h))done++}));return total?Math.round(done/total*100):0}
export function createSession(s:State,date:string):Session{const day=parseDate(date).getDay();return {id:uid(),date,day,title:s.settings.schedule[day],started:new Date().toISOString(),notes:'',cardio:{distance:0,duration:0,incline:0,speed:0,unit:'miles'},exercises:structuredClone(s.templates[day]||[]).map(e=>({...e,logs:Array.from({length:e.sets},()=>({id:uid(),weight:e.weight,reps:parseInt(e.reps)||10,warmup:false,done:false}))}))}}
export function history(s:State,id:string){return s.sessions.filter(x=>x.completed).flatMap(x=>x.exercises.filter(e=>e.exerciseId===id).map(e=>({date:x.date,session:x.id,unit:e.unit,sets:e.logs.filter(l=>l.done&&!l.warmup),name:e.name}))).filter(e=>e.sets.length)}
export function streak(s:State,id:string,date:string){let n=0;for(let i=0;i<366;i++){const key=shift(date,-i),h=s.habits.find(h=>h.id===id);if(!h)return n;if(!h.enabled||!h.days.includes(parseDate(key).getDay())||h.optional)continue;if(!habitDone(s,key,h)){if(i===0)continue;break}n++}return n}
export function validateBackup(raw:unknown):State{
const fail=()=>{throw new Error('Invalid backup. Choose a complete Recomp OS version 1 JSON export. No data was changed.')};
if(!raw||typeof raw!=='object')return fail();const s=raw as State;
if(s.version!==1||typeof s.welcomed!=='boolean'||!Array.isArray(s.exercises)||!Array.isArray(s.sessions)||!Array.isArray(s.habits)||!Array.isArray(s.metrics)||!Array.isArray(s.photos)||!s.templates||!s.days||!s.settings)return fail();
const str=(v:unknown)=>typeof v==='string',num=(v:unknown)=>typeof v==='number'&&Number.isFinite(v)&&v>=0;
const date=(v:unknown)=>str(v)&&/^\d{4}-\d{2}-\d{2}$/.test(v as string)&&!isNaN(parseDate(v as string).getTime());
const plan=(e:PlanExercise)=>e&&str(e.id)&&str(e.exerciseId)&&str(e.name)&&num(e.weight)&&num(e.sets)&&str(e.reps)&&str(e.unit)&&str(e.load);
if(!date(s.settings.start)||!['lbs','kg'].includes(s.settings.weightUnit)||!['in','cm'].includes(s.settings.measureUnit)||!['oz','L'].includes(s.settings.waterUnit)||!['dark','light'].includes(s.settings.theme)||!['simple','detailed'].includes(s.settings.proteinMode)||!num(s.settings.protein)||!num(s.settings.targetWeight)||!num(s.settings.defaultSets)||!str(s.settings.defaultReps)||!Array.isArray(s.settings.schedule)||s.settings.schedule.length!==7||!s.settings.schedule.every(str))return fail();
if(!s.exercises.every(e=>str(e.id)&&str(e.name)&&str(e.muscle)&&str(e.category)&&str(e.equipment)&&num(e.weight)&&['lbs','kg'].includes(e.unit)&&['total','per dumbbell','bodyweight','not applicable'].includes(e.load)&&num(e.sets)&&str(e.reps)&&str(e.notes)))return fail();
if(!Object.entries(s.templates).every(([k,es])=>/^[0-6]$/.test(k)&&Array.isArray(es)&&es.every(plan)))return fail();
if(!s.sessions.every(x=>str(x.id)&&date(x.date)&&num(x.day)&&x.day<=6&&str(x.title)&&str(x.started)&&(!x.completed||str(x.completed))&&str(x.notes)&&x.cardio&&['miles','km'].includes(x.cardio.unit)&&['distance','duration','incline','speed'].every(k=>num(x.cardio[k as 'distance']))&&Array.isArray(x.exercises)&&x.exercises.every(e=>plan(e)&&Array.isArray(e.logs)&&e.logs.every(l=>str(l.id)&&num(l.weight)&&num(l.reps)&&typeof l.warmup==='boolean'&&typeof l.done==='boolean'))))return fail();
if(!['workout','cardio','steps','morning','lunch','standing','protein','water','sleep'].every(id=>s.habits.some(h=>h.id===id)))return fail();
if(!s.habits.every(h=>str(h.id)&&str(h.name)&&num(h.target)&&h.target>0&&str(h.unit)&&typeof h.enabled==='boolean'&&typeof h.optional==='boolean'&&Array.isArray(h.days)&&h.days.every(d=>num(d)&&d<=6)))return fail();
if(!Object.entries(s.days).every(([k,d])=>date(k)&&d&&d.values&&Object.values(d.values).every(num)&&d.overrides&&Object.values(d.overrides).every(v=>typeof v==='boolean')&&str(d.notes)&&d.meals&&Object.values(d.meals).every(m=>typeof m.eaten==='boolean'&&typeof m.protein==='boolean'&&str(m.notes))))return fail();
if(!s.metrics.every(m=>str(m.id)&&date(m.date)&&str(m.kind)&&num(m.value)&&str(m.unit))||!s.photos.every(p=>str(p.id)&&date(p.date)&&str(p.view)&&str(p.notes)&&/^data:image\/(png|jpeg|webp);base64,/.test(p.data)))return fail();
return structuredClone(s);
}
