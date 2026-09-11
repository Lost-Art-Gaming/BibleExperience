// Icon paths ported verbatim from the legacy app.js `icons` object.
const ICONS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-5v-6h-5v6h-5A1.5 1.5 0 0 1 3 19.5z',
  journey: 'M4 4.5A2.5 2.5 0 0 1 6.5 2H20v17H6.5A2.5 2.5 0 0 0 4 21.5zm0 0v17',
  map: 'M3 6l6-3 6 3 6-3v15l-6 3-6-3-6 3zm6-3v15m6-12v15',
  timeline: 'M12 3a9 9 0 1 0 9 9 9 9 0 0 0-9-9zm0 4v5l3 2',
  library: 'M16 20v-1.5a4.5 4.5 0 0 0-4.5-4.5h-4A4.5 4.5 0 0 0 3 18.5V20m6.5-9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zm5-6a3 3 0 1 1 0 6m1 3h1a4.5 4.5 0 0 1 4.5 4.5V20',
  search: 'M20 20l-4-4m1-5.5A6.5 6.5 0 1 1 4 10.5a6.5 6.5 0 0 1 13 0z',
  bookmark: 'M6 3h12v18l-6-3-6 3z',
  play: 'M8 5l11 7-11 7z',
  lock: 'M6 10V7a6 6 0 0 1 12 0v3m-13 0h14a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z',
  arrow: 'M5 12h14m-6-6 6 6-6 6',
  back: 'M19 12H5m6-6-6 6 6 6',
  spark: 'M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z',
  moon: 'M20.5 15.5A8.5 8.5 0 0 1 8.5 3.5a8.8 8.8 0 1 0 12 12z',
  sun: 'M12 3v2m0 14v2M5.64 5.64l1.42 1.42m9.9 9.9 1.42 1.42M3 12h2m14 0h2m-3.36-6.36-1.42 1.42m-9.9 9.9-1.42 1.42M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
};

export interface IconProps {
  name: string;
}

export function Icon({ name }: IconProps) {
  const path = ICONS[name] || ICONS.spark;
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
