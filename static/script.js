// ═══════════════════════════════════════════
//   TCET ERP — Main JavaScript
// ═══════════════════════════════════════════

// ── State ─────────────────────────────────────────────────
let currentRole = 'student';
let currentUser = null;

let STUDENTS = [];
let TEACHERS = [];

// Attendance state for teacher panel
let attState = {};


// ═══════════════════════════════════════════
//   LOGIN
// ═══════════════════════════════════════════

function selectRole(btn) {
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  currentRole = btn.dataset.role;

  // Auto-fill demo credentials
  const emailMap = { student: 'student@tcet.ac.in', teacher: 'teacher@tcet.ac.in', admin: 'admin@tcet.ac.in' };
  document.getElementById('emailInput').value = emailMap[currentRole];
  document.getElementById('passInput').value  = '123456';
  document.getElementById('loginError').classList.add('hidden');
}

function togglePass() {
  const inp  = document.getElementById('passInput');
  const icon = document.getElementById('eyeIcon');
  if (inp.type === 'password') {
    inp.type = 'text';
    icon.classList.replace('fa-eye', 'fa-eye-slash');
  } else {
    inp.type = 'password';
    icon.classList.replace('fa-eye-slash', 'fa-eye');
  }
}

async function handleLogin() {
  const email = document.getElementById('emailInput').value.trim();
  const pass  = document.getElementById('passInput').value.trim();
  const err   = document.getElementById('loginError');

  if (!email || !pass) {
    err.innerHTML = '<i class="fas fa-exclamation-circle"></i> Please fill in all fields.';
    err.classList.remove('hidden');
    return;
  }

  const originalText = document.querySelector('.login-btn span').textContent;
  document.querySelector('.login-btn span').textContent = 'Authenticating...';

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: pass, role: currentRole })
    });
    const data = await res.json();
    document.querySelector('.login-btn span').textContent = originalText;

    if (!data.success) {
      err.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${data.message || 'Invalid credentials'}`;
      err.classList.remove('hidden');
      return;
    }

    currentUser = data; // {success:true, name:..., role:..., info:...}
    currentUser.email = email; // attach email so we can fetch custom endpoints
    localStorage.setItem('erp_user', JSON.stringify(currentUser));
    
    err.classList.add('hidden');
    launchDashboard(currentUser);
  } catch (error) {
    err.innerHTML = '<i class="fas fa-exclamation-circle"></i> Login failed (Network error)';
    err.classList.remove('hidden');
    document.querySelector('.login-btn span').textContent = originalText;
  }
}

// Allow Enter key on login
document.addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const loginPage = document.getElementById('loginPage');
    if (loginPage.classList.contains('active')) handleLogin();
  }
});

// ═══════════════════════════════════════════
//   DASHBOARD LAUNCH
// ═══════════════════════════════════════════

async function launchDashboard(user) {
  // Switch pages
  document.getElementById('loginPage').classList.remove('active');
  document.getElementById('dashboardPage').classList.add('active');

  // Show correct nav
  document.getElementById('studentNav').classList.add('hidden');
  document.getElementById('teacherNav').classList.add('hidden');
  document.getElementById('adminNav').classList.add('hidden');
  document.getElementById(`${user.role}Nav`).classList.remove('hidden');

  // Set user info in sidebar
  document.getElementById('sidebarUser').innerHTML = `<b>${user.name}</b>${user.info || ''}`;

  // Set topbar avatar
  document.getElementById('topbarAvatar').textContent = user.name.charAt(0);

  // Set topbar date
  const d = new Date();
  document.getElementById('topbarDate').textContent = d.toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short', year:'numeric' });

  // Show first section
  const firstSection = { student: 'studentOverview', teacher: 'teacherOverview', admin: 'adminOverview' };
  const firstTitle   = { student: 'Student Dashboard', teacher: 'Teacher Dashboard', admin: 'Admin Dashboard' };
  const firstSub     = { student: `Welcome back, ${user.name}`, teacher: `Welcome back, ${user.name}`, admin: 'System Overview' };

  setPageTitle(firstTitle[user.role], firstSub[user.role]);
  switchSection(firstSection[user.role]);

  // Fetch dynamic info
  try {
    const res = await fetch(`/dashboard_data?role=${user.role}&email=${encodeURIComponent(user.email || '')}`);
    const dashData = await res.json();
    
    if (user.role === 'student') renderStudentDash(dashData);
    else if (user.role === 'teacher') renderTeacherDash(dashData);
    else if (user.role === 'admin') renderAdminDash(dashData);
    
    let [sRes, tRes] = await Promise.all([fetch('/students'), fetch('/teachers')]);
    if(sRes.ok) STUDENTS = await sRes.json();
    if(tRes.ok) TEACHERS = await tRes.json();

  } catch(e) {
    console.log("Error fetching DB dynamic data", e);
  }

  // Populate tables
  populateAttendanceTable();
  populateMarksEntryTable();
  if (user.role === 'admin') {
      populateAdminStudents();
      populateAdminTeachers();
  }
  fetchAndRenderNotices();
}

// ═══════════════════════════════════════════
//   NAVIGATION
// ═══════════════════════════════════════════

const SECTION_TITLES = {
  studentOverview:   ['Dashboard',         'Welcome back!'],
  studentMarks:      ['My Marks',          'Academic Performance'],
  studentAttendance: ['Attendance',        'Subject-wise attendance tracking'],
  studentTimetable:  ['Timetable',         'Weekly class schedule'],
  studentNotices:    ['Notice Board',      'Latest announcements & circulars'],
  teacherOverview:   ['Dashboard',         'Your teaching overview'],
  teacherAttendance: ['Mark Attendance',   'Record daily attendance'],
  teacherMarks:      ['Enter Marks',       'Update student marks'],
  teacherNotice:     ['Post Notice',       'Publish announcements'],
  adminOverview:     ['Admin Dashboard',   'System overview'],
  adminStudents:     ['Student List',      'Manage enrolled students'],
  adminTeachers:     ['Faculty List',      'Manage teaching staff'],
  adminStats:        ['Statistics',        'Analytics & performance data'],
};

function showSection(id, navEl) {
  // Update active nav
  if (navEl) {
    const nav = navEl.closest('.sb-nav');
    nav.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    navEl.classList.add('active');
  }
  switchSection(id);

  const t = SECTION_TITLES[id] || ['Dashboard', ''];
  setPageTitle(t[0], t[1]);

  return false; // prevent default href
}

function switchSection(id) {
  document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
  const sec = document.getElementById(id);
  if (sec) sec.classList.add('active');
}

function setPageTitle(title, sub) {
  document.getElementById('pageTitle').textContent    = title;
  document.getElementById('pageSubtitle').textContent = sub || '';
}

// ═══════════════════════════════════════════
//   SIDEBAR TOGGLE
// ═══════════════════════════════════════════

let sidebarCollapsed = false;

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  const sb = document.getElementById('sidebar');
  if (sidebarCollapsed) {
    sb.classList.add('collapsed');
    document.body.classList.add('sidebar-collapsed');
  } else {
    sb.classList.remove('collapsed');
    document.body.classList.remove('sidebar-collapsed');
  }
}

// ═══════════════════════════════════════════
//   TEACHER — ATTENDANCE
// ═══════════════════════════════════════════

function populateAttendanceTable() {
  const tbody = document.getElementById('attendanceTableBody');
  if (!tbody) return;
  attState = {};

  tbody.innerHTML = STUDENTS.map((s, i) => {
    attState[s.id] = true; // default: present
    return `
      <tr>
        <td>${i + 1}</td>
        <td>${s.name}</td>
        <td><span class="badge blue">${s.roll}</span></td>
        <td id="attStatus_${s.id}" style="color: var(--green); font-weight:600;">Present</td>
        <td>
          <div class="toggle-switch on" id="toggle_${s.id}" onclick="toggleAttendance(${s.id})"></div>
        </td>
      </tr>
    `;
  }).join('');

  // Set today's date
  const dateEl = document.getElementById('attDate');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];
}

function toggleAttendance(studentId) {
  attState[studentId] = !attState[studentId];
  const toggle = document.getElementById(`toggle_${studentId}`);
  const status = document.getElementById(`attStatus_${studentId}`);

  if (attState[studentId]) {
    toggle.classList.add('on');
    status.textContent = 'Present';
    status.style.color = 'var(--green)';
  } else {
    toggle.classList.remove('on');
    status.textContent = 'Absent';
    status.style.color = 'var(--rose)';
  }
}

function markAllPresent() {
  STUDENTS.slice(0, 8).forEach(s => {
    attState[s.id] = true;
    const toggle = document.getElementById(`toggle_${s.id}`);
    const status = document.getElementById(`attStatus_${s.id}`);
    if (toggle) toggle.classList.add('on');
    if (status) { status.textContent = 'Present'; status.style.color = 'var(--green)'; }
  });
}

async function saveAttendance() {
  const msg = document.getElementById('attSaveMsg');
  
  const records = [];
  STUDENTS.forEach(s => {
      records.push({ roll: s.roll, status: attState[s.id] ? 'Present' : 'Absent' });
  });

  const payload = {
      class: document.getElementById('attClass') ? document.getElementById('attClass').value : 'SE Computer A',
      subject: document.getElementById('attSubject') ? document.getElementById('attSubject').value : 'DSA',
      date: document.getElementById('attDate') ? document.getElementById('attDate').value : new Date().toISOString().split('T')[0],
      records: records
  };

  try {
      const res = await fetch('/attendance', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify(payload)
      });
      if(res.ok) {
          msg.classList.remove('hidden');
          setTimeout(() => msg.classList.add('hidden'), 3000);
      }
  } catch(e) {
      console.error(e);
  }
}

// ═══════════════════════════════════════════
//   TEACHER — MARKS ENTRY
// ═══════════════════════════════════════════

function populateMarksEntryTable() {
  const tbody = document.getElementById('marksEntryBody');
  if (!tbody) return;

  tbody.innerHTML = STUDENTS.map((s, i) => `
    <tr>
      <td>${i + 1}</td>
      <td>${s.name}</td>
      <td><span class="badge blue" id="roll_${s.id}">${s.roll}</span></td>
      <td><input type="number" class="erp-input max-marks-input" id="max_${s.id}" value="100" style="width:70px; padding: 4px;" onchange="updateGradeFromFields(${s.id})" /></td>
      <td><input type="number" class="marks-input" id="marks_${s.id}" placeholder="Score" style="width:70px; padding: 4px;" onchange="updateGradeFromFields(${s.id})"/></td>
      <td id="grade_${s.id}"><span class="badge green">—</span></td>
    </tr>
  `).join('');
}

function updateGradeFromFields(id) {
    const marksEl = document.getElementById(`marks_${id}`);
    const maxEl = document.getElementById(`max_${id}`);
    if(marksEl && maxEl) {
        updateGrade(id, marksEl.value, maxEl.value);
    }
}

function updateGrade(id, val, max) {
  const pct = (val / max) * 100;
  const gradeEl = document.getElementById(`grade_${id}`);
  if (!gradeEl) return;
  let g = 'F', cls = 'red';
  if (pct >= 90) { g = 'O';  cls = 'green'; }
  else if (pct >= 80) { g = 'A+'; cls = 'green'; }
  else if (pct >= 70) { g = 'A';  cls = 'amber'; }
  else if (pct >= 60) { g = 'B+'; cls = 'blue'; }
  else if (pct >= 50) { g = 'B';  cls = 'blue'; }
  gradeEl.innerHTML = `<span class="badge ${cls}">${g}</span>`;
}

async function saveMarks() {
  const msg = document.getElementById('marksSaveMsg');
  const subjectSelect = document.getElementById('teachersMarkSubject');
  const subjectText = subjectSelect ? subjectSelect.value : 'General';
  
  const records = [];
  STUDENTS.forEach(s => {
      const marksInp = document.getElementById(`marks_${s.id}`);
      if(marksInp && marksInp.value.trim() !== '') {
          records.push({
              roll_no: s.roll,
              subject: subjectText,
              marks: parseInt(marksInp.value)
          });
      }
  });

  if(records.length === 0) { alert('No marks entered!'); return; }

  try {
      const res = await fetch('/add_marks', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ records })
      });
      if(res.ok) {
          msg.classList.remove('hidden');
          setTimeout(() => msg.classList.add('hidden'), 3000);
      }
  } catch(e) { console.error(e); }
}

// ═══════════════════════════════════════════
//   TEACHER — NOTICE
// ═══════════════════════════════════════════

async function postNotice() {
  const title    = document.getElementById('noticeTitle').value.trim();
  const msg      = document.getElementById('noticeMsg').value.trim();
  const category = document.getElementById('noticeCategory').value;
  const saveMsg  = document.getElementById('noticeSaveMsg');

  if (!title || !msg) { alert('Please fill in all fields.'); return; }

  try {
      const res = await fetch('/notices', {
          method: 'POST',
          headers: {'Content-Type':'application/json'},
          body: JSON.stringify({
              title, category, message: msg, posted_by: currentUser.name || 'Teacher'
          })
      });
      
      if(res.ok) {
          document.getElementById('noticeTitle').value = '';
          document.getElementById('noticeMsg').value   = '';

          saveMsg.classList.remove('hidden');
          setTimeout(() => saveMsg.classList.add('hidden'), 3000);
          fetchAndRenderNotices();
      }
  } catch(e) { console.error(e); }
}

async function fetchAndRenderNotices() {
    try {
        const res = await fetch('/notices');
        const notices = await res.json();
        
        const list = document.getElementById('noticeGrid');
        const colors = { urgent: 'red', important: 'amber', general: 'green', event: 'blue' };
        
        if(list && notices.length > 0) {
            list.innerHTML = notices.map(n => `
            <div class="notice-card ${colors[n.category]}-border">
              <div class="nc-header"><span class="badge ${colors[n.category]}">${n.category.charAt(0).toUpperCase() + n.category.slice(1)}</span><small>${new Date(n.created_at).toLocaleDateString()}</small></div>
              <h4>${n.title}</h4>
              <p>${n.message}</p>
              <div class="nc-footer"><i class="fas fa-user"></i> ${n.posted_by}</div>
            </div>
            `).join('');
        }
    } catch(e) { console.log(e); }
}

// ═══════════════════════════════════════════
//   ADMIN — STUDENTS TABLE
// ═══════════════════════════════════════════

function populateAdminStudents(filter = '') {
  const tbody = document.getElementById('adminStudentsBody');
  if (!tbody) return;

  const filtered = STUDENTS.filter(s =>
    s.name.toLowerCase().includes(filter.toLowerCase()) ||
    s.roll.toLowerCase().includes(filter.toLowerCase()) ||
    s.dept.toLowerCase().includes(filter.toLowerCase())
  );

  tbody.innerHTML = filtered.map((s, i) => {
    const attColor = s.att >= 75 ? 'green' : 'red';
    const status   = s.att >= 75 ? 'Active' : 'Warning';
    const sBadge   = s.att >= 75 ? 'green'  : 'red';
    return `
      <tr>
        <td>${i + 1}</td>
        <td><b>${s.name}</b></td>
        <td><span class="badge blue">${s.roll}</span></td>
        <td>${s.dept}</td>
        <td>${s.year}</td>
        <td style="color: var(--text-muted)">${s.email}</td>
        <td style="color: var(--${attColor}); font-weight:600;">${s.att}%</td>
        <td><span class="badge ${sBadge}">${status}</span></td>
      </tr>
    `;
  }).join('');

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center; color: var(--text-dim); padding: 24px;">No students found.</td></tr>`;
  }
}

