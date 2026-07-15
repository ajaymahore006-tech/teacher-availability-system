const API_BASE_URL = "";
window.selectedRole = ""; // Roles track karne ke liye global variable

// ==========================================
// UI LOGIC: Modern Modals Handling (Login & Signup)
// ==========================================

function openLoginModal(role) {
    window.selectedRole = role;
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = role.charAt(0).toUpperCase() + role.slice(1) + " Login";
}

function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
}

function openSignupModal() {
    // 1. Login modal ko close karo aur signup ko open karo
    closeLoginModal();
    document.getElementById('signup-modal').style.display = 'flex';

    const role = window.selectedRole;
    const signupSubtitle = document.getElementById("signup-subtitle");
    const dynamicFieldContainer = document.getElementById("dynamic-field-container");

    signupSubtitle.textContent = `Register as a ${role.charAt(0).toUpperCase() + role.slice(1)}`;

    // 2. Role ke hisaab se dynamic fields inject karo popup ke andar!
    if (role === "student") {
        dynamicFieldContainer.innerHTML = `
            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Student ID Number</label>
            <input type="text" id="dynamic-input" required placeholder="e.g., STU12345" style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
        `;
    } else if (role === "teacher") {
        dynamicFieldContainer.innerHTML = `
            <label style="display: block; font-weight: bold; margin-bottom: 5px;">Department</label>
            <select id="dynamic-input" required style="width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 5px; background: white;">
                <option value="" disabled selected>Select your department</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Information Technology">Information Technology</option>
                <option value="Electronics">Electronics</option>
                <option value="Mathematics">Mathematics</option>
            </select>
        `;
    }
}

function closeSignupModal() {
    document.getElementById('signup-modal').style.display = 'none';
    // Reset inputs when closed
    document.getElementById("details-form").style.display = "block";
    document.getElementById("otp-form").style.display = "none";
    document.getElementById("signup-message").style.display = "none";
}

function switchModalToLogin() {
    closeSignupModal();
    openLoginModal(window.selectedRole);
}


// ==========================================
// FORM SUBMISSIONS & API CALLS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    const modalLoginForm = document.getElementById("modal-login-form");
    const errorMessage = document.getElementById("modal-error-message");

    const detailsForm = document.getElementById("details-form");
    const otpForm = document.getElementById("otp-form");
    const messageBox = document.getElementById("signup-message");

    // --- LOGIN FORM SUBMIT LISTENER ---
    if (modalLoginForm) {
        modalLoginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const role = window.selectedRole;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            const loginData = {
                email: email,
                password: password
            };

            try {
                const response = await fetch(`${API_BASE_URL}/api/${role}/login`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(loginData)
                }
                );

                const data = await response.json();

                if (response.ok) {
                    localStorage.setItem(`${role}_token`, data.access_token);
                    window.location.href = `${role}_dashboard.html`;
                } else {
                    errorMessage.textContent = data.detail || "Login failed.";
                    errorMessage.style.display = "block";
                }
            } catch (error) {
                errorMessage.textContent = "Could not connect to the server.";
                errorMessage.style.display = "block";
            }
        });
    }

    // --- SIGNUP STEP 1: SEND OTP ---
    if (detailsForm) {
        detailsForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const role = window.selectedRole;
            const email = document.getElementById("signup-email").value;
            const btn = document.getElementById("send-otp-btn");

            btn.textContent = "Sending...";
            btn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/api/${role}/send-otp`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email })
                });

                if (response.ok) {
                    detailsForm.style.display = "none";
                    otpForm.style.display = "block";
                    messageBox.style.display = "block";
                    messageBox.style.background = "#e6f4ea";
                    messageBox.style.color = "#28a745";
                    messageBox.textContent = "OTP Sent! Please check your email.";
                } else {
                    const data = await response.json();
                    throw new Error(data.detail || "Failed to send OTP");
                }
            } catch (error) {
                messageBox.style.display = "block";
                messageBox.style.background = "#ffe6e6";
                messageBox.style.color = "#d9534f";
                messageBox.textContent = error.message;
                btn.textContent = "Send OTP Verification";
                btn.disabled = false;
            }
        });
    }

    // --- SIGNUP STEP 2: VERIFY & REGISTER ---
    if (otpForm) {
        otpForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const role = window.selectedRole;

            const payload = {
                name: document.getElementById("signup-name").value,
                email: document.getElementById("signup-email").value,
                password: document.getElementById("signup-password").value,
                otp: document.getElementById("signup-otp").value
            };

            if (role === "student") {
                payload.student_id = document.getElementById("dynamic-input").value;
            } else {
                payload.department = document.getElementById("dynamic-input").value;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/${role}/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    messageBox.style.background = "#e6f4ea";
                    messageBox.style.color = "#28a745";
                    messageBox.innerHTML = "<strong>Success!</strong> Account created. Closing window...";
                    otpForm.style.display = "none";

                    // Account banne ke baad 2 second mein automatically login modal par switch kar dega
                    setTimeout(() => {
                        closeSignupModal();
                        openLoginModal(role);
                    }, 2000);
                } else {
                    const data = await response.json();
                    throw new Error(data.detail || "Invalid OTP or Signup Failed");
                }
            } catch (error) {
                messageBox.style.background = "#ffe6e6";
                messageBox.style.color = "#d9534f";
                messageBox.textContent = error.message;
            }
        });
    }
});


// ==========================================
// STUDENT DASHBOARD: Fetch & Display Teachers
// ==========================================
async function fetchTeachers() {
    const token = localStorage.getItem("student_token");
    const teachersListDiv = document.getElementById("teachers-list");

    if (!teachersListDiv) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/student/teachers`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
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
    teachersListDiv.innerHTML = "";

    if (teachers.length === 0) {
        teachersListDiv.innerHTML = "<p>No teachers are currently registered.</p>";
        return;
    }

    teachers.forEach(teacher => {
        const teacherName = teacher.name || teacher.full_name || teacher.username || "Unknown Teacher";
        const teacherDept = teacher.department || teacher.department_name || "General";
        const teacherId = teacher.id;

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

function bookAppointment(teacherId) {
    alert("Get ready! We will build the booking feature for Teacher ID: " + teacherId + " next!");
}

// ==========================================
// STUDENT PROFILE: Fetch & Display Details
// ==========================================
async function fetchStudentProfile() {
    const token = localStorage.getItem("student_token");
    const profileInfoDiv = document.getElementById("profile-info");

    if (!profileInfoDiv) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/student/me`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const student = await response.json();

            const studentName = student.name || student.full_name || student.username || "Unknown";
            const studentEmail = student.email || "No email provided";
            const studentId = student.id || "N/A";

            profileInfoDiv.innerHTML = `
                <div style="font-size: 16px; line-height: 1.8; color: #444;">
                    <p><strong>Full Name:</strong> ${studentName}</p>
                    <p><strong>Email Address:</strong> ${studentEmail}</p>
                    <p><strong>Student ID Number:</strong> ${studentId}</p>
                    <p><strong>Account Role:</strong> <span style="background: #e9ecef; padding: 3px 8px; border-radius: 4px; font-size: 14px;">Student</span></p>
                </div>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <button class="btn" style="background-color: #6c757d; width: 100%;" onclick="alert('Password change feature coming soon!')">
                    Change Password
                </button>
            `;
        } else {
            profileInfoDiv.innerHTML = "<p style='color:red;'>Failed to load profile data.</p>";
        }
    } catch (error) {
        console.error("Error fetching profile:", error);
        profileInfoDiv.innerHTML = "<p style='color:red;'>Server connection error.</p>";
    }
}