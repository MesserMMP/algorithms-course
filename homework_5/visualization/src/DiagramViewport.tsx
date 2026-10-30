import {useEffect, useRef, useState, type ReactNode} from 'react';

type Bounds = {x?:number; y?:number; width:number; height:number};

/** Fit the complete diagram by default; magnification is an explicit choice. */
export default function DiagramViewport({bounds, label, children}: {
  bounds:Bounds; label:string; children:ReactNode;
}) {
  const surface = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState(600);
  const [zoom, setZoom] = useState<number | 'fit'>('fit');
  useEffect(() => {
    const el = surface.current!;
    const observer = new ResizeObserver(() => setAvailable(el.clientWidth));
    setAvailable(el.clientWidth);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const fit = Math.min(1, Math.max(1, available - 24) / bounds.width, 620 / bounds.height);
  const scale = zoom === 'fit' ? fit : zoom;
  const fitAll = () => {setZoom('fit'); surface.current?.scrollTo(0, 0)};
  useEffect(() => {if(zoom === 'fit') surface.current?.scrollTo(0, 0)}, [bounds.width, bounds.height, available, zoom]);
  return <div className="diagram-view">
    <div className="diagram-tools" role="group" aria-label={`Масштаб: ${label}`}>
      <button aria-pressed={zoom === 'fit'} onClick={fitAll}>Вписать всё</button>
      <button aria-label={`Уменьшить: ${label}`} onClick={() => setZoom(Math.max(.02, scale / 1.25))}>−</button>
      <output aria-label={`Масштаб в процентах: ${label}`}>{Math.round(scale * 100)}%</output>
      <button aria-label={`Увеличить: ${label}`} onClick={() => setZoom(Math.min(2, scale * 1.25))}>+</button>
      <button onClick={() => setZoom(1)}>100%</button>
      <small>{zoom === 'fit' ? 'Вся схема в области просмотра' : 'Перемещайте схему прокруткой'}</small>
    </div>
    <div ref={surface} className={`diagram-surface ${zoom === 'fit' ? 'diagram-fit' : ''}`}>
      <svg width={bounds.width * scale} height={bounds.height * scale}
        viewBox={`${bounds.x ?? 0} ${bounds.y ?? 0} ${bounds.width} ${bounds.height}`}
        aria-label={label}>{children}</svg>
    </div>
  </div>;
}
