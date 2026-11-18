import {useId, useLayoutEffect, useRef, useState, type CSSProperties} from 'react';
import './stage.css';

type Move = {
  scan:number; dest:number; relation:'lt'|'eq'|'gt';
  lt:number; gt:number; next_scan:number;
};
type MergeWrite = {
  // Buffer slots are indexed exactly like the Python auxiliary list.
  bufferIds:number[]; written:number; source?:number; dest?:number;
  leftHead:number; rightHead:number;
};
export type StageFrame = {
  kind:string; values:number[]; ids:number[]; lo:number; hi:number;
  mid?:number; before?:number[]; sources?:number[]; pivot?:number;
  pivot_index?:number; lt?:number; gt?:number; swaps?:number[][];
  moves?:Move[]; width?:number; depth?:number; stack?:number[][];
  target?:number; index?:number; value?:number;
  sourceStep?:number; write?:MergeWrite; move?:Move;
  compared?:number; lastEqual?:[number,number];
};
type Algorithm = 'merge'|'quick'|'select';
type StageProps = {frames:StageFrame[]; step:number; algorithm:Algorithm; mode?:'recursive'|'iterative'};

function mergeFrames(event:StageFrame, previous:StageFrame): StageFrame[] {
  const mid=event.mid!, sources=event.sources!;
  const bufferIds=previous.ids.slice();
  // Values and identities in the diagram are never recreated. During a merge
  // only the unread elements live in the buffer; written elements live below.
  const buffer={bufferIds, written:0, leftHead:event.lo, rightHead:mid};
  const steps:StageFrame[]=[{...event, kind:'merge-read', write:buffer}];
  let leftHead=event.lo, rightHead=mid;
  for (const [offset,source] of sources.entries()) {
    steps.push({...event, kind:'merge-write', write:{
      bufferIds, written:offset+1, leftHead, rightHead, source, dest:event.lo+offset,
    }});
    if(source<mid)leftHead++;
    else rightHead++;
  }
  return steps;
}

function partitionFrames(event:StageFrame, previous:StageFrame): StageFrame[] {
  const ids=previous.ids.slice(), values=previous.values.slice();
  const steps:StageFrame[]=[];
  for (const move of event.moves ?? []) {
    const {scan,dest}=move;
    const compared=values[scan];
    [ids[scan],ids[dest]]=[ids[dest],ids[scan]];
    [values[scan],values[dest]]=[values[dest],values[scan]];
    steps.push({...event, kind:'scan', move, compared, ids:ids.slice(), values:values.slice()});
  }
  steps.push(event);
  return steps;
}

/** Expand recorded writes and classifications without running the algorithms again. */
export function expandFrames(raw:StageFrame[]): StageFrame[] {
  return raw.flatMap((event,sourceStep) => {
    const frame={...event,sourceStep};
    const previous=raw[sourceStep-1];
    if (previous && frame.kind==='merge' && frame.sources && frame.mid!==undefined)
      return mergeFrames(frame,previous);
    if (previous && frame.kind==='partition') return partitionFrames(frame,previous);
    if (previous?.kind==='partition' && previous.lt!==undefined && previous.gt!==undefined)
      frame.lastEqual=[previous.lt,previous.gt];
    return [frame];
  });
}
const num=(value:number)=>String(value).replace('-','−');
const interval=(lo:number,hi:number)=>hi<=lo?'∅':hi===lo+1?String(lo):`${lo}–${hi-1}`;
const relation=(move:Move)=>move.relation==='lt'?'<' : move.relation==='gt'?'>':'=';

