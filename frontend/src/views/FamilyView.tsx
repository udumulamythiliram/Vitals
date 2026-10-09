import React, { useState, useEffect } from 'react';
import { PatientProfile } from '../types';
import { api } from '../api';
import {
  Users2,
  UserPlus,
  Shield,
  Heart,
  Baby,
  CheckCircle2,
  Mail,
  ChevronRight,
  Lock
} from 'lucide-react';

interface FamilyViewProps {
  patients: PatientProfile[];
  activePatient: PatientProfile | null;
  onSelectPatient: (patientId: string) => void;
  onRefreshPatients: () => void;
}

export const FamilyView: React.FC<FamilyViewProps> = ({
  patients,
  activePatient,
  onSelectPatient,
  onRefreshPatients,
}) => {
  const [caregivers, setCaregivers] = useState<any[]>([]);
  const [showAddPatientModal, setShowAddPatientModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);

  // New patient state
  const [name, setName] = useState('');
  const [relation, setRelation] = useState<'child' | 'parent' | 'dependent'>('child');
  const [ageGroup, setAgeGroup] = useState<'child' | 'elderly' | 'adult'>('child');
  const [dob, setDob] = useState('');

  // New caregiver state
  const [cgName, setCgName] = useState('');
  const [cgEmail, setCgEmail] = useState('');
  const [permissions, setPermissions] = useState<string[]>([
    'view_records',
    'view_medications',
    'receive_reminders'
  ]);

  useEffect(() => {
    if (!activePatient) return;
    api.getCaregivers(activePatient.id).then((cg) => setCaregivers(cg || []));
  }, [activePatient]);

  const handleCreatePatient = async () => {
    if (!name.trim()) return;
    try {
      await api.createPatient({
        full_name: name,
        relationship: relation,
        age_group: ageGroup,
        date_of_birth: dob || undefined,
      });
      setShowAddPatientModal(false);
      setName('');
      onRefreshPatients();
    } catch (err: any) {
      alert(err.message || 'Failed to create patient');
    }
  };

  const handleInviteCaregiver = async () => {
    if (!cgEmail.trim() || !activePatient) return;
    try {
      await api.inviteCaregiver(activePatient.id, {
        caregiver_name: cgName || 'Caregiver',
        caregiver_email: cgEmail,
        permissions,
      });
      setShowInviteModal(false);
      setCgEmail('');
      setCgName('');
      api.getCaregivers(activePatient.id).then((cg) => setCaregivers(cg || []));
    } catch (err: any) {
      alert(err.message || 'Failed to invite caregiver');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center space-x-2">
            <Users2 className="w-5 h-5 text-primary" />
            <span>Family, Children & Caregiver Sharing</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Manage guardian-linked children, elderly parents, and granular caregiver permissions.
          </p>
        </div>

        <button
          onClick={() => setShowAddPatientModal(true)}
          className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs flex items-center space-x-1.5 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Profiles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {patients.map((p) => {
          const isActive = p.id === activePatient?.id;
          return (
            <div
              key={p.id}
              className={`p-4 rounded-theme border transition-all ${
                isActive
                  ? 'bg-primary/5 border-primary shadow-md'
                  : 'bg-surface border-border hover:border-primary/50'
              } flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-10 h-10 rounded-full bg-surface-2 flex items-center justify-center font-bold text-primary">
                    {p.relationship === 'child' ? <Baby className="w-5 h-5" /> : p.full_name.charAt(0)}
                  </div>
                  {isActive && (
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                      Active
                    </span>
                  )}
                </div>

                <div className="font-bold text-text text-base">{p.full_name}</div>
                <div className="text-xs text-text-muted capitalize">
                  {p.relationship} • {p.age_group} • {p.gender}
                </div>

                <div className="text-xs text-text-muted mt-2 pt-2 border-t border-border/50">
                  <div>Allergies: <span className="font-medium text-text">{p.allergies || 'None'}</span></div>
                  <div>Conditions: <span className="font-medium text-text">{p.chronic_conditions || 'None'}</span></div>
                </div>
              </div>

              <button
                onClick={() => onSelectPatient(p.id)}
                disabled={isActive}
                className={`mt-4 w-full py-1.5 rounded-theme font-bold text-xs transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-contrast opacity-90 cursor-default'
                    : 'bg-surface-2 hover:bg-border text-text'
                }`}
              >
                {isActive ? 'Currently Active' : 'Switch to Profile'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Caregiver Access Section */}
      <div className="bg-surface rounded-theme border border-border p-5 shadow-theme">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-3">
          <div>
            <h3 className="font-bold text-base text-text flex items-center space-x-2">
              <Shield className="w-5 h-5 text-primary" />
              <span>Caregiver Access for {activePatient?.full_name}</span>
            </h3>
            <p className="text-xs text-text-muted">
              Explicit, revocable sharing with family doctors, spouses, or professional caretakers.
            </p>
          </div>

          <button
            onClick={() => setShowInviteModal(true)}
            className="px-3 py-1.5 rounded-theme bg-surface-2 hover:bg-border text-text font-bold text-xs flex items-center space-x-1.5 border border-border"
          >
            <Mail className="w-4 h-4 text-primary" />
            <span>Invite Caregiver</span>
          </button>
        </div>

        <div className="mt-4">
          {caregivers.length === 0 ? (
            <p className="text-text-muted text-xs py-4">No external caregivers linked to this profile.</p>
          ) : (
            <div className="divide-y divide-border">
              {caregivers.map((cg) => (
                <div key={cg.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-text text-sm">{cg.caregiver_name}</div>
                    <div className="text-xs text-text-muted font-mono">{cg.caregiver_email}</div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded border border-emerald-300">
                    Consent Active
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Family Member Modal */}
      {showAddPatientModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-theme border border-border shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-text">Add Dependent Profile</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Guardian-managed profile with complete data isolation.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Baby Aarav or Parent Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Relationship</label>
                <select
                  value={relation}
                  onChange={(e) => {
                    const val = e.target.value as any;
                    setRelation(val);
                    if (val === 'child') setAgeGroup('child');
                    if (val === 'parent') setAgeGroup('elderly');
                  }}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text focus:outline-none"
                >
                  <option value="child">Child (Guardian Managed)</option>
                  <option value="parent">Elderly Parent</option>
                  <option value="dependent">Dependent / Other</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Date of Birth</label>
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => setShowAddPatientModal(false)}
                className="px-4 py-2 rounded-theme bg-surface-2 hover:bg-border text-text font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePatient}
                className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs"
              >
                Create Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Caregiver Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-surface rounded-theme border border-border shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95">
            <h3 className="font-bold text-lg text-text">Invite Caregiver</h3>
            <p className="text-xs text-text-muted mt-0.5">
              Send an invite with scoped permissions for {activePatient?.full_name}.
            </p>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Caregiver Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Rao / Nurse Sarah"
                  value={cgName}
                  onChange={(e) => setCgName(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-text mb-1 block">Email Address *</label>
                <input
                  type="email"
                  placeholder="caregiver@email.com"
                  value={cgEmail}
                  onChange={(e) => setCgEmail(e.target.value)}
                  className="w-full bg-surface-2 border border-border rounded p-2 text-sm text-text focus:outline-none"
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end space-x-2">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 rounded-theme bg-surface-2 hover:bg-border text-text font-bold text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleInviteCaregiver}
                className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs"
              >
                Send Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
