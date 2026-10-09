import React, { useState, useEffect } from 'react';
import { PatientProfile, Appointment } from '../types';
import { api } from '../api';
import {
  Calendar,
  Plus,
  Sparkles,
  Printer,
  Clock,
  User,
  MapPin,
  CheckCircle2,
  FileText
} from 'lucide-react';

interface AppointmentsViewProps {
  activePatient: PatientProfile | null;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({ activePatient }) => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [prepSheet, setPrepSheet] = useState<any>(null);
  const [loadingPrep, setLoadingPrep] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New appointment form state
  const [clinician, setClinician] = useState('');
  const [facility, setFacility] = useState('');
  const [time, setTime] = useState('');
  const [notes, setNotes] = useState('');

  const loadAppointments = () => {
    if (!activePatient) return;
    setLoading(true);
    api.getAppointments(activePatient.id)
      .then((apts) => setAppointments(apts || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAppointments();
  }, [activePatient]);

  const handleGeneratePrep = async (aptId: string) => {
    setLoadingPrep(true);
    try {
      const res = await api.generatePrepSheet(aptId);
      setPrepSheet(res.prep_sheet);
    } catch (err: any) {
      alert(err.message || 'Failed to generate prep sheet');
    } finally {
      setLoadingPrep(false);
    }
  };

  const handleCreateAppointment = async () => {
    if (!clinician.trim() || !activePatient) return;
    try {
      await api.createAppointment({
        patient_id: activePatient.id,
        clinician_name: clinician,
        facility: facility || 'Clinic',
        appointment_time: time || new Date().toISOString(),
        notes,
      });
      setShowAddModal(false);
      setClinician('');
      setFacility('');
      setNotes('');
      loadAppointments();
    } catch (err: any) {
      alert(err.message || 'Failed to create appointment');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Doctor Appointments & AI Visit Prep</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Organize upcoming consultations and synthesize one-page briefing sheets for {activePatient?.full_name}.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs flex items-center space-x-1.5 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Schedule Visit</span>
        </button>
      </div>

      {/* Appointments List */}
      <div className="bg-surface rounded-theme border border-border overflow-hidden shadow-theme">
        <div className="p-4 bg-surface-2 border-b border-border">
          <h3 className="font-bold text-text text-base">Scheduled Doctor Visits</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-text-muted">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>No appointments scheduled yet for this patient.</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {appointments.map((a) => (
              <div
                key={a.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-surface-2/30 transition-colors"
              >
                <div>
                  <div className="font-bold text-text text-lg flex items-center space-x-2">
                    <span>{a.clinician_name}</span>
                    <span className="text-[11px] font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded capitalize">
                      {a.status}
                    </span>
                  </div>

                  <div className="text-sm text-text-muted mt-1 flex flex-wrap gap-x-4 gap-y-1">
                    <span className="flex items-center space-x-1">
                      <MapPin className="w-4 h-4 text-text-muted" />
                      <span>{a.facility}</span>
                    </span>
                    <span className="flex items-center space-x-1 font-mono">
                      <Clock className="w-4 h-4 text-text-muted" />
                      <span>{new Date(a.appointment_time).toLocaleString()}</span>
                    </span>
                  </div>

                  {a.notes && <p className="text-xs text-text mt-2">Notes: {a.notes}</p>}
                </div>

                <button
                  onClick={() => handleGeneratePrep(a.id)}
                  disabled={loadingPrep}
                  className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs flex items-center space-x-1.5 shadow-sm transition-all whitespace-nowrap"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Prepare Visit Sheet</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Printable AI Visit Prep Sheet */}
      {prepSheet && (
        <div className="bg-surface rounded-theme border-2 border-primary/30 p-6 shadow-xl animate-in zoom-in-95">
          <div className="flex items-center justify-between pb-4 border-b border-border">
            <div>
              <div className="text-xs font-bold text-primary uppercase tracking-wider">
                Doctor Consultation Briefing Sheet
              </div>
              <h3 className="font-extrabold text-xl text-text">
                Prepared for {prepSheet.appointment?.clinician_name}
              </h3>
              <p className="text-xs text-text-muted">
                Patient: {activePatient?.full_name} • Date: {new Date(prepSheet.appointment?.appointment_time).toLocaleDateString()}
              </p>
            </div>

            <button
              onClick={() => window.print()}
              className="px-3 py-1.5 rounded-theme bg-surface-2 hover:bg-border text-text font-bold text-xs flex items-center space-x-1.5 border border-border"
            >
              <Printer className="w-4 h-4" />
              <span>Print / Save PDF</span>
            </button>
          </div>

          <div className="mt-5 space-y-4 text-sm">
            {/* Medications */}
            <div className="p-4 rounded-theme bg-surface-2 border border-border">
              <h4 className="font-bold text-text mb-2 flex items-center space-x-1.5">
                <FileText className="w-4 h-4 text-primary" />
                <span>Verified Active Medications</span>
              </h4>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                {prepSheet.active_medications?.map((m: any, i: number) => (
                  <li key={i}>
                    <strong>{m.drug_name}</strong> {m.dosage} — {m.frequency} ({m.instructions})
                  </li>
                ))}
              </ul>
            </div>

            {/* Abnormal findings */}
            <div className="p-4 rounded-theme bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 text-amber-950 dark:text-amber-100">
              <h4 className="font-bold mb-2">Recent Values Outside Lab Range</h4>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                {prepSheet.abnormal_findings?.map((o: any, i: number) => (
                  <li key={i}>
                    <strong>{o.test_name}</strong>: {o.value} {o.unit} (Printed Ref: {o.reference_range}) on {o.collection_date}
                  </li>
                ))}
              </ul>
            </div>

            {/* Suggested Doctor Questions */}
            <div className="p-4 rounded-theme bg-surface-2 border border-border">
              <h4 className="font-bold text-text mb-2">Key Questions to Ask During Consultation</h4>
              <ul className="list-decimal pl-5 space-y-1.5 text-xs text-text">
                {prepSheet.questions_for_doctor?.map((q: string, i: number) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Visit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-theme border border-border shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-text">Schedule Doctor Visit</h3>
            <p className="text-xs text-text-muted mt-0.5">For {activePatient?.full_name}</p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Clinician / Doctor Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. K. V. Reddy, Cardiologist"
                  value={clinician}
                  onChange={(e) => setClinician(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Hospital / Facility</label>
                <input
                  type="text"
                  placeholder="e.g. Apollo Hospitals, Jubilee Hills"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Date & Time</label>
                <input
                  type="datetime-local"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Reason / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Routine blood pressure check & lab review"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text focus:outline-none"
                />
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
                onClick={handleCreateAppointment}
                className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs"
              >
                Schedule Appointment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
