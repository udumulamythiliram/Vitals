import React, { useState, useEffect } from 'react';
import { SectionId } from './Sidebar';
import { PatientProfile } from '../types';
import { Search, Heart, User, ShieldAlert, ArrowRight, X } from 'lucide-react';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSection: (section: SectionId) => void;
  patients: PatientProfile[];
  onSelectPatient: (patientId: string) => void;
  onTriggerEmergency: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectSection,
  patients,
  onSelectPatient,
  onTriggerEmergency,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const commands = [
    { label: 'Go to Home Dashboard', section: 'dashboard' as SectionId, icon: Heart },
    { label: 'Ask Vitalis Copilot', section: 'copilot' as SectionId, icon: Heart },
    { label: 'Upload or View Health Records', section: 'records' as SectionId, icon: Heart },
    { label: 'Review Center (Verify Records)', section: 'review' as SectionId, icon: Heart },
    { label: 'View Health Timeline', section: 'timeline' as SectionId, icon: Heart },
    { label: 'Check Medications & Reminders', section: 'medications' as SectionId, icon: Heart },
    { label: 'Lab Trends & Comparison', section: 'reports' as SectionId, icon: Heart },
    { label: 'Family & Caregivers', section: 'family' as SectionId, icon: Heart },
    { label: 'Appointments & Doctor Prep', section: 'appointments' as SectionId, icon: Heart },
    { label: 'Theme Studio (12 Styles)', section: 'appearance' as SectionId, icon: Heart },
    { label: 'Privacy & FHIR R4 Export', section: 'privacy' as SectionId, icon: Heart },
    { label: 'AI Quality & Evaluation Benchmarks', section: 'ai-quality' as SectionId, icon: Heart },
    { label: 'Judge Demo Mode & Personas', section: 'demo' as SectionId, icon: Heart },
  ];

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase())
  );

  const filteredPatients = patients.filter((p) =>
    p.full_name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
    >
      <div
        className="bg-surface border border-border rounded-theme shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-3 border-b border-border flex items-center space-x-3">
          <Search className="w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Type a command or patient name... (Esc to exit)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-text text-base placeholder:text-text-muted"
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {/* Emergency Option */}
          <button
            onClick={() => {
              onTriggerEmergency();
              onClose();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-theme text-left text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors font-bold"
          >
            <div className="flex items-center space-x-3">
              <ShieldAlert className="w-5 h-5" />
              <span>EMERGENCY: Open 112 SOS Card</span>
            </div>
            <ArrowRight className="w-4 h-4" />
          </button>

          {/* Patient Switcher Options */}
          {filteredPatients.length > 0 && (
            <div className="pt-2">
              <div className="px-3 py-1 text-xs font-bold text-text-muted uppercase">
                Switch Patient Profile
              </div>
              {filteredPatients.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSelectPatient(p.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between p-2 rounded-theme hover:bg-surface-2 text-left transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <User className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold">{p.full_name}</span>
                    <span className="text-xs text-text-muted capitalize">({p.relationship})</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-text-muted" />
                </button>
              ))}
            </div>
          )}

          {/* Navigation Commands */}
          <div className="pt-2">
            <div className="px-3 py-1 text-xs font-bold text-text-muted uppercase">Navigation</div>
            {filteredCommands.map((c) => (
              <button
                key={c.section}
                onClick={() => {
                  onSelectSection(c.section);
                  onClose();
                }}
                className="w-full flex items-center justify-between p-2 rounded-theme hover:bg-surface-2 text-left transition-colors"
              >
                <span className="text-sm font-medium">{c.label}</span>
                <ArrowRight className="w-4 h-4 text-text-muted" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
