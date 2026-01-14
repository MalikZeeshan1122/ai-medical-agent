-- ============================================
-- DEMO SAMPLE DATA FOR PRESENTATION
-- Run this in Supabase SQL Editor after logging in
-- Replace 'YOUR_USER_ID' with your actual user ID from auth.users
-- ============================================

-- To get your user ID, run: SELECT id FROM auth.users LIMIT 1;

-- ============================================
-- SAMPLE MEDICATIONS
-- ============================================
INSERT INTO medications (user_id, name, dosage, frequency, start_date, end_date, notes, is_current) VALUES
-- Replace YOUR_USER_ID with your actual UUID
('YOUR_USER_ID', 'Metformin', '500mg', 'Twice daily', '2025-01-01', NULL, 'Take with meals for blood sugar control', true),
('YOUR_USER_ID', 'Lisinopril', '10mg', 'Once daily', '2025-01-01', NULL, 'Blood pressure medication - take in morning', true),
('YOUR_USER_ID', 'Vitamin D3', '2000 IU', 'Once daily', '2025-06-01', NULL, 'Supplement for vitamin D deficiency', true),
('YOUR_USER_ID', 'Omeprazole', '20mg', 'Once daily', '2024-10-01', '2024-12-31', 'For acid reflux - completed course', false),
('YOUR_USER_ID', 'Aspirin', '81mg', 'Once daily', '2025-01-01', NULL, 'Low-dose for heart health', true);

-- ============================================
-- SAMPLE CHRONIC CONDITIONS
-- ============================================
INSERT INTO chronic_conditions (user_id, condition_name, diagnosed_date, status, notes) VALUES
('YOUR_USER_ID', 'Type 2 Diabetes', '2023-06-15', 'managed', 'Well controlled with medication and diet'),
('YOUR_USER_ID', 'Hypertension', '2022-03-10', 'managed', 'Blood pressure stable with Lisinopril'),
('YOUR_USER_ID', 'Vitamin D Deficiency', '2025-05-20', 'improving', 'Taking supplements, levels improving');

-- ============================================
-- SAMPLE SYMPTOMS (Recent entries for demo)
-- ============================================
INSERT INTO symptoms (user_id, symptom_name, severity, notes, created_at) VALUES
('YOUR_USER_ID', 'Headache', 3, 'Mild tension headache after work', NOW() - INTERVAL '2 days'),
('YOUR_USER_ID', 'Fatigue', 5, 'Feeling tired in the afternoon', NOW() - INTERVAL '1 day'),
('YOUR_USER_ID', 'Joint Pain', 4, 'Knee pain after walking', NOW() - INTERVAL '3 days'),
('YOUR_USER_ID', 'Dizziness', 2, 'Brief episode when standing up quickly', NOW() - INTERVAL '5 days');

-- ============================================
-- SAMPLE APPOINTMENTS (Mix of past and upcoming)
-- ============================================
INSERT INTO appointments (user_id, title, doctor_name, appointment_date, appointment_time, location, notes, status, reminder_enabled) VALUES
-- Upcoming appointments
('YOUR_USER_ID', 'Annual Physical Checkup', 'Dr. Sarah Johnson', CURRENT_DATE + INTERVAL '7 days', '10:00 AM', 'City Medical Center, Room 205', 'Bring medication list and recent lab results', 'scheduled', true),
('YOUR_USER_ID', 'Diabetes Follow-up', 'Dr. Michael Chen', CURRENT_DATE + INTERVAL '14 days', '2:30 PM', 'Endocrinology Clinic', 'Blood sugar log review', 'scheduled', true),
('YOUR_USER_ID', 'Eye Examination', 'Dr. Emily Rodriguez', CURRENT_DATE + INTERVAL '21 days', '11:00 AM', 'Vision Care Center', 'Annual diabetic eye screening', 'scheduled', true),
-- Past appointments
('YOUR_USER_ID', 'Blood Pressure Check', 'Dr. Sarah Johnson', CURRENT_DATE - INTERVAL '30 days', '9:00 AM', 'City Medical Center', 'BP was 128/82 - good control', 'completed', false),
('YOUR_USER_ID', 'Lab Work', 'Quest Diagnostics', CURRENT_DATE - INTERVAL '45 days', '8:00 AM', 'Quest Lab - Downtown', 'HbA1c and lipid panel', 'completed', false);

-- ============================================
-- SAMPLE DOCTORS
-- ============================================
INSERT INTO doctors (user_id, name, specialty, hospital, phone, email, address, notes, is_primary) VALUES
('YOUR_USER_ID', 'Dr. Sarah Johnson', 'Internal Medicine', 'City Medical Center', '(555) 123-4567', 'sarah.johnson@citymed.com', '123 Healthcare Blvd, Suite 100', 'Primary care physician since 2022', true),
('YOUR_USER_ID', 'Dr. Michael Chen', 'Endocrinology', 'University Hospital', '(555) 234-5678', 'mchen@unihospital.com', '456 Medical Drive, Floor 3', 'Diabetes specialist', false),
('YOUR_USER_ID', 'Dr. Emily Rodriguez', 'Ophthalmology', 'Vision Care Center', '(555) 345-6789', 'e.rodriguez@visioncare.com', '789 Eye Care Lane', 'Annual diabetic eye exams', false);

-- ============================================
-- SAMPLE EMERGENCY CONTACTS
-- ============================================
INSERT INTO emergency_contacts (user_id, name, relationship, phone, is_primary) VALUES
('YOUR_USER_ID', 'Ahmed Khan', 'Brother', '(555) 111-2222', true),
('YOUR_USER_ID', 'Fatima Khan', 'Mother', '(555) 333-4444', false),
('YOUR_USER_ID', 'Dr. Sarah Johnson', 'Primary Doctor', '(555) 123-4567', false);

-- ============================================
-- Verify data was inserted
-- ============================================
SELECT 'Medications' as table_name, COUNT(*) as count FROM medications WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Chronic Conditions', COUNT(*) FROM chronic_conditions WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Symptoms', COUNT(*) FROM symptoms WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Doctors', COUNT(*) FROM doctors WHERE user_id = 'YOUR_USER_ID'
UNION ALL
SELECT 'Emergency Contacts', COUNT(*) FROM emergency_contacts WHERE user_id = 'YOUR_USER_ID';
