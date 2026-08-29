export const ink = {
  50: '#f6f4ef',
  100: '#e8e2d4',
  200: '#c9bfa8',
  300: '#a99e84',
  400: '#7d7460',
  500: '#5a5240',
  600: '#3d3729',
  700: '#2a2519',
  800: '#1c1812',
  900: '#0f0c08',
  950: '#070503',
} as const;

export const bone = {
  50: '#fbf8f1',
  100: '#f3ecdf',
  200: '#e7dcc4',
  300: '#d4c5a1',
  400: '#b9a577',
  500: '#9a8657',
  600: '#7a6941',
  700: '#5e4f30',
  800: '#3e3320',
  900: '#241d12',
} as const;

export const gold = {
  50: '#fbf6e7',
  100: '#f6e9c2',
  200: '#ecd489',
  300: '#e0bb53',
  400: '#d4a830',
  500: '#b88a1f',
  600: '#946a18',
  700: '#704d12',
  800: '#4a340e',
  900: '#2a1d08',
} as const;

export const amber = {
  50: '#fef5e7',
  100: '#fde4b8',
  200: '#fbcc7e',
  300: '#f7b04a',
  400: '#ed8c20',
  500: '#c46d15',
  600: '#94510f',
  700: '#68380a',
  800: '#3e2006',
  900: '#1f1003',
} as const;

export const crimson = {
  50: '#fdecec',
  100: '#facfcf',
  200: '#f3a3a3',
  300: '#e87070',
  400: '#d54545',
  500: '#b33030',
  600: '#8a2424',
  700: '#641919',
  800: '#401010',
  900: '#1f0707',
} as const;

export const palette = {
  ink,
  bone,
  gold,
  amber,
  crimson,
} as const;

export const fonts = {
  display: '"Cormorant Garamond", "Playfair Display", Georgia, serif',
  body: '"Inter", system-ui, -apple-system, "Segoe UI", sans-serif',
  mono: '"JetBrains Mono", ui-monospace, "SF Mono", monospace',
} as const;

export const radii = {
  none: '0',
  sm: '4px',
  md: '6px',
  lg: '10px',
  xl: '14px',
  full: '9999px',
} as const;

export const shadows = {
  cardWarm: '0 1px 0 rgba(212,175,55,0.04), 0 1px 2px rgba(0,0,0,0.4), 0 8px 24px rgba(0,0,0,0.35)',
  glowGold: '0 0 0 1px rgba(212,175,55,0.18), 0 6px 20px rgba(184,138,31,0.12)',
  ring: '0 0 0 1px rgba(212,175,55,0.25)',
} as const;

export type Palette = typeof palette;
export type Ink = typeof ink;
export type Bone = typeof bone;
export type Gold = typeof gold;
export type Amber = typeof amber;
export type Crimson = typeof crimson;
