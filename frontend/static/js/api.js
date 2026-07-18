const API_BASE_URL = "";
window.selectedRole = ""; // Roles track karne ke liye global variable

// ==========================================
// UI LOGIC: Modern Modals Handling (Login & Signup)
// ==========================================

function openLoginModal(role) {
    window.selectedRole = role;
    document.getElementById('login-modal').style.display = 'flex';
    document.getElementById('modal-title').textContent = role.charAt(0).toUpperCase() + role.slice(1) + " Login";

    // ==========================================
    // FIX FOR BUG 2: Defeat Aggressive Autofill
    // ==========================================
    const loginForm = document.getElementById("modal-login-form");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");

    // 1. Standard form reset
    if (loginForm) loginForm.reset();

    // 2. Explicitly wipe the values
    if (emailInput) emailInput.value = "";
    if (passwordInput) passwordInput.value = "";

    // 3. The "Double-Tap": Wait 50 milliseconds and wipe them AGAIN 
    // This catches the browser if it tries to auto-fill right after the modal becomes visible
    setTimeout(() => {
        if (emailInput) emailInput.value = "";
        if (passwordInput) passwordInput.value = "";
    }, 50);

    // Hide any leftover error messages from previous attempts
    const errorMsg = document.getElementById("modal-error-message");
    if (errorMsg) errorMsg.style.display = "none";
}

function closeLoginModal() {
    document.getElementById('login-modal').style.display = 'none';
}

function togglePasswordVisibility() {
    const passwordInput = document.getElementById("password");
    const toggleIcon = document.getElementById("toggle-password");

    // If it is hidden, show it and OPEN the eye
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.classList.remove("fa-eye-slash");
        toggleIcon.classList.add("fa-eye");
    }
    // If it is visible, hide it and SLASH the eye
    else {
        passwordInput.type = "password";
        toggleIcon.classList.remove("fa-eye");
        toggleIcon.classList.add("fa-eye-slash");
    }
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

function openForgotModal() {
    closeLoginModal();
    document.getElementById('forgot-modal').style.display = 'flex';
    document.getElementById('forgot-subtitle').textContent = `Reset ${window.selectedRole.charAt(0).toUpperCase() + window.selectedRole.slice(1)} Password`;
}

function closeForgotModal() {
    document.getElementById('forgot-modal').style.display = 'none';
    // Reset the forms so it's fresh next time it opens
    document.getElementById("forgot-step1").style.display = "block";
    document.getElementById("forgot-step2").style.display = "none";
    document.getElementById("forgot-message").style.display = "none";

}

// ==========================================
// DASHBOARD: CHANGE PASSWORD (LOGGED IN)
// ==========================================
function openChangePasswordModal() {
    const email = document.getElementById("profile-email").textContent;
    if (!email || email === "Loading...") {
        alert("Please wait for your profile to load completely.");
        return;
    }
    document.getElementById("cp-email-display").textContent = email;

    // Close the profile modal and open the change password modal
    if (typeof closeProfileModal === 'function') closeProfileModal();
    document.getElementById('change-password-modal').style.display = 'flex';
}

function closeChangePasswordModal() {
    document.getElementById('change-password-modal').style.display = 'none';

    // Reset the forms so it's fresh next time
    document.getElementById("cp-step1").style.display = "block";
    document.getElementById("cp-step2").style.display = "none";
    document.getElementById("cp-message").style.display = "none";
}

function toggleCpPasswordVisibility() {
    const passwordInput = document.getElementById("cp-new-password");
    const toggleIcon = document.getElementById("toggle-cp-password");

    // If it is hidden, show it and OPEN the eye
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.classList.remove("fa-eye-slash");
        toggleIcon.classList.add("fa-eye");
    }
    // If it is visible, hide it and SLASH the eye
    else {
        passwordInput.type = "password";
        toggleIcon.classList.remove("fa-eye");
        toggleIcon.classList.add("fa-eye-slash");
    }
}

