import json
import os
import datetime
import shutil
from flask import Flask, render_template, request, jsonify, session, redirect, url_for

app = Flask(__name__)
app.secret_key = 'super_secret_key_for_teacher_availability_app' # Change this in production

FILE_NAME = "teachers_data.json"
LOG_FILE = "status_log.csv"
BACKUP_FILE = "status_log_backup.csv"

# -------------------- DATA MANAGEMENT --------------------

def create_initial_data():
    data = {
        "Dept1": [
            {"id": "t1", "name": "Prof. Sumit Gupta", "password": "123", "status": "Not Available", "requests": []},
            {"id": "t2", "name": "Prof. Mahendrapratap Yadav", "password": "123", "status": "Not Available", "requests": []},
            {"id": "t3", "name": "Prof. Shamal Kashid", "password": "123", "status": "Not Available", "requests": []},
            {"id": "t4", "name": "Prof. Anagha Kishte", "password": "123", "status": "Not Available", "requests": []},
            {"id": "t5", "name": "Prof. Kaptan Singh", "password": "123", "status": "Not Available", "requests": []},
            {"id": "t6", "name": "Prof. Mahesh Joshi", "password": "123", "status": "Not Available", "requests": []},
        ],
        "Dept2": [
            {"id": "t7", "name": "Prof. Dheeraj Dubey", "password": "123", "status": "Not Available", "requests": []},
            {"id": "t8", "name": "Prof. Bhupendra Singh", "password": "123", "status": "Not Available", "requests": []},
            {"id": "t9", "name": "Prof. Sanjeev Sharma", "password": "123", "status": "Not Available", "requests": []},
            {"id": "t10", "name": "Prof. Sanga Chaki", "password": "123", "status": "Not Available", "requests": []},
            {"id": "t11", "name": "Prof. Shrikant Salve", "password": "123", "status": "Not Available", "requests": []},
            {"id": "t12", "name": "Prof. Habila Basumatari", "password": "123", "status": "Not Available", "requests": []},
        ],
    }
    with open(FILE_NAME, "w") as f:
        json.dump(data, f, indent=4)

def load_data():
    if not os.path.exists(FILE_NAME):
        create_initial_data()

    with open(FILE_NAME, "r") as f:
        data = json.load(f)

    # Ensure "requests" key exists and clean up whitespace in status
    modified = False
    for dept in data:
        for teacher in data[dept]:
            if "requests" not in teacher:
                teacher["requests"] = []
                modified = True
            if teacher.get("status") == "Available ":
                teacher["status"] = "Available for Students"
                modified = True
    
    if modified:
        save_data(data)

    return data

def save_data(data):
    with open(FILE_NAME, "w") as f:
        json.dump(data, f, indent=4)

def log_status(dept, teacher):
    time_now = datetime.datetime.now()
    with open(LOG_FILE, "a") as f:
        f.write(f"{teacher['name']},{dept},{teacher['status']},{time_now}\n")

def backup_logs_func():
    if os.path.exists(LOG_FILE):
        shutil.copy(LOG_FILE, BACKUP_FILE)
        return True
    return False

# -------------------- ROUTES --------------------

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/student')
def student():
    return render_template('student.html')

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
    data = load_data()
    # Remove passwords from response
    safe_data = {}
    for dept, teachers in data.items():
        safe_data[dept] = []
        for t in teachers:
            safe_t = t.copy()
            safe_t.pop('password', None)
            safe_data[dept].append(safe_t)
    return jsonify(safe_data)

@app.route('/api/login', methods=['POST'])
def login():
    data = load_data()
    req = request.json
    dept = req.get('dept')
    teacher_id = req.get('teacher_id')
    password = req.get('password')

    if dept in data:
        for teacher in data[dept]:
            if teacher['id'] == teacher_id and teacher['password'] == password:
                session['teacher_id'] = teacher_id
                session['dept'] = dept
                session['teacher_name'] = teacher['name']
                return jsonify({"success": True, "message": "Login successful"})
    
    return jsonify({"success": False, "message": "Invalid department, ID, or password."}), 401

@app.route('/api/logout', methods=['POST'])
def logout():
    session.clear()
    return jsonify({"success": True})

@app.route('/api/teacher/me', methods=['GET'])
def get_me():
    if 'teacher_id' not in session:
        return jsonify({"success": False, "message": "Not logged in"}), 401
    
    data = load_data()
    dept = session['dept']
    teacher_id = session['teacher_id']
    
    for teacher in data.get(dept, []):
        if teacher['id'] == teacher_id:
            safe_t = teacher.copy()
            safe_t.pop('password', None)
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
        
    data = load_data()
    dept = session['dept']
    teacher_id = session['teacher_id']
    
    for teacher in data.get(dept, []):
        if teacher['id'] == teacher_id:
            teacher['status'] = new_status
            if new_status == "Not Available":
                teacher['requests'] = [] # Clear requests when unavailable
            save_data(data)
            log_status(dept, teacher)
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
        
    data = load_data()
    
    for teacher in data.get(dept, []):
        if teacher['id'] == teacher_id:
            if teacher['status'] != "Available for Students":
                return jsonify({"success": False, "message": "Teacher is not available."}), 400
                
            if "requests" not in teacher:
                teacher["requests"] = []
                
            teacher["requests"].append({
                "name": name,
                "roll_no": roll_no,
                "doubt": doubt
            })
            save_data(data)
            position = len(teacher["requests"]) - 1
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
        
    data = load_data()
    dept = session['dept']
    teacher_id = session['teacher_id']
    
    for teacher in data.get(dept, []):
        if teacher['id'] == teacher_id:
            if not teacher.get("requests") or index >= len(teacher["requests"]):
                return jsonify({"success": False, "message": "Invalid request index"}), 400
                
            if action == "accept":
                teacher["requests"].pop(index)
                save_data(data)
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
    # Initialize data if not present
    load_data()
    app.run(debug=True, port=5000)
