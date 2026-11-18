import {useEffect, useMemo, useRef, useState, type CSSProperties} from 'react';
import {createRoot} from 'react-dom/client';
import {
  ArrowDownWideNarrow, BookOpen, Check, ChevronDown, ChevronLeft, ChevronRight,
  GitMerge, Maximize2, Minimize2, Pause, Play, RotateCcw, SkipBack,
  SkipForward, SlidersHorizontal,
} from 'lucide-react';
import Stage, {expandFrames, type StageFrame} from './Stage';
import Reading from './Reading';
import {examples, names, phaseNames, tasks, type Algorithm, type Task} from './content';
import './app.css';

type Trace = {frames: StageFrame[]; result: number[] | number};
type Config = {task: Task; algorithm: Algorithm; values: number[]; k: number; preset: string};

function preset(task: Task, algorithm: Algorithm, index = 0): Config {
  const {values, k} = examples[task][index];
  return {task, algorithm, values, k, preset: String(index)};
}

const initial = preset('compare', 'merge');

function describePhase(frame: StageFrame, i: number) {
  const name = phaseNames[frame.kind] ?? frame.kind;
  if (frame.kind === 'pass') return `${i + 1} · ${name} · ширина ${frame.width}`;
  if (['partition', 'pivot', 'keep', 'split', 'merge'].includes(frame.kind)) {
    return `${i + 1} · ${name} [${frame.lo}…${frame.hi - 1}]`;
  }
  return `${i + 1} · ${name}`;
}

function Timerange({step, frames, rawFrames, speed, playing, onPlay, onSpeed, onSeek}: {
  step: number; frames: StageFrame[]; rawFrames: StageFrame[];
  speed: number; playing: boolean; onPlay: () => void;
  onSpeed: (value: number) => void; onSeek: (index: number) => void;
}) {
  const end = Math.max(0, frames.length - 1);
  const phase = frames[step]?.sourceStep ?? 0;
  const progress = end ? (step / end) * 100 : 0;

  return <div className="playback">
    <div className="transport">
      <button className="play-key" aria-label={playing ? 'Пауза' : step === end ? 'Повторить' : 'Запустить'}
        title={playing ? 'Пауза' : step === end ? 'Повторить' : 'Запустить'}
        onClick={onPlay} disabled={!end}>
        {playing ? <Pause size={16} fill="currentColor"/> : step === end ? <RotateCcw size={17}/> : <Play size={15} fill="currentColor"/>}
      </button>
      <div className="seek-keys">
        {([[SkipBack, 'В начало', 0], [ChevronLeft, 'Назад', step - 1],
          [ChevronRight, 'Вперёд', step + 1], [SkipForward, 'В конец', end]] as const).map(([Glyph, title, target]) =>
          <button key={title} aria-label={title} title={title} disabled={target === step || target < 0 || target > end}
            onClick={() => onSeek(target)}><Glyph size={16}/></button>)}
      </div>
    </div>
    <label className="timeline">
      <span>Шаг <b>{frames.length ? step + 1 : 0}</b><span className="slash">/</span>{frames.length}</span>
      <input aria-label="Шаг" type="range" min={0} max={end} value={step} disabled={!end}
        style={{background: `linear-gradient(90deg, #447561 ${progress}%, #d4dcd0 ${progress}%)`}}
        onChange={e => onSeek(Number(e.target.value))}/>
    </label>
    <div className="player-selects">
      <label className="phase-select"><span>Этап</span><select aria-label="Этап" value={phase}
        disabled={rawFrames.length < 2} onChange={e => {
          const target = frames.findIndex(frame => frame.sourceStep === Number(e.target.value));
          if (target >= 0) onSeek(target);
        }}>{rawFrames.map((frame,i) => <option key={i} value={i}>{describePhase(frame, i)}</option>)}</select></label>
      <select className="speed" aria-label="Скорость" title="Скорость" value={speed}
        onChange={e => onSpeed(Number(e.target.value))}>{[0.5, 1, 1.5, 2].map(s =>
          <option key={s} value={s}>{String(s).replace('.', ',')}×</option>)}</select>
    </div>
  </div>;
}

