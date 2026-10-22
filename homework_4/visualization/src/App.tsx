import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Braces, Check, ChevronLeft, ChevronRight, Code2, Download, GitBranch, ListTree, Pause, Play, RotateCcw, ShieldCheck, SlidersHorizontal, Terminal, X } from 'lucide-react';
import TreeStage from './TreeStage';
import OrderPicker from './OrderPicker';
import { balanceFrames, insertionFrames, parseTree, parseValues, traversalFrames, validationFrames, type Node, type Order, type Task } from './algorithms';
import { examples } from './examples';
import { content, orders, sharedCode } from './content';

type View = 'visual' | 'explain' | 'code' | 'tests';
const tasks: Task[] = ['traversal', 'validate', 'balance'];
const insertionExample = {name: 'Построить 7 узлов', input: '[8, 4, 12, 2, 6, 10, 14]'};
const tabs: [View, string][] = [['visual', 'Визуализация'], ['explain', 'Объяснение'], ['code', 'Python-код'], ['tests', 'Тесты']];
const rangeText = (low: number | null, high: number | null) => `(${low ?? '−∞'}, ${high ?? '+∞'})`;
function nodes(root: Node | null): Node[] { return root ? [root, ...nodes(root.left), ...nodes(root.right)] : []; }
function download(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'}));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function App() {
  const [task, setTask] = useState<Task>('traversal');
  const [view, setView] = useState<View>('visual');
  const [mode, setMode] = useState<'walk' | 'insert'>('walk');
  const [order, setOrder] = useState<Order>('inorder');
  const [draft, setDraft] = useState(examples.traversal[0].input);
  const [input, setInput] = useState(draft);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const [codeKind, setCodeKind] = useState<'solution' | 'node'>('solution');
  const [checks, setChecks] = useState<{name: string; ok: boolean}[]>([]);
  const data = content[task];
  const presets = task === 'traversal' && mode === 'insert' ? [insertionExample, {name: 'Повторы', input: '[8,4,12,4,10,8,14]'}, {name: 'Цепочка', input: '[1,2,3,4,5]'}, {name: 'Пустое дерево', input: '[]'}] : examples[task];
  const frames = useMemo(() => task === 'traversal' ? mode === 'insert' ? insertionFrames(parseValues(input)) : traversalFrames(parseValues(input), order) : task === 'validate' ? validationFrames(parseTree(input)) : balanceFrames(parseTree(input)), [task, mode, input, order]);
  const current = frames[Math.min(step, frames.length - 1)];
  const last = step >= frames.length - 1;
  const allNodes = nodes(current.root);
  const chosen = allNodes.find(n => n.id === (selected ?? current.active));
  const active = allNodes.find(n => n.id === current.active);
  const limits = chosen ? current.bounds[chosen.id] : undefined;
  const heightNode = active ?? (last ? current.root : null);
  const hL = heightNode ? heightNode.left ? current.heights[heightNode.left.id] : 0 : undefined;
  const hR = heightNode ? heightNode.right ? current.heights[heightNode.right.id] : 0 : undefined;
  const pseudo = task === 'traversal' && mode === 'insert' ? ['начать с корня', 'сравнить новое значение', 'меньше → L; больше → R', 'пустая ссылка → новый узел', 'равно → пропустить повтор'] : data.pseudo;

  useEffect(() => {
    if (!playing || last || view !== 'visual') return;
    const timer = window.setTimeout(() => setStep(s => s + 1), 1500 / speed);
    return () => clearTimeout(timer);
  }, [playing, last, view, speed, step]);

  function reset() { setStep(0); setPlaying(false); setSelected(null); }
  function changeTask(next: Task) {
    setTask(next); setMode('walk'); setInput(examples[next][0].input); setDraft(examples[next][0].input); setError(''); setChecks([]); reset();
  }
  function apply(value = draft) {
    try {
      if (task === 'traversal') parseValues(value); else parseTree(value);
      setInput(value); setDraft(value); setError(''); reset();
    } catch (e) { setError((e as Error).message); setPlaying(false); }
  }
  function changeMode(next: 'walk' | 'insert') {
    setMode(next); apply(next === 'insert' ? insertionExample.input : examples.traversal[0].input);
  }
  function move(next: number) { setPlaying(false); setStep(Math.max(0, Math.min(next, frames.length - 1))); setSelected(null); }
  function runChecks() {
    const cases: [string, () => boolean][] = task === 'traversal' ? [
      ['Все 6 порядков посещают каждый узел ровно один раз', () => orders.every(o => {const out = traversalFrames([8,4,12,2,6,10,14], o.id).at(-1)!.output; return out.length === 7 && new Set(out).size === 7;})],
      ['Inorder возвращает отсортированные значения', () => JSON.stringify(traversalFrames([8,4,12,2,6,10,14], 'inorder').at(-1)!.output) === '[2,4,6,8,10,12,14]'],
      ['Повторная вставка не добавляет узел', () => nodes(insertionFrames([8,4,8,4]).at(-1)!.root).length === 2],
    ] : task === 'validate' ? [
      ['Корректное дерево проходит проверку', () => validationFrames(parseTree('[8,4,12,2,6,10,14]')).at(-1)!.result === true],
      ['Нарушение границы далёкого предка обнаруживается', () => validationFrames(parseTree('[8,4,12,null,10]')).at(-1)!.result === false],
      ['Дубликат нарушает строгое правило BST', () => validationFrames(parseTree('[8,4,8]')).at(-1)!.result === false],
    ] : [
      ['Полное дерево сбалансировано', () => balanceFrames(parseTree('[8,4,12,2,6,10,14]')).at(-1)!.result === true],
      ['Цепочка из трёх узлов несбалансирована', () => balanceFrames(parseTree('[1,2,null,3]')).at(-1)!.result === false],
      ['Значения не влияют на баланс', () => balanceFrames(parseTree('[8,12,4]')).at(-1)!.result === true],
    ];
    setChecks(cases.map(([name, check]) => ({name, ok: check()})));
  }

  return <div className="app-shell">
    <aside className="sidebar"><a className="brand" href="#main"><span><GitBranch size={22}/></span><div>Алгоритмы<small>Домашняя работа 4</small></div></a><div className="nav-label">БИНАРНЫЕ ДЕРЕВЬЯ</div><nav aria-label="Задачи">{tasks.map((t, i) => <button key={t} className={task === t ? 'task-link selected' : 'task-link'} aria-current={task === t ? 'page' : undefined} onClick={() => changeTask(t)}><span className="task-index">0{i + 1}</span><span>{content[t].short}</span><ChevronRight size={15}/></button>)}</nav></aside>
    <main id="main"><header className="topbar"><span>Курс алгоритмов <span>/</span> ДЗ 04 <span>/</span> {data.short}</span><span className="chapter">{String(tasks.indexOf(task) + 1).padStart(2, '0')} / 03</span></header>
      <section className="page-heading"><div><div className="eyebrow">ЗАДАЧА {tasks.indexOf(task) + 1}</div><h1>{data.name}</h1><p>{data.subtitle}</p></div><div className="complexity"><div><span>Время</span><strong>{task === 'traversal' && mode === 'insert' ? 'O(h)' : data.time}</strong></div><div><span>Доп. память</span><strong>{task === 'traversal' && mode === 'insert' ? 'O(1)' : data.memory}</strong></div><small>n — узлы · h — высота</small></div></section>
      <div className="tabs" role="tablist" aria-label="Раздел задачи">{tabs.map(([id, name]) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={view === id} aria-controls="task-panel" className={view === id ? 'active' : ''} onClick={() => {setView(id); setPlaying(false);}}>{id === 'visual' ? <GitBranch size={16}/> : id === 'code' ? <Code2 size={16}/> : id === 'tests' ? <ShieldCheck size={16}/> : <ListTree size={16}/>} {name}</button>)}</div>
      <div id="task-panel" role="tabpanel" aria-labelledby={`tab-${view}`}>
        {view === 'visual' ? <>
          <section className="input-panel">
            <div className="section-heading"><h2><Braces size={17}/> Входные данные</h2>
              {task === 'traversal' && <div className="mode-switch task-modes" role="group" aria-label="Режим"><button aria-pressed={mode === 'walk'} className={mode === 'walk' ? 'chosen' : ''} onClick={() => changeMode('walk')}><ListTree size={15}/>Шесть обходов</button><button aria-pressed={mode === 'insert'} className={mode === 'insert' ? 'chosen' : ''} onClick={() => changeMode('insert')}><GitBranch size={15}/>Построение BST</button></div>}
            </div>
            {task === 'traversal' && mode === 'walk' && <OrderPicker value={order} onChange={next => {setOrder(next); reset();}}/>}
            <div className="example-row"><label htmlFor="tree-example">Пример дерева</label><select id="tree-example" value={presets.some(e => e.input === input) ? input : ''} onChange={e => apply(e.target.value)}>
              {!presets.some(e => e.input === input) && <option value="">Свой пример</option>}
              {presets.map(e => <option key={e.name} value={e.input}>{e.name}</option>)}
            </select></div>
            <details className="custom-input"><summary><span>Свои данные</span><code>{input}</code><ChevronRight size={15}/></summary>
              <div className="input-row"><label><span>{task === 'traversal' ? 'Значения для вставки' : 'Дерево по уровням'}</span><textarea value={draft} onChange={e => setDraft(e.target.value)} rows={2} spellCheck={false}/></label><button className="primary" onClick={() => apply()}>Применить <ArrowRight size={16}/></button></div>
              {error ? <p className="error" role="alert">{error}</p> : <p className="input-hint">{draft !== input ? 'Нажмите «Применить», чтобы перестроить пример.' : task === 'traversal' ? 'До 15 целых чисел. Дубликаты игнорируются; порядок вставки определяет форму BST.' : 'Дети по уровням, слева направо; null — нет ребёнка. В [8, 4, 12, null, 6] узел 6 — правый ребёнок 4.'}</p>}
            </details>
          </section>
          <div className="workspace"><section className={`canvas-panel ${playing && !last ? 'is-playing' : ''}`}><div className="section-heading"><h2><span className="live-dot"/> Работа алгоритма</h2><span className="step-badge">Шаг {step} / {frames.length - 1}</span></div><div className={`step-explanation ${current.invalid ? 'has-error' : ''}`}><div className="step-copy" key={`${step}-${current.phase}`}><h3>{current.title}</h3><p aria-live="polite">{current.detail}</p></div></div>
            <TreeStage key={`${task}-${mode}-${input}-${order}`} frame={current} previousActive={step > 0 ? frames[step - 1].active : null} speed={speed} selected={selected} onSelect={setSelected}/>
            <div className="player"><input aria-label="Шаг алгоритма" type="range" min={0} max={frames.length - 1} value={Math.min(step, frames.length - 1)} onChange={e => move(Number(e.target.value))}/><div className="player-buttons"><button className="icon-button" aria-label="В начало" disabled={step === 0} onClick={() => move(0)}><RotateCcw size={17}/></button><button className="icon-button" aria-label="Предыдущий шаг" disabled={step === 0} onClick={() => move(step - 1)}><ChevronLeft size={20}/></button><button className="primary play" disabled={frames.length <= 1} onClick={() => {if (last) setStep(0); setPlaying(p => !p || last);}}>{playing && !last ? <Pause size={16}/> : <Play size={16}/>} {playing && !last ? 'Пауза' : last ? 'Повторить' : 'Запустить'}</button><button className="icon-button" aria-label="Следующий шаг" disabled={last} onClick={() => move(step + 1)}><ChevronRight size={20}/></button><label className="speed">Скорость<select aria-label="Скорость" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div></div>
          </section><aside className="inspector">
            <section className="state-card"><h2><ListTree size={17}/>{task === 'traversal' ? mode === 'insert' ? 'Состояние BST' : 'Порядок посещения' : task === 'validate' ? 'Границы значений' : 'Высоты поддеревьев'}</h2>
              {task === 'traversal' ? mode === 'walk' ? <><div className="output-list" aria-label="Результат обхода">{current.output.length ? current.output.map((v,i) => <span key={i} className={i === current.output.length - 1 && !last ? 'latest' : ''}><small>{i + 1}</small>{v}</span>) : <p className="empty-note">Здесь появятся посещённые значения.</p>}</div><p className="state-note">Посещено {current.output.length} из {allNodes.length}</p></> : <><div className="large-stat">{allNodes.length}<span>узлов в дереве</span></div><p className="state-note">На каждом шаге видно сравнение и выбранную ветвь вставки.</p></> : task === 'validate' ? <><div className="range-display">{active && current.bounds[active.id] ? rangeText(current.bounds[active.id].low, current.bounds[active.id].high) : '(−∞, +∞)'}</div><p className="state-note">{active ? `Узел ${active.value}: значение должно лежать строго внутри интервала.` : last ? 'Проверены ограничения всех узлов.' : 'Корень начинает без ограничений.'}</p><div className="bounds-list">{allNodes.filter(n => current.bounds[n.id]).map(n => <div className={n.id === current.active ? 'current-row' : ''} key={n.id}><strong>{n.value}</strong><span>{rangeText(current.bounds[n.id].low, current.bounds[n.id].high)}</span></div>)}</div></> : <><div className={`height-math ${hL !== undefined && hR !== undefined && Math.abs(hL - hR) > 1 ? 'unbalanced' : ''}`}><div><span>Слева</span><strong>{hL ?? '?'}</strong></div><div><span>Справа</span><strong>{hR ?? '?'}</strong></div><div><span>Разница ≤ 1</span><strong>{hL === undefined || hR === undefined ? '?' : Math.abs(hL - hR)}</strong></div></div><p className="state-note">{heightNode ? `Узел ${heightNode.value}: h = 1 + max(hL, hR).` : 'Высоты вычисляются после обработки детей.'} Пустая ветвь: h = 0.</p><div className="height-list">{allNodes.filter(n => current.heights[n.id] !== undefined).map(n => <span key={n.id}>{n.value} <b>h={current.heights[n.id]}</b></span>)}</div></>}
              {current.result !== null && <div className={`result ${current.result ? 'success' : 'failure'}`}>{current.result ? <Check size={18}/> : <X size={18}/>}<strong>{String(current.result === true ? 'True' : 'False')}</strong><span>{task === 'validate' ? current.result ? 'Это BST' : 'Нарушено свойство BST' : current.result ? 'Дерево сбалансировано' : 'Найден дисбаланс'}</span></div>}
            </section>
            <section className="node-card"><h2><SlidersHorizontal size={16}/> Информация об узле</h2>{chosen ? <dl><div><dt>Значение</dt><dd>{chosen.value}</dd></div><div><dt>Левый ребёнок</dt><dd>{chosen.left?.value ?? '∅'}</dd></div><div><dt>Правый ребёнок</dt><dd>{chosen.right?.value ?? '∅'}</dd></div>{limits && <div><dt>Границы</dt><dd>{rangeText(limits.low, limits.high)}</dd></div>}{current.heights[chosen.id] !== undefined && <div><dt>Высота</dt><dd>{current.heights[chosen.id]}</dd></div>}</dl> : <p>Выберите узел на схеме. Его дети, границы и рассчитанная высота появятся здесь.</p>}</section>
            <details className="pseudo"><summary><Code2 size={16}/> Логика алгоритма</summary>{pseudo.map((s,i) => <div key={i}><span>{i+1}</span><code>{s}</code></div>)}</details>
          </aside></div>

        </> : view === 'explain' ? <article className="reading"><div className="eyebrow">ИДЕЯ И КОРРЕКТНОСТЬ</div><h2>{data.short}</h2><p>{data.idea}</p>{task === 'traversal' && <div className="orders-table">{orders.map(o => <div key={o.id}><strong>{o.name}</strong><code>{o.pattern}</code></div>)}</div>}<h3>Почему алгоритм работает</h3><p>{data.proof}</p><h3>Время и память</h3><p>{data.complexity}</p><div className="note">Оценки относятся к Python-решению. Визуализация дополнительно хранит снимки шагов. Вход — конечное бинарное дерево без циклов и общих дочерних узлов.</div><button className="primary" onClick={() => setView('visual')}>Посмотреть шаги <ArrowRight size={16}/></button></article> : view === 'code' ? <section className="code-panel"><div className="section-heading"><h2><Code2 size={17}/> {codeKind === 'node' ? 'tree.py' : task === 'traversal' ? 'tree_traversal.py' : task === 'validate' ? 'validate_bst.py' : 'balanced_binary_tree.py'}</h2><button onClick={() => download(codeKind === 'node' ? sharedCode : data.code, codeKind === 'node' ? 'tree.py' : task === 'traversal' ? 'tree_traversal.py' : task === 'validate' ? 'validate_bst.py' : 'balanced_binary_tree.py')}><Download size={16}/> Скачать</button></div><div className="mode-switch"><button className={codeKind === 'solution' ? 'chosen' : ''} onClick={() => setCodeKind('solution')}>Решение задачи</button><button className={codeKind === 'node' ? 'chosen' : ''} onClick={() => setCodeKind('node')}>Класс Node</button></div><p>Настоящий исходник из Binary_Tree. Python 3.10+, без сторонних библиотек.</p><pre className="source"><code>{codeKind === 'node' ? sharedCode : data.code}</code></pre></section> : <section className="code-panel"><div className="section-heading"><h2><ShieldCheck size={18}/> Проверка решения</h2><button onClick={() => download(data.tests, 'test_algorithms.py')}><Download size={16}/> Скачать тесты</button></div><p>Тесты проверяют обычные и пустые деревья, цепочки, дубликаты, нарушения глубоко в поддереве и сравнение с независимым эталоном.</p><div className="command"><Terminal size={17}/><code>python3 -m unittest discover -s homework_4 -t . -v</code></div><div className="browser-checks"><div><h3>Быстрая проверка модели</h3><p>В браузере запускается TypeScript. Для Python используйте команду выше.</p></div><button className="primary" onClick={runChecks}><Play size={16}/> Проверить модель</button></div><div className="check-results" role="status">{checks.map(c => <p className={c.ok ? 'pass' : 'fail'} key={c.name}>{c.ok ? '✓' : '✕'} {c.name}</p>)}</div><details><summary>Исходный код Python-тестов</summary><pre className="source"><code>{data.tests}</code></pre></details></section>}
      </div><footer className="page-footer">Домашняя работа 4 · Binary Tree <span>BST · обходы · баланс</span></footer>
    </main>
  </div>;
}
