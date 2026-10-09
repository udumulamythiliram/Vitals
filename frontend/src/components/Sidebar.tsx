import React from 'react';
import {
  Home,
  Bot,
  FileText,
  CheckSquare,
  Clock,
  Pill,
  TrendingUp,
  Users2,
  Calendar,
  Palette,
  Shield,
  Activity,
  Award,
  HelpCircle
} from 'lucide-react';

export type SectionId =
  | 'dashboard'
  | 'copilot'
  | 'records'
  | 'review'
  | 'timeline'
  | 'medications'
  | 'reports'
  | 'family'
  | 'appointments'
  | 'appearance'
  | 'privacy'
  | 'ai-quality'
  | 'demo'
  | 'help';

interface SidebarProps {
  currentSection: SectionId;
  onSelectSection: (section: SectionId) => void;
  elderlyMode?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentSection,
  onSelectSection,
  elderlyMode = false,
}) => {
  const allNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: Home, badge: '' },
    { id: 'copilot', label: 'Vitalis Copilot', icon: Bot, badge: 'AI' },
    { id: 'records', label: 'Health Records', icon: FileText, badge: '' },
    { id: 'review', label: 'Review Center', icon: CheckSquare, badge: 'Verify' },
    { id: 'timeline', label: 'Health Timeline', icon: Clock, badge: '' },
    { id: 'medications', label: 'Medications', icon: Pill, badge: '' },
    { id: 'reports', label: 'Lab Trends', icon: TrendingUp, badge: '' },
    { id: 'family', label: 'Family & Caregivers', icon: Users2, badge: '' },
    { id: 'appointments', label: 'Appointments', icon: Calendar, badge: '' },
    { id: 'appearance', label: 'Theme Studio', icon: Palette, badge: '12 Themes' },
    { id: 'privacy', label: 'Privacy & FHIR', icon: Shield, badge: 'ABDM' },
    { id: 'ai-quality', label: 'AI Quality & Status', icon: Activity, badge: 'Evals' },
    { id: 'demo', label: 'Demo for Judges', icon: Award, badge: 'Personas' },
    { id: 'help', label: 'Help & Safety', icon: HelpCircle, badge: '' },
  ];

  // In Elderly Mode, reduce down to 5 simple, high-impact items
  const elderlyNavItems = [
    { id: 'dashboard', label: 'Home', icon: Home, badge: '' },
    { id: 'copilot', label: 'Ask Vitalis', icon: Bot, badge: 'AI' },
    { id: 'records', label: 'My Documents', icon: FileText, badge: '' },
    { id: 'medications', label: 'My Medicines', icon: Pill, badge: '' },
    { id: 'help', label: 'Emergency & Help', icon: HelpCircle, badge: 'SOS' },
  ];

  const items = elderlyMode ? elderlyNavItems : allNavItems;

  return (
    <nav
      className="w-full md:w-64 bg-surface border-r border-border flex flex-col py-4 px-3 h-[calc(100vh-4rem)] sticky top-16 overflow-y-auto"
      aria-label="Sidebar Navigation"
    >
      <div className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectSection(item.id as SectionId)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-theme text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-primary text-primary-contrast shadow-sm'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text'
              } ${elderlyMode ? 'py-4 text-lg' : ''}`}
              aria-current={isActive ? 'page' : undefined}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`${elderlyMode ? 'w-6 h-6' : 'w-5 h-5'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && !elderlyMode && (
                <span
                  className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-surface-2 text-text-muted border border-border'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {!elderlyMode && (
        <div className="mt-auto pt-4 border-t border-border">
          <div className="p-3 rounded-theme bg-surface-2 border border-border text-xs text-text-muted">
            <div className="font-bold text-text">Vitalis Copilot 2.0</div>
            <div className="mt-0.5">WCAG 2.2 AA • FHIR R4 Ready</div>
          </div>
        </div>
      )}
    </nav>
  );
};
