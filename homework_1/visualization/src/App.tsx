import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { strToU8, zipSync } from 'fflate';
import { evaluate, formatResult, makeFrames, parseInput, repositoryFiles, tasks } from './algorithms';
import { Latex } from './Latex';
import type { Frame, TaskId } from './algorithms';

type IconName = 'arrow' | 'download' | 'play' | 'pause' | 'next' | 'back' | 'reset' | 'check' | 'code' | 'grid' | 'book' | 'test' | 'clock' | 'memory' | 'chevron' | 'external' | 'close' | 'copy' | 'folder' | 'info' | 'spark' | 'terminal';
function Icon({ name, size = 18, className = '' }: { name: IconName; size?: number; className?: string }) {
  const paths: Record<IconName, ReactNode> = {
    arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
    download: <><path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" /></>,
    play: <path d="m9 5 11 7-11 7Z" fill="currentColor" stroke="none" />,
    pause: <><path d="M8 5v14M16 5v14" strokeWidth="4" /></>,
    next: <><path d="m6 6 8 6-8 6Z" fill="currentColor" stroke="none" /><path d="M18 6v12" /></>,
    back: <><path d="m18 6-8 6 8 6Z" fill="currentColor" stroke="none" /><path d="M6 6v12" /></>,
    reset: <><path d="M4 10a8 8 0 1 1 1 7M4 4v6h6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    code: <><path d="m7 7-5 5 5 5m10-10 5 5-5 5M14 4l-4 16" /></>,
    grid: <><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></>,
    book: <><path d="M12 5C8 2 3 4 3 4v15s5-2 9 1c4-3 9-1 9-1V4s-5-2-9 1Zm0 0v15" /></>,
    test: <><path d="M9 3h6m-5 0v7l-6 9a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2l-6-9V3M7 15h10" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    memory: <><rect x="5" y="5" width="14" height="14" rx="3" /><rect x="9" y="9" width="6" height="6" rx="1" /><path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3m14-6h3m-3 6h3" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    external: <><path d="M14 3h7v7M21 3 10 14M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2" /><path d="M15 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h3" /></>,
    folder: <path d="M3 7V5a2 2 0 0 1 2-2h5l2 3h7a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7Z" />,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6m0-10h.01" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /></>,
    terminal: <><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m7 9 3 3-3 3m6 0h4" /></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">{paths[name]}</svg>;
}
function TaskSymbol({ id, small = false }: { id: TaskId; small?: boolean }) {
  return <span className={`task-symbol ${id} ${small ? 'small' : ''}`} aria-hidden="true">{id === 'palindrome' ? <span className="mirror-symbol">1<span />1</span> : id === 'sum' ? <span className="sigma-symbol">∑</span> : <span className="prime-symbol">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</span>}</span>;
}
function CodeView({ code }: { code: string }) {
  return <pre className="code-view"><code>{code.trimEnd().split('\n').map((line, lineIndex) => <span className="code-line" key={lineIndex}><span className="line-number">{lineIndex + 1}</span><span>{line.split(/("[^"\n]*"|'[^'\n]*'|#[^\n]*|\b(?:def|if|else|elif|for|in|while|return|import|from|as|and|or|not|is|raise|assert|class|with|True|False|None)\b|\b\d+\b)/g).map((token, tokenIndex) => <span key={tokenIndex} className={token.startsWith('#') ? 'syntax-comment' : /^["']/.test(token) ? 'syntax-string' : /^(def|if|else|elif|for|in|while|return|import|from|as|and|or|not|is|raise|assert|class|with|True|False|None)$/.test(token) ? 'syntax-keyword' : /^\d+$/.test(token) ? 'syntax-number' : ''}>{token}</span>)}</span></span>)}</code></pre>;
}
function PalindromeScene({ input, frame, step }: { input: number; frame: Frame; step: number }) {
  const digits = String(input).split('');
  const len = digits.length;
  const processed = frame.active || 0;
  const finished = frame.result !== undefined;
  const pairCount = Math.floor(len / 2);
  const arcDepth = Math.min(pairCount, 3);
  const showArcs = len <= 9;
  return <div className="palindrome-scene">
    <div className="scene-caption"><span>СИММЕТРИЯ ЧИСЛА</span><span className="subtle-tag"><Icon name="code" size={13} /> Только арифметика</span></div>
    <div className={`digits-scene ${len > 10 ? 'many-digits' : ''}`}>
      {showArcs && <svg className="connection-lines" viewBox={`0 0 ${len * 63 - 9} 36`} preserveAspectRatio="none" aria-hidden="true">
        {Array.from({ length: arcDepth }, (_, i) => {
          const left = i * 63 + 27;
          const right = (len - 1 - i) * 63 + 27;
          return <path key={i} d={`M ${left} 36 Q ${(left + right) / 2} ${2 * (4 + i * 9) - 36} ${right} 36`} fill="none" stroke={['#7cb8f0', '#a9d2f7', '#d3e8fb'][i]} strokeWidth="1.6" strokeLinecap="round" />;
        })}
      </svg>}
      <div className="digit-row">{digits.map((digit, index) => <div key={index} className={`digit-wrap pair-${Math.min(index, len - 1 - index) % 3} ${index >= len - processed ? 'processed' : ''} ${finished ? frame.result ? 'matched' : 'unmatched' : ''} ${step === 0 && (index === 0 || index === len - 1) ? 'edge' : ''} ${len % 2 === 1 && index === Math.floor(len / 2) ? 'center' : ''}`}><span className="digit-position">{index + 1}</span><div className="digit-tile">{digit}</div><span className="digit-marker">{index >= len - processed ? '↙' : '·'}</span></div>)}</div>
      <div className="symmetry-connector"><span /><div>{finished ? frame.result ? <><Icon name="check" size={14} /> Симметрия найдена</> : 'Симметрии нет' : processed ? `Перенесено цифр: ${processed}` : 'Две половины. Одно отражение.'}</div><span /></div>
    </div>
    <div className="state-row"><div className="state-box"><span>Оставшаяся часть <code>remaining_number</code></span><strong key={`remaining-${frame.remaining}`}>{frame.remaining}</strong></div><div className="transfer-icon"><Icon name="arrow" size={21} /></div><div className="state-box accent"><span>Развёрнутая половина <code>reversed_half</code></span><strong key={`reversed-${frame.reversed}`}>{frame.reversed}</strong></div></div>
  </div>;
}
function SumScene({ input, frame }: { input: number[]; frame: Frame }) {
  const finished = frame.result !== undefined;
  return <div className="sum-scene"><div className="scene-caption"><span>МАКСИМУМ БЕЗ ПЕРЕБОРА</span><span className="subtle-tag">Один проход</span></div>
    <div className="sum-numbers">{input.length ? input.map((number, index) => <div className={`sum-item ${index === frame.active ? 'current' : ''} ${index <= (frame.active ?? -1) ? 'visited' : ''} ${frame.excluded === index ? 'excluded' : ''}`} key={index}><span className="digit-position">{index + 1}</span><div className="sum-bar-space"><div className="sum-bar" style={{ height: `${28 + number / Math.max(...input) * 53}px` }}><span>{number}</span></div></div><span className="sum-item-label">{frame.excluded === index ? 'убираем' : number % 2 ? 'нечётное' : 'чётное'}</span></div>) : <div className="empty-array">[ ]<span>Пустой массив — сумма равна 0</span></div>}</div>
    <div className="state-row"><div className="state-box"><span>Сумма элементов <code>total_sum</code></span><strong>{frame.total}</strong></div><div className="transfer-icon">{finished && frame.excluded !== -1 ? '−' : '+'}</div><div className="state-box accent"><span>Минимальное нечётное <code>smallest_odd</code></span><strong>{frame.smallestOdd ?? '—'}</strong></div></div>
  </div>;
}
function PrimeScene({ input, frame }: { input: number; frame: Frame }) {
  const finished = frame.result !== undefined;
  return <div className="prime-scene"><div className="scene-caption"><span>РЕШЕТО ЭРАТОСФЕНА</span><span className="subtle-tag"><Latex text={`$2 \\le n < ${input}$`} /></span></div>
    <div className={`sieve-grid ${input > 70 ? 'compact' : ''}`}>{Array.from({ length: input }, (_, number) => <div key={number} title={number < 2 ? `${number}: не простое по определению` : frame.crossed?.includes(number) ? `${number}: составное` : finished || number <= (frame.candidate ?? 0) ? `${number}: простое` : `${number}: ещё не вычеркнуто`} className={`sieve-cell ${number < 2 ? 'not-prime' : frame.newlyCrossed?.includes(number) ? 'just-crossed' : frame.crossed?.includes(number) ? 'crossed' : finished || number <= (frame.candidate ?? 0) ? 'prime' : ''} ${number === frame.candidate ? 'candidate' : ''}`}>{number}</div>)}</div>
    {input < 2 && <div className="sieve-empty">В этом диапазоне нет простых чисел</div>}
    <div className="sieve-legend"><span><i className="legend-prime" />Простое</span><span><i className="legend-pending" />Не проверено</span><span><i className="legend-crossed" />Составное</span><span className="sieve-total">{finished ? `${frame.result} простых` : frame.candidate ? `Текущий делитель: ${frame.candidate}` : 'Готово к отсеву'}</span></div>
  </div>;
}
const explanation: Record<TaskId, { title: string; text: string }[]> = {
  palindrome: [
    { title: 'Не разворачиваем число целиком', text: 'Забираем последнюю цифру: $n \\bmod 10$. Добавляем её к развёрнутой половине: $r \\leftarrow 10r + (n \\bmod 10)$ и сокращаем число: $n \\leftarrow \\lfloor n / 10 \\rfloor$. Строки и дополнительные массивы не нужны.' },
    { title: 'Встречаемся в середине', text: 'Повторяем, пока $n > r$. Для палиндрома половины совпадут; при нечётной длине центральная цифра окажется в развёрнутой части $r$.' },
    { title: 'Сравниваем две половины', text: 'Проверяем $n = r$ или $n = \\lfloor r / 10 \\rfloor$ после удаления центральной цифры. Достаточно одного истинного равенства.' },
  ],
  sum: [
    { title: 'Берём всё, что можем', text: 'Все числа положительные, поэтому $S = \\sum_{i} a_i$ — верхняя граница ответа. За один проход считаем сумму и минимальный нечётный элемент $m$.' },
    { title: 'Проверяем чётность', text: 'Если $S \\bmod 2 = 0$, возвращаем $S$ без изменений. Иначе сумма нечётна и от неё нужно избавиться.' },
    { title: 'Теряем как можно меньше', text: 'Любая исключённая группа с нечётной суммой содержит нечётный элемент, значит её сумма не меньше $m$. Ответ: $S - m$ при нечётной $S$ — убирать только $m$ оптимально.' },
  ],
  prime: [
    { title: 'Предполагаем простоту', text: 'Создаём массив признаков простоты длины $N$. Числа 0 и 1 сразу исключаем. При $N \\le 2$ ответ равен 0: верхняя граница не входит в диапазон.' },
    { title: 'Отсеиваем составные', text: 'Для каждого простого $p$ вычёркиваем кратные, начиная с $p^2$: меньшие кратные $k \\cdot p$ при $k < p$ уже вычеркнуты меньшими простыми делителями.' },
    { title: 'Подсчитываем оставшиеся', text: 'Достаточно кандидатов $p \\le \\sqrt{N-1}$: у каждого составного $n < N$ есть делитель $\\le \\sqrt{n}$. Количество оставшихся отметок — искомое число.' },
  ],
};

function FileTree({ files, selectedFile, onSelect }: { files: string[]; selectedFile: string; onSelect: (path: string) => void }) {
  type DirNode = { dirs: Map<string, DirNode>; files: string[] };
  const root: DirNode = { dirs: new Map(), files: [] };
  for (const path of files) {
    const segments = path.split('/');
    let node = root;
    for (let i = 0; i < segments.length - 1; i++) {
      const name = segments[i];
      let child = node.dirs.get(name);
      if (!child) { child = { dirs: new Map(), files: [] }; node.dirs.set(name, child); }
      node = child;
    }
    node.files.push(path);
  }
  const renderDir = (node: DirNode, depth: number): ReactNode => {
    const items: ReactNode[] = [];
    for (const [name, child] of [...node.dirs.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
      items.push(
        <div className="tree-dir" style={{ paddingLeft: depth * 16 }} key={name}><Icon name="folder" size={14} /><span>{name}/</span></div>,
        renderDir(child, depth + 1),
      );
    }
    for (const path of node.files) {
      const fileName = path.split('/').pop()!;
      const isPython = fileName.endsWith('.py');
      items.push(
        <button className={selectedFile === path ? 'active' : ''} style={{ paddingLeft: depth * 16 + 4 }} key={path} onClick={() => onSelect(path)} title={path}>
          <Icon name={isPython ? 'code' : 'book'} size={13} />
          <span>{fileName}</span>
        </button>,
      );
    }
    return items;
  };
  return <div className="file-tree">{renderDir(root, 0)}</div>;
}

export default function App() {
  const [taskId, setTaskId] = useState<TaskId>('palindrome');
  const task = tasks.find(item => item.id === taskId)!;
  const [tab, setTab] = useState('visual');
  const [inputText, setInputText] = useState(task.defaultInput);
  const [appliedInput, setAppliedInput] = useState<number | number[]>(1234321);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState('');
  const [modal, setModal] = useState<'guide' | 'repo' | null>(null);
  const [selectedFile, setSelectedFile] = useState('homework_1/palindrome/solution.py');
  const [copied, setCopied] = useState(false);
  const [showTestCode, setShowTestCode] = useState(false);
  const [runningTests, setRunningTests] = useState(false);
  const [testResults, setTestResults] = useState<(number | boolean)[] | null>(null);
  const testTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const frames = useMemo(() => makeFrames(taskId, appliedInput), [taskId, appliedInput]);
  const frame = frames[Math.min(step, frames.length - 1)];
  const finalStep = frames.length - 1;
  const finished = step === finalStep;

  useEffect(() => {
    if (!playing) return;
    const timer = setInterval(() => setStep(current => {
      if (current >= finalStep - 1) { setPlaying(false); return finalStep; }
      return current + 1;
    }), 1400 / speed);
    return () => clearInterval(timer);
  }, [playing, speed, finalStep]);
  useEffect(() => () => { if (testTimer.current) clearTimeout(testTimer.current); if (copyTimer.current) clearTimeout(copyTimer.current); }, []);
  useEffect(() => {
    if (!modal) return;
    const previousFocus = document.activeElement as HTMLElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    modalRef.current?.focus();
    const handleModalKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setModal(null);
      if (event.key === 'Tab') {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>('button, a, input, [tabindex="0"]');
        if (!focusable?.length) return;
        const first = focusable[0]; const last = focusable[focusable.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === modalRef.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleModalKey);
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', handleModalKey); previousFocus?.focus(); };
  }, [modal]);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (modal || tab !== 'visual' || ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes((event.target as HTMLElement).tagName)) return;
      if (event.code === 'Space') { event.preventDefault(); if (finished) setStep(0); setPlaying(value => !value); }
      if (event.key === 'ArrowRight') { event.preventDefault(); setPlaying(false); setStep(current => Math.min(current + 1, finalStep)); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); setPlaying(false); setStep(current => Math.max(current - 1, 0)); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [finished, finalStep, modal, tab]);

  function selectTask(nextId: TaskId) {
    if (testTimer.current) clearTimeout(testTimer.current);
    const nextTask = tasks.find(item => item.id === nextId)!;
    setPlaying(false); setStep(0); setTaskId(nextId); setInputText(nextTask.defaultInput);
    setAppliedInput(parseInput(nextId, nextTask.defaultInput)); setError(''); setTestResults(null); setRunningTests(false); setShowTestCode(false);
  }
  function applyInput(value = inputText) {
    try { const parsed = parseInput(taskId, value); setAppliedInput(parsed); setInputText(value); setStep(0); setPlaying(false); setError(''); }
    catch (caught) { setError((caught as Error).message); }
  }
  function togglePlayback() { if (finished) setStep(0); setPlaying(value => !value); }
  function downloadRepository() {
    const zipped = zipSync(Object.fromEntries(Object.entries(repositoryFiles).map(([path, content]) => [path, strToU8(content)])));
    const url = URL.createObjectURL(new Blob([new Uint8Array(zipped).buffer], { type: 'application/zip' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'homework_1.zip'; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function copyCode(text: string) {
    try { await navigator.clipboard.writeText(text); setCopied(true); if (copyTimer.current) clearTimeout(copyTimer.current); copyTimer.current = setTimeout(() => setCopied(false), 2000); }
    catch { setCopied(false); }
  }
  function runTests() {
    setRunningTests(true); setTestResults(null);
    testTimer.current = setTimeout(() => { setTestResults(task.cases.map(test => evaluate(task.id, test.input))); setRunningTests(false); }, 650);
  }
  const tabs: { id: string; label: string; icon: IconName }[] = [{ id: 'visual', label: 'Визуализация', icon: 'grid' }, { id: 'solution', label: 'Объяснение', icon: 'book' }, { id: 'code', label: 'Python-код', icon: 'code' }, { id: 'tests', label: 'Тесты', icon: 'test' }];

  return <div className="app-shell">
    <header className="site-header"><div className="header-inner">
      <a className="brand" href="#" aria-label="Алгоритм — главная" onClick={() => { selectTask('palindrome'); setTab('visual'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}><span className="brand-mark"><span /><span /><span /></span><span>алгоритм<span className="brand-dot">.</span></span><span className="brand-divider" /><span className="python-label">python</span></a>
      <nav className="desktop-nav" aria-label="Основная навигация"><a className="active" href="#practice" onClick={() => setTab('visual')}>Визуализация</a><button onClick={() => setModal('guide')}>Как это работает</button><button onClick={() => { setSelectedFile(`homework_1/${taskId}/solution.py`); setModal('repo'); }}>Репозиторий <Icon name="external" size={13} /></button></nav>
      <button className="button button-dark header-download" onClick={downloadRepository}><Icon name="download" size={16} /><span>Скачать решения</span></button>
    </div></header>

    <main className="main-container">
      <section className="hero"><div><div className="eyebrow"><span className="eyebrow-dot" /> АЛГОРИТМЫ НА PYTHON <span className="eyebrow-separator">/</span> ДОМАШНЯЯ РАБОТА 01</div><h1>Визуализация <span>алгоритмов</span></h1><p>Три задачи домашнего задания: палиндром, максимальная сумма, кратная 2, и количество простых чисел меньше N.</p></div><div className="hero-aside"><span className="hero-aside-icon"><Icon name="spark" size={20} /></span><span>Python 3.10+ · unittest<br /><strong>Без внешних зависимостей</strong></span></div></section>

      <section className="task-grid" aria-label="Выберите задачу">{tasks.map(item => <button key={item.id} className={`task-card ${taskId === item.id ? 'selected' : ''}`} onClick={() => selectTask(item.id)} aria-pressed={taskId === item.id}><TaskSymbol id={item.id} /><div className="task-card-content"><span className="task-overline">ЗАДАЧА {item.number}</span><h2>{item.name}</h2><p>{item.subtitle}</p></div><span className="task-card-arrow">{taskId === item.id ? <Icon name="arrow" size={18} /> : <Icon name="chevron" size={17} />}</span>{taskId === item.id && <span className="selected-indicator" />}</button>)}</section>

      <section className="workspace" id="practice"><div className="workspace-heading"><div><div className="workspace-title"><h2>{task.name}</h2><span className="task-number">Задача {task.number}</span></div><p>{task.description}</p></div><span className="python-version"><span /> Python 3.10+</span></div>
        <div className="workspace-tabs" role="tablist" aria-label="Разделы задачи">{tabs.map(item => <button id={`tab-${item.id}`} key={item.id} role="tab" aria-selected={tab === item.id} aria-controls="task-panel" className={tab === item.id ? 'active' : ''} onClick={() => { setTab(item.id); setPlaying(false); }}><Icon name={item.icon} size={16} />{item.label}{item.id === 'tests' && <span className="tab-count">{task.cases.length}</span>}</button>)}<span className="workspace-path">homework_1/{taskId}/</span></div>
        <div id="task-panel" role="tabpanel" aria-labelledby={`tab-${tab}`}>
          {tab === 'visual' && <div className="visual-layout"><aside className="input-panel"><div className="panel-label"><Icon name="terminal" size={16} /> Входные данные</div><form onSubmit={event => { event.preventDefault(); applyInput(); }}><label htmlFor="algorithm-input">{taskId === 'sum' ? 'Массив положительных чисел' : taskId === 'prime' ? 'Верхняя граница N' : 'Целое положительное число'}</label><div className={`input-wrap ${error ? 'has-error' : ''}`}><input id="algorithm-input" value={inputText} onChange={event => { setInputText(event.target.value); setError(''); }} inputMode={taskId === 'sum' ? 'text' : 'numeric'} autoComplete="off" spellCheck={false} aria-invalid={!!error} aria-describedby={error ? 'input-error' : 'input-hint'} /><span>{taskId === 'sum' ? '[ ]' : taskId === 'prime' ? 'N' : 'n'}</span></div>{error ? <p className="input-error" id="input-error" role="alert">{error}</p> : <p className="input-hint" id="input-hint">{taskId === 'sum' ? 'Через пробел · до 14 элементов' : taskId === 'prime' ? 'От 0 до 150 для наглядного разбора' : 'Без строк. Без лишней памяти.'}</p>}<button type="submit" className="button button-dark visualize-button">Визуализировать <Icon name="arrow" size={16} /></button></form>
            <div className="presets"><span>Или попробуйте пример</span><div>{task.presets.map(preset => <button key={preset} className={inputText === preset ? 'active' : ''} onClick={() => applyInput(preset)}>{preset}</button>)}</div></div>
            <div className="input-divider" /><div className="algorithm-note"><span className="note-icon"><Icon name="info" size={16} /></span><div><h3>{taskId === 'palindrome' ? 'Достаточно половины числа' : taskId === 'sum' ? 'Достаточно исключить один элемент' : 'Отсев начинается с квадрата'}</h3><p>{taskId === 'palindrome' ? 'Разворачиваем только вторую половину числа и сравниваем её с первой.' : taskId === 'sum' ? 'Если сумма нечётная, достаточно исключить минимальный нечётный элемент.' : 'Меньшие кратные уже вычеркнуты. Не делаем одну работу дважды.'}</p></div></div><div className="input-bottom"><span className="small-status-dot" /> Вычисляется прямо в браузере</div>
          </aside><div className="visual-content"><div className="visual-topline"><span>Алгоритм в действии</span><span className={`playback-status ${playing ? 'running' : ''} ${finished ? 'done' : ''}`}><i />{playing ? 'Выполняется' : finished ? 'Завершено' : step > 0 ? 'На паузе' : 'Готов к запуску'}</span></div>
            <div className="visual-stage">{taskId === 'palindrome' ? <PalindromeScene input={appliedInput as number} frame={frame} step={step} /> : taskId === 'sum' ? <SumScene input={appliedInput as number[]} frame={frame} /> : <PrimeScene input={appliedInput as number} frame={frame} />}</div>
            <div className={`step-explanation ${finished ? 'complete' : ''}`} aria-live="polite"><span className="step-index">{finished ? <Icon name="check" size={16} /> : String(step).padStart(2, '0')}</span><div><h3>{frame.title}</h3><p><Latex text={frame.description} /></p></div>{finished && <span className={`result-badge ${frame.result === false ? 'false' : ''}`}>{formatResult(frame.result!)}</span>}</div>
            <div className="playback-controls"><div className="playback-buttons"><button className="icon-button" onClick={() => { setStep(0); setPlaying(false); }} title="Начать сначала" aria-label="Начать сначала"><Icon name="reset" size={20} /></button><button className="icon-button step-back" disabled={step === 0} onClick={() => { setStep(value => value - 1); setPlaying(false); }} title="Предыдущий шаг" aria-label="Предыдущий шаг"><Icon name="back" size={20} /></button><button className="button play-button" onClick={togglePlayback}><Icon name={playing ? 'pause' : 'play'} size={17} />{playing ? 'Пауза' : finished ? 'Повторить' : 'Запустить'}</button><button className="icon-button" disabled={finished} onClick={() => { setStep(value => value + 1); setPlaying(false); }} title="Следующий шаг" aria-label="Следующий шаг"><Icon name="next" size={20} /></button></div><div className="timeline"><input type="range" min="0" max={finalStep} value={step} aria-label="Шаг алгоритма" style={{ '--progress': `${step / finalStep * 100}%` } as React.CSSProperties} onChange={event => { setStep(Number(event.target.value)); setPlaying(false); }} /><span>Шаг <b>{step}</b> из {finalStep}</span></div><button className="speed-button" onClick={() => setSpeed(value => value === 2 ? 0.5 : value === 0.5 ? 1 : 2)} title="Изменить скорость воспроизведения">{speed}× <span>⌄</span></button></div><div className="keyboard-hint"><kbd>space</kbd> запуск / пауза <span>·</span> <kbd>←</kbd><kbd>→</kbd> по шагам</div>
          </div></div>}

          {tab === 'solution' && <div className="explanation-panel"><div className="section-intro"><span className="accent-eyebrow">ИДЕЯ РЕШЕНИЯ</span><h3>{task.approach}</h3><p>Разбор решения: шаги алгоритма, трассировка на выбранном примере и граничные случаи.</p></div><div className="explanation-steps">{explanation[taskId].map((item, index) => <article key={item.title}><span>{String(index + 1).padStart(2, '0')}</span><h4>{item.title}</h4><p><Latex text={item.text} /></p></article>)}</div><div className="trace-table-heading"><h3>Трассировка на вашем примере</h3><button className="text-button" onClick={() => setTab('visual')}>Открыть визуализацию <Icon name="arrow" size={15} /></button></div><div className="table-scroll"><table className="trace-table"><thead><tr><th>Шаг</th><th>Операция</th><th>{taskId === 'palindrome' ? 'Оставшаяся часть' : taskId === 'sum' ? 'Текущая сумма' : 'Вычеркнуто'}</th><th>{taskId === 'palindrome' ? 'Развёрнутая половина' : taskId === 'sum' ? 'Минимальное нечётное' : 'Новые составные'}</th></tr></thead><tbody>{frames.map((item, index) => <tr key={index}><td>{String(index).padStart(2, '0')}</td><td>{item.title}</td><td>{taskId === 'palindrome' ? item.remaining : taskId === 'sum' ? item.total : item.crossed?.length}</td><td>{taskId === 'palindrome' ? item.reversed : taskId === 'sum' ? item.smallestOdd ?? '—' : item.newlyCrossed?.join(', ') || '—'}</td></tr>)}</tbody></table></div><div className="boundary-note"><Icon name="info" /><p><Latex text={taskId === 'palindrome' ? 'Границы: 0 считается палиндромом; отрицательные числа и положительные числа с нулём в конце дают False. Нецелый ввод вызывает TypeError.' : taskId === 'sum' ? 'Границы: пустой массив и единственный нечётный элемент дают 0. Неположительные элементы вызывают ValueError, нецелые — TypeError.' : 'Границы: при $N \\le 2$ ответ равен 0. Само число $N$ не учитывается, даже если оно простое. Нецелый ввод вызывает TypeError.'} /></p></div></div>}

          {tab === 'code' && <div className="code-panel"><div className="code-toolbar"><span><Icon name="code" size={17} />homework_1/{taskId}/{showTestCode ? 'test_solution.py' : 'solution.py'}</span><div><button className={`small-button ${showTestCode ? 'active' : ''}`} onClick={() => setShowTestCode(value => !value)}>{showTestCode ? 'К решению' : 'Код тестов'}</button><button className="small-button" onClick={() => copyCode(showTestCode ? task.tests : task.code)}><Icon name={copied ? 'check' : 'copy'} size={14} />{copied ? 'Скопировано' : 'Копировать'}</button></div></div><CodeView code={showTestCode ? task.tests : task.code} /><div className="code-footer"><span><Icon name="check" size={15} /> Стандартная библиотека · без зависимостей</span><button className="text-button" onClick={downloadRepository}>Скачать .zip <Icon name="download" size={15} /></button></div></div>}

          {tab === 'tests' && <div className="tests-panel"><div className="tests-heading"><div><span className="accent-eyebrow">ТЕСТЫ</span><h3>Разные сценарии: от примеров до границ.</h3><p>Типичные входы, граничные значения и нетривиальные случаи.</p></div><button className="button button-dark" disabled={runningTests} onClick={runTests}><Icon name={runningTests ? 'reset' : 'play'} size={16} className={runningTests ? 'spin' : ''} />{runningTests ? 'Проверяем…' : 'Запустить тесты'}</button></div><div className="test-notice"><Icon name="info" size={17} /><span>Здесь выполняется JavaScript-версия алгоритма. Полный набор <b>Python unittest</b>, включая проверки по эталону и неверных типов, — в репозитории.</span><button onClick={() => { setShowTestCode(true); setTab('code'); }}>Посмотреть <Icon name="arrow" size={14} /></button></div>{testResults && <div className="test-result-summary" role="status"><Icon name="check" size={18} />{testResults.filter((result, index) => result === task.cases[index].expected).length} из {task.cases.length} проверок пройдено<span>Вычислено в браузере</span></div>}<div className="table-scroll"><table className="tests-table"><thead><tr><th>Сценарий</th><th>Вход</th><th>Ожидается</th><th>Результат</th><th>Статус</th></tr></thead><tbody>{task.cases.map((test, index) => <tr key={index}><td><span className="test-row-number">{String(index + 1).padStart(2, '0')}</span>{test.label}</td><td><code>{Array.isArray(test.input) ? `[${test.input.join(', ')}]` : test.input}</code></td><td><code>{formatResult(test.expected)}</code></td><td><code>{testResults ? formatResult(testResults[index]) : '—'}</code></td><td>{testResults ? <span className={`test-status ${testResults[index] === test.expected ? 'pass' : 'fail'}`}><Icon name={testResults[index] === test.expected ? 'check' : 'close'} size={13} />{testResults[index] === test.expected ? 'Пройден' : 'Ошибка'}</span> : <span className="test-pending">{runningTests ? 'Проверяем…' : 'Не запущен'}</span>}</td></tr>)}</tbody></table></div><div className="unittest-command"><div><Icon name="terminal" size={17} /><span>Запуск Python-тестов из папки задачи</span></div><code>python -m unittest -v</code><button className="icon-button" aria-label="Скопировать команду запуска тестов" onClick={() => copyCode('python -m unittest -v')}><Icon name={copied ? 'check' : 'copy'} size={16} /></button></div></div>}
        </div>
      </section>

      <section className="insight-grid" aria-label="Характеристики решения"><article className="insight-card"><span className="insight-icon"><Icon name="book" size={20} /></span><div><span className="insight-label">Идея алгоритма</span><h3>{task.approach}</h3><button className="text-button" onClick={() => { setTab('solution'); document.getElementById('practice')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Почему это работает <Icon name="arrow" size={14} /></button></div></article><article className="insight-card"><span className="insight-icon"><Icon name="clock" size={20} /></span><div><span className="insight-label">Временная сложность</span><h3 className="complexity"><Latex text={`$\\mathrm{O}(${task.time.replace(/O\((.+)\)/, '$1').replace(/log/g, '\\log ')})$`} /></h3><p>{taskId === 'palindrome' ? 'Проходим только половину цифр' : taskId === 'sum' ? 'Каждый элемент — ровно один раз' : 'Отсеиваем кратные простых чисел'}</p></div></article><article className="insight-card"><span className="insight-icon"><Icon name="memory" size={20} /></span><div><span className="insight-label">Дополнительная память</span><h3 className="complexity"><Latex text={`$\\mathrm{O}(${task.memory.replace(/O\((.+)\)/, '$1')})$`} /></h3><p>{taskId === 'prime' ? 'Один байт на каждое число' : 'Только несколько переменных'}</p></div></article></section>
      <p className="complexity-footnote"><Icon name="info" size={12} /><Latex text={taskId === 'prime' ? 'Оценки для $N > 2$. При $N \\le 2$ время и память — $\\mathrm{O}(1)$.' : 'Оценки в модели арифметики за $\\mathrm{O}(1)$. Для больших Python int учитывается разрядность; подробнее — в README.'} /></p>
      <footer className="site-footer"><span className="footer-brand">алгоритм<span>.</span></span><span>Алгоритмы на Python <span className="footer-dot">·</span> Домашняя работа 01</span></footer>
    </main>

    {modal && <div className="modal-overlay" onClick={() => setModal(null)}><div className={`modal ${modal === 'repo' ? 'repository-modal' : ''}`} role="dialog" aria-modal="true" aria-labelledby="modal-title" ref={modalRef} tabIndex={-1} onClick={event => event.stopPropagation()}><div className="modal-header"><div><span className="accent-eyebrow">{modal === 'repo' ? 'СОСТАВ РЕПОЗИТОРИЯ' : 'ПОДСКАЗКА'}</span><h2 id="modal-title">{modal === 'repo' ? 'Файлы домашней работы' : 'Как пользоваться'}</h2></div><button className="icon-button" aria-label="Закрыть окно" onClick={() => setModal(null)}><Icon name="close" size={21} /></button></div>{modal === 'guide' ? <div className="guide-content">{[{ icon: 'grid' as IconName, title: 'Выберите задачу', text: 'Палиндром, максимальная сумма, кратная 2, или количество простых чисел меньше N. Для каждой задачи — свой разбор.' }, { icon: 'play' as IconName, title: 'Запустите по шагам', text: 'Введите данные и нажмите «Визуализировать». Управляйте воспроизведением: запуск, пауза, переход по шагам, скорость.' }, { icon: 'code' as IconName, title: 'Сопоставьте с кодом', text: 'Во вкладках — объяснение идеи, трассировка на выбранном примере и исходный код решения с тестами. Ограничения на размер ввода нужны только для наглядности.' }, { icon: 'test' as IconName, title: 'Проверьте локально', text: 'Проверки в браузере — быстрые и наглядные. Полный набор Python unittest запускается в папке задачи командой python -m unittest -v.' }].map((item, index) => <div className="guide-step" key={item.title}><span><Icon name={item.icon} size={21} /></span><div><h3>{index + 1}. {item.title}</h3><p>{item.text}</p></div></div>)}<button className="button button-dark" onClick={() => setModal(null)}>Понятно <Icon name="arrow" size={17} /></button></div> : <><p className="repo-description">Три задачи с решениями, тестами и разбором, плюс исходники этой визуализации. Python 3.10+, без внешних зависимостей.</p><div className="repository-browser"><FileTree files={Object.keys(repositoryFiles)} selectedFile={selectedFile} onSelect={setSelectedFile} /><div className="file-preview"><div className="file-preview-heading"><span>{selectedFile.split('/').pop()}</span><button className="icon-button" aria-label="Скопировать содержимое файла" onClick={() => copyCode(repositoryFiles[selectedFile])}><Icon name={copied ? 'check' : 'copy'} size={15} /></button></div>{selectedFile.endsWith('.py') ? <CodeView code={repositoryFiles[selectedFile]} /> : <pre className="readme-preview">{repositoryFiles[selectedFile]}</pre>}</div></div><div className="repo-footer"><span>{Object.keys(repositoryFiles).length} файлов · для каждой задачи — решение, тесты и разбор</span><button className="button button-dark" onClick={downloadRepository}><Icon name="download" size={16} /> Скачать homework_1.zip</button></div></>}</div></div>}
  </div>;
}
