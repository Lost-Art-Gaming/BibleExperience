import { useEffect, type ReactNode } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';

export interface PageTransitionProps {
  /** Unique key for the current route (e.g. `location.pathname`). A new
   * key causes the previous route to exit and the new one to enter. */
  routeKey: string;
  children: ReactNode;
}

const variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -14 },
};

// When the viewer prefers reduced motion, every state resolves to the same
// fully-visible, unmoved frame, so there is nothing to animate — the route
// swap is instant.
const instant = {
  initial: { opacity: 1, y: 0 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 1, y: 0 },
};

/**
 * Focuses `#main h1` once this route's content is actually mounted in the
 * DOM. This lives *inside* the keyed motion.div (rather than as a
 * `location.pathname`-keyed effect in Shell) so it fires exactly when the
 * new route's markup lands — with `AnimatePresence mode="wait"`, that is
 * only after the previous route has fully unmounted. An effect keyed off
 * the location instead would fire the instant the URL changes, which races
 * the exit animation and can focus a stale (still-exiting) or not-yet-
 * existent heading.
 */
function FocusHeading() {
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('#main h1');
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, []);
  return null;
}

/**
 * Wraps routed content in a fade/rise transition keyed on the current
 * route. `mode="wait"` guarantees the outgoing route is fully unmounted
 * before the incoming one mounts, so there is never a moment with two
 * `#main h1` elements in the DOM (which would make the focus contract
 * ambiguous) and the focus effect above always lands on the right heading.
 */
export function PageTransition({ routeKey, children }: PageTransitionProps) {
  const reduced = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={routeKey}
        variants={reduced ? instant : variants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={reduced ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      >
        <FocusHeading />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
