import { useEffect, type ReactNode } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';
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
 * Per-route scroll management. React Router's built-in <ScrollRestoration>
 * only works with the data-router APIs (we use <HashRouter>), so we do it
 * manually.
 *
 * Saved positions live in a module-level map keyed by `location.key` (unique
 * per history entry). The SAVE side lives in the stable <Shell> (see
 * `useScrollSave`) so it reliably records the user's position regardless of
 * route mount/unmount timing. The APPLY side is here, inside the keyed
 * motion.div, so it runs exactly when the new route's content mounts (after
 * the mode="wait" exit):
 *
 * - A fresh navigation (PUSH/REPLACE) — a tab switch or opening an episode —
 *   scrolls to the top.
 * - Going back/forward (POP) restores the position saved for that entry,
 *   retrying across frames while content that reveals on scroll or loads
 *   async (the reader body) grows the page to its full height.
 */
const scrollPositions = new Map<string, number>();

/** Records the active route's scroll position. Mounted once in <Shell>. */
export function useScrollSave() {
  const location = useLocation();
  useEffect(() => {
    const key = location.key;
    // Save ONLY on real scroll events. Do not seed the position on mount:
    // when returning to an entry (POP), this effect re-runs while the page is
    // mid-transition, and an eager write here would clobber the saved
    // position with the transient scroll value before RouteScroll restores
    // it. A route the user never scrolled simply has no entry (restores 0).
    const onScroll = () => scrollPositions.set(key, window.scrollY);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [location.key]);
}

function RouteScroll() {
  const location = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    const target = navType === 'POP' ? scrollPositions.get(location.key) ?? 0 : 0;
    // `behavior: 'instant'` overrides the page's `scroll-behavior: smooth`
    // (which is kept for user-initiated section jumps): route scroll changes
    // must be an immediate jump, or competing smooth animations fight the
    // retry loop and never land on the target.
    if (target === 0) {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      return;
    }
    let raf = 0;
    const start = performance.now();
    const apply = () => {
      window.scrollTo({ top: target, left: 0, behavior: 'instant' });
      // The reader body loads async, so the page can still be growing; retry
      // until we land on the saved position or the window elapses.
      if (Math.abs(window.scrollY - target) > 2 && performance.now() - start < 600) {
        raf = requestAnimationFrame(apply);
      }
    };
    raf = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(raf);
  }, [location.key, navType]);

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
        <RouteScroll />
        <FocusHeading />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
