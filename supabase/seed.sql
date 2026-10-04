-- Institutional Store Management System - Realistic Development Seed Data

-- 1. Initial Institution Settings
insert into public.institution_settings (id, institution_name, logo_url, address, phone, email)
values (
    'a0000000-0000-0000-0000-000000000001',
    'Apex Institute of Technology & Science',
    null,
    'Central Campus, Knowledge Corridor, Building C, Ground Floor',
    '+1 (555) 482-9100',
    'storekeeper@apex-institute.edu'
) on conflict (id) do update set
    institution_name = excluded.institution_name,
    address = excluded.address,
    phone = excluded.phone,
    email = excluded.email;

-- 2. Categories Seed
insert into public.categories (id, name, description, icon, color, is_active) values
('c1000000-0000-0000-0000-000000000001', 'Sports Equipment', 'Athletics, field gear, indoor and outdoor sports items', 'trophy', '#17352F', true),
('c1000000-0000-0000-0000-000000000002', 'Electronics', 'Audio/visual devices, cables, projectors, screens and displays', 'tv', '#2A4D44', true),
('c1000000-0000-0000-0000-000000000003', 'Tools & Maintenance', 'Power tools, cleaning machinery, workshop hardware and maintenance gear', 'wrench', '#718355', true),
('c1000000-0000-0000-0000-000000000004', 'Laboratory', 'Chemicals, scientific glassware, measurement kits, test tubes and flasks', 'flask-conical', '#C58A32', true),
('c1000000-0000-0000-0000-000000000005', 'Books & Reference', 'Institutional reference manuals, dictionaries, course encyclopedias', 'book-open', '#4B5563', true),
('c1000000-0000-0000-0000-000000000006', 'Other', 'General institutional utility materials and reusable resources', 'box', '#6D756F', true)
on conflict (name) do nothing;

-- 3. Inventory Items Seed
insert into public.items (
    id, item_code, name, category_id, description, tracking_type, unit,
    total_quantity, minimum_quantity, location, condition, is_active
) values
('i1000000-0000-0000-0000-000000000001', 'SPORT-BAT-001', 'English Willow Cricket Bat', 'c1000000-0000-0000-0000-000000000001', 'Full-size grade 1 willow bat for inter-college tournaments', 'ASSET', 'piece', 6, 2, 'Sports Pavilion - Locker A1', 'GOOD', true),
('i1000000-0000-0000-0000-000000000002', 'SPORT-BALL-001', 'FIFA Quality Pro Football (Size 5)', 'c1000000-0000-0000-0000-000000000001', 'Match-grade polyurethane synthetic leather football', 'STOCK', 'piece', 18, 5, 'Sports Store - Bin 4', 'GOOD', true),
('i1000000-0000-0000-0000-000000000003', 'SPORT-SHT-001', 'Feather Badminton Shuttlecock (Tube of 12)', 'c1000000-0000-0000-0000-000000000001', 'Tournament speed 77 goose feather shuttlecocks', 'STOCK', 'box', 3, 5, 'Sports Store - Shelf B2', 'GOOD', true),
('i1000000-0000-0000-0000-000000000004', 'SPORT-RCK-001', 'Yonex Carbon Fiber Badminton Racket', 'c1000000-0000-0000-0000-000000000001', 'High-tension isometric frame rackets for training', 'ASSET', 'piece', 12, 4, 'Sports Store - Rack R1', 'GOOD', true),

