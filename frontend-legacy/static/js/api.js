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

// ==========================================
// UNIVERSAL PASSWORD VISIBILITY TOGGLE
// ==========================================
function togglePasswordVisibility(inputId, iconId) {
    const passwordInput = document.getElementById(inputId);
    const toggleIcon = document.getElementById(iconId);

    if (!passwordInput || !toggleIcon) return; // Error bachane ke liye

    // If hidden, show it and OPEN the eye
    if (passwordInput.type === "password") {
        passwordInput.type = "text";
        toggleIcon.className = "fa-solid fa-eye"; // Force exact classes
        toggleIcon.style.color = "#0056d2"; // Premium blue color
    }
    // If visible, hide it and SLASH the eye
    else {
        passwordInput.type = "password";
        toggleIcon.className = "fa-solid fa-eye-slash"; // Force exact classes
        toggleIcon.style.color = "#666"; // Return to grey
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
            <option value="1">Computer Science</option>
            <option value="2">Information Technology</option>
            <option value="3">Electronics</option>
            <option value="4">Mathematics</option>
        </select>
    `;
    }
}

function closeSignupModal() {
    document.getElementById('signup-modal').style.display = 'none';
    document.body.classList.remove('modal-open'); // 1. Scroll Unfreeze

    // 2. Reset Step Visibility
    document.getElementById("details-form").style.display = "block";
    document.getElementById("otp-form").style.display = "none";
    document.getElementById("signup-message").style.display = "none";

    // 3. Clear Typed Text (Form Reset)
    document.getElementById("details-form").reset();
    document.getElementById("otp-form").reset();
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
    document.body.classList.remove('modal-open'); // 1. Scroll Unfreeze

    // 2. Reset Step Visibility
    document.getElementById("forgot-step1").style.display = "block";
    document.getElementById("forgot-step2").style.display = "none";
    document.getElementById("forgot-message").style.display = "none";

    // 3. Clear Typed Text (Form Reset)
    document.getElementById("forgot-step1").reset();
    document.getElementById("forgot-step2").reset();
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
    document.body.classList.remove('modal-open'); // 1. Scroll Unfreeze

    // 2. Reset Step Visibility
    document.getElementById("cp-step1").style.display = "block";
    document.getElementById("cp-step2").style.display = "none";
    document.getElementById("cp-message").style.display = "none";

    // 3. Clear Typed Text (Form Reset)
    document.getElementById("cp-step1").reset();
    document.getElementById("cp-step2").reset();
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
    if (modalLoginForm) {
        modalLoginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const role = window.selectedRole;
            const email = document.getElementById("email").value;
            const password = document.getElementById("password").value;

            try {
                // Sending JSON because your backend expects StudentLogin(BaseModel) with 'email'
                const response = await fetch(`${API_BASE_URL}/api/${role}/login`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        email: email,       // Matches your Pydantic schema key
                        password: password  // Matches your Pydantic schema key
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Successfully saving the token string
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
            } finally {
                // Always reset the button, whether success, failure, or network error
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

            if (role === "student") {
                payload.roll_no = document.getElementById("dynamic-input").value;
            } else {
                payload.department_id = parseInt(document.getElementById("dynamic-input").value);
            }

            try {
                const response = await fetch(`${API_BASE_URL}/api/${role}/signup`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) {
                    // Correctly saving the access_token string for signup!
                    localStorage.setItem(`${role}_token`, data.access_token);

                    messageBox.style.background = "#e6f4ea";
                    messageBox.style.color = "#28a745";
                    messageBox.innerHTML = "<strong>Success!</strong> Account created. Logging you in...";
                    otpForm.style.display = "none";

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
            } finally {
                // Always reset the button, whether success, failure, or network error
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
            if (welcomeText) {
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


// ==========================================
// SUBMIT TICKET / APPOINTMENT REQUEST
// ==========================================
async function submitAppointmentRequest(event) {
    event.preventDefault();

    const teacherInputValue = document.getElementById('appointment-teacher').value;
    const reason = document.getElementById('appointment-reason').value;
    const submitBtn = document.getElementById('submit-ticket-btn');
    const queueStatus = document.getElementById('queue-status');
    const datalist = document.getElementById('faculty-list');
    const appointmentForm = document.getElementById('appointment-form');

    const selectedOption = Array.from(datalist.options).find(opt => opt.value === teacherInputValue);

    if (!selectedOption) {
        showStableBanner(queueStatus, "Please select a valid faculty member from the list.", "error");
        return;
    }

    const teacherId = selectedOption.getAttribute('data-id');

    if (!reason) {
        showStableBanner(queueStatus, "Please provide a reason for your request.", "error");
        return;
    }

    // 1. Loading State
    const originalBtnText = submitBtn.innerText;
    submitBtn.innerText = "Sending Request...";
    submitBtn.disabled = true;
    showStableBanner(queueStatus, "⏳ Sending your request...", "loading");

    try {
        const response = await fetch('http://127.0.0.1:8000/api/student/book-appointment', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('student_token')}`
            },
            body: JSON.stringify({
                teacher_id: teacherId,
                purpose: reason
            })
        });

        const data = await response.json();

        if (response.ok) {
            // 2. Success State: Reset inputs and disable them so form stays stable in place
            if (appointmentForm) {
                appointmentForm.reset();
                const inputs = appointmentForm.querySelectorAll('input, textarea, select');
                inputs.forEach(input => input.disabled = true);
            }

            // Show permanent success message inside queue-status
            showStableBanner(queueStatus, `🎉 ${data.message || "Appointment requested successfully!"}`, "success");

            submitBtn.innerText = "Done";
            submitBtn.disabled = true;

        } else {
            throw new Error(data.detail || "Failed to send ticket");
        }

    } catch (error) {
        console.error("Error:", error);
        showStableBanner(queueStatus, `❌ ${error.message || "Failed to connect to the server."}`, "error");
        submitBtn.innerText = originalBtnText;
        submitBtn.disabled = false;
    }
}