function switchForgotToLogin() {
    closeForgotModal();
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
    // --- LOGIN FORM SUBMIT LISTENER ---
    if (modalLoginForm) {
        modalLoginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const role = window.selectedRole;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                // YAHAN CHANGE KIYA HAI: Ab hum JSON format bhej rahe hain!
                const response = await fetch(`${API_BASE_URL}/api/${role}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: email,
                        password: password
                    })
                });

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

    // --- SIGNUP STEP 2: VERIFY & REGISTER (AUTO-LOGIN UPDATED) ---
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

            // Fix: Changed 'student_id' to 'roll_no' to match FastAPI's Pydantic schema
            if (role === "student") {
                payload.roll_no = document.getElementById("dynamic-input").value;
            } else {
                payload.department = document.getElementById("dynamic-input").value;
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/${role}/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                // Ab JSON har haal mein parse karna padega token nikalne ke liye
                const data = await response.json();

                if (response.ok) {
                    // 1. JWT Token ko browser storage mein save karo
                    localStorage.setItem(`${role}_token`, data.access_token);

                    // 2. Success message dikhao
                    messageBox.style.background = "#e6f4ea";
                    messageBox.style.color = "#28a745";
                    messageBox.innerHTML = "<strong>Success!</strong> Account created. Logging you in...";
                    otpForm.style.display = "none";

                    // 3. 1.5 seconds baad sidha dashboard par redirect!
                    setTimeout(() => {
                        window.location.href = `${role}_dashboard.html`;
                    }, 1500);
                } else {
                    throw new Error(data.detail || "Invalid OTP or Signup Failed");
                }
            } catch (error) {
                messageBox.style.background = "#ffe6e6";
                messageBox.style.color = "#d9534f";
                messageBox.textContent = error.message;
            }
        });
    }

    // --- FORGOT PASSWORD STEP 1: SEND OTP ---
    const forgotStep1 = document.getElementById("forgot-step1");
    const forgotStep2 = document.getElementById("forgot-step2");
    const forgotMessage = document.getElementById("forgot-message");

    if (forgotStep1) {
        forgotStep1.addEventListener("submit", async (e) => {
            e.preventDefault();
            const role = window.selectedRole;
            const email = document.getElementById("forgot-email").value;
            const btn = document.getElementById("forgot-send-btn");

            btn.textContent = "Sending...";
            btn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/api/${role}/forgot-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: email })
                });

                if (response.ok) {
                    forgotStep1.style.display = "none";
                    forgotStep2.style.display = "block";
                    forgotMessage.style.display = "block";
                    forgotMessage.style.background = "#e6f4ea";
                    forgotMessage.style.color = "#28a745";
                    forgotMessage.textContent = "OTP Sent! Please check your email.";
                } else {
                    const data = await response.json();
                    throw new Error(data.detail || "Failed to send reset link.");
                }
            } catch (error) {
                forgotMessage.style.display = "block";
                forgotMessage.style.background = "#ffe6e6";
                forgotMessage.style.color = "#d9534f";
                forgotMessage.textContent = error.message;
                btn.textContent = "Send Recovery OTP";
                btn.disabled = false;
            }
        });
    }

    // --- FORGOT PASSWORD STEP 2: RESET PASSWORD ---
    if (forgotStep2) {
        forgotStep2.addEventListener("submit", async (e) => {
            e.preventDefault();
            const role = window.selectedRole;

            const payload = {
                email: document.getElementById("forgot-email").value,
                otp: document.getElementById("forgot-otp").value,
                new_password: document.getElementById("forgot-new-password").value
            };

            try {
                const response = await fetch(`${API_BASE_URL}/api/${role}/reset-password`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                if (response.ok) {
                    forgotMessage.style.background = "#e6f4ea";
                    forgotMessage.style.color = "#28a745";
                    forgotMessage.innerHTML = "<strong>Success!</strong> Password reset. Switching to login...";
                    forgotStep2.style.display = "none";

                    setTimeout(() => {
                        switchForgotToLogin();
                    }, 2000);
                } else {
                    const data = await response.json();
                    throw new Error(data.detail || "Invalid OTP or Reset Failed");
                }
            } catch (error) {
                forgotMessage.style.background = "#ffe6e6";
                forgotMessage.style.color = "#d9534f";
                forgotMessage.textContent = error.message;
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
// STUDENT PROFILE: Fetch & Display Details (UPDATED FOR MODAL)
// ==========================================
async function fetchStudentProfile() {
    const token = localStorage.getItem("student_token");

    // If there is no token, don't even try to fetch
    if (!token) return;

    try {
        // Calling the /profile route we just built in the backend
        const response = await fetch(`${API_BASE_URL}/api/student/profile`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const student = await response.json();

            // Inject the data into the new specific HTML elements in the modal
            document.getElementById("profile-name").textContent = student.name || "Unknown Student";
            document.getElementById("profile-email").textContent = student.email || "No Email";

            // Using roll_no to match your student.py model
            document.getElementById("profile-roll").textContent = student.roll_no || "N/A";

        } else {
            console.error("Failed to load profile data");
            document.getElementById("profile-email").textContent = "Error loading data";
            document.getElementById("profile-roll").textContent = "Error loading data";
        }
    } catch (error) {
        console.error("Server connection error:", error);
        document.getElementById("profile-email").textContent = "Connection error";
        document.getElementById("profile-roll").textContent = "Connection error";
    }
}


// ==========================================
// TEACHER PROFILE: Fetch & Display Details
// ==========================================
async function fetchTeacherProfile() {
    const token = localStorage.getItem("teacher_token");
    
    // If there is no token, don't even try to fetch
    if (!token) return;

    try {
        const response = await fetch(`${API_BASE_URL}/api/teacher/profile`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        if (response.ok) {
            const teacher = await response.json();
            
            // 1. Inject the data into the Profile Modal
            // (Adjust teacher.name / teacher.username based on your specific database columns)
            const teacherName = teacher.name || teacher.username || "Unknown Professor";
            
            document.getElementById("profile-name").textContent = teacherName;
            document.getElementById("profile-email").textContent = teacher.email || "No Email";
            document.getElementById("profile-dept").textContent = teacher.department || "General";
            
            // 2. Dynamically update the Welcome Banner on the dashboard!
            const welcomeText = document.getElementById("welcome-text");
            if(welcomeText) {
                welcomeText.textContent = `Welcome, Prof. ${teacherName}!`;
            }
            
        } else {
            console.error("Failed to load teacher profile data");
            document.getElementById("profile-email").textContent = "Error loading data";
        }
    } catch (error) {
        console.error("Server connection error:", error);
        document.getElementById("profile-email").textContent = "Connection error";
    }
}
