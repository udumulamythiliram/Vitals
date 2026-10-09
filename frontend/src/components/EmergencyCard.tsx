import React from 'react';
import { PatientProfile } from '../types';
import { AlertTriangle, Phone, ShieldAlert, HeartPulse, X } from 'lucide-react';

interface EmergencyCardProps {
  patient: PatientProfile | null;
  onClose?: () => void;
}

export const EmergencyCard: React.FC<EmergencyCardProps> = ({ patient, onClose }) => {
  if (!patient) return null;

  return (
    <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-theme p-4 text-red-950 dark:text-red-100 shadow-theme relative animate-in fade-in">
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-red-700 hover:text-red-900 dark:text-red-300"
          aria-label="Close emergency card"
        >
          <X className="w-5 h-5" />
        </button>
      )}

      <div className="flex items-center space-x-3 mb-3">
        <div className="p-2 bg-red-600 text-white rounded-full">
          <ShieldAlert className="w-6 h-6 animate-pulse" />
        </div>
        <div>
          <h3 className="text-xl font-bold tracking-tight text-red-900 dark:text-red-200">
            Emergency Health Summary
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300">
            {patient.full_name} ({patient.gender}, {patient.age_group.toUpperCase()})
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div className="bg-white/80 dark:bg-black/30 p-3 rounded-md border border-red-200 dark:border-red-800">
          <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
            Blood Group
          </div>
          <div className="text-lg font-bold">{patient.blood_group || 'Unknown'}</div>
        </div>

        <div className="bg-white/80 dark:bg-black/30 p-3 rounded-md border border-red-200 dark:border-red-800">
          <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
            Allergies
          </div>
          <div className="text-sm font-semibold text-red-700 dark:text-red-300">
            {patient.allergies || 'No known allergies'}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-black/30 p-3 rounded-md border border-red-200 dark:border-red-800">
          <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
            Chronic Conditions
          </div>
          <div className="text-sm font-medium">
            {patient.chronic_conditions || 'None recorded'}
          </div>
        </div>

        <div className="bg-white/80 dark:bg-black/30 p-3 rounded-md border border-red-200 dark:border-red-800">
          <div className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
            Emergency Contact
          </div>
          <div className="text-sm font-bold">
            {patient.emergency_contact_name || 'Not configured'}
          </div>
          <div className="text-sm text-red-600 font-mono">
            {patient.emergency_contact_phone || 'N/A'}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-red-200 dark:border-red-800">
        <a
          href="tel:112"
          className="flex-1 min-h-[48px] bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-md flex items-center justify-center space-x-2 text-center"
        >
          <Phone className="w-5 h-5" />
          <span>Call 112 (India Emergency)</span>
        </a>

        {patient.emergency_contact_phone && (
          <a
            href={`tel:${patient.emergency_contact_phone}`}
            className="flex-1 min-h-[48px] bg-white dark:bg-gray-900 border-2 border-red-600 text-red-700 dark:text-red-300 font-bold px-4 py-2 rounded-md flex items-center justify-center space-x-2"
          >
            <HeartPulse className="w-5 h-5" />
            <span>Call Contact</span>
          </a>
        )}
      </div>
    </div>
  );
};
