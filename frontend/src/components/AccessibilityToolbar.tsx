import React from 'react';
import { CustomThemeSettings, applyTheme } from '../theme/themeEngine';
import {
  Sliders,
  Type,
  Eye,
  Volume2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  MousePointer,
  HeartHandshake,
  X
} from 'lucide-react';

interface AccessibilityToolbarProps {
  isOpen: boolean;
  onClose: () => void;
  settings: CustomThemeSettings;
  onUpdateSettings: (newSettings: CustomThemeSettings) => void;
}

export const AccessibilityToolbar: React.FC<AccessibilityToolbarProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
}) => {
  if (!isOpen) return null;

  const handleFontChange = (delta: number) => {
    const newScale = Math.min(200, Math.max(80, settings.fontScale + delta));
    const updated = { ...settings, fontScale: newScale };
    onUpdateSettings(updated);
    applyTheme(updated);
  };

  const handleToggle = (key: keyof CustomThemeSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    onUpdateSettings(updated);
    applyTheme(updated);
  };

  const handleReset = () => {
    const resetSettings: CustomThemeSettings = {
      ...settings,
      fontScale: 100,
      elderlyMode: false,
      largeControls: false,
      dyslexiaFont: false,
      highContrast: false,
      underlineLinks: false,
      highlightHover: false,
      motionScale: 1,
    };
    onUpdateSettings(resetSettings);
    applyTheme(resetSettings);
  };

  return (
    <div
      role="dialog"
      aria-label="Accessibility Settings"
      className="fixed inset-y-0 right-0 w-80 sm:w-96 bg-surface border-l border-border shadow-2xl z-50 p-6 overflow-y-auto animate-in slide-in-from-right duration-200"
    >
      <div className="flex items-center justify-between pb-4 border-b border-border mb-6">
        <div className="flex items-center space-x-2">
          <Sliders className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-text">Accessibility Hub</h2>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-surface-2 text-text-muted hover:text-text"
          aria-label="Close accessibility toolbar"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Elderly Care Mode Hero Feature */}
        <div className="p-4 rounded-theme bg-primary/10 border-2 border-primary">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2">
              <HeartHandshake className="w-5 h-5 text-primary" />
              <div className="font-bold text-text">Elderly Care Mode</div>
            </div>
            <input
              type="checkbox"
              id="toggle-elderly"
              checked={settings.elderlyMode}
              onChange={() => handleToggle('elderlyMode')}
              className="w-5 h-5 accent-primary cursor-pointer"
            />
          </div>
          <label htmlFor="toggle-elderly" className="text-xs text-text-muted block mt-2 cursor-pointer">
            Enlarges typography to 20px+, expands touch targets to 56px, simplifies navigation to 5 essentials, and pins emergency actions.
          </label>
        </div>

        {/* Text Size Scale */}
        <div>
          <label className="text-sm font-semibold text-text mb-2 flex items-center justify-between">
            <span className="flex items-center space-x-2">
              <Type className="w-4 h-4 text-text-muted" />
              <span>Text Size</span>
            </span>
            <span className="font-mono text-xs bg-surface-2 px-2 py-0.5 rounded border border-border">
              {settings.fontScale}%
            </span>
          </label>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleFontChange(-10)}
              className="flex-1 py-2 px-3 rounded-theme bg-surface-2 hover:bg-border text-text font-bold flex items-center justify-center space-x-1"
              aria-label="Decrease font size"
            >
              <ZoomOut className="w-4 h-4" />
              <span>A-</span>
            </button>
            <button
              onClick={() => handleFontChange(10)}
              className="flex-1 py-2 px-3 rounded-theme bg-surface-2 hover:bg-border text-text font-bold flex items-center justify-center space-x-1"
              aria-label="Increase font size"
            >
              <ZoomIn className="w-4 h-4" />
              <span>A+</span>
            </button>
          </div>
        </div>

        {/* Visual Accommodation Toggles */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-text">Vision & Reading</div>

          <label className="flex items-center justify-between p-3 rounded-theme bg-surface-2 border border-border cursor-pointer">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">High Contrast (AAA)</span>
            </div>
            <input
              type="checkbox"
              checked={settings.highContrast}
              onChange={() => handleToggle('highContrast')}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-theme bg-surface-2 border border-border cursor-pointer">
            <div className="flex items-center space-x-2">
              <Type className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Dyslexia-Friendly Font</span>
            </div>
            <input
              type="checkbox"
              checked={settings.dyslexiaFont}
              onChange={() => handleToggle('dyslexiaFont')}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-theme bg-surface-2 border border-border cursor-pointer">
            <div className="flex items-center space-x-2">
              <MousePointer className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Underline All Links</span>
            </div>
            <input
              type="checkbox"
              checked={settings.underlineLinks}
              onChange={() => handleToggle('underlineLinks')}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-3 rounded-theme bg-surface-2 border border-border cursor-pointer">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Highlight-on-Hover</span>
            </div>
            <input
              type="checkbox"
              checked={settings.highlightHover}
              onChange={() => handleToggle('highlightHover')}
              className="w-4 h-4 accent-primary cursor-pointer"
            />
          </label>
        </div>

        {/* Reset Button */}
        <div className="pt-4 border-t border-border">
          <button
            onClick={handleReset}
            className="w-full py-2.5 rounded-theme border border-border bg-surface hover:bg-surface-2 text-text font-semibold flex items-center justify-center space-x-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Accessibility Defaults</span>
          </button>
        </div>
      </div>
    </div>
  );
};
