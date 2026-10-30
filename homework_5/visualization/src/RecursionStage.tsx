import {useMemo} from 'react';
import DiagramViewport from './DiagramViewport';
export type TraceFrame={kind:string;function?:string;depth?:number;args?:unknown[];result?:unknown;stack:{name:string;args:unknown[]}[];output:number[][]};
type Call={id:number;end:number;parent:number|null;children:number[];depth:number;name:string;args:unknown[];result:unknown;x:number;y:number};
function buildCalls(frames:TraceFrame[]){
 const calls:Call[]=[],active:number[]=[],at:number[]=[];
 frames.forEach((f,step)=>{
  if(f.kind==='call'){
   const id=calls.length,parent=active.at(-1)??null;
   calls.push({id:step,end:Infinity,parent,children:[],depth:active.length,name:f.function??'',args:f.args??[],result:undefined,x:0,y:0});
   if(parent!==null)calls[parent].children.push(id);active.push(id);
  }
  const id=active.at(-1);at.push(id??0);
  if((f.kind==='return'||f.kind==='error')&&id!==undefined){calls[id].end=step;calls[id].result=f.result;active.pop()}
 });
 const cardWidth=Math.max(98,...calls.map(c=>Array.isArray(c.args[0])?JSON.stringify(c.args[0]).length*7+22:98)), spacing=cardWidth+28;
 let leaf=0;
 function layout(i:number){const c=calls[i];c.children.forEach(layout);c.x=c.children.length?(calls[c.children[0]].x+calls[c.children.at(-1)!].x)/2:spacing/2+leaf++*spacing;c.y=42+c.depth*92}
 if(calls.length)layout(0);
 const horizontal=calls.every(c=>c.children.length<=1);
 if(horizontal)calls.forEach(c=>{c.x=spacing/2+c.depth*spacing;c.y=42});
 const width=Math.max(320,leaf*spacing);calls.forEach(c=>c.x+=(width-leaf*spacing)/2);
 return {calls,at,cardWidth,horizontal,width,height:Math.max(200,...calls.map(c=>c.y+50))};
}
export default function RecursionStage({frames,step,permutation,onSeek}:{frames:TraceFrame[];step:number;permutation:boolean;onSeek:(step:number)=>void}){
 const model=useMemo(()=>buildCalls(frames),[frames]);const frame=frames[step];const current=model.calls[model.at[step]];
 if(!frame||!current)return <div className="stage-placeholder">Подготавливаем вызовы…</div>;
 const visible=model.calls;
 const left=Math.min(...visible.map(c=>c.x))-model.cardWidth/2-18;
 const right=Math.max(...visible.map(c=>c.x))+model.cardWidth/2+18;
 const bounds={x:left,y:0,width:right-left,height:Math.max(...visible.map(c=>c.y))+45};
 const returning=frame.kind==='return',path=permutation?current.args[0] as number[]:[],remaining=permutation?current.args[1] as number[]:[];
 const input=permutation?(model.calls[0]?.args[1] as number[]??[]):[];
 const parent=current.parent===null?null:model.calls[current.parent];
 const siblingParent=permutation?(returning?current:parent):null;
 const choiceCalls=siblingParent?.children.map(i=>model.calls[i])??[];
 const n=Number(current.args[0]);const children=current.children.map(i=>model.calls[i]);
 const childResult=(i:number)=>children[i]?.end<=step?String(children[i].result):'?';
 const expression=permutation?'':current.name==='factorial'?(n<=1?'1':`${n} × ${childResult(0)}`):(n<=1?String(n):`${childResult(0)} + ${childResult(1)}`);
 return <div className={`recursion-studio ${returning?'is-returning':''}`}>
 <div className="phase-strip"><span className={returning?'':'phase-on'}>01 · Вызов</span><i/><span className={returning?'phase-on':''}>02 · Возврат</span><small>Глубина <b>{frame.depth}</b></small></div>
 {permutation?<div className="permutation-workbench">
  <div className="workbench-label"><strong>Собираем перестановку</strong><span>{path.length} / {input.length} позиций</span></div>
  <div className="slots" aria-label="Выбранный путь">{input.map((_,i)=><div key={i} className={`slot ${i<path.length?'filled':''} ${i===path.length-1&&!returning?'just-picked':''}`}><small>{String(i+1).padStart(2,'0')}</small><strong key={String(path[i])}>{path[i]??'·'}</strong></div>)}{!input.length&&<div className="empty-permutation">[ ] <span>Пустая перестановка — тоже результат</span></div>}</div>
  <div className="choice-zone"><div><small>ОСТАЛОСЬ ВЫБРАТЬ</small><div className="choice-pool">{remaining.map((v,i)=><span className="choice-tile" key={i}>{v}</span>)}{!remaining.length&&<span className="leaf-success">✓ Перестановка готова</span>}</div></div><div className="choice-explanation" key={step}>{returning?`Ветка завершена: найдено ${frame.result}. Возвращаемся ${parent?'на уровень '+parent.depth:'из корневого вызова'}.`:!remaining.length?'Дошли до листа. Добавляем копию пути в результат.':`Следующий выбор создаст новый вызов на глубине ${current.depth+1}.`}</div></div>
  {siblingParent&&<div className="branch-options"><small>Развилка {JSON.stringify(siblingParent.args[0])}</small>{choiceCalls.map(c=><button key={c.id} disabled={c.id>step} className={c===current?'branch-current':c.end<step?'branch-done':''} onClick={()=>onSeek(c.id)}>{(c.args[0] as number[]).at(-1)}<small>{c===current?'сейчас':c.end<step?'готово':'ожидает'}</small></button>)}</div>}
 </div>:<div className="calculation"><div><small>ТЕКУЩИЙ ВЫЗОВ</small><h3>{current.name}<span>({n})</span></h3><p>{n<=1?'Базовый случай: дальнейших вызовов нет.':returning?'Вложенные вызовы завершены. Передаём результат родителю.':'Этот кадр ждёт результат вложенной рекурсии.'}</p></div><div className="equation" key={step}><span>{expression}</span><b>=</b><strong>{returning?String(frame.result):'?'}</strong></div></div>}
 <div className="execution-grid">
 <div className="call-map"><div className="diagram-caption">{permutation?'Дерево решений':'Дерево вызовов'}<small>Нажмите вызов, чтобы вернуться к нему</small></div><DiagramViewport key={JSON.stringify(model.calls[0]?.args)} bounds={bounds} label={permutation?'Дерево решений':'Дерево вызовов'}>
 {model.calls.filter(c=>c.id<=step&&c.parent!==null).map(c=>{const p=model.calls[c.parent!],isActive=c===current;return <path key={c.id} className={`call-link ${isActive?'flowing':''} ${isActive&&returning?'back':''}`} pathLength={1} d={model.horizontal?`M ${p.x+model.cardWidth/2} ${p.y} L ${c.x-model.cardWidth/2} ${c.y}`:`M ${p.x} ${p.y+25} C ${p.x} ${p.y+52}, ${c.x} ${c.y-52}, ${c.x} ${c.y-25}`}/>})}
 {model.calls.filter(c=>c.id<=step).map(c=><g key={c.id} data-current={c===current} role="button" tabIndex={0} aria-label={`Вызов ${c.id+1}`} onClick={()=>onSeek(c.id)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();onSeek(c.id)}}} transform={`translate(${c.x},${c.y})`} className={`call-node ${c===current?'call-current':''} ${c.end<=step?'call-finished':''}`}><title>{permutation?JSON.stringify(c.args[0]):`${c.name}(${c.args[0]})`}</title><rect x={-model.cardWidth/2} y={-25} width={model.cardWidth} height={50} rx={12}/><text textAnchor="middle" y={-4}>{permutation?JSON.stringify(c.args[0]):`${c.name==='factorial'?'fact':'fib'}(${c.args[0]})`}</text><text textAnchor="middle" y={14} className="call-status">{c.end<=step?`↩ ${c.result}`:c===current?'выполняется':'ждёт результат'}</text></g>)}
 </DiagramViewport><div className="map-legend"><span>{returning?'● возврат результата':'● текущий вызов'}</span><span>● завершён</span><small>Завершённые вызовы остаются на схеме</small></div></div>
 <div className="live-stack"><div className="diagram-caption">Стек<small>{frame.stack.length} кадров</small></div><div className="stack-scroll">{frame.stack.map((c,i)=><div key={i+JSON.stringify(c.args)} className={`stack-slab ${i===frame.stack.length-1?'slab-current':''}`}><small>{String(i).padStart(2,'0')}</small><div><b>{permutation?'visit':c.name==='factorial'?'fact':'fib'}</b><code>{JSON.stringify(c.args[0])}</code></div><span>{i===frame.stack.length-1?(returning?'↩':'●'):'⋮'}</span></div>)}</div><p>{returning?'Кадр снимается после возврата.':'Каждый вложенный вызов кладёт кадр в стек.'}</p></div>
 </div></div>
}
