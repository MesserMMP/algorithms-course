import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDownUp, ArrowRight, BookOpen, Check, CheckCheck, ChevronRight, CircleHelp, Clock3, Code2, Copy, Download, FlaskConical, GitMerge, Layers3, ListChecks, MemoryStick, Pause, Play, RotateCcw, SkipBack, SkipForward, Terminal, Workflow } from 'lucide-react';
import { makeTrace } from './algorithms';
import type { TaskId, Trace } from './algorithms';
import { tasks } from './content';
import type { Task } from './content';
import { checks } from './checks';
import Diagram from './Diagram';
import CodeView from './CodeView';

type Tab = 'visual' | 'explain' | 'code' | 'tests';
const taskIcons = { stack_vs_queue: Layers3, validate: ListChecks, merge_lists: GitMerge };
const tabs = [
  { id: 'visual', label: 'Визуализация', icon: Workflow },
  { id: 'explain', label: 'Объяснение', icon: BookOpen },
  { id: 'code', label: 'Код', icon: Code2 },
  { id: 'tests', label: 'Тесты', icon: FlaskConical },
] as const;

function CopyButton({ text }: { text: string }) {
  const [status, setStatus] = useState('');
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timeout.current) clearTimeout(timeout.current); }, []);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setStatus('Скопировано'); }
    catch { setStatus('Выделите текст вручную'); }
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => setStatus(''), 2400);
  };
  return <button className="text-button" onClick={() => void copy()}>{status === 'Скопировано' ? <Check size={15} /> : <Copy size={15} />}<span role="status">{status || 'Копировать'}</span></button>;
}

function InputSequence({ label, values, consumed }: { label: string; values: number[]; consumed: number }) {
  return <div className="sequence"><code>{label}</code><div>{values.map((value, i) => <motion.span layout key={i} className={`sequence-number ${i < consumed ? 'consumed' : i === consumed ? 'current' : ''}`} aria-label={`${value}${i < consumed ? ', обработано' : i === consumed ? ', следующий' : ''}`}>{value}{i < consumed && <Check size={10} />}</motion.span>)}</div></div>;
}