type Message={action:string;title:string;why:string};
function narrative(f:StageFrame, algorithm:Algorithm):Message {
  const range=interval(f.lo,f.hi);
  switch(f.kind) {
    case 'start':
      if(!f.values.length)return {action:'Начало',title:'Пустой массив',why:'Здесь нет элементов для сравнения.'};
      if(algorithm==='select')return {action:'Целевая позиция',title:`Ищем индекс ${f.target}`,why:`Считаем от наибольшего: k = ${f.values.length-f.target!}. В порядке возрастания это индекс ${f.values.length} − ${f.values.length-f.target!} = ${f.target}. Повторы считаются отдельно.`};
      if(f.hi===1)return {action:'Начало',title:'Один элемент уже упорядочен',why:'Для такого диапазона сравнения не нужны.'};
      return algorithm==='merge'
        ? {action:'Начало',title:'Сортировка слиянием',why:'Для слияния нужны две упорядоченные серии. На каждом слиянии берём меньшее из двух первых доступных чисел.'}
        : {action:'Начало',title:'Быстрая сортировка',why:'Выбираем опорное число и делим диапазон на три группы: меньше, равно и больше опоры.'};
    case 'split':return {action:'Деление',title:`Разделяем диапазон ${range}`,why:`Левая часть занимает позиции ${interval(f.lo,f.mid!)}, правая — ${interval(f.mid!,f.hi)}. Сначала сортируем каждую часть.`};
    case 'pass':return {action:'Проход',title:`Объединяем серии ширины ${f.width}`,why:`Слева направо сливаем соседние серии. После прохода длина упорядоченной серии достигнет ${Math.min(f.values.length,f.width!*2)}.`};
    case 'merge-read':return {action:'Копирование в буфер',title:'Поднимаем две упорядоченные серии',why:'Метки Л и П указывают на первые доступные числа. Сравним их и запишем меньшее в нижний ряд.'};
    case 'merge-write':{
      const w=f.write!, src=w.source!, left=w.leftHead, right=w.rightHead, before=f.before!;
      const side=src<f.mid!?'левой':'правой';
      let why:string;
      if(left===f.mid!)why='Левая серия исчерпана. Переносим очередное число из правой.';
      else if(right===f.hi)why='Правая серия исчерпана. Переносим очередное число из левой.';
      else if(before[left]===before[right])why=`Оба первых числа равны ${num(before[src])}. Берём левое, чтобы сохранить порядок равных элементов.`;
      else why=`Сравниваем ${num(before[left])} и ${num(before[right])}. Меньшее число берём из ${side} серии.`;
      return {action:'Запись из буфера',title:`${num(before[src])} → позиция ${w.dest}`,why};
    }
    case 'pivot':return {action:'Выбор опоры',title:`Опорное значение — ${num(f.pivot!)}`,why:`Берём число на позиции ${f.pivot_index}. Во всём диапазоне ${range} сравниваем с этим же значением.`};
    case 'scan':{
      const m=f.move!, n=num(f.compared!), p=num(f.pivot!);
      const region=m.relation==='lt'?'левую группу':m.relation==='gt'?'правую группу':'группу равных';
      let why=m.scan===m.dest?`Позиция ${m.scan} уже подходит. Включаем число в ${region}.`:`Меняем места ${m.scan} и ${m.dest}: ${n} переходит в ${region}.`;
      if(m.relation==='gt'&&m.scan!==m.dest)why+=` Число, пришедшее на место ${m.scan}, ещё предстоит проверить.`;
      return {action:m.scan===m.dest?'Сравнение':'Сравнение и обмен',title:`${n} ${relation(m)} ${p}`,why};
    }
    case 'partition':return {action:'Разбиение завершено',title:`Группа равных заняла позиции ${interval(f.lt!,f.gt!)}`,why:algorithm==='select'?`Сравним целевой индекс ${f.target} с границами этой группы.`:'Эти числа уже на своих местах. Только боковые группы могут требовать дальнейшей сортировки.'};
    case 'keep':{
      const same=f.lastEqual, side=same && f.target!<same[0]?'левую':'правую';
      return {action:'Выбор диапазона',title:`Оставляем ${side} часть`,why:`Целевой индекс ${f.target} лежит ${side==='левую'?'левее':'правее'} группы равных. Продолжаем поиск на позициях ${range}.`};
    }
    case 'found':return {action:'Результат',title:`Ответ — ${num(f.value!)}`,why:`Это значение занимает позицию ${f.index} в порядке возрастания. Порядок внутри остальных групп не влияет на ответ.`};
    case 'done':return {action:'Результат',title:'Сортировка завершена',why:f.values.length?'Весь массив упорядочен по возрастанию.':'Результат — пустой массив.'};
    default:return {action:'Диапазон',title:`Позиции ${range}`,why:''};
  }
}

type Tone='plain'|'left'|'right'|'equal'|'dim'|'done'|'hot';
type Tile={id:number; value:number; i:number; lane:'array'|'buffer'; tone:Tone; marked:boolean; chosen:boolean};
function toneFor(f:StageFrame,i:number):Tone {
  if(f.kind==='found')return i===f.index?'equal':'dim';
  if(f.kind==='done')return 'done';
  if(i<f.lo||i>=f.hi)return 'dim';
  if(f.kind==='split')return i<f.mid!?'left':'right';
  if(f.kind==='pass')return Math.floor(i/f.width!)%2?'right':'left';
  if(f.kind==='pivot')return i===f.pivot_index?'equal':'plain';
  if(f.kind==='scan'){
    const m=f.move!;
    if(i<m.lt)return 'left';
    if(i<m.next_scan)return 'equal';
    if(i>=m.gt)return 'right';
    return 'plain';
  }
  if(f.kind==='partition')return i<f.lt!?'left':i<f.gt!?'equal':'right';
  if(f.kind==='keep')return 'left';
  return 'plain';
}

