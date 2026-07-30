# 🎓 Digital Faculty Assistant

A modern full-stack web application designed to efficiently manage teacher availability, schedules, and faculty-student interactions in real-time. Built to transition smoothly from local setups to scalable cloud infrastructure.

---

## 🚀 Tech Stack

* **Backend:** Python, FastAPI, Uvicorn (ASGI Server)
* **Database:** MySQL (Hosted securely on Aiven Cloud)
* **ORM & Database Connection:** SQLAlchemy, PyMySQL
* **Containerization:** Docker
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla JS with modular API integration)

---

## ✨ Key Features

* **Secure Authentication:** Separate secure login and registration portals for both Students and Teachers.
* **Real-Time Availability:** Faculty members can update their availability status instantly.
* **Cloud-Backed Scalability:** Powered by a remote MySQL database hosted on Aiven Cloud, ensuring data persistence independent of local environments.
* **Dockerized Architecture:** Fully containerized for seamless and consistent deployment across any environment without dependency conflicts.

---

## 📂 Project Structure

```text
digital-faculty-assistant/
│
├── app/
│   ├── routers/        # API endpoints for students, teachers, auth
│   ├── models.py       # SQLAlchemy database models
│   ├── schemas.py      # Pydantic data validation schemas
│   ├── database.py     # Database engine & session setup
│   └── main.py         # FastAPI main application entry point
│── frontend
|   |── assets/         # Images, logos, and icons
|   |
|   ├── static/
|   │   ├── css/        # Stylesheets (home.css, common.css, animations)
|   │   |__ js/         # Frontend logic and API callers (api.js)
|   │   
|   │
|   |__ templates/      # HTML templates (if using server-side rendering or static pages)
|
├── .env                # Environment variables (Database credentials)
├── Dockerfile          # Instructions to build the Docker container
├── requirements.txt    # Python dependencies
└── README.md           # Project documentation



🛠️ Local Installation & Setup
If you want to run this project locally on your machine using Docker and the Cloud database, follow these steps:

1. Clone the Repository
Bash

git clone [https://github.com/your-username/your-repo-name.git](https://github.com/your-username/your-repo-name.git)
cd digital-faculty-assistant

2. Configure Environment Variables
Create a .env file in the root directory and add your Aiven Cloud MySQL database credentials:

Code snippet
DB_HOST=your-aiven-mysql-host.aivencloud.com
DB_PORT=your-aiven-port-number
DB_USER=avnadmin
DB_PASSWORD=your-secure-database-password
DB_NAME=defaultdb


3. Run with Docker Build the Docker image:

Bash
docker build -t dfa-app .
Run the Docker container:

Bash
docker run -d -p 8000:8000 --env-file .env --name my-dfa-container dfa-app

4. Access the Application
Web UI: Open your browser and go to http://localhost:8000

API Interactive Docs (Swagger UI): Go to http://localhost:8000/docs

📈 Deployment Status
Phase 1 & 2: FastAPI Backend & API routing setup ✅

Phase 3: Frontend and Database integration ✅

Phase 4: Docker containerization & Aiven Cloud MySQL migration ✅

Phase 5: Live Cloud Platform Hosting 🚀 (In Progress)


👨‍💻 Author
Developed with by Ajay Mahore as part of a journey to master Full-Stack Web Development.