function filterStudents() {
  const val = document.getElementById('studentSearch').value;
  populateAdminStudents(val);
}

async function adminAddStudent() {
  const name = document.getElementById('newStudName').value.trim();
  const roll = document.getElementById('newStudRoll').value.trim();
  const dept = document.getElementById('newStudDept').value.trim();
  const year = document.getElementById('newStudYear').value.trim();
  const email = document.getElementById('newStudEmail').value.trim();

  if(!name || !roll || !email) return alert('Fill required fields');

  try {
    const res = await fetch('/add_student', {
        method: 'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name, roll, dept, year, email })
    });
    if(res.ok) {
        document.getElementById('addStudMsg').classList.remove('hidden');
        setTimeout(() => document.getElementById('addStudMsg').classList.add('hidden'), 3000);
        // Refresh DB
        const sRes = await fetch('/students');
        STUDENTS = await sRes.json();
        populateAdminStudents();
    }
  } catch(e) { console.log(e); }
}

// ═══════════════════════════════════════════
//   ADMIN — TEACHERS TABLE
// ═══════════════════════════════════════════   

function populateAdminTeachers() {
  const tbody = document.getElementById('adminTeachersBody');
  if (!tbody) return;

  tbody.innerHTML = TEACHERS.map((t, i) => `
    <tr>
      <td>${i + 1}</td>
      <td><b>${t.name}</b></td>
      <td><span class="badge blue">${t.empid}</span></td>
      <td>${t.dept}</td>
      <td>${t.desig}</td>
      <td style="color: var(--text-muted)">${t.subjects}</td>
      <td style="color: var(--text-muted)">${t.email}</td>
    </tr>
  `).join('');
}

