// Utility to show toast notifications
function showToast(message, type = 'info') {
    let bgColor = "linear-gradient(to right, #3b82f6, #2563eb)"; // default info/primary
    if (type === 'success') bgColor = "linear-gradient(to right, #10b981, #059669)";
    if (type === 'error') bgColor = "linear-gradient(to right, #ef4444, #dc2626)";

    Toastify({
        text: message,
        duration: 3000,
        gravity: "bottom",
        position: "right",
        style: {
            background: bgColor,
            borderRadius: "8px",
            fontFamily: "Inter, sans-serif"
        }
    }).showToast();
}

// Fetch helper
async function apiCall(url, method = 'GET', body = null) {
    const options = {
        method,
        headers: { 'Content-Type': 'application/json' },
    };
    if (body) options.body = JSON.stringify(body);

    try {
        const response = await fetch(url, options);
        const data = await response.json();
        return { ok: response.ok, data };
    } catch (error) {
        console.error("API Error:", error);
        return { ok: false, data: { message: "Network error occurred." } };
    }
}

document.addEventListener('DOMContentLoaded', () => {

    // --- GLOBAL ---
    const backupBtn = document.getElementById('backupBtn');
    if (backupBtn) {
        backupBtn.addEventListener('click', async () => {
            const res = await apiCall('/api/backup', 'POST');
            if (res.ok) {
                showToast(res.data.message, 'success');
            } else {
                showToast(res.data.message || 'Backup failed', 'error');
            }
        });
    }

    // --- STUDENT PORTAL ---
    const deptSelect = document.getElementById('deptSelect');
    const teachersContainer = document.getElementById('teachersContainer');
    const requestModal = document.getElementById('requestModal');

    if (deptSelect && teachersContainer) {
        let globalData = {};

        // Load Data
        async function loadStudentData() {
            const res = await apiCall('/api/data');
            if (res.ok) {
                globalData = res.data;
                populateDepartments(globalData);
            }
        }

        function populateDepartments(data) {
            deptSelect.innerHTML = '<option value="" disabled selected>Choose Department...</option>';
            Object.keys(data).forEach(dept => {
                const opt = document.createElement('option');
                opt.value = dept;
                opt.textContent = dept;
                deptSelect.appendChild(opt);
            });
        }

        deptSelect.addEventListener('change', (e) => {
            const dept = e.target.value;
            renderTeachers(dept);
        });

        function renderTeachers(dept) {
            teachersContainer.innerHTML = '';
            const teachers = globalData[dept] || [];

            if (teachers.length === 0) {
                teachersContainer.innerHTML = '<p class="text-muted">No teachers found.</p>';
                return;
            }

            teachers.forEach((t) => {
                const isAvailable = t.status === "Available for Students";
                const badgeClass = isAvailable ? 'status-available' : 'status-unavailable';
                const qLen = t.requests ? t.requests.length : 0;
                const qText = qLen === 0 ? "Queue is empty." : `${qLen} student(s) in queue.`;

                const card = document.createElement('div');
                card.className = 'glass-card teacher-card hover-lift fade-in-up';
                card.innerHTML = `
                    <div class="teacher-name">${t.name}</div>
                    <div><span class="status-badge ${badgeClass}">${t.status}</span></div>
                    <div class="queue-info">${isAvailable ? qText : 'Not accepting requests.'}</div>
                    <button class="btn ${isAvailable ? 'btn-primary' : 'btn-outline'}" 
                            ${!isAvailable ? 'disabled' : ''}
                            onclick="openRequestModal('${dept}', '${t.id}', '${t.name}')">
                        Send Doubt Request
                    </button>
                `;
                teachersContainer.appendChild(card);
            });
        }

        loadStudentData();

        // Modal Logic
        const closeModal = document.getElementById('closeModal');
        const requestForm = document.getElementById('requestForm');

        window.openRequestModal = function (dept, id, name) {
            document.getElementById('reqDept').value = dept;
            document.getElementById('reqTeacherId').value = id;
            document.getElementById('modalTeacherName').textContent = "Requesting: " + name;
            document.getElementById('reqName').value = '';
            document.getElementById('reqRoll').value = '';
            document.getElementById('reqDoubt').value = '';
            requestModal.style.display = 'flex';
        };

        closeModal.addEventListener('click', () => {
            requestModal.style.display = 'none';
        });

        window.onclick = function (event) {
            if (event.target == requestModal) {
                requestModal.style.display = "none";
            }
        };

        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const payload = {
                dept: document.getElementById('reqDept').value,
                teacher_id: document.getElementById('reqTeacherId').value,
                name: document.getElementById('reqName').value,
                roll_no: document.getElementById('reqRoll').value,
                doubt: document.getElementById('reqDoubt').value
            };

            const btn = requestForm.querySelector('button');
            btn.disabled = true;
            btn.textContent = "Sending...";

            const res = await apiCall('/api/request', 'POST', payload);

            btn.disabled = false;
            btn.textContent = "Submit Request";

            if (res.ok) {
                requestModal.style.display = 'none';
                let pos = res.data.position;
                let msg = "✅ Request sent successfully! ";
                if (pos === 0) msg += "You are currently next in line!";
                else msg += `There are ${pos} student(s) ahead of you.`;
                showToast(msg, 'success');
                loadStudentData(); // Refresh queue lengths
                setTimeout(() => { renderTeachers(payload.dept); }, 200); // re-render selected
            } else {
                showToast(res.data.message || 'Failed to send request.', 'error');
            }
        });
    }

    // --- TEACHER LOGIN ---
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const dept = document.getElementById('loginDept').value;
            const teacher_id = document.getElementById('loginIdOrName').value;
            const password = document.getElementById('loginPass').value;

            const btn = document.getElementById('loginBtn');
            btn.disabled = true;
            btn.querySelector('.btn-text').textContent = 'Logging in...';

            const res = await apiCall('/api/login', 'POST', { dept, teacher_id, password });

            if (res.ok) {
                window.location.href = '/teacher/dashboard';
            } else {
                showToast(res.data.message, 'error');
                btn.disabled = false;
                btn.querySelector('.btn-text').textContent = 'Login';
            }
        });
    }

    // --- STUDENT LOGIN ---
    const studentLoginForm = document.getElementById('studentLoginForm');
    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('studentEmail').value;
            const password = document.getElementById('studentPass').value;

            const btn = document.getElementById('studentLoginBtn');
            btn.disabled = true;
            btn.querySelector('.btn-text').textContent = 'Logging in...';

            const res = await apiCall('/api/student/login', 'POST', { email, password });

            if (res.ok) {
                window.location.href = '/student';
            } else {
                showToast(res.data.message, 'error');
                btn.disabled = false;
                btn.querySelector('.btn-text').textContent = 'Login';
            }
        });
    }

    // --- STUDENT LOGOUT ---
    const studentLogoutBtn = document.getElementById('studentLogoutBtn');
    if (studentLogoutBtn) {
        studentLogoutBtn.addEventListener('click', async () => {
            await apiCall('/api/logout', 'POST');
            window.location.href = '/';
        });
    }

    // --- TEACHER DASHBOARD ---
    const dashboardContainer = document.querySelector('.dashboard-container');
    if (dashboardContainer) {
        const nameDisplay = document.getElementById('teacherNameDisplay');
        const deptDisplay = document.getElementById('teacherDeptDisplay');
        const statusSelect = document.getElementById('statusSelect');
        const requestsContainer = document.getElementById('requestsContainer');
        const emptyState = document.getElementById('emptyState');
        const logoutBtn = document.getElementById('logoutBtn');

        async function loadDashboard() {
            const res = await apiCall('/api/teacher/me');
            if (res.ok) {
                const t = res.data.teacher;
                nameDisplay.textContent = `Welcome, ${t.name}`;
                deptDisplay.textContent = `Department: ${t.id} (Dept)`;
                statusSelect.value = t.status;

                renderRequests(t.requests || []);
            } else {
                window.location.href = '/teacher/login';
            }
        }

        function renderRequests(reqs) {
            // keep the empty state element around
            requestsContainer.innerHTML = '';
            if (reqs.length === 0) {
                requestsContainer.appendChild(emptyState);
                emptyState.style.display = 'block';
                return;
            }

            emptyState.style.display = 'none';
            reqs.forEach((r, idx) => {
                const card = document.createElement('div');
                card.className = 'request-card fade-in-up';
                card.innerHTML = `
                    <div class="request-info">
                        <h4>${r.name} <span>(#${r.roll_no})</span></h4>
                        <div class="request-doubt">"${r.doubt}"</div>
                    </div>
                    <div class="request-actions">
                        <button class="btn btn-success" onclick="handleRequest('accept', ${idx})">Accept & Solve</button>
                        <button class="btn btn-outline" onclick="handleRequest('skip', ${idx})">Skip</button>
                    </div>
                `;
                requestsContainer.appendChild(card);
            });
        }

        statusSelect.addEventListener('change', async (e) => {
            const newStatus = e.target.value;
            const res = await apiCall('/api/status', 'POST', { status: newStatus });
            if (res.ok) {
                showToast('Status updated successfully.', 'success');
                loadDashboard(); // Refresh because changing to unavailable clears queue
            } else {
                showToast(res.data.message || 'Failed to update status.', 'error');
                loadDashboard(); // revert visual change
            }
        });

        window.handleRequest = async function (action, index) {
            const res = await apiCall('/api/manage_request', 'POST', { action, index });
            if (res.ok) {
                showToast(res.data.message, 'success');
                loadDashboard();
            } else {
                showToast(res.data.message, 'error');
            }
        };

        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await apiCall('/api/logout', 'POST');
                window.location.href = '/';
            });
        }

        loadDashboard();
        // Auto refresh requests every 5 seconds if available
        setInterval(() => {
            if (statusSelect.value === "Available for Students") {
                loadDashboard();
            }
        }, 5000);
    }
});
