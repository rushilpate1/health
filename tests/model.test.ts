import {describe,it,expect,beforeEach} from 'vitest';
import {initialState,createSession,history,consistency,habitDone,validateBackup,emptyDay,weekDates,streak,type State} from '../src/model';
let s:State;
beforeEach(()=>{s=initialState()});
describe('safe defaults and calendar',()=>{
it('starts with a completely empty library and unconfirmed weight',()=>{expect(s.exercises).toEqual([]);expect(s.metrics).toEqual([]);expect(s.templates).toEqual({});expect(s.settings.start).toBe('2026-11-16')});
it('builds Monday–Sunday weeks across year boundaries',()=>expect(weekDates('2027-01-01')).toEqual(['2026-12-28','2026-12-29','2026-12-30','2026-12-31','2027-01-01','2027-01-02','2027-01-03']));
});
describe('historical isolation',()=>{
beforeEach(()=>{s.exercises.push({id:'e',name:'Press',muscle:'Chest',category:'Strength',equipment:'Dumbbell',weight:35,unit:'lbs',load:'per dumbbell',sets:3,reps:'10',notes:''});s.templates[1]=[{id:'p',exerciseId:'e',name:'Press',weight:35,unit:'lbs',load:'per dumbbell',sets:3,reps:'10'}]});
it('snapshots templates and independently tracks future sessions',()=>{const a=createSession(s,'2026-11-16');s.templates[1][0].weight=45;const b=createSession(s,'2026-11-23');a.exercises[0].logs[0].weight=30;expect(a.exercises[0].weight).toBe(35);expect(b.exercises[0].weight).toBe(45);expect(b.exercises[0].logs[0].weight).toBe(45);expect(s.exercises[0].weight).toBe(35)});
it('counts only completed working sets in finished sessions',()=>{const a=createSession(s,'2026-11-16');a.exercises[0].logs[0]={id:'l',weight:40,reps:8,warmup:false,done:true};a.exercises[0].logs[1]={id:'w',weight:100,reps:3,warmup:true,done:true};s.sessions.push(a);expect(history(s,'e')).toHaveLength(0);a.completed='2026-11-16T19:00:00Z';expect(history(s,'e')[0].sets.map(l=>l.weight)).toEqual([40]);a.exercises[0].logs[0].weight=42;expect(s.exercises[0].weight).toBe(35);expect(s.templates[1][0].weight).toBe(35)});
it('does not share plans or logs across dates or days',()=>{s.templates[4]=structuredClone(s.templates[1]);const a=createSession(s,'2026-11-16'),b=createSession(s,'2026-11-19');a.exercises[0].logs[0].done=true;expect(b.exercises[0].logs[0].done).toBe(false);expect(a.id).not.toBe(b.id)});
});
describe('habit accuracy',()=>{
it('automatically completes numeric targets and allows manual correction',()=>{s.days['2026-11-16']=emptyDay();const h=s.habits.find(h=>h.id==='steps')!;s.days['2026-11-16'].values.steps=7000;expect(habitDone(s,'2026-11-16',h)).toBe(true);s.days['2026-11-16'].overrides.steps=false;expect(habitDone(s,'2026-11-16',h)).toBe(false)});
it('excludes disabled, optional, and unscheduled habits from consistency',()=>{s.habits.forEach(h=>{h.enabled=false});const steps=s.habits.find(h=>h.id==='steps')!;steps.enabled=true;s.days['2026-11-15']=emptyDay();s.days['2026-11-15'].values.steps=7000;const workout=s.habits[0];workout.enabled=true;expect(consistency(s,['2026-11-15'])).toBe(100);workout.days.push(0);workout.optional=true;expect(consistency(s,['2026-11-15'])).toBe(100)});
it('skips rest days when computing workout streaks',()=>{s.days['2026-11-13']=emptyDay();s.days['2026-11-13'].overrides.workout=true;s.days['2026-11-16']=emptyDay();s.days['2026-11-16'].overrides.workout=true;expect(streak(s,'workout','2026-11-16')).toBe(2)});
});
describe('backup validation',()=>{
it('round trips all data with a defensive copy',()=>{const restored=validateBackup(JSON.parse(JSON.stringify(s)));restored.settings.start='2027-01-01';expect(s.settings.start).toBe('2026-11-16')});
it.each([null,{}, {version:2}, {...initialState(),exercises:[{name:'bad'}]}, {...initialState(),sessions:[{}]}, {...initialState(),habits:[{}]}, {...initialState(),days:{'bad':{}}}, {...initialState(),metrics:[{}]}, {...initialState(),photos:[{data:'https://server/photo'}]}, {...initialState(),settings:{...initialState().settings,schedule:[]}}])('rejects malformed data without modifying existing data: %j',raw=>{expect(()=>validateBackup(raw)).toThrow();expect(s).toEqual(initialState())});
});