async function adminAddTeacher() {
  const name = document.getElementById('newTeachName').value.trim();
  const empid = document.getElementById('newTeachEmpid').value.trim();
  const dept = document.getElementById('newTeachDept').value.trim();
  const desig = document.getElementById('newTeachDesig').value.trim();
  const subjects = document.getElementById('newTeachSubj').value.trim();
  const email = document.getElementById('newTeachEmail').value.trim();

  if(!name || !empid || !email) return alert('Fill required fields');

  try {
    const res = await fetch('/add_teacher', {
        method: 'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ name, empid, dept, desig, subjects, email })
    });
    if(res.ok) {
        document.getElementById('addTeachMsg').classList.remove('hidden');
        setTimeout(() => document.getElementById('addTeachMsg').classList.add('hidden'), 3000);
        // Refresh DB
        const tRes = await fetch('/teachers');
        TEACHERS = await tRes.json();
        populateAdminTeachers();
    }
  } catch(e) { console.log(e); }
}

// ═══════════════════════════════════════════
//   LOGOUT
// ═══════════════════════════════════════════

function logout() {
  currentUser = null;
  localStorage.removeItem('erp_user');
  document.getElementById('dashboardPage').classList.remove('active');
  document.getElementById('loginPage').classList.add('active');
  // Reset login form
  document.getElementById('emailInput').value = '';
  document.getElementById('passInput').value  = '';
  document.getElementById('loginError').classList.add('hidden');
  // Reset role selection to student
  document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.role-btn[data-role="student"]').classList.add('active');
  currentRole = 'student';
}

