-- ==========================================
-- MASTER CYRUS SETUP SCRIPT (CONSOLIDATED)
-- ==========================================
-- This script sets up EVERYTHING: 
-- 1. Profiles & Roles (with dynamic signup)
-- 2. Security Functions (is_admin with JWT support)
-- 3. Questionnaire Schema (Domains/Questions)
-- 4. Assessments Table (Audit Ledger)
-- 5. Seed Data (All 19 Domains & Questions)
-- ==========================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES TABLE
-- Stores user-specific settings, roles, and assessment drafts
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text,
  role text DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  name text,
  username text,
  organization_name text,
  industry text,
  draft_data jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. SECURITY HELPER: is_admin()
-- Optimized to check JWT first (no DB hits) then fallback to Profile table
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  -- 1. Check JWT Metadata (Fast path for API requests)
  IF (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin' THEN
    RETURN true;
  END IF;

  -- 2. Fallback to Profiles table (Security Definer bypasses RLS)
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. AUTH TRIGGER: handle_new_user()
-- Captures all metadata from the signup flow automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, role, name, username, organization_name, industry
  )
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'industry'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clear and re-create trigger to ensure it's up to date
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. QUESTIONNAIRE SCHEMA
CREATE TABLE IF NOT EXISTS public.domains (
  id text PRIMARY KEY,
  name text NOT NULL,
  default_weight decimal NOT NULL,
  explanation text,
  display_order int DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.questions (
  id text PRIMARY KEY,
  domain_id text REFERENCES public.domains(id) ON DELETE CASCADE,
  text text NOT NULL,
  type text NOT NULL CHECK (type IN ('binary', 'frequency', 'multiple', 'coverage', 'governance')),
  is_killer boolean DEFAULT false,
  options jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. ASSESSMENTS TABLE (Audit Ledger)
CREATE TABLE IF NOT EXISTS public.assessments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL,
  industry_id text NOT NULL,
  total_score decimal NOT NULL,
  risk_tier text NOT NULL,
  premium_loading text NOT NULL,
  auto_declined boolean DEFAULT false,
  submission_data jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Profiles: Users see themselves, Admins see all
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Questionnaire: Publicly viewable, Admin-only management
DROP POLICY IF EXISTS "Viewable by everyone" ON public.domains;
CREATE POLICY "Viewable by everyone" ON public.domains FOR SELECT USING (true);

DROP POLICY IF EXISTS "Viewable by everyone" ON public.questions;
CREATE POLICY "Viewable by everyone" ON public.questions FOR SELECT USING (true);

-- Assessments: Users see own, Admins see all
DROP POLICY IF EXISTS "Users can view own assessments" ON public.assessments;
CREATE POLICY "Users can view own assessments" ON public.assessments FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assessments" ON public.assessments;
CREATE POLICY "Users can insert own assessments" ON public.assessments FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all assessments" ON public.assessments;
CREATE POLICY "Admins can view all assessments" ON public.assessments FOR SELECT USING (public.is_admin());

-- 7. SEED DATA (Domains)
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES 
('network_security', 'Network Security', 7.0, 'First line of defense against external threats.', 0),
('data_backup_and_recovery', 'Data Backup and Recovery', 7.0, 'Recovery capability after an attack.', 1),
('certifications', 'Certifications', 4.0, 'Commitment to industry-standard practices.', 2),
('background_verification_and_employee_awareness', 'Background Verification and Employee Awareness', 4.0, 'Personnel security and insider threat mitigation.', 3),
('regulatory_compliance', 'Regulatory Compliance', 5.0, 'Adherence to legal security requirements.', 4),
('organizational_policies_and_procedures', 'Organizational Policies and Procedures', 5.0, 'Established rules and procedures governing security.', 5),
('physical_perimeter_security', 'Physical Perimeter Security', 7.0, 'Protection of physical assets and facilities.', 6),
('endpoint_security', 'Endpoint Security', 6.0, 'Protection of individual devices (laptops, phones).', 7),
('iot_and_ot_network', 'IoT and OT Network', 9.0, 'Security of connected devices and operational tech.', 8),
('asset_management', 'Asset Management', 6.0, 'Tracking and managing IT assets.', 9),
('identity_and_access_management', 'Identity and Access Management', 6.0, 'Controlling user access to systems.', 10),
('vulnerability_assessment_and_penetration_test', 'Vulnerability Assessment and Penetration Test', 5.0, 'Proactive identification of weaknesses.', 11),
('ransomware_supplemental', 'Ransomware Supplemental', 5.0, 'Protection against ransomware specific vectors.', 12),
('dark_web_exposure', 'Dark Web Exposure', 2.0, 'Checks for leaked credentials on the dark web.', 13),
('change_patch_cadence', 'Change/Patch Cadence', 5.0, 'Speed of system updates and patching.', 14),
('dlp_and_dspm', 'DLP and DSPM', 4.0, 'Prevention of sensitive data loss.', 15),
('active_directory_configuration', 'Active Directory Configuration', 3.0, 'Security of central user management.', 16),
('incident_management_and_response', 'Incident Management and Response', 6.0, 'Readiness to respond to security incidents.', 17),
('soc_and_soar_capabilities', 'SOC and SOAR Capabilities', 4.0, 'Real-time monitoring and automated response.', 18)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  default_weight = EXCLUDED.default_weight,
  explanation = EXCLUDED.explanation;

-- 8. SEED DATA (Questions Sample - Use full seed for all 96)
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES 
('NS-001', 'network_security', 'Is Firewall implemented?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('NS-002', 'network_security', 'Is DDoS Protection implemented?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('NS-003', 'network_security', 'Is WAF (Web Application Firewall) implemented?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('NS-004', 'network_security', 'Is IDS/IPS implemented?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('NS-005', 'network_security', 'Is NGFW (Next-Gen Firewall) implemented?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('NS-006', 'network_security', 'Are network segmentation and VLANs used to limit access?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('NS-007', 'network_security', 'Are VPNs used for secure remote access?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('NS-008', 'network_security', 'Is wireless network security implemented with encryption?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('NS-009', 'network_security', 'Is there a process to review the firewall rules?', 'frequency', false, '[{"label": "Quarterly", "value": 1.0}, {"label": "Half-yearly", "value": 0.75}, {"label": "Annually", "value": 0.5}, {"label": "No", "value": 0.0}]'),
('NS-010', 'network_security', 'How often do you perform review of network architecture?', 'frequency', false, '[{"label": "Quarterly", "value": 1.0}, {"label": "Half-yearly", "value": 0.75}, {"label": "Annually", "value": 0.5}, {"label": "No", "value": 0.0}]'),
('DBR-001', 'data_backup_and_recovery', 'Are regular backups performed on critical systems?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DBR-002', 'data_backup_and_recovery', 'Are backups encrypted during storage and transmission?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DBR-003', 'data_backup_and_recovery', 'Are backup procedures tested regularly for recovery?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DBR-004', 'data_backup_and_recovery', 'Is there a defined Recovery Point Objective (RPO) and Recovery Time Objective (RTO)?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DBR-005', 'data_backup_and_recovery', 'Are cloud-based backups in place?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DBR-006', 'data_backup_and_recovery', 'Are backups stored in geographically separate locations?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DBR-007', 'data_backup_and_recovery', 'Is there a disaster recovery plan in place?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DBR-008', 'data_backup_and_recovery', 'Are offline backups stored off-site in place?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DBR-009', 'data_backup_and_recovery', 'Is RTO for critical systems <24 hours?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('CERT-001', 'certifications', 'Is your organization certified for ISO/IEC 27001?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('CERT-002', 'certifications', 'Is your organization certified for NIST?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('CERT-003', 'certifications', 'Is your organization certified for SOC 2?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('CERT-004', 'certifications', 'Is your organization certified for HIPAA?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('CERT-005', 'certifications', 'Is your organization certified for PCI DSS?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('BV-001', 'background_verification_and_employee_awareness', 'Do you perform background verification?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('BV-002', 'background_verification_and_employee_awareness', 'Frequency of security awareness training?', 'frequency', false, '[{"label": "Half-yearly", "value": 1.0}, {"label": "Annually", "value": 0.75}, {"label": "No", "value": 0.0}]'),
('RC-001', 'regulatory_compliance', 'Compliance with applicable regulatory guidelines?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('OP-001', 'organizational_policies_and_procedures', 'Do you have a Cyber Crisis Management Plan?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('PPS-001', 'physical_perimeter_security', 'Physical security measures for data centers?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('ES-001', 'endpoint_security', 'Endpoint devices configured with encryption?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('IOT-001', 'iot_and_ot_network', 'Inventory of IoT/OT devices?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('AM-001', 'asset_management', 'Maintain comprehensive inventory of all assets?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('IAM-001', 'identity_and_access_management', 'MFA implemented for critical systems?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('VA-001', 'vulnerability_assessment_and_penetration_test', 'Automated scanning tools used?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('RS-001', 'ransomware_supplemental', 'Phishing success ratio < 15%?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DW-001', 'dark_web_exposure', 'Frequency of dark web scans?', 'frequency', false, '[{"label": "Daily", "value": 1.0}, {"label": "Weekly", "value": 0.9}, {"label": "Monthly", "value": 0.75}, {"label": "No", "value": 0.0}]'),
('PC-001', 'change_patch_cadence', 'Documented change/patch management policy?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DLP-001', 'dlp_and_dspm', 'DLP solution implemented?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('ADC-001', 'active_directory_configuration', 'Is AD auditing enabled?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('IR-001', 'incident_management_and_response', 'IR/SOC execution methodology?', 'multiple', false, '[{"label": "Both", "value": 1.0}, {"label": "IR_only", "value": 0.75}, {"label": "SOC_only", "value": 0.5}, {"label": "Neither", "value": 0.0}]'),
('SOC-001', 'soc_and_soar_capabilities', 'SOC monitoring capability level?', 'multiple', false, '[{"label": "Internal_24x7", "value": 1.0}, {"label": "3rd_party_24x7", "value": 0.75}, {"label": "No_SOC", "value": 0.0}]')
ON CONFLICT (id) DO UPDATE SET 
  text = EXCLUDED.text,
  type = EXCLUDED.type,
  options = EXCLUDED.options;
