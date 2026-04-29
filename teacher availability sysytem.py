import json
import os


FILE_NAME = "teachers_data.json"


# -------------------- INITIAL DATA --------------------
def create_initial_data():
    data = {
        "Dept1": [
            {
                "id": "t1",
                "name": "Prof. Sumit Gupta",
                "password": "123",
                "status": "Not Available",
            },
            {
                "id": "t2",
                "name": "Prof. Mahendrapratap Yadav",
                "password": "123",
                "status": "Not Available",
            },
            {
                "id": "t3",
                "name": "Prof. Shamal Kashid",
                "password": "123",
                "status": "Not Available",
            },
            {
                "id": "t4",
                "name": "Prof. Anagha Kishte",
                "password": "123",
                "status": "Not Available",
            },
            {
                "id": "t5",
                "name": "Prof. Kaptan Singh",
                "password": "123",
                "status": "Not Available",
            },
            {
                "id": "t6",
                "name": "Prof. Mahesh Joshi",
                "password": "123",
                "status": "Not Available",
            },
        ],
        "Dept2": [
            {
                "id": "t7",
                "name": "Prof. Dheeraj Dubey",
                "password": "123",
                "status": "Not Available",
            },
            {
                "id": "t8",
                "name": "Prof. Bhupendra Singh",
                "password": "123",
                "status": "Not Available",
            },
            {
                "id": "t9",
                "name": "Prof. Sanjeev Sharma",
                "password": "123",
                "status": "Not Available",
            },
            {
                "id": "t10",
                "name": "Prof. Sanga Chaki",
                "password": "123",
                "status": "Not Available",
            },
            {
                "id": "t11",
                "name": "Prof. Shrikant Salve",
                "password": "123",
                "status": "Not Available",
            },
            {
                "id": "t12",
                "name": "Prof. Habila Basumatari",
                "password": "123",
                "status": "Not Available",
            },
        ],
    }

    with open(FILE_NAME, "w") as f:
        json.dump(data, f, indent=4)


# -------------------- LOAD DATA --------------------
def load_data():
    if not os.path.exists(FILE_NAME):
        create_initial_data()

    with open(FILE_NAME, "r") as f:
        data = json.load(f)

    # Ensure "requests" key exists for all teachers
    modified = False
    for dept in data:
        for teacher in data[dept]:
            if "requests" not in teacher:
                teacher["requests"] = []
                modified = True
    
    if modified:
        save_data(data)

    return data


# -------------------- SAVE DATA --------------------
def save_data(data):
    with open(FILE_NAME, "w") as f:
        json.dump(data, f, indent=4)


# ----------------- LOGGING FUNCTION ---------------
import datetime


def log_status(dept, teacher):
    log_file = "status_log.csv"

    time_now = datetime.datetime.now()

    with open(log_file, "a") as f:
        f.write(f"{teacher['name']},{dept},{teacher['status']},{time_now}\n")


# ------------------ BACKUP FILE FUNCTION --------------
import shutil


def backup_logs():
    source = "status_log.csv"
    backup = "status_log_backup.csv"

    if os.path.exists(source):
        shutil.copy(source, backup)
        print("✅ Backup created successfully!")
    else:
        print("No log file found to backup.")


# -------------------- MANAGE REQUESTS --------------------
def manage_requests(data, dept, teacher):
    if teacher["status"] != "Available for Students":
        print("\nYou must change your status to 'Available for Students' to accept requests.")
        return
    
    if not teacher.get("requests"):
        print("\nNo pending requests.")
        return

    current_index = 0
    while current_index < len(teacher["requests"]):
        req = teacher["requests"][current_index]
        print("\n--- Next Request ---")
        print(f"Student Name: {req['name']}")
        print(f"Roll Number: {req['roll_no']}")
        print(f"Doubt: {req['doubt']}")
        
        action = input("\n1. Accept & Solve\n2. Skip for now\n3. Back to Dashboard\nEnter choice: ")
        if action == "1":
            print(f"✅ Doubt resolved for {req['name']}.")
            teacher["requests"].pop(current_index)
            save_data(data)
        elif action == "2":
            print("Skipped.")
            current_index += 1
        elif action == "3":
            break
        else:
            print("Invalid choice!")
            
    if not teacher["requests"]:
        print("\nNo more pending requests.")
    elif current_index >= len(teacher["requests"]) and action != "3":
        print("\nYou have reached the end of the queue.")


