const API_URL = "http://localhost:3000";
let currentUser = JSON.parse(localStorage.getItem("currentUser"));

document.addEventListener("DOMContentLoaded", () => {
    // Sincronización de sesión
    if (currentUser && !localStorage.getItem('isAuthenticated')) {
        localStorage.setItem('isAuthenticated', 'true');
        localStorage.setItem('userRole', currentUser.role);
    }

    // Validación de rol
    if (!currentUser || currentUser.role !== 'candidate') {
        localStorage.clear();
        window.location.href = "login.html";
        return;
    }

    initDashboard();
});

function initDashboard() {
    // Nombre de bienvenida
    const welcomeElem = document.getElementById("welcomeName");
    if (welcomeElem) welcomeElem.innerText = `Hola, ${currentUser.name}`;

    // Cargar datos iniciales
    renderSidebarStatus();
    loadJobs();
    loadMatches();
    populateProfileView();

    // Listeners Globales
    document.getElementById("btnLogout").addEventListener("click", logout);
    document.getElementById("formProfile").addEventListener("submit", updateProfile);
    document.getElementById("openToWorkToggle").addEventListener("change", toggleOpenToWork);
}

// --- SISTEMA DE PESTAÑAS (TABS) ---
window.switchTab = function (tabName) {
    // Ocultar todas las vistas
    document.querySelectorAll('.view-section').forEach(el => el.classList.add('d-none'));
    // Desactivar todos los botones del menú
    document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));

    // Mostrar vista seleccionada
    document.getElementById(`view-${tabName}`).classList.remove('d-none');

    // Activar botón correspondiente (truco visual simple)
    const buttons = document.querySelectorAll('.menu-list button');
    if (tabName === 'jobs') buttons[0].classList.add('active');
    if (tabName === 'matches') buttons[1].classList.add('active');
    if (tabName === 'profile') buttons[2].classList.add('active');

    // Recargar datos si es necesario
    if (tabName === 'matches') loadMatches();
    if (tabName === 'profile') populateProfileView();
};

// --- LOGICA DE PERFIL Y SIDEBAR ---
function renderSidebarStatus() {
    const profile = currentUser.candidateProfile || {};
    const toggle = document.getElementById("openToWorkToggle");
    const container = document.getElementById("statusContainer");
    const label = document.getElementById("statusLabel");

    toggle.checked = profile.openToWork;

    if (profile.openToWork) {
        container.className = "status-box p-2 rounded text-center mb-4 status-active";
        label.innerText = "Estado: Visible";
    } else {
        container.className = "status-box p-2 rounded text-center mb-4 status-inactive";
        label.innerText = "Estado: Oculto";
    }
}

function populateProfileView() {
    const profile = currentUser.candidateProfile || {};

    // Vista de Lectura (Mi Cuenta)
    document.getElementById("profileNameDisplay").innerText = currentUser.name || "Usuario";
    document.getElementById("profileTitleDisplay").innerText = profile.title || "Sin título profesional";
    document.getElementById("profileEmail").innerText = currentUser.email;
    document.getElementById("profilePhone").innerText = profile.phone || "No registrado";
    document.getElementById("profileCity").innerText = profile.city || "No registrada";
    document.getElementById("profileBirth").innerText = profile.birthdate || "-";
    document.getElementById("profileExp").innerText = profile.yearsOfExperience || "0";

    const skillsContainer = document.getElementById("profileSkillsContainer");
    skillsContainer.innerHTML = "";
    if (profile.skills && profile.skills.length > 0) {
        profile.skills.forEach(skill => {
            skillsContainer.innerHTML += `<span class="badge-skill">${skill}</span>`;
        });
    } else {
        skillsContainer.innerHTML = "<span class='text-muted small'>Sin habilidades registradas</span>";
    }

    // Pre-llenar el formulario del Modal de Edición
    document.getElementById("profTitle").value = profile.title || "";
    document.getElementById("profCity").value = profile.city || "";
    document.getElementById("profExp").value = profile.yearsOfExperience || "";
    document.getElementById("profBirth").value = profile.birthdate || "";
    document.getElementById("profPhone").value = profile.phone || "";
    document.getElementById("profSkills").value = profile.skills ? profile.skills.join(", ") : "";
}

