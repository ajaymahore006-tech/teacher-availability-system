// This tells our API exactly where the FastAPI server is running
const API_BASE_URL = "";

// Run this code only when the login page loads
document.addEventListener("DOMContentLoaded", () => {
    
    const loginForm = document.getElementById("login-form");
    const loginTitle = document.getElementById("login-title");
    const errorMessage = document.getElementById("error-message");

    // 1. Figure out if this is a Teacher or Student logging in
    // Remember the URL looks like: login.html?role=teacher
    const urlParams = new URLSearchParams(window.location.search);
    const role = urlParams.get("role"); // This will be either "student" or "teacher"

    // If there is no role in the URL, send them back to the start
    if (!role) {
        window.location.href = "index.html";
        return;
    }

    // Update the title dynamically so it says "Student Login" or "Teacher Login"
    if (loginTitle) {
        loginTitle.textContent = role.charAt(0).toUpperCase() + role.slice(1) + " Login";
    }

    // 2. Listen for the user clicking the "Log In" button
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault(); // Stop the page from refreshing!

            // Get the values the user typed in
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            // FastAPI's OAuth2 expects data in 'form-urlencoded' format (just like Postman)
            const formData = new URLSearchParams();
            formData.append("username", email); // FastAPI OAuth2 strictly requires the word "username"
            formData.append("password", password);

            try {
                // 3. Make the API Call to our FastAPI backend
                const response = await fetch(`${API_BASE_URL}/api/${role}/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                    },
                    body: formData.toString()
                });

                const data = await response.json();

                if (response.ok) {
                    // 4. SUCCESS! Save the token to the browser's memory (localStorage)
                    // We save it with the role name so we don't mix up student/teacher tokens
                    localStorage.setItem(`${role}_token`, data.access_token);
                    
                    // 5. Send them to their specific dashboard
                    window.location.href = `${role}-dashboard.html`;
                } else {
                    // Show error (like "Incorrect password")
                    errorMessage.textContent = data.detail || "Login failed. Please try again.";
                    errorMessage.style.display = "block";
                }

            } catch (error) {
                console.error("Error connecting to server:", error);
                errorMessage.textContent = "Could not connect to the server. Is FastAPI running?";
                errorMessage.style.display = "block";
            }
        });
    }
});


// ==========================================
// STUDENT DASHBOARD: Fetch & Display Teachers
// ==========================================

async function fetchTeachers() {
    // 1. Get the student's token from memory
    const token = localStorage.getItem("student_token");
    const teachersListDiv = document.getElementById("teachers-list");

    if (!teachersListDiv) return; // Safety check: only run if we are on the dashboard

    try {
        // 2. Call the backend (Change the URL if your router path is slightly different!)
        const response = await fetch(`${API_BASE_URL}/api/student/teachers`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`, // Prove we are logged in!
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const teachers = await response.json();
            displayTeachers(teachers);
        } else {
            teachersListDiv.innerHTML = "<p style='color:red;'>Failed to load teachers.</p>";
        }
    } catch (error) {
        console.error("Error:", error);
        teachersListDiv.innerHTML = "<p style='color:red;'>Error connecting to server.</p>";
    }
}

function displayTeachers(teachers) {
    const teachersListDiv = document.getElementById("teachers-list");
    teachersListDiv.innerHTML = ""; // Clear the "Loading..." text!

    // If no teachers are in the database yet
    if (teachers.length === 0) {
        teachersListDiv.innerHTML = "<p>No teachers are currently registered.</p>";
        return;
    }

    // Loop through every teacher from the database and create a card
    teachers.forEach(teacher => {
        // "Smart" fallback variables just in case our backend names are slightly different
        const teacherName = teacher.name || teacher.full_name || teacher.username || "Unknown Teacher";
        const teacherDept = teacher.department || teacher.department_name || "General";
        const teacherId = teacher.id;

        // Create the HTML card
        const card = document.createElement("div");
        card.className = "teacher-card";
        
        card.innerHTML = `
            <h3 style="margin-top: 0; color: #333;">${teacherName}</h3>
            <p style="color: #666; font-size: 14px; margin-bottom: 20px;">
                Department: <strong>${teacherDept}</strong>
            </p>
            <button class="btn btn-teacher" style="width: 100%;" onclick="bookAppointment(${teacherId})">
                Book Appointment
            </button>
        `;
        
        teachersListDiv.appendChild(card);
    });
}

// A placeholder function for our next feature!
function bookAppointment(teacherId) {
    alert("Get ready! We will build the booking feature for Teacher ID: " + teacherId + " next!");
}