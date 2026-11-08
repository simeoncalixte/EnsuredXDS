import { darkTheme, xdsThemes, type XdsThemeName, palette, brand, neutral, dataViz } from './palette.js';
export { palette } from './palette.js';
// Design color palette tokens for EnsuredUI. Semantic aliases resolve through
// XDS theme variables; raw brand, neutral, data-viz, and vendor palettes stay
// fixed so they can also be used by canvas/map renderers that do not resolve CSS.
const themed = (name: string): string => {
  const key = name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase()) as keyof typeof darkTheme.colors;
  return `var(--xds-${name}, ${darkTheme.colors[key]})`;
};

export const colors = {
  palette,
  // Brand
  brand,

  // UI neutrals
  neutral,

  // Semantic
  success: themed('success'),
  info: themed('info'),
  warning: themed('warning'),
  danger: themed('danger'),

  // Surfaces
  background: themed('background'),
  surface: themed('surface'),

  // Semantic aliases
  primary: themed('primary'),
  primaryHover: themed('primary-hover'),
  primaryContainer: themed('primary-container'),
  onPrimaryContainer: themed('on-primary-container'),
  // Dark-navy text/icon shown on a solid `primary` fill (e.g. primary buttons).
  onPrimary: themed('on-primary'),

  secondary: themed('secondary'),
  secondaryContainer: themed('secondary-container'),
  onSecondaryContainer: themed('on-secondary-container'),

  error: themed('error'),
  errorContainer: themed('error-container'),
  onErrorContainer: themed('on-error-container'),

  // Surface containers
  surfaceContainerLow: themed('surface-container-low'),
  surfaceContainer: themed('surface-container'),
  surfaceContainerHigh: themed('surface-container-high'),
  surfaceContainerHighest: themed('surface-container-highest'),

  outlineVariant: themed('outline-variant'),
  onSurface: themed('on-surface'),
  onSurfaceVariant: themed('on-surface-variant'),
  tertiaryContainer: themed('tertiary-container'),

  // Pure black/white anchors (for alpha overlays, scrims, shadows)
  black: '#000000',
  white: '#ffffff',

  // --- Extended brand / accent (promoted from recurring app usage) ---
  // Lighter primary used for text/icon accents on dark surfaces.
  primarySoft: themed('primary-soft'),
  // Teal-green accent ramp, distinct from `secondary`/`success`.
  accent: themed('accent'),
  accentStrong: themed('accent-strong'),
  // Brighter danger used on dark dashboard surfaces (distinct from `danger`/`error`).
  dangerBright: themed('danger-bright'),
  dangerDeep: themed('danger-deep'),
  // Soft salmon error text shown on dark error containers.
  errorSoft: themed('error-soft'),

  // --- Extended on-surface text ramp (dark theme) ---
  onSurfaceStrong: themed('on-surface-strong'), // brightest body text
  onSurfaceMuted: themed('on-surface-muted'), // muted body text

  // --- Surface ramp (dark dashboard blues, darkest -> lightest) ---
  scrim: themed('scrim'), // overlay/scrim base
  surfaceDeep: themed('surface-deep'),
  surfaceLow: themed('surface-low'),
  surfacePanel: themed('surface-panel'),
  surfaceRaised: themed('surface-raised'),
  surfaceHigh: themed('surface-high'),
  surfaceElevated: themed('surface-elevated'),

  // --- Outlines / borders ---
  outline: themed('outline'),
  border: themed('border'),

  // --- Categorical data-visualization palette (chart series) ---
  dataViz,

  // --- Third-party vendor / provider brand identity colors ---
  // These are external brand colors (e.g. "Sign in with Google" affordances)
  // and are intentionally NOT semantic theme tokens; centralized here so they
  // are still sourced from the design system rather than scattered as literals.
  vendor: {
    googleBlue: '#4285f4',
    googleRedDeep: '#c5221f',
    outlookBlue: '#168bd0',
    outlookLight: '#55b7ed',
    outlookDeep: '#0867b5',
    googleGreen: '#34a853',
    googleYellow: '#fbbc05',
    googleRed: '#ea4335',
    microsoftBlue: '#00a4ef',
    microsoftAzure: '#0078d4',
    microsoftGreen: '#7fba00',
    microsoftRed: '#f25022',
    facebookBlue: '#1877f2',
    awsOrange: '#ff9900',
    awsOrangeDeep: '#e05a00',
  },

  // Text
  text: {
    primary: themed('text-primary'),
    secondary: themed('text-secondary'),
    inverse: themed('text-inverse'),
    accent: themed('text-accent'),
  },
  ui: {
    navItemBg: 'var(--nav-item-bg)',
  },
} as const;

export type Colors = typeof colors;

/**
 * Compose an rgba() string from a design-system hex token plus an alpha.
 * Use this instead of hand-writing rgba() literals so every color still
 * originates from the palette. Accepts 3- or 6-digit hex (with or without `#`).
 *
 * @example withAlpha(colors.primary, 0.12) // 'rgba(75, 142, 255, 0.12)'
 */
export const withAlpha = (color: string, alpha: number): string => {
  const normalizedAlpha = Math.min(1, Math.max(0, alpha));

  // Theme tokens are CSS variables. color-mix preserves their runtime nature,
  // allowing one styled-component definition to respond to theme changes.
  if (!color.startsWith('#')) {
    return `color-mix(in srgb, ${color} ${normalizedAlpha * 100}%, transparent)`;
  }

  const normalized = color.replace('#', '');
  const full =
    normalized.length === 3
      ? normalized
          .split('')
          .map((c) => c + c)
          .join('')
      : normalized;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${normalizedAlpha})`;
};

export default colors;

/** Stable renderer color for categories; business services do not own UI colors. */
export function categoryColor(key: string, theme: XdsThemeName = 'dark'): string {
  const c = xdsThemes[theme].colors;
  const series = [c.primary, c.success, c.secondary, c.info, c.danger, c.primarySoft];
  let hash = 0;
  for (const character of key) hash = ((hash * 31) + character.charCodeAt(0)) >>> 0;
  return series[hash % series.length];
}
