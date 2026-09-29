import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import { ArrowRight, Braces, Check, ChevronLeft, ChevronRight, Code2, Download, FlaskConical, Hash, Layers, Pause, Play, RotateCcw, Terminal } from 'lucide-react';
import { anagramFrames, hashFrames, parseNumbers, parseOperations, parseTarget, parseWords, twoSumFrames, type Task } from './algorithms';
import { content } from './content';

type View = 'lab' | 'explanation' | 'code' | 'tests';
const labels: [View, string][] = [['lab', 'Визуализация'], ['explanation', 'Как это работает'], ['code', 'Python-код'], ['tests', 'Тесты']];
const tasks: Task[] = ['two_sum', 'anagrams', 'hash_table'];
function Code({text}: {text: string}) {
  return <pre className="source"><code>{text}</code></pre>;
}
function download(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], {type: 'text/plain;charset=utf-8'}));
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = filename; anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export default function App() {
  const [task, setTask] = useState<Task>('two_sum');
  const [view, setView] = useState<View>('lab');
  const [input, setInput] = useState(content.two_sum.examples[0].input);
  const [target, setTarget] = useState(content.two_sum.examples[0].target ?? '7');
  const [applied, setApplied] = useState({task: 'two_sum' as Task, input, target});
  const canvasRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');
  const [checks, setChecks] = useState<string[]>([]);
  const data = content[task];
  const frames = useMemo(() => applied.task === 'two_sum' ? twoSumFrames(parseNumbers(applied.input), parseTarget(applied.target)) : applied.task === 'anagrams' ? anagramFrames(parseWords(applied.input)) : hashFrames(parseOperations(applied.input)), [applied]);
  const current = frames[Math.min(step, frames.length - 1)];
  const last = step >= frames.length - 1;
  const dirty = input !== applied.input || target !== applied.target;
  useEffect(() => {
    if (!playing || last) return;
    const timer = window.setTimeout(() => setStep(s => s + 1), 800 / speed);
    return () => clearTimeout(timer);
  }, [playing, last, speed, step]);
  useEffect(() => {
    const area = canvasRef.current;
    if (!area) return;
    if (step === 0) { area.scrollTop = 0; return; }
    const selector = current.result ? '.result' : task === 'hash_table' ? '.bucket.focused' : task === 'anagrams' && current.focus >= 0 ? '.group.focused' : '.array-cell.current';
    const active = area.querySelector<HTMLElement>(selector);
    if (!active) return;
    const box = area.getBoundingClientRect(), item = active.getBoundingClientRect();
    if (item.top < box.top || item.bottom > box.bottom) area.scrollTop += item.top - box.top - 20;
  }, [step, task, current.focus, current.result]);
  function move(index: number) { setPlaying(false); setStep(Math.max(0, Math.min(index, frames.length - 1))); }
  function apply(nextInput = input, nextTarget = target, nextTask = task) {
    try {
      if (nextTask === 'two_sum') { parseNumbers(nextInput); parseTarget(nextTarget); }
      else if (nextTask === 'anagrams') parseWords(nextInput);
      else parseOperations(nextInput);
      setApplied({task: nextTask, input: nextInput, target: nextTarget}); setStep(0); setPlaying(false); setError('');
    } catch (e) { setError((e as Error).message); setPlaying(false); }
  }
  function selectTask(next: Task) {
    const example = content[next].examples[0];
    setTask(next); setInput(example.input); setTarget(example.target ?? '7'); setChecks([]);
    apply(example.input, example.target ?? '7', next);
  }
  function runChecks() {
    const cases: [string, () => boolean][] = task === 'two_sum' ? [
      ['10 чисел → 8 9', () => twoSumFrames(parseNumbers(content.two_sum.examples[0].input), 101).at(-1)!.result === '8 9'],
      ['Пример из условия → 1 2', () => twoSumFrames([1, 3, 4, 10], 7).at(-1)!.result === '1 2'],
      ['Два одинаковых числа → 0 1', () => twoSumFrames([5, 5], 10).at(-1)!.result === '0 1'],
      ['Один индекс не используется дважды', () => twoSumFrames([5], 10).at(-1)!.result === 'ValueError'],
    ] : task === 'anagrams' ? [
      ['10 слов в 4 группах', () => anagramFrames(parseWords(content.anagrams.examples[0].input)).at(-1)!.groups.length === 4],
      ['Анаграммы объединяются', () => anagramFrames(['eat', 'tea', 'ate']).at(-1)!.groups.length === 1],
      ['Пустые строки сохраняются', () => anagramFrames(['', '']).at(-1)!.groups[0][1].length === 2],
      ['Регистр имеет значение', () => anagramFrames(['Ab', 'ab']).at(-1)!.groups.length === 2],
    ] : [
      ['10 операций: коллизии, расширение и удаление', () => { const end = hashFrames(parseOperations(content.hash_table.examples[0].input)).at(-1)!; return end.buckets.length === 8 && end.size === 3 && end.result === 'peach'; }],
      ['Коллизия сохраняет оба ключа', () => hashFrames(parseOperations('set 1 a\nset 5 b')).at(-1)!.buckets[1].length === 2],
      ['Обновление не меняет размер', () => hashFrames(parseOperations('set 1 a\nset 1 b')).at(-1)!.size === 1],
      ['Удалённый ключ не найден', () => hashFrames(parseOperations('set 1 a\ndelete 1\nget 1')).at(-1)!.result === 'KeyError(1)'],
    ];
    setChecks(cases.map(([name, fn]) => `${fn() ? '✓' : '✕'} ${name}`));
  }
  return <MotionConfig reducedMotion="user"><div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#main"><span className="brand-icon"><Hash size={23}/></span>ДЗ 3 · Алгоритмы</a>
      <div className="course-label">АЛГОРИТМЫ НА PYTHON</div>
      <div className="nav-label">ЗАДАЧИ</div>
      <nav aria-label="Задачи">{tasks.map((t, i) => <button key={t} className={`task-link ${task === t ? 'selected' : ''}`} onClick={() => selectTask(t)} aria-current={task === t ? 'page' : undefined}><span className="task-number">0{i + 1}</span><span>{content[t].name}</span><ChevronRight size={15}/></button>)}</nav>
    </aside>
    <main id="main">
      <header className="topbar"><span>Курс алгоритмов <span className="slash">/</span> ДЗ 03 <span className="slash">/</span> <strong>{data.name}</strong></span></header>
      <section className="page-heading"><div><div className="eyebrow">ЗАДАЧА {data.tag}</div><h1>{data.name}</h1><p>{data.subtitle}</p></div><div className="complexity"><div><span>Сложность по времени</span><strong>{data.time}</strong></div><div><span>Дополнительная память</span><strong>{data.memory}</strong></div></div></section>
      <div className="tabs" role="tablist" aria-label="Раздел задачи">{labels.map(([id, name]) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={view === id} aria-controls="panel" className={view === id ? 'active' : ''} onClick={() => {setView(id); setPlaying(false);}}>{id === 'lab' ? <FlaskConical size={16}/> : id === 'code' ? <Code2 size={16}/> : id === 'tests' ? <Check size={16}/> : <Layers size={16}/>} {name}</button>)}</div>
      <div id="panel" role="tabpanel" aria-labelledby={`tab-${view}`}>
      {view === 'lab' ? <>
        <section className="input-panel"><div className="section-heading"><h2><Braces size={17}/> Входные данные</h2><span className="muted">Выберите пример или задайте свой</span></div>
          <div className="presets">{data.examples.map((e, i) => <button key={e.name} className={input === e.input && (task !== 'two_sum' || target === e.target) ? 'chosen' : ''} onClick={() => {setInput(e.input); setTarget(e.target ?? target); apply(e.input, e.target ?? target);}}>{i === 0 && <span className="small-dot"/>}{e.name}</button>)}</div>
          <div className={`input-row ${task === 'hash_table' ? 'operations' : ''}`}><label className="main-input"><span>{task === 'two_sum' ? 'Массив arr' : task === 'anagrams' ? 'Список слов strs' : 'Сценарий операций'}</span>{task === 'hash_table' ? <textarea value={input} onChange={e => setInput(e.target.value)} rows={6} spellCheck={false}/> : <textarea value={input} onChange={e => setInput(e.target.value)} rows={3} spellCheck={false}/>}</label>{task === 'two_sum' && <label className="target-input"><span>Сумма k</span><input inputMode="numeric" value={target} onChange={e => setTarget(e.target.value)}/></label>}<button className="primary apply" onClick={() => apply()}>Применить <ArrowRight size={16}/></button></div>
          {error ? <p className="error" role="alert">{error}</p> : <p className="input-hint">{dirty ? 'Вход изменён. Нажмите «Применить», чтобы обновить визуализацию.' : task === 'hash_table' ? 'set ключ значение · get ключ · delete ключ. Целочисленные ключи, до 24 операций.' : task === 'two_sum' ? 'Индексы начинаются с 0. По условию подходящая пара ровно одна.' : 'JSON-массив строк. Порядок групп в ответе не важен; повторы сохраняются.'}</p>}
        </section>
        <div className="workspace">
          <section className="canvas-panel"><div className="section-heading"><h2><span className="status-dot"/> Состояние алгоритма</h2><span className="step-badge">ШАГ {step} / {frames.length - 1}</span></div>
            <section className="step-info"><h3>{current.title}</h3><p aria-live="polite">{current.detail}</p></section><div className="canvas-body" ref={canvasRef} tabIndex={0} role="region" aria-label="Схема алгоритма — прокручивается по вертикали">
              {task !== 'hash_table' && <><div className="diagram-label">{task === 'two_sum' ? 'МАССИВ / ЗНАЧЕНИЕ И ИНДЕКС' : 'ВХОДНЫЕ СЛОВА'}</div><div className="array">{current.items.length ? current.items.map((value, i) => <motion.div layout key={i} className={`array-cell ${current.active === i ? 'current' : ''} ${current.found.includes(i) ? 'found' : ''} ${i < current.active ? 'visited' : ''}`}><strong>{value === '' ? '""' : value}</strong><small>{i}</small></motion.div>) : <span className="empty-inline">Пустой вход</span>}</div><div className="flow-connector"><span/><ArrowRight size={18}/><span>{task === 'two_sum' ? 'проверить дополнение → запомнить число' : 'отсортировать символы → найти группу'}</span></div></>}
              {task === 'two_sum' && <><div className="diagram-label">СЛОВАРЬ SEEN <span>число → индекс</span></div><div className="dictionary">{current.pairs.length ? current.pairs.map(([v, i]) => <motion.div layout key={v} className="dict-entry"><strong>{v}</strong><ArrowRight size={14}/><span>{i}</span></motion.div>) : <div className="empty-state"><Hash size={25}/><span>Словарь пока пуст</span><small>Здесь появятся уже просмотренные числа</small></div>}</div></>}
              {task === 'anagrams' && <><div className="diagram-label">ГРУППЫ ПО ПОДПИСИ <span>{current.groups.length} групп</span></div><div className="groups">{current.groups.length ? current.groups.map(([key, words]) => <motion.div layout key={key} className={`group ${current.focus === current.groups.findIndex(g => g[0] === key) ? 'focused' : ''}`}><span className="signature">{key || '""'}</span><ArrowRight size={16}/><div>{words.map((word, i) => <span className="word" key={i}>{word || '""'}</span>)}</div></motion.div>) : <div className="empty-state"><Layers size={25}/><span>Групп пока нет</span><small>Первое слово создаст первую группу</small></div>}</div></>}
              {task === 'hash_table' && <><div className="current-operation"><span>Текущая операция</span><code>{current.active >= 0 ? current.items[current.active] : 'Ожидание первого шага'}</code></div><div className="hash-stats"><span>Записи <strong>{current.size}</strong></span><span>Корзины <strong>{current.buckets.length}</strong></span><span>Нагрузка <strong>{(current.size / current.buckets.length).toFixed(2)}</strong></span></div><div className="load-bar"><div style={{width: `${current.size / current.buckets.length * 100}%`}}/><span style={{left: '75%'}}/></div><div className="diagram-label">КОРЗИНЫ И ЦЕПОЧКИ <span>порог расширения 0.75</span></div><div className="buckets">{current.buckets.map((chain, i) => <motion.div layout className={`bucket ${current.focus === i ? 'focused' : ''}`} key={i}><span className="bucket-index">{i.toString().padStart(2, '0')}</span><div className="chain">{chain.length ? chain.map(([k, v]) => <span className="record" key={k}><b>{k}</b><span>{v}</span></span>) : <span className="null">пусто</span>}</div></motion.div>)}</div></>}
              {current.result && <div className={`result ${current.result.startsWith('KeyError') || current.result === 'ValueError' ? 'result-error' : ''}`}><span aria-hidden="true">{current.result.startsWith('KeyError') || current.result === 'ValueError' ? '!' : '✓'}</span><span>Результат <strong>{current.result}</strong></span></div>}
            </div>
            <div className="player"><input type="range" aria-label="Шаг алгоритма" min={0} max={frames.length - 1} value={step} onChange={e => move(Number(e.target.value))}/><div className="player-buttons"><button className="icon-button" aria-label="В начало" onClick={() => move(0)} disabled={step === 0}><RotateCcw size={17}/></button><button className="icon-button" aria-label="Предыдущий шаг" onClick={() => move(step - 1)} disabled={step === 0}><ChevronLeft size={20}/></button><button className="primary play" disabled={frames.length <= 1} onClick={() => {if (last) setStep(0); setPlaying(p => !p || last);}}>{playing && !last ? <Pause size={16}/> : <Play size={16}/>} {playing && !last ? 'Пауза' : last ? 'Повторить' : 'Запустить'}</button><button className="icon-button" aria-label="Следующий шаг" onClick={() => move(step + 1)} disabled={last}><ChevronRight size={20}/></button><label className="speed"><span>Скорость</span><select aria-label="Скорость" value={speed} onChange={e => setSpeed(Number(e.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div></div>
          </section>
          <aside className="inspector"><section className="pseudo"><div className="section-heading"><h2><Code2 size={16}/> Логика шага</h2><span>Python · схема</span></div>{data.pseudo.map((line, i) => <div className={i === current.line ? 'highlight' : ''} key={i}><span>{i + 1}</span><code>{line}</code></div>)}</section><div className="tip"><strong>Попробуйте сами</strong><p>{task === 'two_sum' ? 'Почему проверка идёт до добавления? Запустите массив [5] и сумму 10.' : task === 'anagrams' ? 'Добавьте пустую строку или повтор слова. В какую группу они попадут?' : 'Ключи 1, 5 и 9 попадут в одну корзину при ёмкости 4. Что изменится после роста?'}</p></div></aside>
        </div><div className="legend">{task !== 'hash_table' && <span><i className="legend-current"/>Текущий элемент</span>}<span><i className="legend-found"/>{task === 'two_sum' ? 'Найденная пара' : task === 'anagrams' ? 'Пополняемая группа' : 'Активная корзина'}</span><span>Шаги: ползунок и стрелки. Большие схемы прокручиваются внутри блока.</span></div>
      </> : view === 'explanation' ? <section className="reading"><div className="eyebrow">ОТ ИДЕИ К АЛГОРИТМУ</div><h2>Как устроено решение</h2><p>{data.idea}</p><h3>Почему это работает</h3><p>{data.proof}</p><h3>Сложность и ограничения</h3><p>{data.complexity}</p><div className="note">Оценки относятся к Python-алгоритму. Визуализация хранит снимки всех шагов и требует дополнительной памяти.</div><button className="primary" onClick={() => setView('lab')}>К визуализации <ArrowRight size={16}/></button></section> : view === 'code' ? <section className="code-panel"><div className="section-heading"><h2><Code2 size={17}/> {task}/solution.py</h2><button onClick={() => download(data.code, 'solution.py')}><Download size={16}/> Скачать</button></div><p className="code-note">Исходный файл из папки задачи. Python 3.10+, без сторонних библиотек.</p><Code text={data.code}/></section> : <section className="code-panel"><div className="section-heading"><h2><FlaskConical size={17}/> Проверка решения</h2><button onClick={() => download(data.tests, 'test_solution.py')}><Download size={16}/> Скачать тесты</button></div><p>Python-тесты: граничные случаи, независимые эталоны, случайные входы с фиксированным seed и большие данные.</p><div className="command"><Terminal size={18}/><code>python3 -m unittest discover -s homework_3 -t . -v</code></div><div className="browser-checks"><div><h3>Быстрая проверка модели</h3><p>Эти проверки выполняют TypeScript в браузере. Python запускается командой выше.</p></div><button className="primary" onClick={runChecks}><Play size={15}/> Проверить модель</button></div><div role="status" className="check-results">{checks.map(c => <div key={c}>{c}</div>)}</div><details><summary>Исходный код Python-тестов</summary><Code text={data.tests}/></details></section>}
      </div><footer className="page-footer">Домашняя работа 3 · Алгоритмы на Python</footer>
    </main>
  </div></MotionConfig>;
}