async function updateProfile(e) {
    e.preventDefault();

    const updatedProfile = {
        title: document.getElementById("profTitle").value,
        city: document.getElementById("profCity").value,
        yearsOfExperience: document.getElementById("profExp").value,
        birthdate: document.getElementById("profBirth").value,
        phone: document.getElementById("profPhone").value,
        skills: document.getElementById("profSkills").value
            .split(",")
            .map(s => s.trim())
            .filter(Boolean),
        openToWork: document.getElementById("openToWorkToggle").checked
    };

    try {

        await Swal.fire({
            icon: "success",
            title: "Guardado",
            text: "Cambios aplicados correctamente",
            timer: 2000,
            showConfirmButton: false
        });

        const response = await fetch(`${API_URL}/users/${currentUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candidateProfile: updatedProfile })
        });

        if (!response.ok) throw new Error("Error al actualizar");

        currentUser.candidateProfile = updatedProfile;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));

        bootstrap.Modal
            .getInstance(document.getElementById('profileModal'))
            .hide();

        renderSidebarStatus();
        populateProfileView();

    } catch (error) {
        console.error(error);
        Swal.fire("Error", "No se pudo actualizar el perfil.", "error");
    }
}

async function toggleOpenToWork() {
    const newState = document.getElementById("openToWorkToggle").checked;
    try {
        await fetch(`${API_URL}/users/${currentUser.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                candidateProfile: { ...currentUser.candidateProfile, openToWork: newState }
            })
        });
        currentUser.candidateProfile.openToWork = newState;
        localStorage.setItem("currentUser", JSON.stringify(currentUser));
        renderSidebarStatus();
    } catch (error) {
        console.error("Error toggle:", error);
        document.getElementById("openToWorkToggle").checked = !newState;
    }
}

// --- LOGICA DE OFERTAS (JOBS) ---
async function loadJobs() {
    const container = document.getElementById("jobsList");
    try {
        const response = await fetch(`${API_URL}/jobs`);
        const jobs = await response.json();
        container.innerHTML = "";

        if (jobs.length === 0) {
            container.innerHTML = `<div class="col-12 text-center py-5 text-muted">No hay ofertas disponibles.</div>`;
            return;
        }

        jobs.forEach(job => {
            const skillsHtml = job.skills ? job.skills.slice(0, 3).map(s => `<span class="badge-skill">${s}</span>`).join('') : '';
            const card = `
                <div class="col-md-6">
                    <div class="job-card h-100">
                        <h6 class="fw-bold mb-1">${job.title}</h6>
                        <p class="small text-muted mb-2"><i class="bi bi-building"></i> ${job.companyName}</p>
                        <div class="d-flex flex-wrap gap-1 mb-3">${skillsHtml}</div>
                        <button class="btn btn-sm btn-outline-dark rounded-pill px-3" onclick="viewJobDetail('${job.id}')">
                            Ver más
                        </button>
                    </div>
                </div>`;
            container.innerHTML += card;
        });
    } catch (error) {
        container.innerHTML = `<div class="alert alert-danger">Error cargando ofertas.</div>`;
    }
}

