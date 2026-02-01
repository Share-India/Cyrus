-- ==========================================
-- MASTER SUPABASE SETUP SCRIPT (REVISED)
-- ==========================================
-- This script sets up EVERYTHING: 
-- 1. Profiles & Roles (with dynamic signup)
-- 2. Auth Triggers
-- 3. Questionnaire Schema (Domains/Questions)
-- 4. Assessments Table (Audit Ledger)
-- 5. Seed Data (All 19 Domains & 96 Questions)
-- ==========================================

-- 0. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. PROFILES & ROLES
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text,
  role text DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  organization_name text,
  industry text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. AUTH TRIGGER (Corrected for Dynamic Role Deployment)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, organization_name, industry)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'role', 'client'),
    new.raw_user_meta_data->>'organization_name',
    new.raw_user_meta_data->>'industry'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. DOMAINS & QUESTIONS SCHEMA
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

ALTER TABLE public.domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public domains are viewable by everyone." ON public.domains;
CREATE POLICY "Public domains are viewable by everyone." ON public.domains FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public questions are viewable by everyone." ON public.questions;
CREATE POLICY "Public questions are viewable by everyone." ON public.questions FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage domains" ON public.domains;
CREATE POLICY "Admins can manage domains" ON public.domains
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

DROP POLICY IF EXISTS "Admins can manage questions" ON public.questions;
CREATE POLICY "Admins can manage questions" ON public.questions
  USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- 4. ASSESSMENTS TABLE (Missing in previous version)
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

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own assessments" ON public.assessments;
CREATE POLICY "Users can view own assessments" ON public.assessments 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own assessments" ON public.assessments;
CREATE POLICY "Users can insert own assessments" ON public.assessments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all assessments" ON public.assessments;
CREATE POLICY "Admins can view all assessments" ON public.assessments 
  FOR SELECT USING ( (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin' );

-- 5. SEED DATA (Domains)
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES 
('network_security', 'Network Security', 7.0, 'This section assesses your first line of defense against external threats.', 0),
('data_backup_and_recovery', 'Data Backup and Recovery', 7.0, 'This helps us understand recovery capability after an attack.', 1),
('certifications', 'Certifications', 4.0, 'This validates your commitment to industry-standard security practices.', 2),
('background_verification_and_employee_awareness', 'Background Verification and Employee Awareness', 4.0, 'This assesses your personnel security and insider threat mitigation.', 3),
('regulatory_compliance', 'Regulatory Compliance', 5.0, 'This evaluates adherence to legal and regulatory security requirements.', 4),
('organizational_policies_and_procedures', 'Organizational Policies and Procedures', 5.0, 'This checks for established rules and procedures governing security.', 5),
('physical_perimeter_security', 'Physical Perimeter Security', 7.0, 'This assesses protection of physical assets and facilities.', 6),
('endpoint_security', 'Endpoint Security', 6.0, 'This evaluates protection of individual devices connecting to your network.', 7),
('iot_and_ot_network', 'IoT and OT Network', 9.0, 'This assesses security of connected devices and operational technology.', 8),
('asset_management', 'Asset Management', 6.0, 'This evaluates how you track and manage your IT assets.', 9),
('identity_and_access_management', 'Identity and Access Management', 6.0, 'This assesses how you control user access to systems and data.', 10),
('vulnerability_assessment_and_penetration_test', 'Vulnerability Assessment and Penetration Test', 5.0, 'This evaluates your proactive identification of security weaknesses.', 11),
('ransomware_supplemental', 'Ransomware Supplemental', 5.0, 'This section helps assess protection against ransomware.', 12),
('dark_web_exposure', 'Dark Web Exposure', 2.0, 'This checks for leaked credentials or data on the dark web.', 13),
('change_patch_cadence', 'Change/Patch Cadence', 5.0, 'This evaluates how quickly you update systems to fix vulnerabilities.', 14),
('dlp_and_dspm', 'DLP and DSPM', 4.0, 'This assesses measures to prevent sensitive data loss.', 15),
('active_directory_configuration', 'Active Directory Configuration', 3.0, 'This evaluates the security of your central user and computer management.', 16),
('incident_management_and_response', 'Incident Management and Response', 6.0, 'This assesses your readiness to respond to security incidents.', 17),
('soc_and_soar_capabilities', 'SOC and SOAR Capabilities', 4.0, 'This evaluates your real-time threat monitoring and automated response capabilities.', 18)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  default_weight = EXCLUDED.default_weight,
  explanation = EXCLUDED.explanation;

-- 6. SEED DATA (Questions)
-- Seed questions (NS-001, etc. as they remain largely consistent)
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
('BV-001', 'background_verification_and_employee_awareness', 'Do you perform background verification of employees/subcontractors before onboarding?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('BV-002', 'background_verification_and_employee_awareness', 'How often are security awareness trainings conducted?', 'frequency', false, '[{"label": "Half-yearly", "value": 1.0}, {"label": "Annually", "value": 0.75}, {"label": "No", "value": 0.0}]'),
('BV-003', 'background_verification_and_employee_awareness', 'Is Password Management and MFA covered in training?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('BV-004', 'background_verification_and_employee_awareness', 'Is Social Media security covered in training?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('BV-005', 'background_verification_and_employee_awareness', 'Is Data Classification covered in training?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('BV-006', 'background_verification_and_employee_awareness', 'Is Phishing, Vishing, SMiShing covered in training?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('BV-007', 'background_verification_and_employee_awareness', 'Does applicant provide security awareness training to employees at least annually?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('BV-008', 'background_verification_and_employee_awareness', 'Does applicant use simulated phishing attacks to test employees?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('RC-001', 'regulatory_compliance', 'Do you comply with applicable regulatory guidelines?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('RC-002', 'regulatory_compliance', 'Are data protection laws (GDPR, DPDP) implemented?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('RC-003', 'regulatory_compliance', 'Is there a documented data retention policy?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('RC-004', 'regulatory_compliance', 'Are regulatory audit reports current?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('OP-001', 'organizational_policies_and_procedures', 'Do you have a Cyber Crisis Management Plan?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('OP-002', 'organizational_policies_and_procedures', 'Do you have an Information Technology Policy?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('OP-003', 'organizational_policies_and_procedures', 'Do you have an Information Security Policy?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('OP-004', 'organizational_policies_and_procedures', 'Do you have an Incident Management Policy?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('OP-005', 'organizational_policies_and_procedures', 'Do you have a Data Protection & Privacy Policy?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('OP-006', 'organizational_policies_and_procedures', 'Do you have a Business Continuity Plan (BCP)?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('PPS-001', 'physical_perimeter_security', 'Are physical security measures in place to protect data centers?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('PPS-002', 'physical_perimeter_security', 'Are access control systems (keycards, biometrics, CCTV) implemented for secure areas?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('PPS-003', 'physical_perimeter_security', 'Is there a policy for securing physical network ports?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('PPS-004', 'physical_perimeter_security', 'Are intrusion detection systems in place for physical premises?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('PPS-005', 'physical_perimeter_security', 'Are periodic physical security audits conducted?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"line_number": 158, "label": "No", "value": 0.0}]'),
('ES-001', 'endpoint_security', 'Are endpoint devices configured with encryption?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('ES-002', 'endpoint_security', 'How often are patches reviewed for endpoint devices?', 'frequency', false, '[{"label": "Quarterly", "value": 1.0}, {"label": "Half-yearly", "value": 0.75}, {"label": "Annually", "value": 0.5}, {"label": "No", "value": 0.0}]'),
('ES-003', 'endpoint_security', 'Are mobile devices enrolled in a Mobile Device Management (MDM) solution?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('ES-004', 'endpoint_security', 'Is there a process for securing and wiping lost/stolen devices?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('ES-005', 'endpoint_security', 'Do all workstations have antivirus with heuristic capabilities?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('ES-006', 'endpoint_security', 'Are endpoint security tools with behavioral detection deployed?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('IOT-001', 'iot_and_ot_network', 'Is there an inventory of all IoT and OT devices connected to the network?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('IOT-002', 'iot_and_ot_network', 'How often are IoT and OT network security assessments conducted?', 'frequency', false, '[{"label": "Monthly", "value": 1.0}, {"label": "Quarterly", "value": 0.75}, {"label": "Annually", "value": 0.5}, {"label": "No", "value": 0.0}]'),
('IOT-003', 'iot_and_ot_network', 'Are there network segmentation strategies to isolate IoT and OT devices?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('IOT-004', 'iot_and_ot_network', 'Is there monitoring of IoT/OT device communications?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('IOT-005', 'iot_and_ot_network', 'Are default credentials changed on all IoT devices?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('AM-001', 'asset_management', 'Do you maintain a comprehensive inventory of all assets?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('AM-002', 'asset_management', 'Do you maintain Asset Criticality in inventory?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('AM-003', 'asset_management', 'Do you maintain Asset Owner in inventory?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('AM-004', 'asset_management', 'Do you maintain Asset Provisioning and EOL dates?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('AM-005', 'asset_management', 'Do you follow a step-by-step approach for asset provisioning/deprovisioning?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('IAM-001', 'identity_and_access_management', 'Is multi-factor authentication implemented for all critical systems?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('IAM-002', 'identity_and_access_management', 'How often are access rights reviewed?', 'frequency', false, '[{"label": "Monthly", "value": 1.0}, {"label": "Quarterly", "value": 0.9}, {"label": "Half-yearly", "value": 0.75}, {"label": "Annually", "value": 0.5}, {"label": "Never", "value": 0.0}]'),
('IAM-003', 'identity_and_access_management', 'Are privileged access accounts monitored using PAM solution?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('IAM-004', 'identity_and_access_management', 'Is there an account lockout policy for failed login attempts?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('IAM-005', 'identity_and_access_management', 'Are access permissions revoked immediately upon employee termination?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('VA-001', 'vulnerability_assessment_and_penetration_test', 'Do you have automated tools for periodic scanning of network components?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('VA-002', 'vulnerability_assessment_and_penetration_test', 'How often do you perform VA-PT assessment through external auditor?', 'frequency', false, '[{"label": "Quarterly", "value": 1.0}, {"label": "Annually", "value": 0.75}, {"label": "No", "value": 0.0}]'),
('VA-003', 'vulnerability_assessment_and_penetration_test', 'Are identified vulnerabilities mitigated in a defined timeframe?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('VA-004', 'vulnerability_assessment_and_penetration_test', 'Is there a risk-based prioritization for vulnerability remediation?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('RS-001', 'ransomware_supplemental', 'Is phishing success ratio less than 15% on last test?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('RS-002', 'ransomware_supplemental', 'Does applicant tag/mark e-mails from outside the organization?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('RS-003', 'ransomware_supplemental', 'Is there a process to report suspicious e-mails to security team?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('RS-004', 'ransomware_supplemental', 'Is there a documented process to respond to phishing campaigns?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('RS-005', 'ransomware_supplemental', 'Does email filtering block known malicious attachments?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DW-001', 'dark_web_exposure', 'How frequently are dark web scans conducted?', 'frequency', false, '[{"label": "Daily", "value": 1.0}, {"label": "Weekly", "value": 0.9}, {"label": "Monthly", "value": 0.75}, {"label": "No", "value": 0.0}]'),
('DW-002', 'dark_web_exposure', 'Are dark web monitoring alerts reviewed regularly?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DW-003', 'dark_web_exposure', 'Is there a process to respond to dark web exposure?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('PC-001', 'change_patch_cadence', 'Is there a documented change/patch management policy?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('PC-002', 'change_patch_cadence', 'Is target time to deploy critical patches <24 hours?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('PC-003', 'change_patch_cadence', 'Is year-to-date critical patch compliance >90%?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DLP-001', 'dlp_and_dspm', 'Is there a DLP solution implemented to monitor sensitive data?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('DLP-002', 'dlp_and_dspm', 'How often is DLP policy reviewed and updated?', 'frequency', false, '[{"label": "Bi-annually", "value": 1.0}, {"label": "Annually", "value": 0.75}, {"label": "No", "value": 0.0}]'),
('ADC-001', 'active_directory_configuration', 'Is Active Directory (AD) auditing enabled?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('ADC-002', 'active_directory_configuration', 'Are service accounts managed with least privilege?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('IR-001', 'incident_management_and_response', 'How is incident management and response process executed?', 'multiple', false, '[{"label": "Both", "value": 1.0}, {"label": "IR_only", "value": 0.75}, {"label": "SOC_only", "value": 0.5}, {"label": "Neither", "value": 0.0}]'),
('IR-002', 'incident_management_and_response', 'Are historical incident statistics maintained?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('SOC-001', 'soc_and_soar_capabilities', 'What is SOC monitoring capability?', 'multiple', false, '[{"label": "Internal_24x7", "value": 1.0}, {"label": "3rd_party_24x7", "value": 0.75}, {"label": "Partial_24x7", "value": 0.5}, {"label": "No_SOC", "value": 0.0}]'),
('SOC-002', 'soc_and_soar_capabilities', 'Is there a mechanism for real-time alerting and escalation?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]'),
('SOC-003', 'soc_and_soar_capabilities', 'Is external reporting responsibility defined?', 'governance', false, '[{"label": "Not defined", "value": 0.0}, {"label": "Informal", "value": 0.5}, {"label": "Formal", "value": 1.0}]'),
('SOC-004', 'soc_and_soar_capabilities', 'Is log monitoring conducted 24×7?', 'coverage', false, '[{"label": "None", "value": 0.0}, {"label": "Partial", "value": 0.5}, {"label": "Full", "value": 1.0}]'),
('SOC-005', 'soc_and_soar_capabilities', 'Are OT logs integrated where feasible?', 'coverage', false, '[{"label": "None", "value": 0.0}, {"label": "Partial", "value": 0.5}, {"label": "Full", "value": 1.0}]'),
('SOC-006', 'soc_and_soar_capabilities', 'Are alerts triaged with defined SLAs?', 'governance', false, '[{"label": "Not defined", "value": 0.0}, {"label": "Informal", "value": 0.5}, {"label": "Formal", "value": 1.0}]'),
('SOC-007', 'soc_and_soar_capabilities', 'Is incident automation or playbooks used?', 'coverage', false, '[{"label": "None", "value": 0.0}, {"label": "Partial", "value": 0.5}, {"label": "Full", "value": 1.0}]')
ON CONFLICT (id) DO UPDATE SET 
  text = EXCLUDED.text,
  type = EXCLUDED.type,
  options = EXCLUDED.options;
