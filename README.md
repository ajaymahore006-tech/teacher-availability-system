# Teacher Availability System

## Overview
A web-based application that allows teachers to manage their availability and enables students to view schedules and book sessions.

## Features
- Role-based authentication for teachers and students
- Teacher availability management
- Session booking and scheduling
- Responsive user interface
- MySQL database integration for data persistence

## Tech Stack
- Python
- Flask
- MySQL
- HTML/CSS
- JavaScript
- Bootstrap

## Project Structure
```
teacher-availability-system/
├── static/
├── templates/
├── app.py
├── requirements.txt
└── README.md
```
## Environment Variables

Create a `.env` file in the project root directory and add the following variables:

```env
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=teacher_availability
```

Update the values according to your local MySQL configuration.
## How to Run
1. Clone the repository
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Configure environment variables
4. Run:
   ```bash
   python app.py
   ```

## Author
Ajay Mahore