function Workspace({ task }: { task: Task }) {
  const [tab, setTab] = useState<Tab>('visual');
  const [first, setFirst] = useState(task.defaults[0]);
  const [second, setSecond] = useState(task.defaults[1]);
  const [dummy, setDummy] = useState(true);
  const [trace, setTrace] = useState<Trace>(() => makeTrace(task.id, ...task.defaults, true));
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');
  const [dirty, setDirty] = useState(false);
  const [sourceFile, setSourceFile] = useState<'solution' | 'test_solution'>('solution');
  const [results, setResults] = useState<boolean[] | null>(null);
  const frame = trace.frames[step];
  const last = trace.frames.length - 1;
  const code = sourceFile === 'solution' ? task.code : task.tests;
  const command = `python3 -m unittest homework_2.${task.id}.test_solution -v`;
  const go = (value: number) => { setPlaying(false); setStep(Math.max(0, Math.min(last, value))); };
  const build = (a = first, b = second, useDummy = dummy) => {
    setPlaying(false);
    try {
      const nextTrace = makeTrace(task.id, a, b, useDummy);
      setTrace(nextTrace); setStep(0); setError(''); setDirty(false);
    } catch (e) { setError(e instanceof Error ? e.message : 'Проверьте входные данные.'); }
  };
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setStep(value => Math.min(value + 1, last)), 1000 / speed);
    return () => clearInterval(id);
  }, [playing, speed, last]);
  useEffect(() => { if (step === last) setPlaying(false); }, [step, last]);
  useEffect(() => {
    const onVisibility = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (tab !== 'visual' || target.closest('input, textarea, select, button, a, [role="button"], .react-flow')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); setPlaying(false); setStep(value => Math.min(last, value + 1)); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setPlaying(false); setStep(value => Math.max(0, value - 1)); }
      if (event.code === 'Space') { event.preventDefault(); if (step === last) setStep(0); setPlaying(value => !value); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tab, step, last]);
  const switchTab = (value: Tab) => { setPlaying(false); setTab(value); };
  return <>
    <section className="workspace" aria-label={task.title}>
      <div className="workspace-heading"><div><div className="task-title"><span className="task-number">0{tasks.indexOf(task) + 1}</span><h2>{task.title}</h2></div><p>{task.description}</p></div><span className="python-tag"><span />Python</span></div>
      <div className="workspace-tabs" role="tablist" aria-label="Раздел задачи">{tabs.map(({ id, label, icon: Icon }, index) => <button key={id} role="tab" id={`tab-${id}`} aria-controls={`panel-${id}`} aria-selected={tab === id} tabIndex={tab === id ? 0 : -1} onClick={() => switchTab(id)} onKeyDown={event => {
        if (['ArrowRight', 'ArrowLeft', 'Home', 'End'].includes(event.key)) {
          event.preventDefault();
          const nextIndex = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
          switchTab(tabs[nextIndex].id); document.getElementById(`tab-${tabs[nextIndex].id}`)?.focus();
        }
      }}><Icon size={16} />{label}{tab === id && <motion.span layoutId="tab-underline" className="tab-underline" />}</button>)}</div>
      <div id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
        {tab === 'visual' && <div className="visual-layout">
          <aside className="input-panel">
            <h3><Terminal size={16} />Входные данные</h3>
            <form onSubmit={event => { event.preventDefault(); build(); }}>
              {task.labels.map((label, i) => <label className="input-label" key={label}>{label}<input aria-describedby="input-hint" value={i === 0 ? first : second} onChange={event => { (i === 0 ? setFirst : setSecond)(event.target.value); setDirty(true); setPlaying(false); }} placeholder={task.id === 'merge_lists' ? 'Пустой список' : '1 2 3'} spellCheck={false} /></label>)}
              <p className="input-hint" id="input-hint">Целые числа через пробел.<br />До 16 элементов в каждом списке.</p>
              {task.id === 'merge_lists' && <fieldset className="variant"><legend>Способ слияния</legend>{[[true, 'С dummy'], [false, 'Без dummy']].map(([value, label]) => <label key={String(value)}><input type="radio" name="variant" checked={dummy === value} onChange={() => { setDummy(Boolean(value)); build(first, second, Boolean(value)); }} />{label}</label>)}</fieldset>}
              <button className="button primary" type="submit"><Play size={15} fill="currentColor" />Построить шаги</button>
              {error && <p role="alert" className="error-message">{error}</p>}
              {dirty && !error && <p className="pending-message">Примените изменения кнопкой выше.</p>}
            </form>
            <div className="presets"><span>Примеры</span><div>{task.presets.map(preset => <button key={preset.label} onClick={() => { setFirst(preset.values[0]); setSecond(preset.values[1]); build(...preset.values); }}>{preset.label}</button>)}</div></div>
            <div className="variables"><h4>Текущее состояние</h4>{Object.entries(frame.variables).map(([name, value]) => <div key={name}><code>{name}</code><motion.span key={String(value)} initial={{ opacity: .4 }} animate={{ opacity: 1 }}>{value}</motion.span></div>)}</div>
            <p className="input-footnote"><CircleHelp size={15} />Python-решения и тесты доступны в соседних вкладках.</p>
          </aside>
          <div className="visual-content">
            <div className="visual-topline"><h3>Состояние списков</h3><span className={`playback-status ${playing ? 'running' : ''}`}><i />{playing ? 'Воспроизведение' : step === last ? 'Завершено' : step === 0 ? 'Начало' : 'Пауза'}</span></div>
            {task.id === 'validate' && <div className="sequences"><InputSequence label="pushed" values={trace.input[0]} consumed={frame.consumed?.[0] ?? 0} /><InputSequence label="popped" values={trace.input[1]} consumed={frame.consumed?.[1] ?? 0} /></div>}
            <Diagram frame={frame} dummy={task.id === 'merge_lists' && trace.dummy} />
            {frame.output && <div className="outputs">{frame.output.map(output => <div key={output.label}><code>{output.label}()</code><span>{output.values.length ? output.values.join(' → ') : '—'}</span></div>)}</div>}
            <div className={`step-explanation ${frame.result === false ? 'failed' : ''}`} aria-live="polite"><span className="step-index">{String(step).padStart(2, '0')}</span><motion.div key={step} initial={{ opacity: 0, y: 3 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: .1 }}><h3>{frame.operation}</h3><p>{frame.detail}</p></motion.div>{frame.result !== undefined && <strong className={`result-badge ${frame.result ? 'success' : 'failure'}`}>{String(frame.result ? 'True' : 'False')}</strong>}</div>
            <div className="playback-controls"><div className="playback-buttons"><button className="icon-button" aria-label="В начало" onClick={() => go(0)} disabled={step === 0}><RotateCcw size={18} /></button><button className="icon-button" aria-label="Предыдущий шаг" onClick={() => go(step - 1)} disabled={step === 0}><SkipBack size={18} /></button><button className="button primary play-button" onClick={() => { if (step === last) setStep(0); setPlaying(value => !value); }}>{playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}{playing ? 'Пауза' : 'Играть'}</button><button className="icon-button" aria-label="Следующий шаг" onClick={() => go(step + 1)} disabled={step === last}><SkipForward size={18} /></button></div><label className="speed">Скорость<select value={speed} onChange={event => setSpeed(Number(event.target.value))}><option value="0.5">0.5×</option><option value="1">1×</option><option value="2">2×</option></select></label></div>
            <div className="timeline"><input aria-label="Шаг алгоритма" aria-valuetext={`Шаг ${step} из ${last}: ${frame.operation}`} type="range" min="0" max={last} value={step} onChange={event => go(Number(event.target.value))} /><span>{step} <i>/ {last}</i></span></div>
            <details className="history"><summary>Операции <span>{last}</span></summary><div>{trace.frames.map((entry, i) => <button aria-current={step === i ? 'step' : undefined} key={i} onClick={() => go(i)}><span>{String(i).padStart(2, '0')}</span>{entry.operation}<ChevronRight size={14} /></button>)}</div></details>
          </div>
        </div>}
        {tab === 'explain' && <div className="explanation-panel"><div className="explanation-steps">{task.explanation.map((part, i) => <article key={part.title}><span>0{i + 1}</span><h3>{part.title}</h3><p>{part.text}</p></article>)}</div><div className="section-heading"><h3>Пошаговый пример</h3><button className="text-button" onClick={() => switchTab('visual')}>Открыть визуализацию<ArrowRight size={15} /></button></div><div className="table-scroll"><table><thead><tr><th>Шаг</th><th>Операция</th><th>Состояние</th></tr></thead><tbody>{trace.frames.map((entry, i) => <tr key={i}><td>{i}</td><td><code>{entry.operation}</code></td><td>{entry.lanes.map(lane => <div key={lane.id}><b>{lane.label}:</b> {lane.items.map(item => item.value).join(' → ') || 'None'}</div>)}</td></tr>)}</tbody></table></div></div>}
        {tab === 'code' && <div className="source-panel"><div className="code-toolbar"><div className="file-switch">{(['solution', 'test_solution'] as const).map(file => <button className={sourceFile === file ? 'active' : ''} key={file} onClick={() => setSourceFile(file)}><Code2 size={14} />{file}.py</button>)}</div><div><CopyButton text={code} /><a className="text-button" href={`data:text/plain;charset=utf-8,${encodeURIComponent(code)}`} download={`${sourceFile}.py`}><Download size={15} />Скачать</a></div></div><CodeView code={code} /><p className="source-caption">homework_2/{task.id}/{sourceFile}.py</p></div>}
        {tab === 'tests' && <div className="tests-panel"><div className="section-heading"><div><h3>Проверки визуализации</h3><p>Запускаются в браузере на TypeScript-модели алгоритма.</p></div><button className="button primary" onClick={() => setResults(checks[task.id].map(check => { try { return check.run(); } catch { return false; } }))}><Play size={15} />Запустить</button></div><div className="table-scroll"><table><thead><tr><th>Проверка</th><th>Вход</th><th>Ожидается</th><th>Результат</th></tr></thead><tbody>{checks[task.id].map((check, i) => <tr key={check.name}><td>{check.name}</td><td><code>{check.input}</code></td><td><code>{check.expected}</code></td><td><span className={results ? results[i] ? 'test-pass' : 'test-fail' : 'test-pending'}>{results ? results[i] ? 'Пройдено' : 'Ошибка' : 'Не запущен'}</span></td></tr>)}</tbody></table></div>{results && <p className="test-summary" role="status"><CheckCheck size={18} />Пройдено: {results.filter(Boolean).length} из {results.length}</p>}<div className="python-tests"><Terminal size={21} /><div><h3>Тесты Python-решения</h3><p>Запустите из корня репозитория. Проверяют граничные случаи и входы до 100 000 элементов.</p><div className="command"><code>{command}</code><CopyButton text={command} /></div><button className="text-button" onClick={() => { setSourceFile('test_solution'); switchTab('code'); }}>Посмотреть test_solution.py<ArrowRight size={15} /></button></div></div></div>}
      </div>
    </section>
    <div className="insight-grid"><article><span className="insight-icon"><Clock3 size={20} /></span><div><span>Время</span><strong>{task.time}</strong><p>{task.costNote}</p></div></article><article><span className="insight-icon violet"><MemoryStick size={20} /></span><div><span>Память</span><strong>{task.memory}</strong><p>{task.id === 'merge_lists' ? 'Только указатели и один dummy в первом способе.' : task.id === 'validate' ? 'В худшем случае все элементы находятся в стеке.' : 'Один связный узел на каждый элемент.'}</p></div></article><article><span className="insight-icon green"><ArrowDownUp size={20} /></span><div><span>{task.id === 'merge_lists' ? 'Способы' : 'Операции'}</span><strong className="text-metric">{task.id === 'merge_lists' ? 'С dummy / без dummy' : task.id === 'validate' ? 'push → pop' : 'LIFO / FIFO'}</strong><p>{task.id === 'merge_lists' ? 'Обе реализации меняют связи исходных узлов.' : task.id === 'validate' ? 'Добавляем по pushed, извлекаем по popped.' : 'Добавление и извлечение без обхода списка.'}</p></div></article></div>
  </>;
}