('i1000000-0000-0000-0000-000000000005', 'ELEC-PRJ-001', 'Epson Full HD Laser Projector (4000 Lumens)', 'c1000000-0000-0000-0000-000000000002', 'Portable classroom & seminar hall projector with HDMI/VGA', 'ASSET', 'piece', 4, 1, 'AV Store - Cabinet 2', 'GOOD', true),
('i1000000-0000-0000-0000-000000000006', 'ELEC-TV-001', 'Sony Bravia 55-inch 4K Commercial Display', 'c1000000-0000-0000-0000-000000000002', 'Mounted display unit with wheeled heavy-duty stand', 'ASSET', 'piece', 2, 1, 'AV Store - Bay 1', 'GOOD', true),
('i1000000-0000-0000-0000-000000000007', 'ELEC-MIC-001', 'Shure Dual UHF Wireless Lapel & Handheld Microphone Kit', 'c1000000-0000-0000-0000-000000000002', 'Auditorium wireless mic set with receiver and rechargeable batteries', 'ASSET', 'set', 5, 2, 'AV Store - Case 3', 'GOOD', true),
('i1000000-0000-0000-0000-000000000008', 'ELEC-SPK-001', 'JBL EON 15-inch Powered PA Speaker System', 'c1000000-0000-0000-0000-000000000002', '1000W active speaker pair with aluminum tripod stands', 'ASSET', 'pair', 0, 1, 'AV Store - Bay 3', 'MAINTENANCE', true),

('i1000000-0000-0000-0000-000000000009', 'TOOL-VAC-001', 'Kärcher Commercial Wet & Dry Vacuum Cleaner (30L)', 'c1000000-0000-0000-0000-000000000003', 'Heavy-duty industrial vacuum for campus halls & labs', 'ASSET', 'piece', 3, 1, 'Facility Store - Bay F1', 'GOOD', true),
('i1000000-0000-0000-0000-000000000010', 'TOOL-BLW-001', 'Bosch Variable Speed Electric Air Blower (820W)', 'c1000000-0000-0000-0000-000000000003', 'Dust extraction and electronics chassis maintenance blower', 'ASSET', 'piece', 4, 1, 'Facility Store - Bay F2', 'GOOD', true),

('i1000000-0000-0000-0000-000000000011', 'LAB-TUB-001', 'Borosilicate Glass Test Tubes (Rimless, 15x150mm)', 'c1000000-0000-0000-0000-000000000004', 'Autoclavable thermal shock resistant laboratory test tubes', 'STOCK', 'box', 24, 10, 'Central Chemistry Vault - Shelf 1C', 'GOOD', true),
('i1000000-0000-0000-0000-000000000012', 'BOOK-DCT-001', 'Oxford English Reference Dictionary (Hardcover 2024)', 'c1000000-0000-0000-0000-000000000005', 'Standard reference edition for academic language lab', 'ASSET', 'piece', 8, 2, 'Main Library - Reserve Shelf 4', 'GOOD', true)
on conflict (item_code) do nothing;

-- 4. People Seed (Students, Faculty, Staff)
insert into public.people (
    id, admission_number, full_name, role, department, class_name, phone, email, is_active
) values
('p1000000-0000-0000-0000-000000000001', 'STU-2023-0142', 'Marcus Vance', 'STUDENT', 'Computer Science & Engineering', 'CSE-3A', '+1 (555) 201-9981', 'm.vance@student.apex.edu', true),
('p1000000-0000-0000-0000-000000000002', 'STU-2024-0089', 'Ananya Sharma', 'STUDENT', 'Electronics & Communication', 'ECE-2B', '+1 (555) 304-8812', 'a.sharma@student.apex.edu', true),
('p1000000-0000-0000-0000-000000000003', null, 'Dr. Arthur Pendelton', 'TEACHER', 'Department of Physics', null, '+1 (555) 441-2309', 'a.pendelton@apex.edu', true),
('p1000000-0000-0000-0000-000000000004', null, 'Prof. Elena Rostova', 'TEACHER', 'Physical Education & Sports', null, '+1 (555) 552-3341', 'e.rostova@apex.edu', true),
('p1000000-0000-0000-0000-000000000005', null, 'David K. O''Connor', 'STAFF', 'Facilities & Campus Maintenance', null, '+1 (555) 663-4452', 'd.oconnor@apex.edu', true),
('p1000000-0000-0000-0000-000000000006', 'STU-2023-0310', 'Zoe Chen', 'STUDENT', 'Mechanical Engineering', 'ME-3B', '+1 (555) 774-5563', 'z.chen@student.apex.edu', true)
on conflict (id) do nothing;
