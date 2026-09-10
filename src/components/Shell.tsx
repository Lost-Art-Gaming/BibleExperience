import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopBar } from './TopBar';
import { Nav } from './Nav';
import { SearchOverlay } from './SearchOverlay';
import { Toast } from './Toast';
import { useTheme } from '../hooks/useTheme';

export function Shell() {
  const { theme, toggle } = useTheme();
  const location = useLocation();

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const heading = document.querySelector<HTMLElement>('#main h1');
      if (!heading) return;
      heading.tabIndex = -1;
      heading.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.pathname]);

  return (
    <div className="app">
      <TopBar theme={theme} onToggleTheme={toggle} />
      <main id="main">
        <Outlet />
      </main>
      <Nav className="bottom-nav" />
      <Toast />
      <SearchOverlay />
    </div>
  );
}