function renderAdminDash(data) {
    const cards = document.querySelectorAll('#adminOverview .stat-card .sc-num');
    if(cards.length >= 4) {
        cards[0].textContent = data.total_students || 0;
        cards[1].textContent = data.total_teachers || 0;
        cards[2].textContent = Object.keys(data.departments || {}).length;
        cards[3].textContent = data.low_attendance || 0;
    }
    const dList = document.querySelector('.dept-list');
    if(dList && data.departments) {
        let max = Math.max(...Object.values(data.departments));
        if(max === 0) max = 1;
        const colors = ['blue', 'amber', 'green', 'rose', 'teal'];
        let idx = 0;
        dList.innerHTML = Object.entries(data.departments).map(([d, c]) => {
           let pct = (c/max)*100;
           let col = colors[idx++ % colors.length];
           return `<div class="dept-row"><span>${d}</span><div class="bar-track"><div class="bar-fill ${col}-fill" style="width:${pct}%"></div></div><b>${c}</b></div>`;
        }).join('');
    }
    const stCards = document.querySelectorAll('#adminStats .stat-card .sc-num');
    if(stCards.length >= 4) {
        stCards[0].textContent = "N/A";
        stCards[1].textContent = (data.avg_attendance || 0) + "%";
        stCards[2].textContent = "6";
        stCards[3].textContent = data.low_attendance || 0;
    }
    const bChart = document.querySelector('.big-bar-chart');
    if(bChart && data.departments) {
        let max = Math.max(...Object.values(data.departments));
        if(max === 0) max = 1;
        const colors = ['blue', 'amber', 'green', 'rose', '', 'teal'];
        let idx = 0;
        bChart.innerHTML = Object.entries(data.departments).map(([d, c]) => {
            let pct = (c/max)*100;
            let col = colors[idx++ % colors.length];
            return `<div class="bbc-item"><div class="bbc-bar ${col}" style="height:${pct}%"><span>${c}</span></div><p>${d}</p></div>`;
        }).join('');
    }
}

