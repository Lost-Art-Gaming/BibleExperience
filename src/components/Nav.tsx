import { NavLink } from 'react-router-dom';
import { Icon } from './Icon';

const NAV_ITEMS: Array<{ id: string; to: string; label: string; icon: string }> = [
  { id: 'home', to: '/', label: 'Home', icon: 'home' },
  { id: 'journey', to: '/journey', label: 'Journey', icon: 'journey' },
  { id: 'explore', to: '/explore', label: 'Explore', icon: 'map' },
  { id: 'timeline', to: '/timeline', label: 'Timeline', icon: 'timeline' },
  { id: 'library', to: '/library', label: 'Library', icon: 'library' },
];

export interface NavProps {
  className?: string;
}

export function Nav({ className }: NavProps) {
  return (
    <nav className={className} aria-label="Primary navigation">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.id}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
          aria-label={item.label}
        >
          <Icon name={item.icon} />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
