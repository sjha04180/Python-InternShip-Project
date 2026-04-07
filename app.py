# ═══════════════════════════════════════════════════
#   TCET ERP — Flask Backend (app.py)
#   Simple, beginner-friendly structure
# ═══════════════════════════════════════════════════

import os
from flask import Flask, render_template, jsonify, request
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

url = os.environ.get("SUPABASE_URL", "")
key = os.environ.get("SUPABASE_KEY", "")

supabase: Client = None
if url and key:
    supabase = create_client(url, key)

@app.route('/')
def home():
    """Serve the main HTML page."""
    return render_template('index.html')


@app.route('/login', methods=['POST'])
def login():
    if not supabase:
        return jsonify({"success": False, "message": "Supabase not configured."}), 500

    data = request.get_json()
    email = data.get('email', '')
    password = data.get('password', '')
    role = data.get('role', '')

    try:
        response = supabase.table('users').select('*').eq('email', email).eq('password', password).eq('role', role).execute()
        if response.data and len(response.data) > 0:
            user = response.data[0]
            return jsonify({"success": True, "name": user["name"], "role": role, "info": user.get("info", "")})
        else:
            return jsonify({"success": False, "message": "Invalid credentials"}), 401
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/students', methods=['GET'])
def get_students():
    if not supabase: return jsonify([])
    try:
        res = supabase.table('students').select('*').execute()
        return jsonify(res.data)
    except:
        return jsonify([])

@app.route('/teachers', methods=['GET'])
def get_teachers():
    if not supabase: return jsonify([])
    try:
        res = supabase.table('teachers').select('*').execute()
        return jsonify(res.data)
    except:
        return jsonify([])


@app.route('/marks', methods=['GET'])
def get_marks():
    roll_no = request.args.get('roll_no', '22CS04')
    if not supabase: return jsonify({"roll_no": roll_no, "marks": []})
    try:
        res = supabase.table('marks').select('*').eq('roll_no', roll_no).execute()
        return jsonify({"roll_no": roll_no, "marks": res.data})
    except:
        return jsonify({"roll_no": roll_no, "marks": []})


@app.route('/attendance', methods=['POST'])
def save_attendance():
    if not supabase: return jsonify({"success": False, "message": "DB not configured"})
    data = request.get_json()
    records = data.get("records", [])
    class_name = data.get("class", "Unknown")
    subject = data.get("subject", "Unknown")
    date = data.get("date", "")
    
    insert_data = []
    for r in records:
        insert_data.append({
            "class_name": class_name,
            "subject": subject,
            "date": date,
            "student_roll": r.get('roll'),
            "status": r.get('status')
        })
    try:
        if insert_data:
            supabase.table('attendance_records').insert(insert_data).execute()
        return jsonify({"success": True, "message": "Attendance saved successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/notices', methods=['GET'])
def get_notices():
    if not supabase: return jsonify([])
    try:
        res = supabase.table('notices').select('*').order('created_at', desc=True).execute()
        return jsonify(res.data)
    except:
        return jsonify([])


@app.route('/notices', methods=['POST'])
def post_notice():
    if not supabase: return jsonify({"success": False, "message": "error"})
    data = request.get_json()
    try:
        supabase.table('notices').insert(data).execute()
        return jsonify({"success": True, "message": "Notice posted successfully!"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/add_student', methods=['POST'])
def add_student():
    if not supabase: return jsonify({"success": False, "message": "error"})
    data = request.get_json()
    import random
    new_id = random.randint(100, 10000000)
    try:
        supabase.table('students').insert({
            "id": new_id,
            "name": data.get("name"),
            "roll": data.get("roll"),
            "dept": data.get("dept"),
            "year": data.get("year"),
            "email": data.get("email"),
            "attendance": 0
        }).execute()
        
        supabase.table('users').insert({
            "id": new_id,
            "email": data.get("email"),
            "password": "123456",
            "role": "student",
            "name": data.get("name"),
            "info": f"{data.get('year')} {data.get('dept')} · Roll: {data.get('roll')}"
        }).execute()
        
        return jsonify({"success": True, "message": "Student added"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/add_teacher', methods=['POST'])
def add_teacher():
    if not supabase: return jsonify({"success": False, "message": "error"})
    data = request.get_json()
    import random
    new_id = random.randint(100, 10000000)
    try:
        supabase.table('teachers').insert({
            "id": new_id,
            "name": data.get("name"),
            "empid": data.get("empid"),
            "dept": data.get("dept"),
            "desig": data.get("desig"),
            "subjects": data.get("subjects"),
            "email": data.get("email")
        }).execute()
        
        supabase.table('users').insert({
            "id": new_id,
            "email": data.get("email"),
            "password": "123456",
            "role": "teacher",
            "name": data.get("name"),
            "info": data.get("dept")
        }).execute()
        
        return jsonify({"success": True, "message": "Teacher added"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/add_marks', methods=['POST'])
def add_marks():
    if not supabase: return jsonify({"success": False, "message": "error"})
    data = request.get_json()
    import random
    try:
        records = data.get('records', [])
        for r in records:
            supabase.table('marks').insert({
                "id": random.randint(100, 10000000),
                "roll_no": r.get('roll_no'),
                "subject": r.get('subject'),
                "code": "GEN",
                "total": r.get('marks')
            }).execute()
        return jsonify({"success": True, "message": "Marks added"})
    except Exception as e:
        return jsonify({"success": False, "message": str(e)}), 500


@app.route('/dashboard_data', methods=['GET'])
def get_dashboard_data():
    if not supabase: return jsonify({})
    role = request.args.get('role', '')
    email = request.args.get('email', '')
    
    data = {}
    if role == 'student':
        student = supabase.table('students').select('*').eq('email', email).execute().data
        if student:
            s_rec = student[0]
            data['profile'] = s_rec
            roll = s_rec['roll']
            data['marks'] = supabase.table('marks').select('*').eq('roll_no', roll).execute().data
            att = supabase.table('attendance_records').select('*').eq('student_roll', roll).execute().data
            data['attendance_records'] = att
            
    elif role == 'teacher':
        data['timetable'] = [
            {"time":"9:00 AM","subject":"Data Structures","target":"SE Comp A","room":"302","status":"Now"},
            {"time":"11:00 AM","subject":"DSA Lab","target":"SE Comp B","room":"Lab 104","status":"Upcoming"},
            {"time":"1:00 PM","subject":"Compiler Design","target":"TE Comp A","room":"401","status":"Upcoming"},
        ]
        
    elif role == 'admin':
        stu_res = supabase.table('students').select('*').execute().data
        teach_res = supabase.table('teachers').select('*').execute().data
        depts = {}
        for s in stu_res:
            d = s.get('dept', 'Eng')
            if 'Comp' in d: d = 'Computer Eng'
            elif 'Elec' in d: d = 'Electronics'
            elif 'Info' in d or 'IT' in d: d = 'IT'
            depts[d] = depts.get(d, 0) + 1
            
        data['total_students'] = len(stu_res)
        data['total_teachers'] = len(teach_res)
        data['departments'] = depts
        data['low_attendance'] = sum(1 for s in stu_res if s.get('attendance', 0) < 75)
        if len(stu_res) > 0:
            data['avg_attendance'] = round(sum(s.get('attendance', 0) for s in stu_res) / len(stu_res))
        else:
            data['avg_attendance'] = 0

    return jsonify(data)

if __name__ == '__main__':
    print("=" * 50)
    print("  TCET ERP — Flask Server Starting")
    print("  Open: http://localhost:5000")
    print("=" * 50)
    app.run(debug=True, port=5000)