function renderStudentDash(data) {
    const bChart = document.querySelector('.bar-chart');
    if(bChart && data.marks) {
        bChart.innerHTML = data.marks.map(m => `
            <div class="bar-item"><span>${m.subject}</span><div class="bar-track"><div class="bar-fill" style="width:${m.total}%"></div></div><b>${m.total}</b></div>
        `).join('');
    }
    const attList = document.querySelector('#studentAttendanceList');
    let totalPresent = 0;
    let totalDays = 0;
    if(attList && data.attendance_records) {
        let uniqueRecords = {};
        data.attendance_records.forEach(r => {
            let key = r.date + "_" + r.subject;
            uniqueRecords[key] = r;
        });

        let subjAtt = {};
        Object.values(uniqueRecords).forEach(r => {
            totalDays++;
            if(r.status === 'Present') totalPresent++;
            if(!subjAtt[r.subject]) subjAtt[r.subject] = {p:0, t:0};
            subjAtt[r.subject].t++;
            if(r.status === 'Present') subjAtt[r.subject].p++;
        });
        const colors = ['blue', 'green', 'amber', 'red', 'teal'];
        let idx = 0;
        attList.innerHTML = Object.entries(subjAtt).map(([sub, counts]) => {
            let pct = Math.round((counts.p / counts.t) * 100);
            let col = colors[idx++ % colors.length];
            return `<div class="att-row"><div class="att-sub"><i class="fas fa-circle ${col}"></i>${sub}</div><div class="att-bar"><div class="bar-track"><div class="bar-fill ${col}-fill" style="width:${pct}%"></div></div><span>${pct}</span></div></div>`;
        }).join('');
        
        const attStatusCardsContainer = document.querySelector('.att-status-cards');
        if(attStatusCardsContainer) {
            let overallPct = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
            let absentDays = totalDays - totalPresent;
            attStatusCardsContainer.innerHTML = `
              <div class="ass-card green"><span>Present</span><b>${totalPresent}</b><small>days</small></div>
              <div class="ass-card red"><span>Absent</span><b>${absentDays}</b><small>days</small></div>
              <div class="ass-card amber"><span>Total</span><b>${totalDays}</b><small>days</small></div>
              <div class="ass-card blue"><span>Overall</span><b>${overallPct}%</b><small></small></div>
            `;
        }
    }
    const mBody = document.getElementById('marksTableBody');
    let cgpa = "0.0";
    if(mBody && data.marks) {
        let totalSum = 0;
        mBody.innerHTML = data.marks.map((m, i) => {
            totalSum += m.total;
            let grade = 'F'; let cls = 'red';
            if (m.total >= 90) { grade = 'O'; cls = 'green'; }
            else if (m.total >= 80) { grade = 'A+'; cls = 'green'; }
            else if (m.total >= 70) { grade = 'A'; cls = 'amber'; }
            else if (m.total >= 60) { grade = 'B+'; cls = 'blue'; }
            else if (m.total >= 50) { grade = 'B'; cls = 'blue'; }
            return `<tr><td>${i+1}</td><td>${m.subject}</td><td>${m.code || 'GEN'}</td><td>-</td><td>-</td><td>-</td><td>-</td><td>${m.total}</td><td><span class="badge ${cls}">${grade}</span></td></tr>`;
        }).join('');
        let pctVal = data.marks.length > 0 ? (totalSum / (data.marks.length * 100) * 100) : 0;
        let pct = pctVal.toFixed(1);
        cgpa = data.marks.length > 0 ? (pctVal / 9.5).toFixed(1) : "0.0";
        document.querySelector('.marks-summary').innerHTML = `
            <div class="ms-item"><span>Total Marks</span><b>${totalSum} / ${data.marks.length*100}</b></div>
            <div class="ms-item"><span>Percentage</span><b>${pct}%</b></div>
            <div class="ms-item"><span>CGPA</span><b>${cgpa}</b></div>
            <div class="ms-item"><span>Result</span><b style="color:var(--green)">PASS</b></div>
        `;
    }
    const overCards = document.querySelectorAll('#studentOverview .stat-card .sc-num');
    if(overCards.length >= 4) {
        let globalAtt = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
        overCards[0].textContent = globalAtt + "%";
        overCards[1].textContent = cgpa;
        overCards[2].textContent = data.marks ? data.marks.length : 0;
        let ringFills = document.querySelectorAll('#studentOverview .ring-fill');
        if(ringFills.length > 0) ringFills[0].setAttribute('stroke-dasharray', `${globalAtt}, 100`);
        if(ringFills.length > 1) {
            let cgpaPct = parseFloat(cgpa) * 10;
            ringFills[1].setAttribute('stroke-dasharray', `${cgpaPct}, 100`);
        }
    }
}

