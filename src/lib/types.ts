/**
 * Shared domain types for CRM business logic.
 * Все бизнес-типы централизованы здесь — импортируются lib-модулями.
 */

/** CRM-администратор (сессия в sessionStorage) */
export interface CrmAdmin {
  id: string;
  full_name: string;
  role: 'super_admin' | 'manager';
}

/** Актёр для логирования действий */
export interface Actor {
  name: string;
  role: 'admin' | 'manager' | 'agency';
  agency_name?: string;
}

/** Статус логистики (FSM) */
export type LogisticsStatus = 'none' | 'pending_admin' | 'pending_candidate' | 'confirmed';

/** Статус онбординг-анкеты */
export type FormStatus = 'not_sent' | 'pending' | 'completed';

/** Документ кандидата (в CandidateForm.uploaded_docs) */
export interface CandidateDocument {
  doc_type?: string;
  type?: string;
  name?: string;
  url?: string;
  uploaded_at?: string;
}

/** Определение типа документа (слот загрузки) */
export interface DocTypeDef {
  id: string;
  label: string;
  required: boolean;
}

/** Город с геокоординатами */
export interface GeoCity {
  id?: string;
  name: string;
  region?: string;
  lat?: number | null;
  lon?: number | null;
  is_assembly_point?: boolean;
}

/** Кандидат — ключевые поля бизнес-логики */
export interface Candidate {
  id?: string;
  full_name: string;
  position?: string;
  agency_id?: string;
  agency_name?: string;
  phone?: string;
  email?: string;
  birth_date?: string;
  gender?: string;
  citizenship?: string;
  birth_place?: string;
  health_status?: string;
  health_details?: string;
  city?: string;
  assembly_point?: string;
  assembly_distance?: string;
  arrival_date?: string;
  arrival_time?: string;
  ticket_photo_url?: string;
  logistics_status?: LogisticsStatus;
  logistics_confirmed_at?: string;
  proposed_assembly_point?: string;
  proposed_arrival_date?: string;
  proposed_arrival_time?: string;
  proposed_by?: string;
  sb_check?: string;
  medical_check?: string;
  comment?: string;
  payment_basis?: string;
  payment_made?: string;
  documents?: CandidateDocument[];
  is_archived?: boolean;
  deleted_at?: string | null;
  form_token?: string;
  form_status?: FormStatus;
  form_submitted_at?: string;
  final_call_confirmed?: boolean;
  final_call_confirmed_at?: string;
  created_date?: string;
  updated_date?: string;
  created_by_id?: string;
}

/** Блок скрипта звонка */
export interface CallScriptBlock {
  id: string;
  label: string;
  text: string;
}

/** Документ для отчёта СБ */
export interface SbReportDoc {
  label: string;
  url: string;
}

/** Параметры логирования действия с кандидатом */
export interface LogActionParams {
  action: 'create' | 'update' | 'delete';
  candidate: Candidate;
  oldData?: Candidate | null;
  actor: Actor;
}