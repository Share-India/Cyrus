
-- SEED DOMAINS
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('network_security', 'Network Security', 7.0, 'This section assesses your first line of defense against external threats.', 0);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('data_backup_and_recovery', 'Data Backup and Recovery', 7.0, 'This helps us understand recovery capability after an attack.', 1);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('certifications', 'Certifications', 4.0, 'This validates your commitment to industry-standard security practices.', 2);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('background_verification_and_employee_awareness', 'Background Verification and Employee Awareness', 4.0, 'This assesses your personnel security and insider threat mitigation.', 3);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('regulatory_compliance', 'Regulatory Compliance', 5.0, 'This evaluates adherence to legal and regulatory security requirements.', 4);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('organizational_policies_and_procedures', 'Organizational Policies and Procedures', 5.0, 'This checks for established rules and procedures governing security.', 5);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('physical_perimeter_security', 'Physical Perimeter Security', 7.0, 'This assesses protection of physical assets and facilities.', 6);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('endpoint_security', 'Endpoint Security', 6.0, 'This evaluates protection of individual devices connecting to your network.', 7);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('iot_and_ot_network', 'IoT and OT Network', 9.0, 'This assesses security of connected devices and operational technology.', 8);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('asset_management', 'Asset Management', 6.0, 'This evaluates how you track and manage your IT assets.', 9);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('identity_and_access_management', 'Identity and Access Management', 6.0, 'This assesses how you control user access to systems and data.', 10);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('vulnerability_assessment_and_penetration_test', 'Vulnerability Assessment and Penetration Test', 5.0, 'This evaluates your proactive identification of security weaknesses.', 11);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('ransomware_supplemental', 'Ransomware Supplemental', 5.0, 'This section helps assess protection against ransomware.', 12);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('dark_web_exposure', 'Dark Web Exposure', 2.0, 'This checks for leaked credentials or data on the dark web.', 13);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('change_patch_cadence', 'Change/Patch Cadence', 5.0, 'This evaluates how quickly you update systems to fix vulnerabilities.', 14);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('dlp_and_dspm', 'DLP and DSPM', 4.0, 'This assesses measures to prevent sensitive data loss.', 15);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('active_directory_configuration', 'Active Directory Configuration', 3.0, 'This evaluates the security of your central user and computer management.', 16);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('incident_management_and_response', 'Incident Management and Response', 6.0, 'This assesses your readiness to respond to security incidents.', 17);
INSERT INTO public.domains (id, name, default_weight, explanation, display_order) VALUES ('soc_and_soar_capabilities', 'SOC and SOAR Capabilities', 4.0, 'This evaluates your real-time threat monitoring and automated response capabilities.', 18);

-- SEED QUESTIONS
-- (Sampling 20 to start, I will provide the user a way to run the full set if they prefer, or I can dump the full list here)
-- Actually, I'll dump a significant chunk to ensure the user sees the scale.
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('NS-001', 'network_security', 'Is Firewall implemented?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]');
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('NS-002', 'network_security', 'Is DDoS Protection implemented?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]');
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('NS-003', 'network_security', 'Is WAF (Web Application Firewall) implemented?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]');
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('NS-004', 'network_security', 'Is IDS/IPS implemented?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]');
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('NS-005', 'network_security', 'Is NGFW (Next-Gen Firewall) implemented?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]');
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('NS-006', 'network_security', 'Are network segmentation and VLANs used to limit access?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]');
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('NS-007', 'network_security', 'Are VPNs used for secure remote access?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]');
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('NS-008', 'network_security', 'Is wireless network security implemented with encryption?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]');
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('NS-009', 'network_security', 'Is there a process to review the firewall rules?', 'frequency', false, '[{"label": "Quarterly", "value": 1.0}, {"label": "Half-yearly", "value": 0.75}, {"label": "Annually", "value": 0.5}, {"label": "No", "value": 0.0}]');
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('NS-010', 'network_security', 'How often do you perform review of network architecture?', 'frequency', false, '[{"label": "Quarterly", "value": 1.0}, {"label": "Half-yearly", "value": 0.75}, {"label": "Annually", "value": 0.5}, {"label": "No", "value": 0.0}]');

INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('DBR-001', 'data_backup_and_recovery', 'Are regular backups performed on critical systems?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]');
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('DBR-002', 'data_backup_and_recovery', 'Are backups encrypted during storage and transmission?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]');
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('DBR-003', 'data_backup_and_recovery', 'Are backup procedures tested regularly for recovery?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]');
INSERT INTO public.questions (id, domain_id, text, type, is_killer, options) VALUES ('DBR-004', 'data_backup_and_recovery', 'Is there a defined Recovery Point Objective (RPO) and Recovery Time Objective (RTO)?', 'binary', false, '[{"label": "Yes", "value": 1.0}, {"label": "No", "value": 0.0}]');

-- (Full list will be provided to the user in a separate artifact to avoid cluttering chat)