function renderTeacherDash(data) {
    const table = document.querySelector('.teacher-schedule');
    if(table && data.timetable) {
        table.innerHTML = data.timetable.map(t => {
            let col = t.status === 'Now' ? 'green' : (t.status === 'Upcoming' ? 'blue' : 'amber');
            return `<div class="ts-item"><div class="ts-time">${t.time}</div><div class="ts-info"><b>${t.subject}</b><p>${t.target} · ${t.room}</p></div><span class="badge ${col}">${t.status}</span></div>`;
        }).join('');
    }
}

// ═══════════════════════════════════════════
//   API CALLS (Flask backend integration)
// ═══════════════════════════════════════════

async function fetchMarks() {
  try {
    const res  = await fetch('/marks');
    const data = await res.json();
    return data.marks || [];
  } catch (e) {
    console.log('Backend not running — using local data.');
    return [];
  }
}

// ═══════════════════════════════════════════
//   INIT — Auto-fill demo hint
// ═══════════════════════════════════════════

window.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('erp_user');
  if (saved) {
      currentUser = JSON.parse(saved);
      currentRole = currentUser.role;
      // Auto launch previously active session
      launchDashboard(currentUser);
  } else {
      document.getElementById('emailInput').value = 'student@tcet.ac.in';
      document.getElementById('passInput').value  = '123456';
  }
  document.getElementById('attDate') && (document.getElementById('attDate').value = new Date().toISOString().split('T')[0]);
});
