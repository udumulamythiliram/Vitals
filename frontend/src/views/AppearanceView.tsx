import React, { useState } from 'react';
import {
  THEME_PRESETS,
  CustomThemeSettings,
  applyTheme,
  checkWcagCompliance,
  DEFAULT_THEME_SETTINGS
} from '../theme/themeEngine';
import {
  Palette,
  Check,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Download,
  Upload,
  Type,
  Layout,
  Sun,
  Moon
} from 'lucide-react';

interface AppearanceViewProps {
  settings: CustomThemeSettings;
  onUpdateSettings: (newSettings: CustomThemeSettings) => void;
}

export const AppearanceView: React.FC<AppearanceViewProps> = ({
  settings,
  onUpdateSettings,
}) => {
  const activePreset = THEME_PRESETS.find((p) => p.id === settings.presetId) || THEME_PRESETS[2];

  // Contrast Guard check
  const contrastCheck = checkWcagCompliance(
    activePreset.bg,
    settings.primaryColor || activePreset.primary
  );

  const handlePresetSelect = (presetId: string) => {
    const updated = { ...settings, presetId, primaryColor: undefined, secondaryColor: undefined };
    onUpdateSettings(updated);
    applyTheme(updated);
  };

  const handleUpdate = (partial: Partial<CustomThemeSettings>) => {
    const updated = { ...settings, ...partial };
    onUpdateSettings(updated);
    applyTheme(updated);
  };

  const handleExportTheme = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(settings, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `vitalis-theme-${settings.presetId}.json`);
    dl.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center space-x-2">
            <Palette className="w-5 h-5 text-primary" />
            <span>Theme Studio & WCAG 2.2 Contrast Guard</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            12 curated clinical themes with live token crossfade, typography scaling, and WCAG AAA compliance enforcement.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportTheme}
            className="px-3 py-1.5 rounded-theme bg-surface-2 hover:bg-border text-text font-bold text-xs flex items-center space-x-1.5 border border-border"
          >
            <Download className="w-4 h-4" />
            <span>Export Theme JSON</span>
          </button>
          <button
            onClick={() => {
              onUpdateSettings(DEFAULT_THEME_SETTINGS);
              applyTheme(DEFAULT_THEME_SETTINGS);
            }}
            className="p-1.5 rounded-theme hover:bg-surface-2 text-text-muted hover:text-text"
            title="Reset theme defaults"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* WCAG Contrast Guard Live Panel */}
      <div className="bg-surface rounded-theme p-4 border border-border shadow-theme flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-full ${
              contrastCheck.aaNormal ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
            }`}
          >
            {contrastCheck.aaNormal ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="font-bold text-text text-sm flex items-center space-x-2">
              <span>WCAG 2.2 AA Contrast Guard:</span>
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                  contrastCheck.aaaNormal
                    ? 'bg-emerald-100 text-emerald-800'
                    : contrastCheck.aaNormal
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                Grade: {contrastCheck.grade} ({contrastCheck.ratio}:1)
              </span>
            </div>
            <p className="text-xs text-text-muted">
              {contrastCheck.aaNormal
                ? 'Primary color satisfies WCAG minimum contrast ratio against current background.'
                : 'Warning: Low contrast detected. Select a darker primary accent or enable High Contrast mode.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <label className="text-xs font-semibold text-text-muted">Primary Accent Picker:</label>
          <input
            type="color"
            value={settings.primaryColor || activePreset.primary}
            onChange={(e) => handleUpdate({ primaryColor: e.target.value })}
            className="w-8 h-8 rounded border border-border cursor-pointer"
          />
        </div>
      </div>

      {/* 12 Presets Grid */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme">
        <h3 className="font-bold text-base text-text mb-4">12 Curated Theme Presets</h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {THEME_PRESETS.map((p) => {
            const isSelected = settings.presetId === p.id;
            return (
              <button
                key={p.id}
                onClick={() => handlePresetSelect(p.id)}
                className={`p-3 rounded-theme border text-left transition-all relative overflow-hidden flex flex-col justify-between h-24 ${
                  isSelected
                    ? 'border-primary ring-2 ring-primary shadow-md'
                    : 'border-border hover:border-text-muted'
                }`}
                style={{ backgroundColor: p.surface }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="w-4 h-4 rounded-full" style={{ backgroundColor: p.primary }} />
                    {isSelected && <Check className="w-4 h-4 text-primary" />}
                  </div>
                  <div className="font-bold text-xs mt-2" style={{ color: p.text }}>
                    {p.name}
                  </div>
                </div>

                <div className="text-[10px] opacity-70 flex items-center space-x-1" style={{ color: p.textMuted }}>
                  {p.isDark ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                  <span>{p.isDark ? 'Dark' : 'Light'}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Fine-Tuning Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Typography & Spacing */}
        <div className="bg-surface rounded-theme p-5 border border-border shadow-theme space-y-4">
          <h3 className="font-bold text-base text-text flex items-center space-x-2">
            <Type className="w-4 h-4 text-primary" />
            <span>Typography & Spacing Controls</span>
          </h3>

          <div>
            <div className="flex justify-between text-xs font-semibold text-text mb-1">
              <span>Font Scale ({settings.fontScale}%)</span>
              <span className="text-text-muted">80% - 200%</span>
            </div>
            <input
              type="range"
              min="80"
              max="200"
              step="5"
              value={settings.fontScale}
              onChange={(e) => handleUpdate({ fontScale: parseInt(e.target.value) })}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-text mb-1">
              <span>Line Height ({settings.lineHeight})</span>
              <span className="text-text-muted">1.2 - 2.0</span>
            </div>
            <input
              type="range"
              min="1.2"
              max="2.0"
              step="0.1"
              value={settings.lineHeight}
              onChange={(e) => handleUpdate({ lineHeight: parseFloat(e.target.value) })}
              className="w-full accent-primary cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold text-text mb-1">
              <span>Card Border Radius ({settings.borderRadius}px)</span>
              <span className="text-text-muted">0 - 24px</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              step="2"
              value={settings.borderRadius}
              onChange={(e) => handleUpdate({ borderRadius: parseInt(e.target.value) })}
              className="w-full accent-primary cursor-pointer"
            />
          </div>
        </div>

        {/* Card Style & Layout Density */}
        <div className="bg-surface rounded-theme p-5 border border-border shadow-theme space-y-4">
          <h3 className="font-bold text-base text-text flex items-center space-x-2">
            <Layout className="w-4 h-4 text-primary" />
            <span>Card Styling & Layout Density</span>
          </h3>

          <div>
            <label className="text-xs font-semibold text-text mb-2 block">Card Elevation Style:</label>
            <div className="grid grid-cols-2 gap-2">
              {(['shadow', 'flat', 'outlined', 'glass'] as const).map((style) => (
                <button
                  key={style}
                  onClick={() => handleUpdate({ cardStyle: style })}
                  className={`py-2 px-3 rounded-theme border text-xs font-bold capitalize transition-colors ${
                    settings.cardStyle === style
                      ? 'bg-primary text-primary-contrast border-primary'
                      : 'bg-surface-2 border-border text-text'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-text mb-2 block">Layout Density:</label>
            <div className="grid grid-cols-3 gap-2">
              {(['compact', 'normal', 'spacious'] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => handleUpdate({ density: d })}
                  className={`py-2 px-3 rounded-theme border text-xs font-bold capitalize transition-colors ${
                    settings.density === d
                      ? 'bg-primary text-primary-contrast border-primary'
                      : 'bg-surface-2 border-border text-text'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2">
            <label className="flex items-center space-x-2 text-xs font-semibold text-text cursor-pointer">
              <input
                type="checkbox"
                checked={settings.darkScheduleAfter7pm}
                onChange={(e) => handleUpdate({ darkScheduleAfter7pm: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <span>Auto schedule: Switch to dark theme after 7:00 PM</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};
