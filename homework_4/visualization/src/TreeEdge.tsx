import { useEffect, useId, useRef } from 'react';

type Props = {
  curve: {d: string; start: number[]; end: number[]};
  index: number;
  count: number;
  upward: boolean;
  transitionKey: object;
  onArrive: () => void;
  speed: number;
  reducedMotion: boolean;
};

/** A feathered band inside the existing stroke, never a second visible line. */
export default function TreeEdge({curve, index, count, upward, transitionKey, onArrive, speed, reducedMotion}: Props) {
  const id = useId();
  const gradient = useRef<SVGLinearGradientElement>(null);
  const path = useRef<SVGPathElement>(null);
  const active = index >= 0;
  const from = upward ? curve.end : curve.start, to = upward ? curve.start : curve.end;
  useEffect(() => {
    const stops = gradient.current?.querySelectorAll<SVGStopElement>('.edge-wave');
    if (!stops) return;
    const clear = () => {
      stops.forEach(stop => stop.setAttribute('stop-color', '#bdcdb4'));
      path.current?.style.setProperty('stroke-width', '2');
      path.current?.style.setProperty('filter', 'none');
    };
    clear();
    if (!active || reducedMotion) return;
    const duration = 1350 / speed;
    const width = Math.max(1.6, count * .5);
    const start = performance.now();
    let frame = 0;
    let arrived = false;
    const draw = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      // Smooth acceleration and deceleration, with a broad, soft leading edge.
      const eased = progress * progress * (3 - 2 * progress);
      const center = eased * (count + 2 * width) - width - index;
      // Keep the wave readable along the whole route, with soft fades at its ends.
      const fade = Math.min(1, progress / .2, (1 - progress) / .2);
      const envelope = fade * fade * (3 - 2 * fade);
      // Each connection gently widens as the coloured band passes through it.
      const presence = Math.exp(-2 * ((center - .5) / width) ** 2) * envelope;
      path.current?.style.setProperty('stroke-width', String(2 + 2.8 * presence));
      path.current?.style.setProperty('filter', `drop-shadow(0 0 2.5px rgb(191 119 24 / ${.3 * presence}))`);
      stops.forEach((stop, i) => {
        stop.setAttribute('offset', String(Math.max(0, Math.min(1, center + (i - 2) * width / 2))));
        const strength = envelope * [0, .65, 1, .65, 0][i];
        const color = [189, 205, 180].map((base, channel) => Math.round(base + ([191, 119, 24][channel] - base) * strength));
        stop.setAttribute('stop-color', `rgb(${color.join(',')})`);
      });
      // React to the visible leading shoulder, rather than waiting for the peak.
      if (!arrived && index === count - 1 && center + width / 2 >= 1) {
        arrived = true;
        onArrive();
      }
      if (progress < 1) frame = requestAnimationFrame(draw);
      else clear();
    };
    frame = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(frame); clear(); };
  }, [active, index, count, transitionKey, onArrive, speed, reducedMotion]);

  return <>
    <defs>
      <linearGradient ref={gradient} id={id} gradientUnits="userSpaceOnUse" x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]}>
        <stop offset="0" stopColor="#bdcdb4"/>
        {[0, 1, 2, 3, 4].map(i => <stop key={i} offset="0" className="edge-wave" stopColor="#bdcdb4"/>)}
        <stop offset="1" stopColor="#bdcdb4"/>
      </linearGradient>
    </defs>
    <path ref={path} className={`tree-edge ${active ? 'on-route' : ''}`} d={curve.d} style={{stroke: `url(#${id})`}}/>
  </>;
}
