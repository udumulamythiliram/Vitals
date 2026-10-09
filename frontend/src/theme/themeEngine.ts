// Vitalis AI Theme Engine and WCAG 2.2 AA Contrast Guard
export interface ThemePreset {
  id: string;
  name: string;
  isDark: boolean;
  bg: string;
  surface: string;
  surface2: string;
  text: string;
  textMuted: string;
  primary: string;
  primaryContrast: string;
  primaryHover: string;
  secondary: string;
  accent: string;
  border: string;
  ring: string;
  success: string;
  successBg: string;
  warning: string;
  warningBg: string;
  danger: string;
  dangerBg: string;
}

export interface CustomThemeSettings {
  presetId: string;
  primaryColor?: string;
  secondaryColor?: string;
  cardStyle: 'flat' | 'shadow' | 'outlined' | 'glass';
  borderRadius: number; // in px
  fontScale: number; // 80 to 200 %
  lineHeight: number; // 1.2 to 2.0
  letterSpacing: number; // -0.05 to 0.15 em
  density: 'compact' | 'normal' | 'spacious';
  fontFamily: 'Inter' | 'Lexend' | 'Atkinson' | 'OpenDyslexic';
  motionScale: number; // 0 (reduced) to 1 (normal)
  chartPalette: 'standard' | 'colorblind' | 'monochrome';
  darkScheduleAfter7pm: boolean;
  // Accessibility toggles
  elderlyMode: boolean;
  largeControls: boolean;
  dyslexiaFont: boolean;
  highContrast: boolean;
  underlineLinks: boolean;
  highlightHover: boolean;
  simplifiedUi: boolean;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'bright-white',
    name: 'Bright White',
    isDark: false,
    bg: '#f8fafc',
    surface: '#ffffff',
    surface2: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#475569',
    primary: '#0284c7', // Sky 600
    primaryContrast: '#ffffff',
    primaryHover: '#0369a1',
    secondary: '#0ea5e9',
    accent: '#38bdf8',
    border: '#e2e8f0',
    ring: '#38bdf8',
    success: '#16a34a',
    successBg: '#f0fdf4',
    warning: '#d97706',
    warningBg: '#fffbeb',
    danger: '#dc2626',
    dangerBg: '#fef2f2',
  },
  {
    id: 'soft-lavender',
    name: 'Soft Lavender',
    isDark: false,
    bg: '#faf5ff',
    surface: '#ffffff',
    surface2: '#f3e8ff',
    text: '#1e1b4b',
    textMuted: '#6b21a8',
    primary: '#7c3aed',
    primaryContrast: '#ffffff',
    primaryHover: '#6d28d9',
    secondary: '#a855f7',
    accent: '#c084fc',
    border: '#e9d5ff',
    ring: '#c084fc',
    success: '#15803d',
    successBg: '#f0fdf4',
    warning: '#b45309',
    warningBg: '#fffbeb',
    danger: '#b91c1c',
    dangerBg: '#fef2f2',
  },
  {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    isDark: false,
    bg: '#f0f9ff',
    surface: '#ffffff',
    surface2: '#e0f2fe',
    text: '#082f49',
    textMuted: '#0369a1',
    primary: '#0369a1',
    primaryContrast: '#ffffff',
    primaryHover: '#075985',
    secondary: '#0284c7',
    accent: '#06b6d4',
    border: '#bae6fd',
    ring: '#38bdf8',
    success: '#16a34a',
    successBg: '#ecfdf5',
    warning: '#d97706',
    warningBg: '#fffbeb',
    danger: '#dc2626',
    dangerBg: '#fef2f2',
  },
  {
    id: 'fresh-mint',
    name: 'Fresh Mint',
    isDark: false,
    bg: '#f0fdf4',
    surface: '#ffffff',
    surface2: '#dcfce7',
    text: '#052e16',
    textMuted: '#15803d',
    primary: '#059669',
    primaryContrast: '#ffffff',
    primaryHover: '#047857',
    secondary: '#10b981',
    accent: '#34d399',
    border: '#bbf7d0',
    ring: '#34d399',
    success: '#16a34a',
    successBg: '#f0fdf4',
    warning: '#d97706',
    warningBg: '#fffbeb',
    danger: '#dc2626',
    dangerBg: '#fef2f2',
  },
  {
    id: 'warm-sunset',
    name: 'Warm Sunset',
    isDark: false,
    bg: '#fff7ed',
    surface: '#ffffff',
    surface2: '#ffedd5',
    text: '#431407',
    textMuted: '#9a3412',
    primary: '#ea580c',
    primaryContrast: '#ffffff',
    primaryHover: '#c2410c',
    secondary: '#f97316',
    accent: '#fb923c',
    border: '#fed7aa',
    ring: '#fb923c',
    success: '#16a34a',
    successBg: '#f0fdf4',
    warning: '#d97706',
    warningBg: '#fffbeb',
    danger: '#dc2626',
    dangerBg: '#fef2f2',
  },
  {
    id: 'rose-quartz',
    name: 'Rose Quartz',
    isDark: false,
    bg: '#fff1f2',
    surface: '#ffffff',
    surface2: '#ffe4e6',
    text: '#4c0519',
    textMuted: '#9f1239',
    primary: '#e11d48',
    primaryContrast: '#ffffff',
    primaryHover: '#be123c',
    secondary: '#f43f5e',
    accent: '#fb7185',
    border: '#fecdd3',
    ring: '#fb7185',
    success: '#16a34a',
    successBg: '#f0fdf4',
    warning: '#d97706',
    warningBg: '#fffbeb',
    danger: '#dc2626',
    dangerBg: '#fef2f2',
  },
  {
    id: 'sand-sage',
    name: 'Sand & Sage',
    isDark: false,
    bg: '#fbfbfa',
    surface: '#ffffff',
    surface2: '#f4f4f0',
    text: '#292524',
    textMuted: '#57534e',
    primary: '#57755b',
    primaryContrast: '#ffffff',
    primaryHover: '#445b47',
    secondary: '#788f7c',
    accent: '#a3b899',
    border: '#e7e5e4',
    ring: '#788f7c',
    success: '#16a34a',
    successBg: '#f0fdf4',
    warning: '#d97706',
    warningBg: '#fffbeb',
    danger: '#dc2626',
    dangerBg: '#fef2f2',
  },
  {
    id: 'midnight-dark',
    name: 'Midnight Dark',
    isDark: true,
    bg: '#0f172a',
    surface: '#1e293b',
    surface2: '#334155',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    primary: '#38bdf8',
    primaryContrast: '#0f172a',
    primaryHover: '#7dd3fc',
    secondary: '#0ea5e9',
    accent: '#818cf8',
    border: '#334155',
    ring: '#38bdf8',
    success: '#4ade80',
    successBg: '#14532d',
    warning: '#fbbf24',
    warningBg: '#451a03',
    danger: '#f87171',
    dangerBg: '#450a0a',
  },
  {
    id: 'oled-black',
    name: 'OLED Black',
    isDark: true,
    bg: '#000000',
    surface: '#0a0a0a',
    surface2: '#171717',
    text: '#ffffff',
    textMuted: '#a3a3a3',
    primary: '#22d3ee',
    primaryContrast: '#000000',
    primaryHover: '#67e8f9',
    secondary: '#06b6d4',
    accent: '#38bdf8',
    border: '#262626',
    ring: '#22d3ee',
    success: '#4ade80',
    successBg: '#052e16',
    warning: '#fbbf24',
    warningBg: '#451a03',
    danger: '#f87171',
    dangerBg: '#450a0a',
  },
  {
    id: 'high-contrast-light',
    name: 'High Contrast Light',
    isDark: false,
    bg: '#ffffff',
    surface: '#ffffff',
    surface2: '#eeeeee',
    text: '#000000',
    textMuted: '#111111',
    primary: '#0000ee',
    primaryContrast: '#ffffff',
    primaryHover: '#0000bb',
    secondary: '#000000',
    accent: '#551a8b',
    border: '#000000',
    ring: '#0000ee',
    success: '#006600',
    successBg: '#e6ffe6',
    warning: '#8a4b00',
    warningBg: '#fff4e6',
    danger: '#cc0000',
    dangerBg: '#ffe6e6',
  },
  {
    id: 'high-contrast-dark',
    name: 'High Contrast Dark',
    isDark: true,
    bg: '#000000',
    surface: '#000000',
    surface2: '#1a1a1a',
    text: '#ffffff',
    textMuted: '#ffffff',
    primary: '#ffff00', // Yellow on Black is WCAG AAA
    primaryContrast: '#000000',
    primaryHover: '#ffff66',
    secondary: '#00ffff',
    accent: '#ff00ff',
    border: '#ffffff',
    ring: '#ffff00',
    success: '#00ff00',
    successBg: '#003300',
    warning: '#ffaa00',
    warningBg: '#332200',
    danger: '#ff4444',
    dangerBg: '#330000',
  },
  {
    id: 'auto-system',
    name: 'Auto (System / Schedule)',
    isDark: false, // dynamically resolved
    bg: '#f8fafc',
    surface: '#ffffff',
    surface2: '#f1f5f9',
    text: '#0f172a',
    textMuted: '#475569',
    primary: '#0284c7',
    primaryContrast: '#ffffff',
    primaryHover: '#0369a1',
    secondary: '#0ea5e9',
    accent: '#38bdf8',
    border: '#e2e8f0',
    ring: '#38bdf8',
    success: '#16a34a',
    successBg: '#f0fdf4',
    warning: '#d97706',
    warningBg: '#fffbeb',
    danger: '#dc2626',
    dangerBg: '#fef2f2',
  }
];

