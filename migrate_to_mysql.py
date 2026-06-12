import json
import os
import csv
import datetime
import pymysql

# Helper to load .env variables manually in case python-dotenv is not fully loaded yet
def load_env(filepath=".env"):
    env = {}
    if os.path.exists(filepath):
        with open(filepath, "r") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    k, v = line.split('=', 1)
                    env[k.strip()] = v.strip()
    return env

def main():
    env = load_env()
    db_host = env.get("DB_HOST", "localhost")
    db_port = int(env.get("DB_PORT", "3306"))
    db_user = env.get("DB_USER", "root")
    db_password = env.get("DB_PASSWORD", "")
    db_name = env.get("DB_NAME", "teacher_availability")

    print(f"Connecting to MySQL server at {db_host}:{db_port}...")
    
    # 1. Connect without db to create the database if it doesn't exist
    try:
        conn = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            port=db_port
        )
        cursor = conn.cursor()
        cursor.execute(f"CREATE DATABASE IF NOT EXISTS {db_name}")
        conn.commit()
        cursor.close()
        conn.close()
        print(f"Database '{db_name}' checked/created successfully.")
    except Exception as e:
        print(f"Error creating database: {e}")
        return

    # 2. Connect to the specific database and create tables
    try:
        conn = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_password,
            port=db_port,
            database=db_name,
            cursorclass=pymysql.cursors.DictCursor
        )
        cursor = conn.cursor()
        print("Connected to database. Creating tables...")

        # Create departments table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS departments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) UNIQUE NOT NULL
            )
        """)

        # Create students table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS students (
                email VARCHAR(191) PRIMARY KEY,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100) NOT NULL,
                roll_no VARCHAR(50) UNIQUE NOT NULL
            )
        """)

        # Create teachers table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS teachers (
                id VARCHAR(50) PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                password VARCHAR(255) NOT NULL,
                status VARCHAR(50) DEFAULT 'Not Available',
                department_id INT NOT NULL,
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE CASCADE
            )
        """)

        # Create requests table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                teacher_id VARCHAR(50) NOT NULL,
                student_name VARCHAR(100) NOT NULL,
                student_roll_no VARCHAR(50) NOT NULL,
                doubt TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE CASCADE
            )
        """)

        # Create status_logs table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS status_logs (
                id INT AUTO_INCREMENT PRIMARY KEY,
                teacher_name VARCHAR(100) NOT NULL,
                department VARCHAR(100) NOT NULL,
                status VARCHAR(50) NOT NULL,
                logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        print("Tables created successfully.")

        # 3. Seed Students
        students_file = "students_data.json"
        if os.path.exists(students_file):
            print(f"Reading students from {students_file}...")
            with open(students_file, "r") as f:
                students_data = json.load(f)
            
            for email, info in students_data.items():
                cursor.execute("""
                    INSERT INTO students (email, password, name, roll_no)
                    VALUES (%s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE password=%s, name=%s, roll_no=%s
                """, (email, info["password"], info["name"], info["roll_no"], info["password"], info["name"], info["roll_no"]))
            conn.commit()
            print(f"Successfully migrated students.")

        # 4. Seed Departments, Teachers, and active Requests
        teachers_file = "teachers_data.json"
        if os.path.exists(teachers_file):
            print(f"Reading teachers from {teachers_file}...")
            with open(teachers_file, "r") as f:
                teachers_data = json.load(f)
            
            for dept_name, teachers in teachers_data.items():
                cursor.execute("INSERT IGNORE INTO departments (name) VALUES (%s)", (dept_name,))
                cursor.execute("SELECT id FROM departments WHERE name = %s", (dept_name,))
                dept_id = cursor.fetchone()["id"]
                
                for t in teachers:
                    cursor.execute("""
                        INSERT INTO teachers (id, name, password, status, department_id)
                        VALUES (%s, %s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE name=%s, password=%s, status=%s, department_id=%s
                    """, (t["id"], t["name"], t["password"], t["status"], dept_id, t["name"], t["password"], t["status"], dept_id))
                    
                    # Clear old migrated requests to avoid doubling on rerun
                    cursor.execute("DELETE FROM requests WHERE teacher_id = %s", (t["id"],))
                    
                    requests = t.get("requests", [])
                    for req in requests:
                        cursor.execute("""
                            INSERT INTO requests (teacher_id, student_name, student_roll_no, doubt)
                            VALUES (%s, %s, %s, %s)
                        """, (t["id"], req["name"], req["roll_no"], req["doubt"]))
            conn.commit()
            print("Successfully migrated departments, teachers, and pending requests.")

        # 5. Seed Status Logs from status_log.csv
        log_file = "status_log.csv"
        if os.path.exists(log_file):
            print(f"Reading logs from {log_file}...")
            with open(log_file, "r") as f:
                reader = csv.reader(f)
                for row in reader:
                    if len(row) >= 4:
                        teacher_name = row[0]
                        department = row[1]
                        status = row[2]
                        # Try parsing timestamp or use raw string
                        logged_at = row[3]
                        cursor.execute("""
                            INSERT INTO status_logs (teacher_name, department, status, logged_at)
                            VALUES (%s, %s, %s, %s)
                        """, (teacher_name, department, status, logged_at))
            conn.commit()
            print("Successfully migrated status logs.")

        cursor.close()
        conn.close()
        print("Data migration completed successfully!")

    except Exception as e:
        print(f"Error during migration: {e}")

if __name__ == "__main__":
    main()
