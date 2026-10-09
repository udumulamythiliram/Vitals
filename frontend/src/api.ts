const BASE_URL = 'http://127.0.0.1:8000/api';

export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(errorText || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const api = {
  // Auth
  demoLogin: () => fetchJson<any>('/auth/demo-login', { method: 'POST' }),
  getCurrentUser: () => fetchJson<any>('/auth/me'),
  updatePreferences: (data: any) => fetchJson<any>('/auth/preferences', { method: 'PUT', body: JSON.stringify(data) }),

  // Patients
  getPatients: () => fetchJson<any[]>('/patients'),
  createPatient: (data: any) => fetchJson<any>('/patients', { method: 'POST', body: JSON.stringify(data) }),
  activatePatient: (id: string) => fetchJson<any>(`/patients/${id}/activate`, { method: 'POST' }),
  getCaregivers: (patientId: string) => fetchJson<any[]>(`/patients/${patientId}/caregivers`),
  inviteCaregiver: (patientId: string, data: any) => fetchJson<any>(`/patients/${patientId}/caregivers`, { method: 'POST', body: JSON.stringify(data) }),

  // Documents
  getDocuments: (patientId?: string) => fetchJson<any[]>(`/documents${patientId ? `?patient_id=${patientId}` : ''}`),
  getDocument: (id: string) => fetchJson<any>(`/documents/${id}`),
  deleteDocument: (id: string) => fetchJson<any>(`/documents/${id}`, { method: 'DELETE' }),
  uploadDocument: async (file: File, patientId: string, documentType = 'general') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('patient_id', patientId);
    formData.append('document_type', documentType);
    const res = await fetch(`${BASE_URL}/documents/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  },

  // Extraction
  runExtraction: (documentId: string) => fetchJson<any>(`/extraction/${documentId}/run`, { method: 'POST' }),
  getExtractedFields: (documentId: string) => fetchJson<any[]>(`/extraction/${documentId}/fields`),
  updateField: (fieldId: string, data: any) => fetchJson<any>(`/extraction/fields/${fieldId}`, { method: 'PUT', body: JSON.stringify(data) }),
  verifyDocument: (documentId: string) => fetchJson<any>(`/extraction/${documentId}/verify`, { method: 'POST' }),

  // Summaries
  getSummary: (documentId: string, language = 'en', readingLevel = 'standard') =>
    fetchJson<any>(`/summaries/${documentId}?language=${language}&reading_level=${readingLevel}`),
  explainAbnormal: (documentId: string) => fetchJson<any>(`/summaries/${documentId}/explain-abnormal`),

  // Chat
  getConversations: (patientId: string) => fetchJson<any[]>(`/chat/conversations?patient_id=${patientId}`),
  getMessages: (conversationId: string) => fetchJson<any[]>(`/chat/conversations/${conversationId}/messages`),
  sendMessage: (data: { patient_id: string; message: string; conversation_id?: string }) =>
    fetchJson<any>('/chat/message', { method: 'POST', body: JSON.stringify(data) }),

  // Timeline
  getTimeline: (patientId: string) => fetchJson<any[]>(`/timeline?patient_id=${patientId}`),

  // Medications
  getMedications: (patientId: string, status?: string) =>
    fetchJson<any[]>(`/medications?patient_id=${patientId}${status ? `&status=${status}` : ''}`),
  addMedication: (data: any) => fetchJson<any>('/medications', { method: 'POST', body: JSON.stringify(data) }),
  updateMedicationStatus: (id: string, status: string) => fetchJson<any>(`/medications/${id}/status?status=${status}`, { method: 'PUT' }),
  logAdherence: (data: any) => fetchJson<any>('/medications/adherence', { method: 'POST', body: JSON.stringify(data) }),
  getReminders: (patientId: string) => fetchJson<any[]>(`/medications/reminders?patient_id=${patientId}`),
  createReminder: (data: any) => fetchJson<any>('/medications/reminders', { method: 'POST', body: JSON.stringify(data) }),

  // Trends
  getLabTrends: (patientId: string, testName?: string) =>
    fetchJson<any[]>(`/trends/lab-trends?patient_id=${patientId}${testName ? `&test_name=${encodeURIComponent(testName)}` : ''}`),
  compareReports: (patientId: string, doc1: string, doc2: string) =>
    fetchJson<any>(`/trends/compare-reports?patient_id=${patientId}&doc_id_1=${doc1}&doc_id_2=${doc2}`),
  getVitals: (patientId: string) => fetchJson<any[]>(`/trends/vitals?patient_id=${patientId}`),
  logVital: (data: any) => fetchJson<any>('/trends/vitals', { method: 'POST', body: JSON.stringify(data) }),

  // Appointments
  getAppointments: (patientId: string) => fetchJson<any[]>(`/appointments?patient_id=${patientId}`),
  createAppointment: (data: any) => fetchJson<any>('/appointments', { method: 'POST', body: JSON.stringify(data) }),
  generatePrepSheet: (appointmentId: string) => fetchJson<any>(`/appointments/${appointmentId}/prep-sheet`, { method: 'POST' }),

  // FHIR / ABDM
  exportFhir: (patientId: string) => fetchJson<any>(`/export/fhir?patient_id=${patientId}`),
  linkAbhaMock: (patientId: string, abhaAddress: string) =>
    fetchJson<any>('/export/abha/link-mock', { method: 'POST', body: JSON.stringify({ patient_id: patientId, abha_address: abhaAddress }) }),

  // Privacy
  getAuditTrail: () => fetchJson<any[]>('/privacy/audit'),
  getConsent: () => fetchJson<any>('/privacy/consent'),
  exportAllData: () => fetchJson<any>('/privacy/export'),
  deleteAccount: () => fetchJson<any>('/privacy/account', { method: 'DELETE' }),

  // System & Evals
  getSystemStatus: () => fetchJson<any>('/system/status'),
  configureLlm: (data: any) => fetchJson<any>('/system/configure-llm', { method: 'POST', body: JSON.stringify(data) }),
  resetDemo: () => fetchJson<any>('/system/reset-demo', { method: 'POST' }),
  runEvals: () => fetchJson<any>('/evals/run'),
};
