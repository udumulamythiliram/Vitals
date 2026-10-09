import React, { useState, useEffect } from 'react';
import { PatientProfile, DocumentItem } from '../types';
import { api } from '../api';
import {
  TrendingUp,
  FileText,
  Activity,
  Plus,
  ArrowRight,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea
} from 'recharts';

interface ReportsViewProps {
  activePatient: PatientProfile | null;
}

export const ReportsView: React.FC<ReportsViewProps> = ({ activePatient }) => {
  const [trends, setTrends] = useState<any[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedTest, setSelectedTest] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Comparison state
  const [doc1, setDoc1] = useState<string>('');
  const [doc2, setDoc2] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [loadingComparison, setLoadingComparison] = useState(false);

  // Vitals state
  const [vitals, setVitals] = useState<any[]>([]);
  const [vitalType, setVitalType] = useState('blood_pressure');
  const [vitalVal, setVitalVal] = useState('');
  const [vitalVal2, setVitalVal2] = useState('');

  useEffect(() => {
    if (!activePatient) return;
    setLoading(true);

    Promise.all([
      api.getLabTrends(activePatient.id),
      api.getDocuments(activePatient.id),
      api.getVitals(activePatient.id)
    ])
      .then(([trnds, docs, vts]) => {
        setTrends(trnds || []);
        if (trnds && trnds.length > 0) {
          setSelectedTest(trnds[0].test_name);
        }
        setDocuments(docs || []);
        if (docs && docs.length >= 2) {
          setDoc1(docs[0].id);
          setDoc2(docs[1].id);
        }
        setVitals(vts || []);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [activePatient]);

  const activeTrendData = trends.find((t) => t.test_name === selectedTest);

  const handleCompare = async () => {
    if (!doc1 || !doc2 || !activePatient) return;
    setLoadingComparison(true);
    try {
      const res = await api.compareReports(activePatient.id, doc1, doc2);
      setComparisonData(res);
    } catch (err: any) {
      alert(err.message || 'Comparison failed');
    } finally {
      setLoadingComparison(false);
    }
  };

  const handleLogVital = async () => {
    if (!vitalVal || !activePatient) return;
    try {
      await api.logVital({
        patient_id: activePatient.id,
        measurement_type: vitalType,
        value: parseFloat(vitalVal),
        value_secondary: vitalVal2 ? parseFloat(vitalVal2) : undefined,
        unit: vitalType === 'blood_pressure' ? 'mmHg' : vitalType === 'glucose' ? 'mg/dL' : 'kg',
      });
      setVitalVal('');
      setVitalVal2('');
      const updated = await api.getVitals(activePatient.id);
      setVitals(updated || []);
    } catch (err: any) {
      alert(err.message || 'Failed to log measurement');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme">
        <h2 className="text-xl font-bold text-text flex items-center space-x-2">
          <TrendingUp className="w-5 h-5 text-primary" />
          <span>Reports, Lab Trends & Multi-Report Comparison</span>
        </h2>
        <p className="text-xs text-text-muted mt-0.5">
          Track clinical test trajectory over time against reference bands for {activePatient?.full_name}.
        </p>
      </div>

      {/* Chart Section */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-4">
          <div>
            <h3 className="font-bold text-base text-text">Laboratory Observation Trend</h3>
            <p className="text-xs text-text-muted">
              {activeTrendData ? `Reference Range: ${activeTrendData.reference_range || 'Standard'}` : ''}
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <label className="text-xs font-semibold text-text-muted">Select Test:</label>
            <select
              value={selectedTest}
              onChange={(e) => setSelectedTest(e.target.value)}
              className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text font-bold"
            >
              {trends.map((t) => (
                <option key={t.test_name} value={t.test_name}>
                  {t.test_name} ({t.unit})
                </option>
              ))}
            </select>
          </div>
        </div>

        {activeTrendData && activeTrendData.points.length > 0 ? (
          <div className="mt-6 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={activeTrendData.points}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="date" stroke="var(--text-muted)" fontSize={12} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={12}
                  unit={` ${activeTrendData.unit}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--surface)',
                    borderColor: 'var(--border)',
                    color: 'var(--text)',
                    borderRadius: '8px',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="var(--primary)"
                  strokeWidth={3}
                  dot={{ r: 6, fill: 'var(--primary)' }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="text-center py-16 text-text-muted text-sm">
            No sequential numeric test data recorded for this patient.
          </div>
        )}
      </div>

      {/* Multi-Report Comparison Tool */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme">
        <div className="pb-4 border-b border-border">
          <h3 className="font-bold text-base text-text flex items-center space-x-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Multi-Report Comparison (Delta & Percent Change)</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Compare two diagnostic lab reports across test observations with computed deltas.
          </p>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-text mb-1 block">Baseline Report (Report 1):</label>
            <select
              value={doc1}
              onChange={(e) => setDoc1(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_filename} ({new Date(d.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text mb-1 block">Follow-up Report (Report 2):</label>
            <select
              value={doc2}
              onChange={(e) => setDoc2(e.target.value)}
              className="w-full bg-surface-2 border border-border rounded px-3 py-2 text-xs text-text"
            >
              {documents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.original_filename} ({new Date(d.created_at).toLocaleDateString()})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCompare}
            disabled={loadingComparison || !doc1 || !doc2}
            className="w-full py-2 px-4 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs shadow-sm"
          >
            {loadingComparison ? 'Comparing...' : 'Compare Reports'}
          </button>
        </div>

        {comparisonData && (
          <div className="mt-5 border border-border rounded-theme overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-2 text-text-muted uppercase font-bold border-b border-border">
                <tr>
                  <th className="p-3">Test Name</th>
                  <th className="p-3">Baseline (Rep 1)</th>
                  <th className="p-3">Follow-up (Rep 2)</th>
                  <th className="p-3">Delta Change</th>
                  <th className="p-3">% Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {comparisonData.comparisons.map((c: any, i: number) => {
                  const isPositive = (c.delta || 0) > 0;
                  return (
                    <tr key={i} className="hover:bg-surface-2/30">
                      <td className="p-3 font-bold text-text">{c.test_name}</td>
                      <td className="p-3">
                        {c.report_1 ? `${c.report_1.value} ${c.unit}` : 'N/A'}
                      </td>
                      <td className="p-3 font-semibold text-text">
                        {c.report_2 ? `${c.report_2.value} ${c.unit}` : 'N/A'}
                      </td>
                      <td className="p-3 font-mono font-bold">
                        {c.delta !== null ? (
                          <span
                            className={`flex items-center space-x-1 ${
                              isPositive ? 'text-amber-600' : 'text-emerald-600'
                            }`}
                          >
                            {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            <span>{c.delta} {c.unit}</span>
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="p-3 font-mono">
                        {c.percent_change !== null ? `${c.percent_change}%` : 'N/A'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Log Daily Vitals */}
      <div className="bg-surface rounded-theme p-5 border border-border shadow-theme">
        <div className="pb-3 border-b border-border">
          <h3 className="font-bold text-base text-text flex items-center space-x-2">
            <Activity className="w-5 h-5 text-primary" />
            <span>Daily Vitals Tracker</span>
          </h3>
          <p className="text-xs text-text-muted mt-0.5">
            Log patient-entered blood pressure, glucose, or pulse.
          </p>
        </div>

        <div className="mt-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-text mb-1 block">Metric:</label>
            <select
              value={vitalType}
              onChange={(e) => setVitalType(e.target.value)}
              className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text"
            >
              <option value="blood_pressure">Blood Pressure (Systolic/Diastolic)</option>
              <option value="glucose">Fasting Blood Glucose (mg/dL)</option>
              <option value="pulse">Pulse Rate (bpm)</option>
              <option value="weight">Body Weight (kg)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-text mb-1 block">Value:</label>
            <input
              type="number"
              placeholder={vitalType === 'blood_pressure' ? 'Systolic (e.g. 120)' : 'Value'}
              value={vitalVal}
              onChange={(e) => setVitalVal(e.target.value)}
              className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text w-32"
            />
          </div>

          {vitalType === 'blood_pressure' && (
            <div>
              <label className="text-xs font-semibold text-text mb-1 block">Diastolic:</label>
              <input
                type="number"
                placeholder="Diastolic (e.g. 80)"
                value={vitalVal2}
                onChange={(e) => setVitalVal2(e.target.value)}
                className="bg-surface-2 border border-border rounded px-3 py-1.5 text-xs text-text w-32"
              />
            </div>
          )}

          <button
            onClick={handleLogVital}
            className="px-4 py-2 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold text-xs"
          >
            Log Entry
          </button>
        </div>
      </div>
    </div>
  );
};