// Stable Banner helper
function showStableBanner(element, message, type) {
    if (!element) return;

    element.style.display = "block";
    element.style.padding = "15px";
    element.style.borderRadius = "8px";
    element.style.fontSize = "14px";
    element.style.fontWeight = "500";
    element.style.textAlign = "center";
    element.style.marginTop = "10px";

    if (type === "success") {
        element.style.backgroundColor = "#D1FAE5";
        element.style.color = "#065F46";
        element.style.border = "1px solid #A7F3D0";
    } else if (type === "loading") {
        element.style.backgroundColor = "#EFF6FF";
        element.style.color = "#1E40AF";
        element.style.border = "1px solid #BFDBFE";
    } else {
        element.style.backgroundColor = "#FEE2E2";
        element.style.color = "#991B1B";
        element.style.border = "1px solid #FECACA";
    }
    element.innerText = message;
}
// ==========================================
// LOAD TEACHERS LIST (For Student Dashboard)
// ==========================================
async function loadTeachersList() {
    try {
        // 1. FastAPI se saare teachers fetch karein
        // Note: Agar aapka route /api/teachers/list hai toh URL adjust kar lijiye
        const response = await fetch('http://127.0.0.1:8000/api/teacher/list', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                // Agar aapne is route par security (token) lagai hai toh ye un-comment karein:
                // 'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch teachers list from backend.");
        }

        const teachers = await response.json(); // Array of Teacher objects
        const datalist = document.getElementById('faculty-list');

        // 2. Pehle purane/dummy options clear kar dein
        datalist.innerHTML = '';

        // 3. Har ek teacher ke liye naya option create karein
        teachers.forEach(teacher => {
            const option = document.createElement('option');

            // Ye wo text hai jo student ko dropdown mein dikhega 
            // Aap apne schema ke hisaab se teacher.full_name ya teacher.name use kar sakte hain
            option.value = `${teacher.name} - ${teacher.department}`;

            // SABSE ZAROORI CHEEZ: Hidden ID attach karna
            option.setAttribute('data-id', teacher.id);

            datalist.appendChild(option);
        });

        console.log("Teachers list loaded successfully!");

    } catch (error) {
        console.error("Error loading teachers:", error);
    }
}