export const DEFAULT_THEME_SETTINGS: CustomThemeSettings = {
  presetId: 'ocean-blue',
  cardStyle: 'shadow',
  borderRadius: 12,
  fontScale: 100,
  lineHeight: 1.5,
  letterSpacing: 0,
  density: 'normal',
  fontFamily: 'Inter',
  motionScale: 1,
  chartPalette: 'standard',
  darkScheduleAfter7pm: false,
  elderlyMode: false,
  largeControls: false,
  dyslexiaFont: false,
  highContrast: false,
  underlineLinks: false,
  highlightHover: false,
  simplifiedUi: false,
};

// WCAG 2.2 Contrast Calculation
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return {
      r: parseInt(clean[0] + clean[0], 16),
      g: parseInt(clean[1] + clean[1], 16),
      b: parseInt(clean[2] + clean[2], 16),
    };
  }
  if (clean.length === 6) {
    return {
      r: parseInt(clean.substring(0, 2), 16),
      g: parseInt(clean.substring(2, 4), 16),
      b: parseInt(clean.substring(4, 6), 16),
    };
  }
  return null;
}

export function getRelativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const brighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((brighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function checkWcagCompliance(bgHex: string, textHex: string): {
  ratio: number;
  aaNormal: boolean;
  aaLarge: boolean;
  aaaNormal: boolean;
  grade: 'AAA' | 'AA' | 'AA Large' | 'Fail';
} {
  const ratio = getContrastRatio(bgHex, textHex);
  const aaNormal = ratio >= 4.5;
  const aaLarge = ratio >= 3.0;
  const aaaNormal = ratio >= 7.0;

  let grade: 'AAA' | 'AA' | 'AA Large' | 'Fail' = 'Fail';
  if (aaaNormal) grade = 'AAA';
  else if (aaNormal) grade = 'AA';
  else if (aaLarge) grade = 'AA Large';

  return { ratio, aaNormal, aaLarge, aaaNormal, grade };
}

// Apply settings to document element
export function applyTheme(settings: CustomThemeSettings) {
  let preset = THEME_PRESETS.find((p) => p.id === settings.presetId) || THEME_PRESETS[2];

  // Auto/Schedule check
  if (settings.presetId === 'auto-system') {
    const now = new Date();
    const hour = now.getHours();
    const isNight = settings.darkScheduleAfter7pm ? (hour >= 19 || hour < 7) : window.matchMedia('(prefers-color-scheme: dark)').matches;
    preset = isNight
      ? THEME_PRESETS.find((p) => p.id === 'midnight-dark')!
      : THEME_PRESETS.find((p) => p.id === 'ocean-blue')!;
  }

  // High contrast override if enabled in accessibility
  if (settings.highContrast) {
    preset = preset.isDark
      ? THEME_PRESETS.find((p) => p.id === 'high-contrast-dark')!
      : THEME_PRESETS.find((p) => p.id === 'high-contrast-light')!;
  }

  const root = document.documentElement;

  // Primary / Secondary custom colors
  const primary = settings.primaryColor || preset.primary;
  const primaryContrast = getContrastRatio(primary, '#ffffff') >= 4.5 ? '#ffffff' : '#000000';
  const secondary = settings.secondaryColor || preset.secondary;

  root.style.setProperty('--bg', preset.bg);
  root.style.setProperty('--surface', preset.surface);
  root.style.setProperty('--surface-2', preset.surface2);
  root.style.setProperty('--text', preset.text);
  root.style.setProperty('--text-muted', preset.textMuted);
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--primary-contrast', primaryContrast);
  root.style.setProperty('--primary-hover', preset.primaryHover);
  root.style.setProperty('--secondary', secondary);
  root.style.setProperty('--accent', preset.accent);
  root.style.setProperty('--border', preset.border);
  root.style.setProperty('--ring', preset.ring);
  root.style.setProperty('--success', preset.success);
  root.style.setProperty('--success-bg', preset.successBg);
  root.style.setProperty('--warning', preset.warning);
  root.style.setProperty('--warning-bg', preset.warningBg);
  root.style.setProperty('--danger', preset.danger);
  root.style.setProperty('--danger-bg', preset.dangerBg);

  // Layout & Typography tokens
  const effectiveFontScale = settings.elderlyMode ? Math.max(125, settings.fontScale) : settings.fontScale;
  root.style.setProperty('--font-scale', `${effectiveFontScale}%`);
  root.style.setProperty('--font-size-base', `${16 * (effectiveFontScale / 100)}px`);
  root.style.setProperty('--line-height-base', settings.lineHeight.toString());
  root.style.setProperty('--letter-spacing-base', `${settings.letterSpacing}em`);
  root.style.setProperty('--radius', `${settings.borderRadius}px`);
  root.style.setProperty('--motion-scale', settings.motionScale.toString());

  // Density
  const densityPadding = settings.density === 'compact' ? '0.5rem' : settings.density === 'spacious' ? '1.25rem' : '0.875rem';
  root.style.setProperty('--density-padding', densityPadding);

  // Card shadow style
  const shadowMap = {
    flat: 'none',
    shadow: '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
    outlined: 'none',
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
  };
  root.style.setProperty('--shadow', shadowMap[settings.cardStyle]);

  // Dark class for Tailwind
  if (preset.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }

  // Accessibility classes
  root.classList.toggle('elderly-mode', settings.elderlyMode);
  root.classList.toggle('large-controls', settings.largeControls || settings.elderlyMode);
  root.classList.toggle('dyslexia-font', settings.dyslexiaFont);
  root.classList.toggle('underline-links', settings.underlineLinks);
  root.classList.toggle('highlight-hover', settings.highlightHover);

  // Save to localStorage for instant reload persistence
  localStorage.setItem('vitalis_theme_settings', JSON.stringify(settings));
}

export function loadSavedThemeSettings(): CustomThemeSettings {
  try {
    const raw = localStorage.getItem('vitalis_theme_settings');
    if (raw) {
      return { ...DEFAULT_THEME_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.error('Failed to parse saved theme settings', e);
  }
  return DEFAULT_THEME_SETTINGS;
}
