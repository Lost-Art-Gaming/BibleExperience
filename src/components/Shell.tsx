import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Nav } from './Nav';
import { PageTransition } from './PageTransition';
import { SearchOverlay } from './SearchOverlay';
import { Toast } from './Toast';
import { useTheme } from '../hooks/useTheme';

export function Shell() {
  const { theme, toggle } = useTheme();
  const location = useLocation();

  // Route-to-route focus is handled inside PageTransition (see
  // FocusHeading there): it must fire only once the new route's content is
  // actually mounted, which — under AnimatePresence's mode="wait" — happens
  // after the previous route's exit animation completes, not the instant
  // the location changes.
  return (
    <div className="app">
      <TopBar theme={theme} onToggleTheme={toggle} />
      <main id="main">
        <PageTransition routeKey={location.pathname}>
          <Outlet />
        </PageTransition>
      </main>
      <Nav className="bottom-nav" />
      <Toast />
      <SearchOverlay />
    </div>
  );
}
