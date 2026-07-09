import os
import datetime
import re
from flask import Flask, render_template, request, jsonify, session, redirect, url_for
from flask_sqlalchemy import SQLAlchemy
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv('SECRET_KEY', 'super_secret_key_for_teacher_availability_app')

# Database configuration
db_host = os.getenv("DB_HOST", "localhost")
db_port = os.getenv("DB_PORT", "3306")
db_user = os.getenv("DB_USER", "root")
db_password = os.getenv("DB_PASSWORD", "")
db_name = os.getenv("DB_NAME", "teacher_availability")

app.config['SQLALCHEMY_DATABASE_URI'] = f"mysql+pymysql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

BACKUP_FILE = "status_log_backup.csv"

# -------------------- DATABASE MODELS --------------------

class Department(db.Model):
    __tablename__ = 'departments'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    teachers = db.relationship('Teacher', backref='department', lazy=True)

class Student(db.Model):
    __tablename__ = 'students'
    email = db.Column(db.String(191), primary_key=True)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    roll_no = db.Column(db.String(50), unique=True, nullable=False)

class Teacher(db.Model):
    __tablename__ = 'teachers'
    id = db.Column(db.String(50), primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    password = db.Column(db.String(255), nullable=False)
    status = db.Column(db.String(50), default='Not Available')
    department_id = db.Column(db.Integer, db.ForeignKey('departments.id', ondelete='CASCADE'), nullable=False)
    requests = db.relationship('Request', backref='teacher', cascade="all, delete-orphan", lazy=True)

class Request(db.Model):
    __tablename__ = 'requests'
    id = db.Column(db.Integer, primary_key=True)
    teacher_id = db.Column(db.String(50), db.ForeignKey('teachers.id', ondelete='CASCADE'), nullable=False)
    student_name = db.Column(db.String(100), nullable=False)
    student_roll_no = db.Column(db.String(50), nullable=False)
    doubt = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

class StatusLog(db.Model):
    __tablename__ = 'status_logs'
    id = db.Column(db.Integer, primary_key=True)
    teacher_name = db.Column(db.String(100), nullable=False)
    department = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(50), nullable=False)
    logged_at = db.Column(db.DateTime, default=datetime.datetime.utcnow)

# -------------------- HELPER FUNCTIONS --------------------

def backup_logs_func():
    try:
        logs = StatusLog.query.all()
        import csv
        with open(BACKUP_FILE, "w", newline="") as f:
            writer = csv.writer(f)
            for log in logs:
                writer.writerow([log.teacher_name, log.department, log.status, log.logged_at])
        return True
    except Exception as e:
        print(f"Error backing up logs: {e}")
        return False

# -------------------- ROUTES --------------------

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/student')
def student():
    if 'student_email' not in session:
        return redirect(url_for('student_login_page'))
    return render_template('student.html')

@app.route('/student/login')
def student_login_page():
    if 'student_email' in session:
        return redirect(url_for('student'))
    return render_template('student_login.html')

@app.route('/teacher/login')
def teacher_login():
    if 'teacher_id' in session:
        return redirect(url_for('teacher_dashboard'))
    return render_template('teacher_login.html')

@app.route('/teacher/dashboard')
def teacher_dashboard():
    if 'teacher_id' not in session:
        return redirect(url_for('teacher_login'))
    return render_template('teacher_dashboard.html')

# -------------------- API ENDPOINTS --------------------

@app.route('/api/data', methods=['GET'])
def get_data():
    departments = Department.query.all()
    safe_data = {}
    for dept in departments:
        safe_data[dept.name] = []
        for t in dept.teachers:
            safe_data[dept.name].append({
                "id": t.id,
                "name": t.name,
                "status": t.status,
                "requests": [
                    {
                        "name": r.student_name,
                        "roll_no": r.student_roll_no,
                        "doubt": r.doubt
                    } for r in t.requests
                ]
            })
    return jsonify(safe_data)

@app.route('/api/login', methods=['POST'])
def login():
    req = request.json
    dept_name = req.get('dept')
    teacher_id = req.get('teacher_id')
    password = req.get('password')

    dept = Department.query.filter_by(name=dept_name).first()
    if dept:
        teacher = Teacher.query.filter(
            (Teacher.id == teacher_id) | (Teacher.name == teacher_id),
            Teacher.department_id == dept.id,
            Teacher.password == password
        ).first()
        
        if teacher:
            session['teacher_id'] = teacher.id
            session['dept'] = dept.name
            session['teacher_name'] = teacher.name
            return jsonify({"success": True, "message": "Login successful"})
    
    return jsonify({"success": False, "message": "Invalid department, ID/Name, or password."}), 401

