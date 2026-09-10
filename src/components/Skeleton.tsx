import type { CSSProperties } from 'react';

export interface SkeletonProps {
  className?: string;
  style?: CSSProperties;
}

/**
 * A single animated placeholder block (see `.skeleton` in global.css for the
 * shimmer). The app-wide prefers-reduced-motion rule in global.css zeroes
 * out every animation/transition duration, so the shimmer is automatically
 * disabled for users who prefer reduced motion — no extra logic needed here.
 */
export function Skeleton({ className, style }: SkeletonProps) {
  const classes = ['skeleton', className].filter(Boolean).join(' ');
  return <div className={classes} style={style} aria-hidden="true" />;
}
