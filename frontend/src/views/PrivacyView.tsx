import React, { useState, useEffect } from 'react';
import { PatientProfile } from '../types';
import { api } from '../api';
import {
  Shield,
  Download,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Lock,
  FileCode,
  Link,
  AlertTriangle,
  Clock
} from 'lucide-react';

interface PrivacyViewProps {
  activePatient: PatientProfile | null;
}

export const PrivacyView: React.FC<PrivacyViewProps> = ({ activePatient }) => {
  const [fhirBundle, setFhirBundle] = useState<any>(null);
  const [loadingFhir, setLoadingFhir] = useState(false);
  const [auditEvents, setAuditEvents] = useState<any[]>([]);
  const [consentInfo, setConsentInfo] = useState<any>(null);

  // ABHA Mock State
  const [abhaAddress, setAbhaAddress] = useState('ram@abdm');
  const [abhaLinked, setAbhaLinked] = useState<any>(null);

  useEffect(() => {
    api.getAuditTrail().then((a) => setAuditEvents(a || []));
    api.getConsent().then((c) => setConsentInfo(c || null));
  }, []);

  const handleExportFhir = async () => {
    if (!activePatient) return;
    setLoadingFhir(true);
    try {
      const bundle = await api.exportFhir(activePatient.id);
      setFhirBundle(bundle);
    } catch (err: any) {
      alert(err.message || 'FHIR export failed');
    } finally {
      setLoadingFhir(false);
    }
  };

  const handleDownloadFhirJson = () => {
    if (!fhirBundle) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(fhirBundle, null, 2));
    const dl = document.createElement('a');
    dl.setAttribute('href', dataStr);
    dl.setAttribute('download', `fhir-bundle-${activePatient?.id}.json`);
    dl.click();
  };

  const handleLinkAbha = async () => {
    if (!activePatient) return;
    try {
      const res = await api.linkAbhaMock(activePatient.id, abhaAddress);
      setAbhaLinked(res);
    } catch (err: any) {
      alert(err.message || 'ABHA link failed');
    }
  };

  const handleExportAll = async () => {
    try {
      const data = await api.exportAllData();
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
      const dl = document.createElement('a');
      dl.setAttribute('href', dataStr);
      dl.setAttribute('download', `vitalis-complete-backup.json`);
      dl.click();
    } catch (err: any) {
      alert(err.message || 'Export failed');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center space-x-2">
            <Shield className="w-5 h-5 text-primary" />
            <span>Privacy, FHIR R4 & ABDM Readiness</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            GDPR/DPDP patient data rights, HL7 FHIR interoperability bundle export, and audit log.
          </p>
        </div>

        <button
          onClick={handleExportAll}
          className="px-4 py-2 rounded-theme bg-surface-2 hover:bg-border text-text font-bold text-xs flex items-center space-x-1.5 border border-border"
        >
          <Download className="w-4 h-4 text-primary" />
          <span>Export All Data (JSON)</span>
        </button>
      </div>

      {/* HL7 FHIR R4 Bundle Exporter */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
          <div>
            <h3 className="font-bold text-base text-text flex items-center space-x-2">
              <FileCode className="w-5 h-5 text-primary" />
              <span>HL7 FHIR R4 Bundle Generator</span>
            </h3>
            <p className="text-xs text-text-muted mt-0.5">
              Converts {activePatient?.full_name}'s verified records into valid FHIR Patient, Observation, and MedicationRequest resources.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportFhir}
              disabled={loadingFhir}
              className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs shadow-sm"
            >
              {loadingFhir ? 'Generating Bundle...' : 'Generate FHIR Bundle'}
            </button>

            {fhirBundle && (
              <button
                onClick={handleDownloadFhirJson}
                className="px-3 py-2 rounded-theme bg-surface-2 hover:bg-border text-text font-bold text-xs flex items-center space-x-1 border border-border"
              >
                <Download className="w-4 h-4 text-primary" />
                <span>Download .JSON</span>
              </button>
            )}
          </div>
        </div>

        {fhirBundle && (
          <div className="mt-4 space-y-3">
            <div className="p-3 bg-surface-2 rounded-theme border border-border flex items-center justify-between text-xs">
              <span className="font-bold text-text">
                Bundle Type: {fhirBundle.type} • Total Resources: {fhirBundle.entry?.length || 0}
              </span>
              <span className="text-text-muted font-mono">{fhirBundle.id}</span>
            </div>

            <div className="max-h-64 overflow-y-auto p-4 bg-surface-2 rounded-theme font-mono text-xs text-text border border-border">
              <pre>{JSON.stringify(fhirBundle, null, 2)}</pre>
            </div>
          </div>
        )}
      </div>

      {/* ABDM / ABHA ID Mock Link */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme">
        <div className="pb-3 border-b border-border">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-text flex items-center space-x-2">
              <Link className="w-5 h-5 text-primary" />
              <span>Ayushman Bharat Health Account (ABHA / ABDM) Integration</span>
            </h3>
            <span className="text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded border border-amber-300">
              Simulated Mock Mode
            </span>
          </div>
          <p className="text-xs text-text-muted mt-1">
            Simulate linking an Indian 14-digit ABHA ID or PHR address with synthetic test credentials.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="e.g. ram@abdm"
            value={abhaAddress}
            onChange={(e) => setAbhaAddress(e.target.value)}
            className="bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text font-mono w-64"
          />

          <button
            onClick={handleLinkAbha}
            className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs"
          >
            Link ABHA ID
          </button>
        </div>

        {abhaLinked && (
          <div className="mt-4 p-4 rounded-theme bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 text-emerald-900 dark:text-emerald-100 text-xs">
            <div className="font-bold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Successfully Linked Synthetic ABHA ID: {abhaLinked.abha_number}</span>
            </div>
            <p className="mt-1 opacity-90">{abhaLinked.disclaimer}</p>
          </div>
        )}
      </div>

      {/* Audit Log Trail */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme">
        <div className="pb-3 border-b border-border">
          <h3 className="font-bold text-base text-text flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>Immutable Privacy & Access Audit Trail</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Log of user accesses, data exports, uploads, and AI queries.
          </p>
        </div>

        <div className="mt-4 max-h-56 overflow-y-auto divide-y divide-border">
          {auditEvents.map((evt) => (
            <div key={evt.id} className="py-2.5 flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-text uppercase tracking-wider">{evt.action}</span>
                <span className="text-text-muted ml-2">Target: {evt.target_type} ({evt.target_id || 'Global'})</span>
              </div>
              <span className="text-text-muted font-mono">{new Date(evt.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
