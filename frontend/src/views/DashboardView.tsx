import React, { useState, useEffect } from 'react';
import { PatientProfile, Observation, Medication, Appointment, DocumentItem } from '../types';
import { api } from '../api';
import { SectionId } from '../components/Sidebar';
import {
  FileText,
  Pill,
  Calendar,
  AlertTriangle,
  Upload,
  Bot,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  Sparkles,
  ShieldCheck,
  ChevronRight,
  Activity
} from 'lucide-react';

interface DashboardViewProps {
  activePatient: PatientProfile | null;
  onNavigate: (section: SectionId) => void;
  onAskCopilot: (prompt: string) => void;
  elderlyMode?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  activePatient,
  onNavigate,
  onAskCopilot,
  elderlyMode = false,
}) => {
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [abnormalObs, setAbnormalObs] = useState<Observation[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activePatient) return;
    setLoading(true);

    Promise.all([
      api.getDocuments(activePatient.id),
      api.getMedications(activePatient.id, 'active'),
      api.getAppointments(activePatient.id),
      api.getLabTrends(activePatient.id)
    ])
      .then(([docs, meds, apts, trends]) => {
        setDocuments(docs || []);
        setMedications(meds || []);
        setAppointments(apts || []);

        // Find abnormal observations
        const abnormals: Observation[] = [];
        trends.forEach((t: any) => {
          t.points?.forEach((p: any) => {
            if (['high', 'low', 'abnormal', 'critical_high', 'critical_low'].includes(p.flag)) {
              abnormals.push({
                id: p.document_id + t.test_name,
                patient_id: activePatient.id,
                test_name: t.test_name,
                value: p.value,
                value_text: String(p.value),
                unit: t.unit,
                reference_range: t.reference_range,
                flag: p.flag,
                collection_date: p.date,
                report_date: p.date,
                lab_name: 'Diagnostic Lab',
                user_verified: 1
              });
            }
          });
        });
        setAbnormalObs(abnormals.slice(0, 4));
      })
      .catch((err) => console.error('Failed to load dashboard data', err))
      .finally(() => setLoading(false));
  }, [activePatient]);

  const pendingReviewCount = documents.filter((d) => d.status === 'extracted' || d.status === 'uploaded').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Hero Greeting */}
      <div className="bg-surface rounded-theme p-6 border border-border shadow-theme relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-primary text-sm font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-4 h-4" />
              <span>Personalized Health Copilot</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text tracking-tight">
              Welcome, {activePatient?.full_name || 'Friend'}
            </h1>
            <p className="text-text-muted text-sm sm:text-base mt-1">
              {activePatient?.age_group === 'child'
                ? `Managing records for child profile (${activePatient.full_name}). All answers guardian-scoped.`
                : activePatient?.age_group === 'elderly'
                ? `Your prescriptions and health documents are organized simply in large, readable format.`
                : `All your prescriptions, lab tests, and clinical history in one place. Ask anything.`}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => onNavigate('records')}
              className="px-4 py-2.5 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold flex items-center space-x-2 shadow-sm transition-all"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Document</span>
            </button>
            <button
              onClick={() => onNavigate('demo')}
              className="px-4 py-2.5 rounded-theme bg-surface-2 hover:bg-border text-text font-bold border border-border transition-all"
            >
              <span>Judge Personas</span>
            </button>
          </div>
        </div>

        {/* Big "Ask Vitalis" Question Bar */}
        <div className="mt-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                onAskCopilot(searchQuery);
                setSearchQuery('');
              }
            }}
            className="flex items-center bg-surface-2 border-2 border-border focus-within:border-primary rounded-theme p-1.5 transition-all shadow-sm"
          >
            <div className="p-2 text-primary">
              <Bot className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder={
                elderlyMode
                  ? 'Ask anything about your health or medicines...'
                  : 'Ask Vitalis: "Explain my latest blood test", "Which values are high?", "What meds am I taking?"'
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-text text-sm sm:text-base px-2 placeholder:text-text-muted"
            />
            <button
              type="submit"
              className="bg-primary hover:bg-primary-hover text-primary-contrast font-bold px-4 py-2 rounded-theme text-sm flex items-center space-x-1.5 transition-all"
            >
              <span>Ask</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* Pending Reviews Banner */}
      {pendingReviewCount > 0 && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-theme p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500 text-white rounded-full">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-amber-900 dark:text-amber-200">
                {pendingReviewCount} Document{pendingReviewCount > 1 ? 's' : ''} Awaiting Review
              </h4>
              <p className="text-xs text-amber-800 dark:text-amber-300">
                Verify AI-extracted values before committing to your permanent health profile.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('review')}
            className="px-3 py-1.5 rounded-theme bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center space-x-1"
          >
            <span>Review Center</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Card 1: Active Medications */}
        <div className="bg-surface rounded-theme p-5 border border-border shadow-theme flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 text-primary rounded-theme">
                  <Pill className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-text text-base">Active Medications</h3>
              </div>
              <span className="text-xs font-semibold bg-surface-2 px-2 py-0.5 rounded text-text-muted">
                {medications.length} Prescribed
              </span>
            </div>

            <div className="space-y-2.5">
              {medications.length === 0 ? (
                <p className="text-text-muted text-sm py-4">No active medications registered.</p>
              ) : (
                medications.slice(0, 3).map((m) => (
                  <div
                    key={m.id}
                    className="p-2.5 rounded-theme bg-surface-2 border border-border flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-text text-sm">{m.drug_name}</div>
                      <div className="text-xs text-text-muted">{m.dosage} • {m.frequency}</div>
                    </div>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                      Active
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('medications')}
            className="mt-4 pt-3 border-t border-border text-xs font-bold text-primary flex items-center justify-between hover:underline"
          >
            <span>View All Medications & Reminders</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 2: Latest Abnormal Values */}
        <div className="bg-surface rounded-theme p-5 border border-border shadow-theme flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/10 text-amber-600 rounded-theme">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-text text-base">Values Outside Range</h3>
              </div>
              <span className="text-xs font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded">
                Deterministic
              </span>
            </div>

            <div className="space-y-2.5">
              {abnormalObs.length === 0 ? (
                <div className="p-4 rounded-theme bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 text-sm flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>All extracted test values are within printed laboratory ranges.</span>
                </div>
              ) : (
                abnormalObs.map((obs) => (
                  <div
                    key={obs.id}
                    className="p-2.5 rounded-theme bg-surface-2 border border-border flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-text text-sm">{obs.test_name}</div>
                      <div className="text-xs text-text-muted">
                        Lab Range: {obs.reference_range || 'Standard'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-extrabold text-sm text-amber-600 dark:text-amber-400">
                        {obs.value} {obs.unit}
                      </div>
                      <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300">
                        {obs.flag}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="mt-4 pt-3 border-t border-border text-xs font-bold text-primary flex items-center justify-between hover:underline"
          >
            <span>View Lab Trend Charts & History</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Card 3: Upcoming Appointments */}
        <div className="bg-surface rounded-theme p-5 border border-border shadow-theme flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-primary/10 text-primary rounded-theme">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-text text-base">Doctor Visits</h3>
              </div>
            </div>

            <div className="space-y-2.5">
              {appointments.length === 0 ? (
                <p className="text-text-muted text-sm py-4">No upcoming appointments scheduled.</p>
              ) : (
                appointments.slice(0, 2).map((a) => (
                  <div
                    key={a.id}
                    className="p-3 rounded-theme bg-surface-2 border border-border"
                  >
                    <div className="font-bold text-text text-sm">{a.clinician_name}</div>
                    <div className="text-xs text-text-muted truncate">{a.facility}</div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="text-xs font-semibold text-primary flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{new Date(a.appointment_time).toLocaleDateString()}</span>
                      </div>
                      <button
                        onClick={() => onNavigate('appointments')}
                        className="text-[11px] font-bold bg-primary text-primary-contrast px-2 py-0.5 rounded shadow-sm"
                      >
                        Prepare Sheet
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate('appointments')}
            className="mt-4 pt-3 border-t border-border text-xs font-bold text-primary flex items-center justify-between hover:underline"
          >
            <span>Manage All Appointments</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Recent Health Documents Section */}
      <div className="bg-surface rounded-theme p-6 border border-border shadow-theme">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-bold text-lg text-text">Recent Medical Records</h3>
            <p className="text-xs text-text-muted">Prescriptions, diagnostic reports, and summaries</p>
          </div>
          <button
            onClick={() => onNavigate('records')}
            className="text-xs font-bold text-primary hover:underline flex items-center space-x-1"
          >
            <span>View All ({documents.length})</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="text-center py-8 text-text-muted">
            <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
            <p>No documents uploaded yet for this patient profile.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {documents.slice(0, 3).map((d) => (
              <div
                key={d.id}
                onClick={() => onNavigate('records')}
                className="p-3.5 rounded-theme bg-surface-2 border border-border hover:border-primary cursor-pointer transition-all flex flex-col justify-between"
              >
                <div className="flex items-start space-x-3">
                  <FileText className="w-5 h-5 text-primary mt-0.5" />
                  <div className="overflow-hidden">
                    <div className="font-semibold text-text text-sm truncate" title={d.original_filename}>
                      {d.original_filename}
                    </div>
                    <div className="text-xs text-text-muted capitalize">
                      {d.document_type.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                  <span className="text-text-muted">
                    {new Date(d.created_at).toLocaleDateString()}
                  </span>
                  <span
                    className={`font-semibold capitalize px-2 py-0.5 rounded text-[11px] ${
                      d.status === 'reviewed'
                        ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                        : 'bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {d.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
