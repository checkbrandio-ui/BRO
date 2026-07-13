CREATE EXTENSION IF NOT EXISTS &quot;pgcrypto&quot;;

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('admin','user','moderator')),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crm_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    access_code VARCHAR(100) UNIQUE,
    role VARCHAR(50) DEFAULT 'manager' CHECK (role IN ('super_admin','manager')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(100),
    status VARCHAR(100) DEFAULT 'Рассматривается',
    is_active BOOLEAN DEFAULT true,
    access_code VARCHAR(100) UNIQUE,
    candidates_count INTEGER DEFAULT 0,
    contract_url TEXT,
    contract_date DATE,
    special_conditions TEXT,
    comment TEXT,
    call_datetime VARCHAR(100),
    call_type VARCHAR(50),
    planned_candidates INTEGER DEFAULT 0,
    manager_email VARCHAR(255),
    deleted_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    region VARCHAR(255),
    lat NUMERIC(10,6),
    lon NUMERIC(10,6),
    source VARCHAR(50) DEFAULT 'manual',
    is_assembly_point BOOLEAN DEFAULT false,
    payment_amount NUMERIC(10,2),
    previous_payment NUMERIC(10,2),
    processing_time VARCHAR(100),
    agent_fee NUMERIC(10,2),
    curator_name VARCHAR(255),
    curator_phone VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assembly_points (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    city VARCHAR(255),
    address TEXT,
    lat NUMERIC(10,6),
    lon NUMERIC(10,6),
    is_active BOOLEAN DEFAULT true,
    comment TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    full_name VARCHAR(255) NOT NULL,
    position VARCHAR(100),
    agency_id UUID REFERENCES agencies(id),
    agency_name VARCHAR(255),
    phone VARCHAR(100),
    email VARCHAR(255),
    birth_date DATE,
    gender VARCHAR(10) DEFAULT 'муж',
    citizenship VARCHAR(255),
    birth_place VARCHAR(255),
    health_status VARCHAR(100) DEFAULT 'Без замечаний',
    health_details TEXT,
    city VARCHAR(255),
    assembly_point VARCHAR(255),
    assembly_distance VARCHAR(100),
    arrival_date DATE,
    arrival_time VARCHAR(10),
    ticket_photo_url TEXT,
    logistics_status VARCHAR(50) DEFAULT 'none',
    proposed_assembly_point VARCHAR(255),
    proposed_arrival_date DATE,
    proposed_arrival_time VARCHAR(10),
    proposed_by VARCHAR(255),
    logistics_confirmed_at TIMESTAMP,
    final_call_confirmed BOOLEAN DEFAULT false,
    final_call_confirmed_at TIMESTAMP,
    sb_check VARCHAR(100) DEFAULT 'Не проверялся',
    medical_check VARCHAR(100) DEFAULT 'Не проверялся',
    comment TEXT,
    payment_basis VARCHAR(100),
    payment_made VARCHAR(10) DEFAULT 'Нет',
    documents JSONB DEFAULT '[]',
    is_archived BOOLEAN DEFAULT false,
    deleted_at TIMESTAMP,
    form_token VARCHAR(255) UNIQUE,
    form_status VARCHAR(50) DEFAULT 'not_sent',
    form_submitted_at TIMESTAMP,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_forms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    form_token VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255),
    birth_date DATE,
    birth_place VARCHAR(255),
    citizenship VARCHAR(255),
    registration_address TEXT,
    actual_address TEXT,
    passport_series VARCHAR(20),
    passport_number VARCHAR(20),
    passport_issued_by TEXT,
    passport_issued_date DATE,
    passport_dept_code VARCHAR(20),
    migration_card_number VARCHAR(100),
    migration_card_expiry DATE,
    patent_number VARCHAR(100),
    patent_region VARCHAR(255),
    phone VARCHAR(100),
    email VARCHAR(255),
    city VARCHAR(255),
    assembly_point VARCHAR(255),
    arrival_date DATE,
    arrival_time VARCHAR(10),
    position VARCHAR(100),
    education_level VARCHAR(100),
    education_institution VARCHAR(255),
    education_specialty VARCHAR(255),
    graduation_year VARCHAR(10),
    additional_certs TEXT,
    skills TEXT,
    work_experience TEXT,
    shift_experience TEXT,
    health_notes TEXT,
    chronic_diseases TEXT,
    disabilities TEXT,
    family_status VARCHAR(100),
    children_count VARCHAR(20),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(100),
    emergency_contact_relation VARCHAR(100),
    military_rank VARCHAR(100),
    military_unit VARCHAR(255),
    military_specialty VARCHAR(255),
    has_criminal_record VARCHAR(10),
    criminal_record_details TEXT,
    salary_expectations VARCHAR(255),
    motivation TEXT,
    docs_ready VARCHAR(50),
    ready_to_start_date DATE,
    uploaded_docs JSONB DEFAULT '[]',
    consent_given BOOLEAN DEFAULT false,
    consent_timestamp TIMESTAMP,
    submitted_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
    candidate_name VARCHAR(255),
    action VARCHAR(50),
    changed_by_id UUID,
    changed_by_name VARCHAR(255),
    changed_by_role VARCHAR(100),
    agency_name VARCHAR(255),
    changes JSONB DEFAULT '{}',
    timestamp TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    agency_name VARCHAR(255),
    candidate_id UUID,
    candidate_name VARCHAR(255),
    message TEXT,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    category VARCHAR(100),
    actor_name VARCHAR(255),
    actor_role VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agent_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asked_by_name VARCHAR(255),
    asked_by_role VARCHAR(100),
    category VARCHAR(255),
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'open',
    answer TEXT,
    answered_by VARCHAR(255),
    conversation_id VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidates_agency ON candidates(agency_id);
CREATE INDEX IF NOT EXISTS idx_candidates_archived ON candidates(is_archived);
CREATE INDEX IF NOT EXISTS idx_candidates_form_token ON candidates(form_token);
CREATE INDEX IF NOT EXISTS idx_candidate_forms_token ON candidate_forms(form_token);
CREATE INDEX IF NOT EXISTS idx_candidate_logs_candidate ON candidate_logs(candidate_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);