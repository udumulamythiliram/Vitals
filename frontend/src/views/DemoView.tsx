import React, { useState } from 'react';
import { PatientProfile } from '../types';
import { api } from '../api';
import { SectionId } from '../components/Sidebar';
import {
  Award,
  Users,
  Baby,
  Heart,
  TrendingUp,
  Sliders,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Play
} from 'lucide-react';

interface DemoViewProps {
  patients: PatientProfile[];
  activePatient: PatientProfile | null;
  onSelectPatient: (patientId: string) => void;
  onNavigate: (section: SectionId) => void;
  onRefreshData: () => void;
}

export const DemoView: React.FC<DemoViewProps> = ({
  patients,
  activePatient,
  onSelectPatient,
  onNavigate,
  onRefreshData,
}) => {
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const personas = [
    {
      id: 'p_elderly_ramachandra',
      title: '1. Elderly Patient with Multiple Prescriptions',
      name: 'Ramachandra Rao (72 Y / M)',
      icon: Heart,
      tag: 'Elderly Care & Polypharmacy',
      description: 'Prescription with Metformin, Telmisartan & Atorvastatin. Elevated Fasting Blood Sugar (138 mg/dL) & HbA1c (7.4%). Demonstrates large text and time-labeled medication schedules.',
      actionSection: 'medications' as SectionId,
      actionLabel: 'Inspect Prescriptions'
    },
    {
      id: 'p_child_aarav',
      title: "2. Parent with Child's Records",
      name: 'Aarav Sharma (18 Months / M)',
      icon: Baby,
      tag: 'Guardian Scoped',
      description: 'Pediatric MMR and DTP Booster records administered at Rainbow Children\'s Hospital. Demonstrates guardian permissions and child-safe chatbot answers.',
      actionSection: 'timeline' as SectionId,
      actionLabel: 'Inspect Child Chart'
    },
    {
      id: 'p_adult_vikram',
      title: '3. Adult Comparing Two Lab Reports',
      name: 'Vikram Patel (45 Y / M)',
      icon: TrendingUp,
      tag: 'Delta Tracking & Trends',
      description: 'Baseline vs follow-up metabolic panel across 3 months showing FBS reduction from 132 to 112 mg/dL. Demonstrates multi-report comparison deltas.',
      actionSection: 'reports' as SectionId,
      actionLabel: 'View Report Deltas'
    },
    {
      id: 'p_accessible_lakshmi',
      title: '4. Accessibility & Regional Language',
      name: 'Lakshmi Devi (68 Y / F)',
      icon: Sliders,
      tag: 'High Contrast & Telugu (తెలుగు)',
      description: 'Cardiology consultation notes with Telugu and Hindi plain-language synthesis, high-contrast palette, and screen reader markup.',
      actionSection: 'copilot' as SectionId,
      actionLabel: 'Ask in Telugu / Hindi'
    }
  ];

  const handleResetDemo = async () => {
    setResetting(true);
    try {
      await api.resetDemo();
      setResetMsg('Demo database reset to clean state with 4 judge personas!');
      onRefreshData();
      setTimeout(() => setResetMsg(null), 3000);
    } catch (err: any) {
      alert(err.message || 'Reset failed');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Header */}
      <div className="bg-surface rounded-theme p-6 border border-border shadow-theme flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-primary text-xs font-bold uppercase tracking-wider mb-1">
            <Award className="w-4 h-4" />
            <span>ByteXL AI Tools Hackathon • Altrix Labs Challenge</span>
          </div>
          <h2 className="text-2xl font-extrabold text-text">Judge Demonstration Suite</h2>
          <p className="text-text-muted text-sm mt-1">
            Select any of the 4 pre-configured clinical personas to evaluate end-to-end workflows without manual data entry.
          </p>
        </div>

        <button
          onClick={handleResetDemo}
          disabled={resetting}
          className="px-4 py-2.5 rounded-theme bg-surface-2 hover:bg-border text-text font-bold text-xs flex items-center space-x-2 border border-border transition-all"
        >
          <RotateCcw className={`w-4 h-4 ${resetting ? 'animate-spin' : ''}`} />
          <span>{resetting ? 'Resetting...' : 'Reset Demo Data'}</span>
        </button>
      </div>

      {resetMsg && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded text-xs flex items-center space-x-2 border border-emerald-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>{resetMsg}</span>
        </div>
      )}

      {/* 4 Personas Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {personas.map((persona) => {
          const Icon = persona.icon;
          const isCurrentActive = activePatient?.id === persona.id;

          return (
            <div
              key={persona.id}
              className={`p-5 rounded-theme border transition-all ${
                isCurrentActive
                  ? 'bg-primary/5 border-primary shadow-md'
                  : 'bg-surface border-border hover:border-primary/50'
              } flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full border border-primary/20">
                    {persona.tag}
                  </span>
                  {isCurrentActive && (
                    <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-300">
                      Currently Active Profile
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-3 my-2">
                  <div className="p-2.5 rounded-theme bg-surface-2 text-primary">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-text">{persona.title}</h3>
                    <div className="text-xs text-text-muted font-semibold">{persona.name}</div>
                  </div>
                </div>

                <p className="text-xs text-text-muted leading-relaxed mt-2">{persona.description}</p>
              </div>

              <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-3">
                <button
                  onClick={() => onSelectPatient(persona.id)}
                  disabled={isCurrentActive}
                  className={`flex-1 py-2 px-3 rounded-theme font-bold text-xs transition-colors ${
                    isCurrentActive
                      ? 'bg-emerald-600 text-white cursor-default'
                      : 'bg-surface-2 hover:bg-border text-text border border-border'
                  }`}
                >
                  {isCurrentActive ? 'Active in Header' : 'Activate Persona'}
                </button>

                <button
                  onClick={() => {
                    onSelectPatient(persona.id);
                    onNavigate(persona.actionSection);
                  }}
                  className="flex-1 py-2 px-3 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs flex items-center justify-center space-x-1 shadow-sm"
                >
                  <span>{persona.actionLabel}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3-Minute Guided Walkthrough Checklist for Judges */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme">
        <h3 className="font-bold text-base text-text mb-3 flex items-center space-x-2">
          <Play className="w-5 h-5 text-primary" />
          <span>Recommended 3-Minute Judging Walkthrough</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-3 bg-surface-2 rounded-theme border border-border">
            <div className="font-bold text-text mb-1">Step 1: Upload & Review</div>
            <p className="text-text-muted">
              Select <strong>Health Records</strong> → Upload a medical document or click <strong>Review Center</strong> to see real side-by-side OCR and deterministic flags.
            </p>
          </div>

          <div className="p-3 bg-surface-2 rounded-theme border border-border">
            <div className="font-bold text-text mb-1">Step 2: Scoped Copilot & Citations</div>
            <p className="text-text-muted">
              Open <strong>Vitalis Copilot</strong> → Ask "Explain my latest blood test" or "Explain in Telugu". See clickable source chips linking directly to records.
            </p>
          </div>

          <div className="p-3 bg-surface-2 rounded-theme border border-border">
            <div className="font-bold text-text mb-1">Step 3: Themes & FHIR Export</div>
            <p className="text-text-muted">
              Open <strong>Theme Studio</strong> to see live WCAG contrast guarding, toggle <strong>Elderly Mode</strong>, and export an HL7 FHIR R4 Bundle under <strong>Privacy</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