function tilesFor(f:StageFrame):Tile[] {
  const w=f.write;
  const original=w?new Map(w.bufferIds.map((id,i)=>[id,i])):null;
  return f.ids.map((id,index):Tile=>{
    const tile:Tile={id,value:f.values[index],i:index,lane:'array',tone:toneFor(f,index),marked:false,chosen:false};
    if(w && index>=f.lo && index<f.hi){
      const src=original!.get(id)!;
      if(index >= f.lo+w.written){tile.lane='buffer';tile.i=src;}
      tile.tone=src<f.mid!?'left':'right';
      tile.marked=tile.lane==='buffer'&&(src===w.leftHead||src===w.rightHead);
      tile.chosen=index===w.dest;
    } else if(f.move){
      tile.chosen=index===f.move.dest;
      tile.marked=index===f.move.scan && index!==f.move.dest;
    } else {tile.chosen=f.kind==='pivot'&&index===f.pivot_index || f.kind==='found'&&index===f.index;}
    return tile;
  }).sort((a,b)=>a.id-b.id);
}

const swatches={plain:'Сравниваем',left:'Меньше',equal:'Равны',right:'Больше',dim:'Вне поиска',done:'Готово',hot:'Выбор'};
function legend(f:StageFrame,algo:Algorithm):[Tone,string][]{
  if(f.kind==='start' || !f.values.length)return [];
  if(f.kind==='done')return [['done','Упорядочено']];
  if(f.kind==='found')return [['equal','Ответ'],['dim','Остальные']];
  if(algo==='merge')return [['left','Левая серия'],['right','Правая серия']];
  if(f.kind==='keep')return [['left','В поиске'],['dim','Исключены']];
  if(f.kind==='pivot')return [['equal','Опорный элемент']];
  const tones:Tone[]=['left','equal','right'];
  if(f.kind==='scan' && f.move!.next_scan<f.move!.gt)tones.push('plain');
  return tones.map(t=>[t,t==='plain'?'Не проверены':swatches[t]]);
}

