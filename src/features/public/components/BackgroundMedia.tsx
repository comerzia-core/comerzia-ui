import { useEffect, useRef, useState } from 'react';
import { Pause, Play } from 'lucide-react';
import { PublicAction } from '../../../components/ui/PublicAction';

export function BackgroundMedia({ light = false }: { light?: boolean }) {
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [motion, setMotion] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [paused, setPaused] = useState(false);
  const [visible, setVisible] = useState(() => !light || matchMedia('(min-width: 761px)').matches);
  useEffect(() => {
    const query = matchMedia('(prefers-reduced-motion: reduce)');
    const wide = matchMedia('(min-width: 761px)');
    const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
    const update = () => { const show = !light || wide.matches; setVisible(show); setMotion(show && !query.matches && !connection?.saveData); };
    update(); query.addEventListener('change', update); wide.addEventListener('change', update);
    return () => { query.removeEventListener('change', update); wide.removeEventListener('change', update); };
  }, [light]);
  useEffect(() => {
    const element = video.current;
    if (!element || !motion || failed) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !document.hidden && !paused) void element.play().catch(() => setFailed(true)); else element.pause();
    });
    const update = () => { if (document.hidden || paused) element.pause(); else if (element.getBoundingClientRect().bottom > 0 && element.getBoundingClientRect().top < innerHeight) void element.play().catch(() => setFailed(true)); };
    observer.observe(element); document.addEventListener('visibilitychange', update);
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', update); element.pause(); };
  }, [motion, failed, paused, visible]);
  if (!visible) return null;
  return <><div className={`public-media ${light ? 'public-media--light' : ''}`} aria-hidden="true">
    <img src="/media/landing/merchants-poster.webp" alt="" fetchPriority="high" />
    {motion && !failed && <video ref={video} muted loop playsInline autoPlay={!paused} preload="none" poster="/media/landing/merchants-poster.webp" onCanPlay={() => setLoaded(true)} onError={() => setFailed(true)}>
      <source src="/media/landing/merchants-loop.mp4" type="video/mp4" />
    </video>}
    <div className="public-media-shade" />
  </div>{motion && loaded && !failed && <PublicAction className="public-video-control" type="button" onClick={() => setPaused(current => !current)} aria-label={paused ? 'Reproducir fondo' : 'Pausar fondo'}>
    {paused ? <Play size={14} /> : <Pause size={14} />}
  </PublicAction>}</>;
}