// ==========================================
// AUTO-RUN WHEN PAGE LOADS
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
    // Ye check karega ki agar hum Student Dashboard par hain tabhi load kare
    if (document.getElementById('faculty-list')) {
        loadTeachersList();
    }
});


// ==========================================
// TEACHER APPOINTMENTS MODAL & MANAGEMENT
// ==========================================

function openTeacherAppointmentsModal() {
    const modal = document.getElementById('teacher-appointments-modal');
    if (modal) {
        modal.style.display = "flex"; // Aapke glassmorphism flex overlay ke liye
        fetchTeacherAppointmentsList();
    }
}

function closeTeacherAppointmentsModal() {
    const modal = document.getElementById('teacher-appointments-modal');
    if (modal) {
        modal.style.display = "none";
    }
}

async function fetchTeacherAppointmentsList() {
    const tableBody = document.getElementById('teacher-appointments-table-body');
    if (!tableBody) return;

    try {
        const response = await fetch('http://127.0.0.1:8000/api/teacher/appointments', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('teacher_token')}`
            }
        });

        const appointments = await response.json();

        if (response.ok) {
            if (appointments.length === 0) {
                tableBody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #666;">No pending appointment requests.</td></tr>`;
                return;
            }

            tableBody.innerHTML = "";
            appointments.forEach(appt => {
                let badgeBg = "#ffc107"; // Pending
                let badgeColor = "#000";
                if (appt.status === "Approved") {
                    badgeBg = "#28a745";
                    badgeColor = "#fff";
                } else if (appt.status === "Rejected") {
                    badgeBg = "#dc3545";
                    badgeColor = "#fff";
                }

                const row = document.createElement('tr');
                row.style.borderBottom = "1px solid #dee2e6";
                row.innerHTML = `
                    <td style="padding: 10px; font-size: 13px;"><b>${appt.student_name || 'Student'}</b><br><span style="color: #666; font-size: 11px;">${appt.student_email || ''}</span></td>
                    <td style="padding: 10px; font-size: 13px;">${appt.student_roll || 'N/A'}</td>
                    <td style="padding: 10px; font-size: 13px; max-width: 200px;">${appt.purpose}</td>
                    <td style="padding: 10px; font-size: 13px;"><span style="padding: 4px 8px; border-radius: 4px; background: ${badgeBg}; color: ${badgeColor}; font-weight: bold; font-size: 11px;">${appt.status}</span></td>
                    <td style="padding: 10px; text-align: center;">
                        ${appt.status === 'Pending' ? `
                            <button onclick="updateTeacherAppointmentStatus(${appt.id}, 'Approved')" class="btn" style="background-color: #28a745; padding: 5px 10px; font-size: 11px; margin-right: 4px;">Accept</button>
                            <button onclick="updateTeacherAppointmentStatus(${appt.id}, 'Rejected')" class="btn" style="background-color: #dc3545; padding: 5px 10px; font-size: 11px;">Reject</button>
                        ` : `<span style="color: #888; font-size: 12px; font-style: italic;">Processed</span>`}
                    </td>
                `;
                tableBody.appendChild(row);
            });

        } else {
            tableBody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #dc3545;">Failed to load appointments.</td></tr>`;
        }

    } catch (error) {
        console.error("Error:", error);
        tableBody.innerHTML = `<tr><td colspan="5" style="padding: 20px; text-align: center; color: #dc3545;">Server connection error.</td></tr>`;
    }
}

async function updateTeacherAppointmentStatus(appointmentId, newStatus) {
    try {
        const response = await fetch(`http://127.0.0.1:8000/api/teacher/appointments/${appointmentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('teacher_token')}`
            },
            body: JSON.stringify({ status: newStatus })
        });

        const data = await response.json();

        if (response.ok) {
            // Table ko turant refresh karein taaki updated status dikhe
            fetchTeacherAppointmentsList();
        } else {
            alert(data.detail || "Failed to update status");
        }
    } catch (error) {
        console.error("Error updating status:", error);
        alert("Failed to connect to server.");
    }
}