function Diagram({frame:f,algorithm}:{frame:StageFrame;algorithm:Algorithm}){
  const canvas=useRef<HTMLDivElement>(null);
  const [width,setWidth]=useState(650);
  useLayoutEffect(()=>{
    const el=canvas.current;
    if(!el)return;
    function measure(){if(el)setWidth(el.clientWidth);}
    const obs=new ResizeObserver(measure);
    measure();obs.observe(el);return ()=>obs.disconnect();
  },[]);
  const paintId=useId();
  const merge=algorithm==='merge';
  const n=f.values.length;
  const columns=Math.max(1,Math.min(n,Math.floor(width/(width<400?46:55))));
  const rows=Math.ceil(n/columns);
  const rowHeight=merge?152:112;
  const arrayY=merge?100:49, bufferY=35;
  const x=(i:number)=>(i%columns)*100/columns;
  const y=(i:number,offset:number)=>Math.floor(i/columns)*rowHeight+offset;
  const tokens=tilesFor(f);
  const tileWidth=Math.min(86,width/columns-6);
  const style={'--count':columns,'--tile-w':tileWidth+'px','--row-height':rowHeight+'px',height:Math.max(1,rows)*rowHeight} as CSSProperties;
  const w=f.write;
  const nextScan=f.move && f.move.next_scan < f.move.gt ? f.move.next_scan : undefined;
  const routeSource=w?.source ?? f.move?.scan;
  const routeDest=w?.dest ?? f.move?.dest;
  let route='';
  if(routeSource!==undefined && routeDest!==undefined && (w||routeSource!==routeDest)){
    const sx=(routeSource%columns+.5)*width/columns, ex=(routeDest%columns+.5)*width/columns;
    if(w){
      const sy=y(routeSource,bufferY+32), ey=y(routeDest,arrayY);
      const bend=(sy+ey)/2;
      route=`M ${sx} ${sy} C ${sx} ${bend}, ${ex} ${bend}, ${ex} ${ey}`;
    }else{
      const sy=y(routeSource,arrayY), ey=y(routeDest,arrayY);
      route=`M ${sx} ${sy} C ${sx} ${sy-26}, ${ex} ${ey-26}, ${ex} ${ey}`;
    }
  }
  return <div className={'s6-plot'+(merge?' is-merge':'')} aria-label="Схема массива">
    <div className="s6-plot-head"><span>{merge?'Слияние серий':'Разбиение массива'}</span><div className="s6-legend">{legend(f,algorithm).map(([tone,label])=><span key={tone} data-tone={tone}><i/>{label}</span>)}</div></div>
    <div className="s6-measure" ref={canvas}>
      {n ? <div className="s6-grid" key={columns} style={style} role="img" aria-label={w?`Записано ${w.written} из ${f.hi-f.lo} элементов диапазона.`:`Массив: ${f.values.join(', ')}.`}>
        {Array.from({length:rows},(_,row)=><div key={row} className="s6-labels" style={{top:row*rowHeight}}>
          {merge&&<span style={{top:0}}>Буфер</span>}<span style={{top:merge?71:16}}>Массив</span>
        </div>)}
        {f.values.map((_,i)=><div className="s6-position" key={i} style={{left:x(i)+'%',top:y(i,0)}}>
          {merge&&<div className={'s6-dock buffer'+(w&&i>=f.lo&&i<f.hi?' live':'')} style={{top:bufferY}}>
            {w?.source===i&&<span className="s6-imprint" aria-hidden="true"/>}
          </div>}
          {nextScan===i&&<span className="s6-next" style={{top:arrayY-13}} aria-label={`Следующая проверка: индекс ${i}`}>↓</span>}
          <div className={'s6-dock array'+(i>=f.lo&&i<f.hi?' live':'')+(i===f.target?' target':'')} style={{top:arrayY}}/>
          <span className={'s6-index'+(i===f.target?' target':'')} style={{top:arrayY+35}}>{i===f.target?'цель · ':''}{i}</span>
        </div>)}
        {route&&<svg className="s6-flow" aria-hidden="true" width={width} height={rows*rowHeight}>
          <defs><linearGradient id={paintId} x1="0" y1="0" x2="100%" y2="100%"><stop stopColor="#93bcab"/><stop offset="1" stopColor="#efc274"/></linearGradient></defs>
          <path key={route} d={route} pathLength="1" stroke={routeSource===routeDest?'#d3b780':`url(#${paintId})`}/>
        </svg>}
        {tokens.map(t=><div className="s6-token" data-origin={t.id} data-index={t.i} data-lane={t.lane} data-tone={t.tone} aria-hidden="true" key={t.id}
          style={{transform:`translate(${t.i%columns*100}%, ${y(t.i,t.lane==='buffer'?bufferY:arrayY)}px)`}}>
          <div className={`s6-piece ${t.chosen?'chosen':''} ${t.marked?'marked':''}`}><strong className="s6-val">{num(t.value)}</strong>
            {t.lane==='buffer'&&t.marked&&<i className="s6-flag">{t.i<f.mid!?'Л':'П'}</i>}
          </div>
        </div>)}
      </div>:<div className="s6-empty">∅</div>}
    </div>
  </div>;
}

function segmentNote(f:StageFrame,mode:StageProps['mode']) {
  if(f.stack!==undefined)return <><span>Стек ожидающих диапазонов</span>{f.stack.length?f.stack.map(([s,e])=><code key={s}>{interval(s,e)}</code>):<b>пуст</b>}</>;
  if(f.target!==undefined)return <><span>Целевой индекс</span><code>{f.target}</code></>;
  if(f.width!==undefined)return <><span>Ширина исходной серии</span><code>{f.width}</code></>;
  if(mode==='recursive'&&f.depth!==undefined)return <><span>Глубина вызова</span><code>{f.depth}</code></>;
  return null;
}

export default function Stage({frames,step,algorithm,mode}: StageProps){
  const f=frames[step];
  if(!f)return null;
  const {action,title,why}=narrative(f,algorithm);
  const note=segmentNote(f,mode);
  return <section className="s6-stage" data-kind={f.kind} data-source-step={f.sourceStep} data-lo={f.lo} data-hi={f.hi} aria-label="Работа алгоритма">
    <div className="s6-story"><div className="s6-action"><i/>{action}</div><h3>{title}</h3><p>{why}</p></div>
    <Diagram frame={f} algorithm={algorithm}/>
    <div className="s6-foot"><span>Активные индексы <code>{interval(f.lo,f.hi)}</code></span>
      {f.write&&<span>Записано <code>{f.write.written} / {f.hi-f.lo}</code></span>}
      {f.move&&f.move.next_scan<f.move.gt&&<span>Следующая проверка <code>{f.move.next_scan}</code></span>}
      {f.pivot!==undefined&&<span>Опора <code>{num(f.pivot)}</code></span>}
      {note&&<div>{note}</div>}
    </div>
  </section>;
}