# -------------------- TEACHER LOGIN --------------------
def teacher_login(data):
    print("\n--- Select Department ---")
    print("1. Dept1")
    print("2. Dept2")

    dept_choice = input("Enter choice: ")

    if dept_choice == "1":
        dept = "Dept1"
    elif dept_choice == "2":
        dept = "Dept2"
    else:
        print("Invalid department!")
        return

    teacher_id = input("Enter ID: ")
    password = input("Enter Password: ")

    for teacher in data[dept]:
        if teacher["id"] == teacher_id and teacher["password"] == password:
            print(f"\nWelcome {teacher['name']}")
            while True:
                print("\n--- Teacher Dashboard ---")
                print("1. Update Status")
                print("2. View & Accept Requests")
                print("3. Logout")
                choice = input("Enter choice: ")
                
                if choice == "1":
                    update_status(data, dept, teacher)
                elif choice == "2":
                    manage_requests(data, dept, teacher)
                elif choice == "3":
                    print("Logging out...")
                    return
                else:
                    print("Invalid choice!")
            return

    print("Invalid login!")


# -------------------- UPDATE STATUS --------------------
def update_status(data, dept, teacher):
    print("\n--- Update Status ---")
    print("1. Available ")
    print("2. Not Available")

    choice = input("Enter choice: ")

    status_list = {
        "1": "Available ",
        "2": "Not Available",
    }

    if choice in status_list:
        new_status = status_list[choice]
        if new_status != "Available for Students":
            teacher["requests"] = []
        teacher["status"] = new_status
        save_data(data)
        log_status(dept, teacher)
        print("✅ Status Updated Successfully!")
    else:
        print("Invalid choice!")


# -------------------- STUDENT VIEW --------------------
def student_view(data):
    while True:
        print("\n--- Student View ---")
        print("1. Dept1")
        print("2. Dept2")
        print("3. Back")

        dept_choice = input("Enter choice: ")

        if dept_choice == "1":
            dept = "Dept1"
        elif dept_choice == "2":
            dept = "Dept2"
        elif dept_choice == "3":
            return  # go back to main menu
        else:
            print("Invalid choice!")
            continue

        # Show teachers in selected dept
        while True:
            print(f"\n--- {dept} Teachers ---")
            for i, t in enumerate(data[dept]):
                print(f"{i+1}. {t['name']}")

            print(f"{len(data[dept]) + 1}. Change Department")
            print(f"{len(data[dept]) + 2}. Back")

            try:
                choice = int(input("Select teacher: ")) - 1

                if 0 <= choice < len(data[dept]):
                    teacher = data[dept][choice]
                    print("\n--- Teacher Status ---")
                    print(f"{teacher['name']} -> {teacher['status']}")
                    
                    if teacher["status"] == "Available for Students":
                        requests = teacher.get("requests", [])
                        if requests:
                            print(f"\n--- Current Queue ({len(requests)} student(s)) ---")
                            for idx, req in enumerate(requests):
                                print(f"{idx+1}. {req['name']}")
                        else:
                            print("\n--- Current Queue ---")
                            print("Queue is empty. You can be the first!")
                            
                        action = input("\n1. Send Doubt Request\n2. Back\nEnter choice: ")
                        if action == "1":
                            name = input("Enter your Name: ")
                            roll_no = input("Enter your Roll Number: ")
                            doubt = input("Enter your doubt/question: ")
                            
                            if "requests" not in teacher:
                                teacher["requests"] = []
                            teacher["requests"].append({
                                "name": name,
                                "roll_no": roll_no,
                                "doubt": doubt
                            })
                            save_data(data)
                            
                            queue_position = len(teacher["requests"]) - 1
                            print("✅ Request sent successfully! The teacher will view it soon.")
                            if queue_position == 0:
                                print("You are currently next in line!")
                            else:
                                print(f"There are {queue_position} student(s) ahead of you in the queue.")

                elif choice == len(data[dept]):
                    break  # change department

                elif choice == len(data[dept]) + 1:
                    return  # back to main menu

                else:
                    print("Invalid choice!")

            except ValueError:
                print("Invalid input! Please enter a number.")


# -------------------- MAIN --------------------
def main():
    while True:
        data = load_data()

        print("\n=== Faculty Availability System (Phase 2) ===")
        print("1. Teacher Login")
        print("2. Student View")
        print("3. Backup Logs")
        print("4. Exit")

        choice = input("Enter choice: ")

        if choice == "1":
            teacher_login(data)
        elif choice == "2":
            student_view(data)
        elif choice == "3":
            backup_logs()
        elif choice == "4":
            print("Exiting...")
            break
        else:
            print("Invalid choice!")


if __name__ == "__main__":
    main()
