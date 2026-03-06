// API Types based on OpenAPI specification

// ==================== Auth Types ====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
  };
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  status: 'ok';
}

export interface ResetPasswordRequest {
  token: string;
  password: string;
}

export interface ResetPasswordResponse {
  user: string;
}

export interface RefreshResponse {
  status: 'ok';
}

export interface LogoutResponse {
  status: 'logged_out';
}

// ==================== Account Types ====================

export type Sex = 'male' | 'female';

export interface Account {
  id: string;
  nickname: string | null;
  date_of_birth: string;
  sex: Sex;
  language: string;
  timezone: string;
  sensitive_words: string | null;
}

export interface CreateAccountRequest {
  sex: Sex;
  date_of_birth: string;
  nickname?: string | null;
  language?: string;
  timezone?: string;
  sensitive_words?: string | null;
}

export interface UpdateAccountRequest {
  nickname?: string | null;
  language?: string;
  timezone?: string;
  sensitive_words?: string | null;
  sex?: string;
  date_of_birth?: string;
}

export interface UpdateAccountResponse {
  status: 'updated';
}

export interface DeleteAccountResponse {
  status: 'account_deleted';
}

export interface AccountExistsResponse {
  status: 'account_exists';
}

// ==================== Health Check Types ====================

export interface HealthCheckResponse {
  service: string;
  environment: string;
  version: string;
  timestamp: string;
}

// ==================== Diagnostic Report Types ====================

export interface ObservationResource {
  id: number;
  biomarker_name: string;
  biomarker_code: string | null;
  value_type: ObservationValueType;
  value: number | boolean | string;
  unit: string | null;
  reference_range_min: number | null;
  reference_range_max: number | null;
  reference_unit: string | null;
  created_at: string;
  updated_at: string;
}

export interface DiagnosticReportResource {
  id: number;
  title?: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  document_uuids?: string[];
  observations: ObservationResource[];
}

export interface DiagnosticReportListResponse {
  data: DiagnosticReportResource[];
}

export interface StoreDiagnosticReportRequest {
  title?: string | null;
  notes?: string | null;
}

export type ObservationValueType = 'numeric' | 'boolean' | 'text';

export interface StoreObservationRequest {
  biomarker_name: string;
  biomarker_code?: string | null;
  value_type?: ObservationValueType;
  value: number | boolean | string;
  unit?: string | null;
  reference_range_min?: number | null;
  reference_range_max?: number | null;
  reference_unit?: string | null;
}

export interface StoreObservationBatchRequest {
  observations: StoreObservationRequest[];
}

export interface StoreDocumentExtractionObservationRequest {
  biomarker_name: string;
  biomarker_code?: string | null;
  value_type?: ObservationValueType;
  value: number | boolean | string;
  unit?: string | null;
  reference_range_min?: number | null;
  reference_range_max?: number | null;
  reference_unit?: string | null;
}

export interface StoreDocumentExtractionRequest {
  document_uuid: string;
  title?: string | null;
  notes?: string | null;
  observations: StoreDocumentExtractionObservationRequest[];
}

export interface DocumentExtractionResponse {
  id: number;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  observations: ObservationResource[];
  document_ids: number[];
}

// ==================== Document Types ====================

export type DocumentJobStatus = 'pending' | 'processing' | 'done' | 'failed' | null;

export interface DocumentResource {
  uuid: string;
  file_size_bytes: number;
  mime_type: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  job_status: DocumentJobStatus;
}

export interface DocumentListResponse {
  data: DocumentResource[];
}

export interface DocumentStoreResponse {
  uuid: string;
}

export interface DocumentMarkerValue {
  type: 'numeric' | 'boolean' | 'text';
  number: number | null;
  unit: string | null;
  value: boolean | null;
  text: string | null;
}

export interface DocumentReferenceRange {
  min: number | null;
  max: number | null;
  unit: string;
}

export interface DocumentFinalResultMarker {
  code: string;
  name: string;
  value: DocumentMarkerValue;
  reference_range: DocumentReferenceRange | null;
}

export interface DocumentFinalResultPerson {
  name: string;
  dob: string | null;
}

export interface DocumentFinalResult {
  person: DocumentFinalResultPerson;
  diagnostic_date: string | null;
  diagnostic_title?: string | null;
  language: string | null;
  markers: DocumentFinalResultMarker[];
  pii: string[];
}

export interface DocumentMetadataResource {
  uuid: string;
  file_size_bytes: number;
  mime_type: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  status: DocumentJobStatus;
  error_message: string | null;
  job_status: DocumentJobStatus;
  diagnostic_title?: string | null;
  parsed_result: unknown | null;
  anonymised_result: unknown | null;
  anonymised_artifacts: unknown[] | null;
  normalized_result: unknown[] | null;
  transliteration_mapping: unknown[] | null;
  final_result: unknown | null;
}

// ==================== Error Types ====================

export interface ValidationError {
  message: string;
  errors: Record<string, string[]>;
}

export interface AuthenticationError {
  message: string;
}

export interface ApiError {
  status: number;
  message: string;
  errors?: Record<string, string[]>;
}

// ==================== Profile Types (/me) ====================

export interface Profile {
  id: string;
  email: string;
  nickname: string | null;
  date_of_birth: string;
  sex: Sex;
  language: string | null;
  timezone: string | null;
}

export interface UpdateProfileRequest {
  nickname?: string | null;
  language?: string;
  timezone?: string;
  sex?: string;
  date_of_birth?: string;
}

export interface UpdateProfileResponse {
  status: 'updated';
}

// ==================== Security Types (/me/security) ====================

export interface UpdateSecurityRequest {
  current_password?: string;
  email?: string;
  password?: string;
  password_confirmation?: string;
}

export interface UpdateSecurityResponse {
  status: 'updated';
}

// ==================== User State ====================

export interface User {
  id: string;
  email: string;
}

export interface AuthState {
  user: User | null;
  account: Account | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasCompletedSetup: boolean;
}
