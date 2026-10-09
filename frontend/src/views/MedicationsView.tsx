import React, { useState, useEffect } from 'react';
import { PatientProfile, Medication } from '../types';
import { api } from '../api';
import {
  Pill,
  Clock,
  CheckCircle2,
  XCircle,
  Plus,
  AlertCircle,
  Bell,
  Calendar,
  Check,
  ShieldCheck
} from 'lucide-react';

interface MedicationsViewProps {
  activePatient: PatientProfile | null;
  elderlyMode?: boolean;
}

export const MedicationsView: React.FC<MedicationsViewProps> = ({
  activePatient,
  elderlyMode = false,
}) => {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedMessage, setLoggedMessage] = useState<string | null>(null);

  // New med modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newDrug, setNewDrug] = useState('');
  const [newDose, setNewDose] = useState('');
  const [newFreq, setNewFreq] = useState('Once daily');

  const loadData = () => {
    if (!activePatient) return;
    setLoading(true);
    Promise.all([
      api.getMedications(activePatient.id),
      api.getReminders(activePatient.id)
    ])
      .then(([meds, rems]) => {
        setMedications(meds || []);
        setReminders(rems || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [activePatient]);

  const handleLogAdherence = async (medId: string, status: 'taken' | 'skipped') => {
    try {
      await api.logAdherence({ medication_id: medId, status });
      setLoggedMessage(`Marked as ${status.toUpperCase()}!`);
      setTimeout(() => setLoggedMessage(null), 2500);
    } catch (err: any) {
      alert(err.message || 'Error logging adherence');
    }
  };

  const handleAddMed = async () => {
    if (!newDrug.trim() || !activePatient) return;
    try {
      await api.addMedication({
        patient_id: activePatient.id,
        drug_name: newDrug,
        dosage: newDose || 'As directed',
        frequency: newFreq,
      });
      setShowAddModal(false);
      setNewDrug('');
      setNewDose('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to add medication');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Disclaimer Notice */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded-theme p-4 flex items-start space-x-3 text-xs text-amber-900 dark:text-amber-200">
        <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
        <div>
          <span className="font-bold">Clinical Safety Notice: </span>
          Vitalis AI organizes recorded medication schedules for informational assistance. It does not evaluate clinical appropriateness, drug interactions, or adjust dosages. Always consult your prescriber or pharmacist before changing any regimen.
        </div>
      </div>

      {/* Header and Add Action */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center space-x-2">
            <Pill className="w-5 h-5 text-primary" />
            <span>Medications & Schedule</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Active and verified prescriptions for {activePatient?.full_name}.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className={`px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs flex items-center space-x-1.5 shadow-sm ${
            elderlyMode ? 'py-3 text-base' : ''
          }`}
        >
          <Plus className="w-4 h-4" />
          <span>Add Medication</span>
        </button>
      </div>

      {loggedMessage && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded text-xs flex items-center space-x-2 border border-emerald-300">
          <CheckCircle2 className="w-4 h-4" />
          <span>{loggedMessage}</span>
        </div>
      )}

      {/* Reminders Row */}
      {reminders.length > 0 && (
        <div className="bg-surface rounded-theme p-4 border border-border shadow-theme">
          <div className="flex items-center space-x-2 text-sm font-bold text-text mb-3">
            <Bell className="w-4 h-4 text-primary" />
            <span>Scheduled Daily Reminders</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="p-3 rounded-theme bg-surface-2 border border-border flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-text text-sm">{r.title}</div>
                  <div className="text-xs text-text-muted">Repeat: {r.repeat_pattern}</div>
                </div>
                <div className="font-mono text-sm font-bold text-primary bg-surface px-2 py-1 rounded border border-border">
                  {r.reminder_time}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications List */}
      <div className="bg-surface rounded-theme border border-border overflow-hidden shadow-theme">
        <div className="p-4 bg-surface-2 border-b border-border">
          <h3 className="font-bold text-text text-base">Current Medication Regimen</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading medications...</div>
        ) : medications.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            <Pill className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No active medications found for this profile.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {medications.map((m) => (
              <div
                key={m.id}
                className={`p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-2/30 transition-colors ${
                  elderlyMode ? 'p-6' : ''
                }`}
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-extrabold text-text text-lg sm:text-xl">
                      {m.drug_name}
                    </span>
                    <span className="text-xs bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 uppercase">
                      {m.status}
                    </span>
                  </div>

                  <div className="text-sm text-text-muted mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="font-semibold text-text">Dose: {m.dosage}</span>
                    <span>Frequency: {m.frequency}</span>
                    <span>Instructions: {m.instructions}</span>
                  </div>

                  {m.source_doc_name && (
                    <div className="text-xs text-text-muted mt-1.5">
                      Grounded Source: <span className="font-medium text-text">{m.source_doc_name}</span>
                    </div>
                  )}
                </div>

                {/* Adherence Check Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleLogAdherence(m.id, 'taken')}
                    className={`px-4 py-2 rounded-theme bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all ${
                      elderlyMode ? 'py-3 px-5 text-base' : ''
                    }`}
                  >
                    <Check className="w-4 h-4" />
                    <span>Take Now</span>
                  </button>

                  <button
                    onClick={() => handleLogAdherence(m.id, 'skipped')}
                    className={`px-3 py-2 rounded-theme bg-surface-2 hover:bg-border text-text font-bold text-xs border border-border flex items-center space-x-1 transition-all ${
                      elderlyMode ? 'py-3 px-4 text-base' : ''
                    }`}
                  >
                    <XCircle className="w-4 h-4 text-text-muted" />
                    <span>Skip</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Medication Dialog */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-theme border border-border shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-text">Add Prescription Medication</h3>
            <p className="text-xs text-text-muted mt-0.5">For {activePatient?.full_name}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Drug Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Metformin, Telmisartan"
                  value={newDrug}
                  onChange={(e) => setNewDrug(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Dosage *</label>
                <input
                  type="text"
                  placeholder="e.g. 500 mg, 1 tablet"
                  value={newDose}
                  onChange={(e) => setNewDose(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Frequency</label>
                <select
                  value={newFreq}
                  onChange={(e) => setNewFreq(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text focus:outline-none"
                >
                  <option value="Once daily">Once daily (OD)</option>
                  <option value="Twice daily">Twice daily (BD)</option>
                  <option value="Three times daily">Three times daily (TDS)</option>
                  <option value="At bedtime">At bedtime (HS)</option>
                  <option value="As needed">As needed (PRN)</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-theme bg-surface-2 hover:bg-border text-text font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleAddMed}
                className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs"
              >
                Save Medication
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
