-- ═══════════════════════════════════════════════════
--   TCET ERP — Supabase Schema & Initial Data
-- ═══════════════════════════════════════════════════

-- 1. Create Users Table (for Authentication)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    info VARCHAR(255)
);

-- 2. Create Students Table
CREATE TABLE students (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    roll VARCHAR(50) UNIQUE NOT NULL,
    dept VARCHAR(100) NOT NULL,
    year VARCHAR(10) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    attendance INT DEFAULT 0
);

-- 3. Create Teachers Table
CREATE TABLE teachers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    empid VARCHAR(50) UNIQUE NOT NULL,
    dept VARCHAR(100) NOT NULL,
    desig VARCHAR(100),
    subjects VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL
);

-- 4. Create Marks Table
CREATE TABLE marks (
    id SERIAL PRIMARY KEY,
    roll_no VARCHAR(50) NOT NULL,
    subject VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    ut1 INT DEFAULT 0,
    ut2 INT DEFAULT 0,
    mid_sem INT DEFAULT 0,
    end_sem INT DEFAULT 0,
    total INT DEFAULT 0,
    grade VARCHAR(10)
);

-- 5. Create Attendance Table
CREATE TABLE attendance_records (
    id SERIAL PRIMARY KEY,
    class_name VARCHAR(100) NOT NULL,
    subject VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    student_roll VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL
);

-- 6. Create Notices Table
CREATE TABLE notices (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    posted_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- ── Insert Dummy Data ──────────────────────────────────────

-- Users
INSERT INTO users (email, password, role, name, info) VALUES
('student@tcet.ac.in', '123456', 'student', 'Rahul Sharma', 'SE Computer · Roll: 22CS04'),
('teacher@tcet.ac.in', '123456', 'teacher', 'Prof. A. Mehta', 'Computer Engineering Dept.'),
('admin@tcet.ac.in', '123456', 'admin', 'Admin User', 'System Administrator');

-- Students
INSERT INTO students (id, name, roll, dept, year, email, attendance) VALUES
(1, 'Rahul Sharma', '22CS04', 'Computer Eng.', 'SE', 'rahul@tcet.ac.in', 84),
(2, 'Sneha Patil', '22CS07', 'Computer Eng.', 'SE', 'sneha@tcet.ac.in', 91),
(3, 'Arjun Verma', '22CS12', 'Computer Eng.', 'SE', 'arjun@tcet.ac.in', 68),
(4, 'Priya Nair', '22CS15', 'Computer Eng.', 'SE', 'priya@tcet.ac.in', 79),
(5, 'Yash Kulkarni', '22CS19', 'Computer Eng.', 'SE', 'yash@tcet.ac.in', 88),
(6, 'Ananya Joshi', '22CS23', 'Computer Eng.', 'SE', 'ananya@tcet.ac.in', 95),
(7, 'Rohan Desai', '21IT08', 'Info. Tech.', 'TE', 'rohan@tcet.ac.in', 72),
(8, 'Kavya Iyer', '21IT14', 'Info. Tech.', 'TE', 'kavya@tcet.ac.in', 83),
(9, 'Mihir Tiwari', '21IT20', 'Info. Tech.', 'TE', 'mihir@tcet.ac.in', 74),
(10, 'Sakshi Gupta', '22EC09', 'Electronics', 'SE', 'sakshi@tcet.ac.in', 89);

-- Teachers
INSERT INTO teachers (id, name, empid, dept, desig, subjects, email) VALUES
(1, 'Prof. A. Mehta', 'TC001', 'Computer Eng.', 'Associate Prof.', 'OS, Compiler Design', 'mehta@tcet.ac.in'),
(2, 'Dr. R. Sharma', 'TC002', 'Computer Eng.', 'Professor', 'DSA, Algorithms', 'sharma@tcet.ac.in'),
(3, 'Prof. K. Gupta', 'TC003', 'Computer Eng.', 'Assistant Prof.', 'DBMS, SQL', 'gupta@tcet.ac.in'),
(4, 'Prof. S. Nair', 'TC004', 'Computer Eng.', 'Assistant Prof.', 'Computer Networks', 'nair@tcet.ac.in'),
(5, 'Dr. V. Pillai', 'TC005', 'Computer Eng.', 'Associate Prof.', 'TOC, CD', 'pillai@tcet.ac.in'),
(6, 'Prof. M. Joshi', 'TC006', 'Info. Tech.', 'Assistant Prof.', 'Web Tech, Java', 'joshi@tcet.ac.in'),
(7, 'Dr. P. Desai', 'TC007', 'Electronics', 'Professor', 'VLSI, Digital Sys.', 'desai@tcet.ac.in');

-- Marks for Roll 22CS04
INSERT INTO marks (roll_no, subject, code, ut1, ut2, mid_sem, end_sem, total, grade) VALUES
('22CS04', 'Data Structures', 'CSC601', 18, 19, 38, 72, 88, 'A+'),
('22CS04', 'DBMS', 'CSC602', 16, 15, 30, 60, 75, 'A'),
('22CS04', 'Operating Systems', 'CSC603', 20, 18, 40, 76, 92, 'O'),
('22CS04', 'Computer Networks', 'CSC604', 14, 16, 28, 54, 68, 'B+'),
('22CS04', 'Theory of Comp.', 'CSC605', 17, 16, 34, 62, 79, 'A'),
('22CS04', 'Compiler Design', 'CSC606', 18, 17, 36, 66, 83, 'A');

-- Notices
INSERT INTO notices (title, category, message, posted_by) VALUES
('Internal Exam Schedule', 'urgent', 'Exams from 18th–22nd April.', 'Admin'),
('Project Submission', 'important', 'Submit by 30th April.', 'HOD CSE');
