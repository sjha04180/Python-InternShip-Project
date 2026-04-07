# TCET ERP — College Management System

A visually polished, student-level ERP built with **HTML + CSS + JavaScript + Flask**.

---

## 📁 Project Structure

```
tcet-erp/
├── app.py                 ← Flask backend
├── templates/
│   └── index.html         ← Full frontend (all pages)
└── static/
    ├── style.css          ← Dark glassmorphism theme
    └── script.js          ← All frontend logic
```

---

## 🚀 How to Run

### 1. Install Flask
```bash
pip install flask
```

### 2. Run the server
```bash
python app.py
```

### 3. Open in browser
```
http://localhost:5000
```

---

## 🔐 Demo Login Credentials

| Role    | Email                  | Password |
|---------|------------------------|----------|
| Student | student@tcet.ac.in     | 123456   |
| Teacher | teacher@tcet.ac.in     | 123456   |
| Admin   | admin@tcet.ac.in       | 123456   |

> Credentials are auto-filled when you select a role on the login page.

---

## 🎨 Features

### Login Page
- Role selection (Student / Teacher / Admin)
- Show/hide password toggle
- Auto-fill demo credentials
- Form validation

### Student Dashboard
- Overview cards (attendance %, CGPA, subjects, assignments)
- Animated bar chart for subject scores
- Marks table with grades
- Attendance tracking with visual bars
- Weekly timetable (color-coded)
- Notice board with categories

### Teacher Dashboard
- Today's class schedule
- Toggle-based attendance marking
- Mark entry with auto-grade calculation
- Post notice form

### Admin Dashboard
- System statistics cards
- Department distribution chart
- Live activity feed
- Searchable student list
- Faculty list
- Performance bar chart

---

## 🌐 API Endpoints (Flask)

| Method | Route         | Description              |
|--------|---------------|--------------------------|
| GET    | `/`           | Serve HTML page          |
| POST   | `/login`      | Validate credentials     |
| GET    | `/students`   | Get all students         |
| GET    | `/marks`      | Get student marks        |
| POST   | `/attendance` | Save attendance data     |
| GET    | `/notices`    | Get all notices          |
| POST   | `/notices`    | Post a new notice        |
| GET    | `/stats`      | System statistics        |

---

## 🎨 Design

- **Theme:** Dark Glassmorphism
- **Fonts:** Syne (display) + DM Sans (body)
- **Colors:** Deep dark + blue/teal/green/amber accents
- **Effects:** Frosted glass panels, glowing orbs, smooth transitions