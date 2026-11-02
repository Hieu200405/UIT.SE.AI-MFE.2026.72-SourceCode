import React from 'react';
import type { ColorValue } from 'react-native';
import Svg, { Path } from 'react-native-svg';

// Cùng bộ đường vẽ với web (apps/chat-remote/src/ui/Icons.tsx).
const P: Record<string, string> = {
  home: 'M3 11l9-8 9 8M5 10v10h14V10M10 20v-6h4v6', medical: 'M4 4h16v16H4zM12 8v8M8 12h8', document: 'M7 3h8l4 4v14H7zM15 3v4h4M10 12h6M10 16h6',
  bank: 'M3 9l9-5 9 5M5 9v9M9 9v9M15 9v9M19 9v9M3 20h18', basket: 'M4 9h16l-2 10H6zM9 9l3-5 3 5',
  people: 'M9 11a3 3 0 100-6 3 3 0 000 6zM3 20c0-3 3-5 6-5s6 2 6 5M16 5a3 3 0 010 6M18 20c0-2-1-3.5-3-4.3',
  heart: 'M12 20s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 9c0 6-8 11-8 11z', bowl: 'M3 12h18a9 9 0 01-18 0zM8 8c0-2 2-2 2-4M13 8c0-2 2-2 2-4',
  user: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6', speech: 'M4 5h16v11H9l-4 4v-4H4z',
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 00-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 00-4-10z', check: 'M5 12l5 5 9-10',
  mic: 'M12 3a3 3 0 00-3 3v6a3 3 0 006 0V6a3 3 0 00-3-3zM6 11a6 6 0 0012 0M12 17v4', send: 'M3 12l18-9-7 18-3-8z',
  refresh: 'M20 11a8 8 0 10-2 6M20 4v7h-7', chevron: 'M6 9l6 6 6-6', back: 'M15 6l-6 6 6 6', alert: 'M12 8v5M12 17h.01M12 3a9 9 0 100 18 9 9 0 000-18z',
  chart: 'M4 19V5M4 19h16M8 15l4-5 3 3 5-7', profile: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 21c0-4 4-6 8-6s8 2 8 6',
};
export function Icon({ name, size = 20, color = '#0f766e' }: { name: string; size?: number; color?: ColorValue }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d={P[name] ?? P.speech} />
    </Svg>
  );
}
