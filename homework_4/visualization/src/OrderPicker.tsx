import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import type { Order } from './algorithms';

const kinds = ['preorder', 'inorder', 'postorder'] as const;
const names = ['Preorder', 'Inorder', 'Postorder'];
const descriptions = ['Узел до детей', 'Узел между детьми', 'Узел после детей'];
const patterns = {preorder: ['N', 'L', 'R'], inorder: ['L', 'N', 'R'], postorder: ['L', 'R', 'N']};
const labels: Record<string, string> = {N: 'Узел', L: 'Лево', R: 'Право'};

export default function OrderPicker({value, onChange}: {value: Order; onChange: (order: Order) => void}) {
  const reverse = value.startsWith('reverse_');
  const kind = value.replace('reverse_', '') as typeof kinds[number];
  const select = (next: typeof kind, mirrored = reverse) => onChange(`${mirrored ? 'reverse_' : ''}${next}` as Order);
  return <section className="order-picker" aria-label="Настройки обхода">
    <div className="order-heading"><span>Порядок обхода</span><div className="direction-switch" role="group" aria-label="Направление обхода">
      <button aria-pressed={!reverse} onClick={() => select(kind, false)}><ArrowRight size={14}/>Сначала левое</button>
      <button aria-pressed={reverse} onClick={() => select(kind, true)}><ArrowLeft size={14}/>Сначала правое</button>
    </div></div>
    <div className="order-cards" role="radiogroup" aria-label="Порядок обхода">
      {kinds.map((item, index) => {
        const sequence = patterns[item].map(letter => reverse ? letter === 'L' ? 'R' : letter === 'R' ? 'L' : letter : letter);
        const selected = item === kind;
        return <button key={item} role="radio" aria-checked={selected} aria-label={`${reverse ? 'Reverse ' : ''}${names[index]}`} tabIndex={selected ? 0 : -1} className={`order-card ${selected ? 'selected' : ''}`} onClick={() => select(item)} onKeyDown={event => {
          const offset = ['ArrowRight', 'ArrowDown'].includes(event.key) ? 1 : ['ArrowLeft', 'ArrowUp'].includes(event.key) ? -1 : 0;
          if (!offset && event.key !== 'Home' && event.key !== 'End') return;
          event.preventDefault();
          const next = event.key === 'Home' ? 0 : event.key === 'End' ? 2 : (index + offset + 3) % 3;
          select(kinds[next]);
          (event.currentTarget.parentElement!.children[next] as HTMLButtonElement).focus();
        }}>
          <svg className="order-mini" viewBox="0 0 84 68" aria-hidden="true">
            <path d="M42 17 L18 50 M42 17 L66 50"/>
            {([['N', 42, 17], ['L', 18, 50], ['R', 66, 50]] as const).map(([letter, x, y]) => <g key={letter} className={letter === 'N' ? 'mini-root' : ''}>
              <circle cx={x} cy={y} r={12}/><text x={x} y={y} textAnchor="middle" dominantBaseline="central">{sequence.indexOf(letter) + 1}</text>
            </g>)}
          </svg>
          <span className="order-card-copy"><strong>{reverse && <small>Reverse </small>}{names[index]}</strong><span>{descriptions[index]}</span><span className="order-flow">{sequence.map((letter, i) => <span key={letter}><b className={letter === 'N' ? 'root-token' : ''}>{labels[letter]}</b>{i < 2 && <ArrowRight size={11}/>}</span>)}</span></span>
          <span className="order-check" aria-hidden="true">{selected && <Check size={12}/>}</span>
        </button>;
      })}
    </div>
  </section>;
}