@app.route('/api/student/login', methods=['POST'])
def student_login_api():
    req = request.json
    email = req.get('email')
    password = req.get('password')

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required"}), 400
        
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"success": False, "message": "Invalid email format"}), 400

    student = Student.query.filter_by(email=email).first()
    if student:
        if student.password == password:
            session['student_email'] = email
            session['student_name'] = student.name
            session['student_roll'] = student.roll_no
            return jsonify({"success": True, "message": "Login successful"})
        else:
            return jsonify({"success": False, "message": "Invalid password."}), 401
    
    return jsonify({"success": False, "message": "Email not found in student database."}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True})

@app.route('/api/teacher/me', methods=['GET'])
def get_me():
    if 'teacher_id' not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    teacher_id = session['teacher_id']
    teacher = Teacher.query.get(teacher_id)
    
    if teacher:
        safe_t = {
            "id": teacher.id,
            "name": teacher.name,
            "status": teacher.status,
            "requests": [
                {
                    "name": r.student_name,
                    "roll_no": r.student_roll_no,
                    "doubt": r.doubt
                } for r in teacher.requests
            ]
        }
        return jsonify({"success": True, "teacher": safe_t})
            
    return jsonify({"success": False, "message": "Teacher not found"}), 404

@app.route('/api/status', methods=['POST'])
def update_status():
    if 'teacher_id' not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
        
    req = request.json
    new_status = req.get('status')
    
    if new_status not in ["Available for Students", "Not Available"]:
        return jsonify({"success": False, "message": "Invalid status"}), 400
        
    teacher_id = session['teacher_id']
    teacher = Teacher.query.get(teacher_id)
    
    if teacher:
        teacher.status = new_status
        if new_status == "Not Available":
            Request.query.filter_by(teacher_id=teacher_id).delete()
        
        log = StatusLog(
            teacher_name=teacher.name,
            department=session['dept'],
            status=new_status,
            logged_at=datetime.datetime.now()
        )
        db.session.add(log)
        db.session.commit()
        return jsonify({"success": True, "message": "Status updated"})
            
    return jsonify({"success": False, "message": "Teacher not found"}), 404

@app.route('/api/request', methods=['POST'])
def submit_request():
    req = request.json
    dept = req.get('dept')
    teacher_id = req.get('teacher_id')
    name = req.get('name')
    roll_no = req.get('roll_no')
    doubt = req.get('doubt')
    
    if not all([dept, teacher_id, name, roll_no, doubt]):
        return jsonify({"success": False, "message": "Missing fields"}), 400
        
    teacher = Teacher.query.get(teacher_id)
    if teacher:
        if teacher.status != "Available for Students":
            return jsonify({"success": False, "message": "Teacher is not available."}), 400
            
        new_request = Request(
            teacher_id=teacher_id,
            student_name=name,
            student_roll_no=roll_no,
            doubt=doubt
        )
        db.session.add(new_request)
        db.session.commit()
        
        position = Request.query.filter_by(teacher_id=teacher_id).count() - 1
        return jsonify({"success": True, "position": position})
            
    return jsonify({"success": False, "message": "Teacher not found"}), 404

@app.route('/api/manage_request', methods=['POST'])
def manage_request():
    if 'teacher_id' not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
        
    req = request.json
    action = req.get('action')
    index = req.get('index', 0)
    
    if action not in ["accept", "skip"]:
        return jsonify({"success": False, "message": "Invalid action"}), 400
        
    teacher_id = session['teacher_id']
    teacher = Teacher.query.get(teacher_id)
    
    if teacher:
        requests = Request.query.filter_by(teacher_id=teacher_id).order_by(Request.id).all()
        if not requests or index >= len(requests):
            return jsonify({"success": False, "message": "Invalid request index"}), 400
            
        if action == "accept":
            req_to_remove = requests[index]
            db.session.delete(req_to_remove)
            db.session.commit()
            return jsonify({"success": True, "message": "Request resolved and removed."})
        elif action == "skip":
            return jsonify({"success": True, "message": "Request skipped."})
                
    return jsonify({"success": False, "message": "Teacher not found"}), 404

@app.route('/api/backup', methods=['POST'])
def backup_logs():
    success = backup_logs_func()
    if success:
        return jsonify({"success": True, "message": "Backup created successfully!"})
    return jsonify({"success": False, "message": "No log file found to backup."}), 404

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)

