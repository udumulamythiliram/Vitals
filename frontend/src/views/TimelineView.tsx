import React, { useState, useEffect } from 'react';
import { PatientProfile, TimelineEvent } from '../types';
import { api } from '../api';
import {
  Clock,
  FileText,
  Pill,
  TrendingUp,
  Calendar,
  ShieldCheck,
  Search,
  Filter,
  AlertTriangle
} from 'lucide-react';

interface TimelineViewProps {
  activePatient: PatientProfile | null;
  onOpenDocument?: (docId: string) => void;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  activePatient,
  onOpenDocument,
}) => {
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!activePatient) return;
    setLoading(true);
    api.getTimeline(activePatient.id)
      .then((evts) => setEvents(evts || []))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activePatient]);

  const filteredEvents = events.filter((e) => {
    const matchesFilter = filterType === 'all' || e.type === filterType;
    const matchesSearch =
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.subtitle.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'medication':
        return <Pill className="w-5 h-5 text-indigo-500" />;
      case 'lab_test':
        return <TrendingUp className="w-5 h-5 text-emerald-500" />;
      case 'appointment':
        return <Calendar className="w-5 h-5 text-amber-500" />;
      case 'vaccination':
        return <ShieldCheck className="w-5 h-5 text-purple-500" />;
      default:
        return <FileText className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text flex items-center space-x-2">
            <Clock className="w-5 h-5 text-primary" />
            <span>Unified Health Timeline</span>
          </h2>
          <p className="text-xs text-text-muted mt-0.5">
            Chronological aggregation of medications, lab observations, documents, and doctor encounters for {activePatient?.full_name}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search timeline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text focus:outline-none"
          />

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text font-semibold"
          >
            <option value="all">All Events</option>
            <option value="medication">Medications</option>
            <option value="lab_test">Lab Tests</option>
            <option value="document_upload">Documents</option>
            <option value="vaccination">Vaccinations</option>
            <option value="appointment">Appointments</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="p-12 text-center text-text-muted">Loading timeline records...</div>
      ) : filteredEvents.length === 0 ? (
        <div className="bg-surface rounded-theme p-12 border border-border text-center text-text-muted">
          <Clock className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No timeline events recorded yet for this profile.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-border ml-4 sm:ml-8 pl-6 space-y-6 py-2">
          {filteredEvents.map((evt) => {
            const isAbnormal = ['high', 'low', 'abnormal', 'critical_high', 'critical_low'].includes(evt.flag || '');

            return (
              <div key={evt.id} className="relative group">
                {/* Node icon dot */}
                <div className="absolute -left-[35px] top-1.5 w-8 h-8 rounded-full bg-surface border-2 border-border flex items-center justify-center shadow-sm">
                  {getEventIcon(evt.type)}
                </div>

                <div
                  className={`bg-surface rounded-theme p-4 border transition-all ${
                    isAbnormal
                      ? 'border-amber-400 bg-amber-50/30 dark:bg-amber-950/20'
                      : 'border-border hover:border-primary'
                  } shadow-theme`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <div className="font-bold text-text text-base flex items-center space-x-2">
                      <span>{evt.title}</span>
                      {isAbnormal && (
                        <span className="text-[10px] uppercase font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded">
                          {evt.flag}
                        </span>
                      )}
                    </div>

                    <span className="text-xs text-text-muted font-mono">
                      {new Date(evt.date).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-xs text-text-muted mt-1">{evt.subtitle}</p>

                  {evt.source_id && (
                    <div className="mt-3 pt-2 border-t border-border/50 flex items-center justify-between text-xs">
                      <span className="text-text-muted">Grounded Source:</span>
                      <button
                        onClick={() => onOpenDocument && onOpenDocument(evt.source_id!)}
                        className="text-primary hover:underline font-semibold"
                      >
                        {evt.doc_name || 'View Source Document'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