function App(){
  const [config, setConfig] = useState(initial);
  const [draft, setDraft] = useState(initial.values.join(', '));
  const [rank, setRank] = useState(String(initial.k));
  const [trace, setTrace] = useState<Trace | null>(null);
  const [inputError, setInputError] = useState('');
  const [networkError, setNetworkError] = useState('');
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [focus, setFocus] = useState(false);
  const [reading, setReading] = useState(false);
  const editor = useRef<HTMLDetailsElement>(null);
  const {task, algorithm} = config;
  const frames = useMemo(() => trace ? expandFrames(trace.frames) : [], [trace]);
  const end = Math.max(0, frames.length - 1);

  function load(next: Config) {
    setPlaying(false);
    setStep(0);
    setTrace(null);
    setConfig(next);
    setNetworkError('');
    setInputError('');
    setDraft(next.values.join(', '));
    setRank(String(next.k));
    if (editor.current) editor.current.open = false;
  }

  useEffect(() => {
    const controller = new AbortController();
    async function fetchTrace() {
      try {
        const response = await fetch('/api/trace', {method:'POST', signal:controller.signal,
          headers:{'Content-Type':'application/json'}, body:JSON.stringify(config)});
        const data = await response.json();
        if (!response.ok) throw new Error(data.error);
        if (!controller.signal.aborted) setTrace(data);
      } catch (e) {
        if (!controller.signal.aborted) setNetworkError(e instanceof Error ? e.message : 'Ошибка загрузки.');
      }
    }
    void fetchTrace();
    return () => controller.abort();
  }, [config]);

  useEffect(() => {
    if (!playing || step >= end) return;
    const current = frames[step];
    const previous = frames[step - 1];
    const duration = current?.sourceStep === previous?.sourceStep ? 680 : 1050;
    const timer = window.setTimeout(() => {
      setStep(step + 1);
      if (step + 1 >= end) setPlaying(false);
    }, duration / speed);
    return () => window.clearTimeout(timer);
  }, [playing, step, end, speed, frames]);

  useEffect(() => {
    function escape(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      setFocus(false);
      if (editor.current?.open) {
        editor.current.open = false;
        editor.current.querySelector('summary')?.focus();
      }
    }
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, []);

  function apply() {
    try {
      const raw = draft.trim().replaceAll('−', '-');
      const values: unknown = raw.startsWith('[') ? JSON.parse(raw) : raw === '' ? [] :
        raw.split(',').map(part => part.trim() ? Number(part) : NaN);
      if (!Array.isArray(values) || values.length > 16 ||
        !values.every(v => Number.isInteger(v) && Math.abs(v) <= 999)) {
        throw Error('Введите до 16 целых чисел от −999 до 999.');
      }
      const k = Number(rank);
      if (task === 'kth' && (!Number.isInteger(k) || k < 1 || k > values.length)) {
        throw Error('k должно быть от 1 до длины массива.');
      }
      load({...config, values, k, preset:'custom'});
    } catch(e) {
      setInputError(e instanceof SyntaxError ? 'Проверьте скобки и запятые в массиве.' : (e as Error).message);
    }
  }

  function seek(next: number) {
    setPlaying(false);
    setStep(next);
  }

  function toggleFocus() {
    setFocus(!focus);
    if (editor.current) editor.current.open = false;
    window.scrollTo(0, 0);
  }

  return <div className={focus ? 'atlas is-focused' : 'atlas'} style={{'--playback-speed': speed} as CSSProperties}>
    <header className="mast"><div className="mast-inner">
      <div className="identity"><span className="identity-sign" aria-hidden="true"><i/><i/><i/></span>
        <span>Алгоритмы <em>на Python</em></span></div>
      <nav className="tasks" aria-label="Задачи">{(Object.keys(tasks) as Task[]).map(t =>
        <button key={t} aria-pressed={task === t} onClick={() => {
          if (task === t) return;
          setReading(false);
          load(preset(t, t === 'kth' ? 'select' : 'merge'));
        }}>{tasks[t].name}</button>)}</nav>
      <span className="mast-note">ДЗ <b>06</b></span>
    </div></header>
    <main className="shell">
      <div className="heading-row">
        <h1>{tasks[task].title}</h1>
        <dl className="method-costs" aria-label="Сложность алгоритма">
          <div><dt>{algorithm === 'merge' ? 'Время' : 'Время в среднем'}</dt><dd>{algorithm === 'select' ? 'O(n)' : 'O(n log n)'}</dd></div>
          <div><dt>Память с копией</dt><dd>O(n)</dd></div>
        </dl>
      </div>
      <section className="workbench" aria-label="Демонстрация">
        <div className="config-bar">
          <div className="methods" aria-label="Метод">{task === 'kth' ?
            <span className="fixed-method"><ArrowDownWideNarrow size={17}/>Quickselect</span> :
            (['merge','quick'] as const).map(a => <button key={a} aria-pressed={a === algorithm}
              onClick={() => {if (a !== algorithm) load({...config, algorithm:a});}}>
              {a === 'merge' ? <GitMerge size={15}/> : <ArrowDownWideNarrow size={15}/>} {names[a]}
            </button>)}</div>
          <div className="source-settings">
            <label className="source-select"><span>Пример</span>
              <select aria-label="Пример" value={config.preset} onChange={e => load(preset(task, algorithm, Number(e.target.value)))}>
                {examples[task].map((ex,i) => <option value={i} key={ex.name}>{ex.name}</option>)}
                {config.preset === 'custom' && <option value="custom">Свой массив</option>}
              </select>
            </label>
            <details className="editor" ref={editor} onToggle={e => {if(e.currentTarget.open)setPlaying(false);}}>
              <summary aria-label="Свои данные" title="Свои данные"><SlidersHorizontal size={16}/><span>Свои данные</span></summary>
              <form onSubmit={e => {e.preventDefault();apply();}}>
                <label>Массив · до 16 целых чисел<input aria-label="Массив" value={draft} onChange={e => setDraft(e.target.value)} placeholder="8, 3, −2, 5"/></label>
                {task === 'kth' && <label>k от наибольшего<input aria-label="k" type="number" value={rank} onChange={e => setRank(e.target.value)}/></label>}
                {inputError && <p className="input-error" role="alert">{inputError}</p>}
                <button type="submit" className="apply">Применить</button>
              </form>
            </details>
          </div>
          <button className="focus-control" aria-label={focus ? 'Свернуть' : 'Развернуть'} title={focus ? 'Свернуть' : 'Развернуть'}
            aria-pressed={focus} onClick={toggleFocus}>{focus ? <Minimize2 size={16}/> : <Maximize2 size={16}/>}</button>
        </div>
        <div className="source-line"><span>На входе</span><code>[{config.values.join(', ')}]</code>
          {task === 'kth' && <strong>k = {config.k}</strong>}</div>
        <Timerange step={step} frames={frames} rawFrames={trace?.frames ?? []}
          playing={playing} speed={speed} onSpeed={setSpeed} onSeek={seek} onPlay={() => {
            if (step === end) setStep(0);
            setPlaying(!playing);
          }}/>
        {networkError ? <div className="load-message" role="alert">{networkError}<button onClick={() => load({...config})}>Повторить запрос</button></div>
          : trace ? <Stage frames={frames} step={step} algorithm={algorithm} mode={task === 'compare' ? 'recursive' : 'iterative'}/>
          : <div className="load-message" role="status">Загружаем шаги…</div>}
        {trace && step === end && <div className="answer"><Check size={17}/><span>{task === 'kth' ? 'k-й наибольший элемент' : 'Отсортированный массив'}</span>
          <strong>{Array.isArray(trace.result) ? '[' + trace.result.join(', ') + ']' : trace.result}</strong></div>}
      </section>
      <div className="reading-more">
        <button className="reading-toggle" aria-expanded={reading} aria-controls="reading-content"
          onClick={() => {setReading(!reading);setPlaying(false);}}>
          <BookOpen size={18}/><span>Разбор и код</span><ChevronDown size={17}/>
        </button>
        <div id="reading-content" hidden={!reading}>{reading && <Reading task={task} algorithm={algorithm}/>}</div>
      </div>
    </main>
  </div>;
}
createRoot(document.getElementById('root')!).render(<App/>);
