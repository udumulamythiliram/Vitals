export interface PatientProfile {
  id: string;
  user_id: string;
  full_name: string;
  relationship: 'self' | 'parent' | 'child' | 'dependent';
  date_of_birth: string;
  age_group: 'infant' | 'child' | 'adult' | 'elderly';
  gender: string;
  blood_group: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  allergies: string;
  chronic_conditions: string;
  is_active: number;
  created_at: string;
}

export interface DocumentItem {
  id: string;
  patient_id: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  document_type: 'prescription' | 'lab_report' | 'discharge_summary' | 'vaccination_record' | 'radiology_report' | 'general';
  status: 'uploaded' | 'processing' | 'extracted' | 'reviewed' | 'failed';
  created_at: string;
}

export interface ExtractedField {
  id: string;
  document_id: string;
  field_name: string;
  original_text: string;
  extracted_value: string;
  confidence: number;
  status: 'confident' | 'needs_review' | 'unreadable';
  source_page: number;
  user_corrected_value?: string;
}

export interface Observation {
  id: string;
  patient_id: string;
  document_id?: string;
  test_name: string;
  value: number;
  value_text: string;
  unit: string;
  reference_range: string;
  flag: 'normal' | 'high' | 'low' | 'abnormal' | 'critical_high' | 'critical_low';
  collection_date: string;
  report_date: string;
  lab_name: string;
  user_verified: number;
}

export interface Medication {
  id: string;
  patient_id: string;
  document_id?: string;
  drug_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions: string;
  status: 'active' | 'historical' | 'uncertain';
  user_verified: number;
  source_doc_name?: string;
}

export interface TimelineEvent {
  id: string;
  type: 'document_upload' | 'lab_test' | 'medication' | 'vaccination' | 'appointment';
  title: string;
  subtitle: string;
  date: string;
  flag?: string;
  status?: string;
  source_id?: string;
  doc_name?: string;
}

export interface Appointment {
  id: string;
  patient_id: string;
  clinician_name: string;
  facility: string;
  appointment_time: string;
  notes?: string;
  status: string;
  prep_sheet_json?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  safety_flag?: string;
  model_used?: string;
  created_at: string;
  sources?: { document_id: string; doc_name: string; excerpt: string }[];
}

export interface SystemStatus {
  status: string;
  app_version: string;
  database: string;
  ocr_engine: string;
  llm_gateway: {
    status: string;
    provider: string;
    model: string;
    is_fallback: boolean;
    latency_ms?: number;
    message?: string;
  };
  active_provider: string;
  active_model: string;
  is_fallback: boolean;
}