// Función para abrir el Modal de Detalle
window.viewJobDetail = async function (jobId) {
    try {
        const response = await fetch(`${API_URL}/jobs/${jobId}`);
        const job = await response.json();

        document.getElementById("modalJobTitle").innerText = job.title;
        document.getElementById("modalJobCompany").innerText = job.companyName;
        document.getElementById("modalJobDesc").innerText = job.description || "Sin descripción detallada.";

        const skillsContainer = document.getElementById("modalJobSkills");
        skillsContainer.innerHTML = job.skills ? job.skills.map(s => `<span class="badge bg-light text-dark border">${s}</span>`).join('') : "No especificados";

        const modal = new bootstrap.Modal(document.getElementById('jobDetailModal'));
        modal.show();
    } catch (error) {
        Swal.fire("Error", "No se pudo cargar el detalle.", "error");
    }
};

// --- LOGICA DE MATCHES ---
async function loadMatches() {
    const container = document.getElementById("matchesList");
    const counterBadge = document.getElementById("matchCount");

    try {
        // json-server permite expandir relaciones. Usamos _expand para traer datos del job
        // Nota: Asumimos que el match tiene jobId y companyId
        const response = await fetch(`${API_URL}/matches?candidateId=${currentUser.id}&_expand=job`);
        const matches = await response.json();

        // Filtramos solo los pendientes para la vista principal
        const pendingMatches = matches.filter(m => m.status === 'pending');

        // Actualizar contador
        counterBadge.innerText = pendingMatches.length;
        if (pendingMatches.length > 0) counterBadge.classList.remove('d-none');

        container.innerHTML = "";

        if (pendingMatches.length === 0) {
            container.innerHTML = `
                <div class="col-12 text-center py-5">
                    <i class="bi bi-emoji-neutral text-muted" style="font-size: 3rem;"></i>
                    <p class="text-muted mt-2">No tienes solicitudes pendientes.</p>
                </div>`;
            return;
        }

        pendingMatches.forEach(match => {
            const jobTitle = match.job ? match.job.title : "Posición desconocida";
            const companyName = match.job ? match.job.companyName : "Empresa";

            const card = `
                <div class="col-12">
                    <div class="login-card p-3 d-flex justify-content-between align-items-center flex-wrap gap-3">
                        <div>
                            <span class="badge bg-warning text-dark mb-1">Nueva Solicitud</span>
                            <h6 class="fw-bold mb-0">${jobTitle}</h6>
                            <p class="small text-muted mb-0">De: ${companyName}</p>
                        </div>
                        <div class="d-flex gap-2">
                            <button class="btn btn-sm btn-outline-danger" onclick="respondMatch('${match.id}', 'discarded')">
                                <i class="bi bi-x-lg"></i> Rechazar
                            </button>
                            <button class="btn btn-sm btn-success text-white" onclick="respondMatch('${match.id}', 'contacted')">
                                <i class="bi bi-check-lg"></i> Aceptar
                            </button>
                        </div>
                    </div>
                </div>
            `;
            container.innerHTML += card;
        });

    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="text-danger">Error cargando matches.</div>`;
    }
}

window.respondMatch = async function (matchId, newStatus) {
    const actionText = newStatus === 'contacted' ? 'Aceptar' : 'Rechazar';

    const result = await Swal.fire({
        title: `¿${actionText} solicitud?`,
        text: newStatus === 'contacted' ? "La empresa recibirá tus datos de contacto." : "Esta oferta desaparecerá de tu lista.",
        icon: "question",
        showCancelButton: true,
        confirmButtonColor: newStatus === 'contacted' ? '#198754' : '#d33',
        confirmButtonText: `Sí, ${actionText}`
    });

    if (result.isConfirmed) {
        try {
            await fetch(`${API_URL}/matches/${matchId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus })
            });

            Swal.fire("Listo", `Solicitud ${newStatus === 'contacted' ? 'aceptada' : 'rechazada'}.`, "success");
            loadMatches(); // Recargar lista
        } catch (error) {
            Swal.fire("Error", "No se pudo actualizar el match.", "error");
        }
    }
};

function logout() {
    localStorage.removeItem("currentUser");
    localStorage.removeItem("isAuthenticated");
    localStorage.removeItem("userRole");
    window.location.href = "login.html";
}