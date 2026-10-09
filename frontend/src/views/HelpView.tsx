import React from 'react';
import {
  HelpCircle,
  Phone,
  ShieldAlert,
  AlertTriangle,
  Info,
  CheckCircle2,
  HeartHandshake
} from 'lucide-react';

export const HelpView: React.FC = () => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Emergency Call Box */}
      <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-500 rounded-theme p-6 text-red-950 dark:text-red-100 shadow-theme">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2.5 bg-red-600 text-white rounded-full">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-red-900 dark:text-red-100">
              Immediate Emergency Guidance
            </h2>
            <p className="text-sm text-red-700 dark:text-red-300">
              If experiencing acute symptoms such as chest pain, severe shortness of breath, stroke signs or severe bleeding:
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="bg-white/80 dark:bg-black/30 p-4 rounded-theme border border-red-200 dark:border-red-800 text-center">
            <div className="text-xs uppercase font-bold text-red-600 dark:text-red-400">India Emergency</div>
            <a href="tel:112" className="text-2xl font-extrabold text-red-700 dark:text-red-200 hover:underline block mt-1">
              Dial 112
            </a>
            <div className="text-[11px] text-text-muted mt-0.5">Ambulance: 102</div>
          </div>

          <div className="bg-white/80 dark:bg-black/30 p-4 rounded-theme border border-red-200 dark:border-red-800 text-center">
            <div className="text-xs uppercase font-bold text-red-600 dark:text-red-400">Mental Health (India)</div>
            <a href="tel:18005990019" className="text-lg font-bold text-red-700 dark:text-red-200 hover:underline block mt-1">
              1800-599-0019
            </a>
            <div className="text-[11px] text-text-muted mt-0.5">Kiran 24/7 Helpline</div>
          </div>

          <div className="bg-white/80 dark:bg-black/30 p-4 rounded-theme border border-red-200 dark:border-red-800 text-center">
            <div className="text-xs uppercase font-bold text-red-600 dark:text-red-400">US / Canada Emergency</div>
            <a href="tel:911" className="text-2xl font-extrabold text-red-700 dark:text-red-200 hover:underline block mt-1">
              Dial 911
            </a>
            <div className="text-[11px] text-text-muted mt-0.5">Suicide Crisis: 988</div>
          </div>
        </div>

        <div className="text-xs text-red-800 dark:text-red-300">
          <strong>Important:</strong> Vitalis AI is an informational tool and cannot dispatch emergency medical personnel or provide acute medical care.
        </div>
      </div>

      {/* Product Disclaimers & Safety Rules */}
      <div className="bg-surface rounded-theme p-6 border border-border shadow-theme space-y-4">
        <h3 className="font-bold text-lg text-text flex items-center space-x-2">
          <Info className="w-5 h-5 text-primary" />
          <span>Product Safety Principles & Limitations</span>
        </h3>

        <div className="space-y-3 text-sm text-text-muted leading-relaxed">
          <div className="p-3.5 bg-surface-2 rounded-theme border border-border">
            <strong className="text-text block mb-1">1. Not a Replacement for a Licensed Clinician</strong>
            Vitalis AI is designed to help you organize, extract, and understand your existing medical records. It does not replace the professional clinical judgment, diagnosis, or advice of a physician.
          </div>

          <div className="p-3.5 bg-surface-2 rounded-theme border border-border">
            <strong className="text-text block mb-1">2. No Autonomous Diagnoses or Dosage Alterations</strong>
            The platform will never definitively diagnose a condition from an abnormal test value, nor will it advise changing, increasing, or discontinuing prescription doses.
          </div>

          <div className="p-3.5 bg-surface-2 rounded-theme border border-border">
            <strong className="text-text block mb-1">3. Deterministic Clinical Lab Logic</strong>
            Abnormal value flags (High, Low, Critical) are computed through deterministic boundary code using the lab's printed reference range. The LLM only explains what the test generally measures.
          </div>

          <div className="p-3.5 bg-surface-2 rounded-theme border border-border">
            <strong className="text-text block mb-1">4. Human Review & Data Integrity</strong>
            All OCR-extracted fields undergo human review before being committed to your permanent health timeline.
          </div>
        </div>
      </div>
    </div>
  );
};
