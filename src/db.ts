import { openDB } from 'idb';
import { initialState, validateBackup, type State } from './model';
const db=openDB('recomp-os',1,{upgrade(db){db.createObjectStore('app')}});
export async function loadState():Promise<State>{const value=await (await db).get('app','state');return value?validateBackup(value):initialState()}
export async function saveState(state:State){await (await db).put('app',state,'state')}
