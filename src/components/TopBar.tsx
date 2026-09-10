import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import { Nav } from './Nav';
import { openSearch } from '../lib/search';
import type { UseThemeResult } from '../hooks/useTheme';

export interface TopBarProps {
  theme: UseThemeResult['theme'];
  onToggleTheme: () => void;
}

export function TopBar({ theme, onToggleTheme }: TopBarProps) {
  const themeLabel = theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme';

  return (
    <header className="topbar">
      <Link className="brand" to="/" aria-label="The Bible Experience home">
        <img src={`${import.meta.env.BASE_URL}assets/logo.svg`} alt="" />
        <span>
          <strong>THE BIBLE EXPERIENCE</strong>
          <small>See. Understand. Believe.</small>
        </span>
      </Link>
      <Nav className="desktop-nav" />
      <div className="top-actions">
        <button className="round-btn" id="themeBtn" aria-label={themeLabel} onClick={onToggleTheme}>
          <Icon name={theme === 'light' ? 'moon' : 'sun'} />
        </button>
        <button className="round-btn" id="searchBtn" aria-label="Search" onClick={openSearch}>
          <Icon name="search" />
        </button>
      </div>
    </header>
  );
}
