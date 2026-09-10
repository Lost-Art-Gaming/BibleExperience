import { useEffect, useState } from 'react';

export interface ProgressBarProps {
  value: number;
  className?: string;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true;
}

/**
 * A track + fill bar whose fill animates from 0 to `value` percent on
 * mount. Reduced motion jumps straight to the final width with no
 * transition, ahead of the global reduced-motion rule in global.css.
 */
export function ProgressBar({ value, className }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const reduced = prefersReducedMotion();
  const [width, setWidth] = useState(reduced ? clamped : 0);

  useEffect(() => {
    if (reduced) {
      setWidth(clamped);
      return;
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setWidth(clamped));
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [clamped, reduced]);

  const classes = ['progress-track', className].filter(Boolean).join(' ');

  return (
    <div className={classes}>
      <i style={{ width: `${width}%`, transition: reduced ? 'none' : undefined }} />
    </div>
  );
}