export default function App() {
  const [selected, setSelected] = useState<TaskId>('stack_vs_queue');
  const task = tasks.find(value => value.id === selected)!;
  return <><header className="site-header"><div><span className="header-title"><Code2 size={22} />Алгоритмы</span><span className="header-divider" /><span>Домашнее задание 2</span><code>Python</code></div></header><main><div className="page-heading"><div><p>АЛГОРИТМЫ НА PYTHON</p><h1>Домашнее задание <span>2</span></h1><div>Связные списки, стек и очередь</div></div><span className="task-count">3 задачи</span></div><nav className="task-grid" aria-label="Задачи">{tasks.map((entry, i) => { const Icon = taskIcons[entry.id]; return <button className={`task-card ${selected === entry.id ? 'selected' : ''}`} key={entry.id} aria-pressed={selected === entry.id} onClick={() => setSelected(entry.id)}><span className={`task-symbol symbol-${i}`}><Icon size={27} strokeWidth={1.6} /></span><span className="task-card-text"><small>ЗАДАЧА 0{i + 1}</small><strong>{entry.title}</strong><span>{entry.short}</span></span><ChevronRight size={18} className="task-chevron" />{selected === entry.id && <motion.span className="task-indicator" layoutId="selected-task" />}</button>; })}</nav><Workspace key={selected} task={task} /><footer><span>homework_2</span><span>Stack vs Queue<span className="footer-dot">·</span>Validate<span className="footer-dot">·</span>Merge lists</span></footer></main></>;
}
