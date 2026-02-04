// company.js - Lógica completa para el panel de empresas

// URLs del backend
const API_URL = 'http://localhost:3000';
const CACHE_PREFIX = 'matchflow_company_';

// Variables globales
let currentCompany = null;
let currentCompanyId = null;
let allCandidates = [];
let allJobs = [];
let allMatches = [];
let currentMatchId = null;

// Inicialización cuando el DOM está listo
document.addEventListener('DOMContentLoaded', function () {
    initializeApp();
    setupEventListeners();
});

// Inicializar la aplicación
function initializeApp() {
    // Obtener empresa del localStorage (viene del login)
    const savedCompany = localStorage.getItem('currentUser');

    if (!savedCompany) {
        // Si no hay empresa logueada, redirigir al login
        Swal.fire({
            icon: 'error',
            title: 'Sesión no iniciada',
            text: 'Debes iniciar sesión como empresa',
            confirmButtonText: 'Ir al login'
        }).then(() => {
            window.location.href = 'index.html';
        });
        return;
    }

    try {
        currentCompany = JSON.parse(savedCompany);

        // Verificar que sea una empresa
        if (currentCompany.role !== 'company') {
            Swal.fire({
                icon: 'error',
                title: 'Acceso denegado',
                text: 'Esta sección es solo para empresas',
                confirmButtonText: 'Volver'
            }).then(() => {
                window.location.href = 'index.html';
            });
            return;
        }

        currentCompanyId = currentCompany.id;

        // Mostrar nombre de empresa en la interfaz
        document.getElementById('companyName').textContent = currentCompany.companyname || currentCompany.name;


        // Cargar datos iniciales
        loadInitialData();

    } catch (error) {
        console.error('Error al parsear datos de empresa:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error de sesión',
            text: 'Por favor, inicia sesión nuevamente',
            confirmButtonText: 'Ir al login'
        }).then(() => {
            window.location.href = 'index.html';
        });
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const section = this.dataset.section;
            showSection(section);
        });
    });

    // Cerrar sesión
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);

    // Nueva oferta
    document.getElementById('newJobBtn').addEventListener('click', () => {
        document.getElementById('jobModal').classList.add('active');
    });

    // Buscar candidatos
    document.getElementById('searchBtn').addEventListener('click', searchCandidates);
    document.getElementById('candidateSearch').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') searchCandidates();
    });

    // Filtro de matches
    document.getElementById('statusFilter').addEventListener('change', loadMatches);

    // Modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function () {
            const modalId = this.dataset.modal;
            document.getElementById(modalId).classList.remove('active');
        });
    });

    // Formularios
    document.getElementById('jobForm').addEventListener('submit', handleCreateJob);
    document.getElementById('matchForm').addEventListener('submit', handleCreateMatch);
    document.getElementById('statusForm').addEventListener('submit', handleUpdateStatus);

    // Cerrar modal al hacer clic fuera
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.remove('active');
            }
        });
    });

    // Actualizar perfil de empresa
    document.getElementById('profile-section').addEventListener('click', function (e) {
        if (e.target.classList.contains('save-profile')) {
            handleUpdateProfile();
        }
        if (e.target.classList.contains('edit-profile')) {
            enableProfileEditing();
        }
    });
}

// Cargar datos iniciales
async function loadInitialData() {
    try {
        // Mostrar loading
        showLoading('Cargando datos...');

        // Intentar cargar desde caché primero
        const cached = loadFromCache('initial_data');
        if (cached && cached.companyId === currentCompanyId) {
            allCandidates = cached.candidates;
            allJobs = cached.jobs;
            allMatches = cached.matches;

            // Renderizar datos desde caché
            loadJobs();
            loadCandidates();
            loadMatches();
            loadCompanyProfile();

            hideLoading();
        }

        // Cargar datos desde la API
        const [candidates, jobs, matches] = await Promise.all([
            fetchData('users?role=candidate'),
            fetchData(`jobs?companyId=${currentCompanyId}`),
            fetchData(`matches?companyId=${currentCompanyId}`)
        ]);

        // Filtrar solo candidatos con openToWork = true
        allCandidates = candidates.filter(c => {
            // Verificar si el candidato tiene profile y si openToWork es true
            const hasProfile = c.candidateProfile && typeof c.candidateProfile === 'object';
            return hasProfile && c.candidateProfile.openToWork === true;
        });
        allJobs = jobs;
        allMatches = matches;

        // Si no hay ofertas, sugerir crear una
        if (allJobs.length === 0) {
            setTimeout(() => {
                Swal.fire({
                    title: 'Sin ofertas',
                    text: 'Aún no has creado ofertas de trabajo. ¿Quieres crear una ahora?',
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, crear oferta',
                    cancelButtonText: 'Más tarde'
                }).then((result) => {
                    if (result.isConfirmed) {
                        document.getElementById('newJobBtn').click();
                    }
                });
            }, 1000);
        }

        // Guardar en caché
        saveToCache('initial_data', {
            companyId: currentCompanyId,
            candidates: allCandidates,
            jobs: allJobs,
            matches: allMatches,
            timestamp: Date.now()
        });

        // Renderizar datos iniciales
        loadJobs();
        loadCandidates();
        loadMatches();
        loadCompanyProfile();

        hideLoading();

    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        hideLoading();

        // Usar datos de ejemplo si la API falla
        useSampleData();

        Swal.fire({
            icon: 'warning',
            title: 'Modo sin conexión',
            text: 'Algunos datos pueden no estar disponibles',
            timer: 3000,
            showConfirmButton: false
        });
    }
}

// Usar datos de ejemplo si todo falla
function useSampleData() {
    // Solo mostrar datos básicos si falla la API
    allJobs = [];
    allCandidates = [];
    allMatches = [];

    loadJobs();
    loadCandidates();
    loadMatches();
    loadCompanyProfile();
}

// Mostrar loading
function showLoading(message = 'Cargando...') {
    const loadingEl = document.createElement('div');
    loadingEl.id = 'loadingOverlay';
    loadingEl.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        color: white;
    `;
    loadingEl.innerHTML = `
        <div class="spinner-border" role="status" style="width: 3rem; height: 3rem;">
            <span class="visually-hidden">Cargando...</span>
        </div>
        <div class="mt-3">${message}</div>
    `;
    document.body.appendChild(loadingEl);
}

// Ocultar loading
function hideLoading() {
    const loadingEl = document.getElementById('loadingOverlay');
    if (loadingEl) {
        loadingEl.remove();
    }
}

// Mostrar sección específica
function showSection(sectionId) {
    // Actualizar botones de navegación
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.section === sectionId);
    });

    // Mostrar sección correspondiente
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.toggle('active', section.id === `${sectionId}-section`);
    });

    // Recargar datos si es necesario
    if (sectionId === 'candidates') loadCandidates();
    if (sectionId === 'matches') loadMatches();
    if (sectionId === 'profile') loadCompanyProfile();
}

// Cargar ofertas de trabajo
function loadJobs() {
    const jobsList = document.getElementById('jobsList');

    if (!allJobs || allJobs.length === 0) {
        jobsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-briefcase fa-3x" style="color: #4a6fa5; margin-bottom: 15px;"></i>
                <h3>No hay ofertas creadas</h3>
                <p>Crea tu primera oferta para empezar a buscar candidatos</p>

            </div>
        `;
        return;
    }

    jobsList.innerHTML = allJobs.map(job => `
        <div class="job-card" data-job-id="${job.id}">
            <div class="job-header">
                <div>
                    <h3 class="job-title">${job.title}</h3>
                    <p>${job.description ? job.description.substring(0, 100) + '...' : 'Sin descripción'}</p>
                </div>
                <span class="job-status ${job.status === 'active' ? 'status-active' : 'status-inactive'}">
                    ${job.status === 'active' ? 'Activa' : 'Inactiva'}
                </span>
            </div>
            <div class="job-details">
                <p><strong>Habilidades requeridas:</strong> ${job.skills && job.skills.length > 0 ? job.skills.join(', ') : 'No especificadas'}</p>
            </div>
            <div class="job-actions">
                <button class="btn btn-primary toggle-job" data-job-id="${job.id}" data-status="${job.status}">
                    ${job.status === 'active' ? 'Desactivar' : 'Activar'}
                </button>
                <button class="btn btn-secondary view-candidates" data-job-id="${job.id}">
                    Ver candidatos
                </button>
                <button class="btn btn-danger delete-job" data-job-id="${job.id}">
                    Eliminar
                </button>
            </div>
        </div>
    `).join('');

    // Agregar event listeners a los botones de las ofertas
    document.querySelectorAll('.toggle-job').forEach(btn => {
        btn.addEventListener('click', function () {
            const jobId = this.dataset.jobId;
            const newStatus = this.dataset.status === 'active' ? 'inactive' : 'active';
            toggleJobStatus(jobId, newStatus);
        });
    });

    document.querySelectorAll('.delete-job').forEach(btn => {
        btn.addEventListener('click', function () {
            const jobId = this.dataset.jobId;
            deleteJob(jobId);
        });
    });

    document.querySelectorAll('.view-candidates').forEach(btn => {
        btn.addEventListener('click', function () {
            const jobId = this.dataset.jobId;
            showCandidatesForJob(jobId);
        });
    });
}

// Cargar candidatos disponibles
function loadCandidates() {
    const candidatesGrid = document.getElementById('candidatesGrid');

    if (!allCandidates || allCandidates.length === 0) {
        candidatesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-users fa-3x" style="color: #4a6fa5; margin-bottom: 15px;"></i>
                <h3>No hay candidatos disponibles</h3>
                <p>Los candidatos deben activar "Open to Work" para aparecer aquí</p>
            </div>
        `;
        return;
    }

    // Filtrar candidatos que ya están reservados
    const reservedCandidateIds = allMatches
        .filter(match => match.isReserved === true)
        .map(match => match.candidateId);

    const availableCandidates = allCandidates.filter(candidate =>
        !reservedCandidateIds.includes(candidate.id)
    );

    if (availableCandidates.length === 0) {
        candidatesGrid.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-user-lock fa-3x" style="color: #dc3545; margin-bottom: 15px;"></i>
                <h3>Todos los candidatos están reservados</h3>
                <p>Los candidatos disponibles ya tienen matches activos</p>
            </div>
        `;
        return;
    }

    candidatesGrid.innerHTML = availableCandidates.map(candidate => {
        const profile = candidate.candidateProfile || {};
        return `
            <div class="candidate-card" data-candidate-id="${candidate.id}">
                <div class="candidate-header">
                    <div>
                        <h3 class="candidate-name">${candidate.name || 'Sin nombre'}</h3>
                        <p class="candidate-title">${profile.title || 'Sin título profesional'}</p>
                    </div>
                    <span class="available-badge">Disponible</span>
                </div>
                <div class="candidate-skills">
                    ${profile.skills && profile.skills.length > 0 ?
                profile.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('') :
                '<span class="skill-tag">Sin habilidades</span>'
            }
                </div>
                <div class="candidate-info">
                    <p><i class="fas fa-map-marker-alt"></i> ${profile.city || 'No especificada'}</p>
                    <p><i class="fas fa-briefcase"></i> ${profile.yearsOfExperience || '0'} años de experiencia</p>
                </div>
                <div class="candidate-actions">
                    <button class="btn btn-primary view-profile" data-candidate-id="${candidate.id}">
                        <i class="fas fa-eye"></i> Ver perfil
                    </button>
                    <button class="btn btn-success create-match" data-candidate-id="${candidate.id}">
                        <i class="fas fa-handshake"></i> Crear Match
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Agregar event listeners
    document.querySelectorAll('.view-profile').forEach(btn => {
        btn.addEventListener('click', function () {
            const candidateId = this.dataset.candidateId;
            showCandidateProfile(candidateId);
        });
    });

    document.querySelectorAll('.create-match').forEach(btn => {
        btn.addEventListener('click', function () {
            const candidateId = this.dataset.candidateId;
            openMatchModal(candidateId);
        });
    });
}

// Buscar candidatos por habilidades
function searchCandidates() {
    const searchTerm = document.getElementById('candidateSearch').value.toLowerCase();
    const candidatesGrid = document.getElementById('candidatesGrid');

    if (!searchTerm.trim()) {
        loadCandidates();
        return;
    }

    const filteredCandidates = allCandidates.filter(candidate => {
        const profile = candidate.candidateProfile || {};
        const skills = profile.skills || [];
        const hasSkill = skills.some(skill =>
            skill.toLowerCase().includes(searchTerm)
        );
        const nameMatches = candidate.name.toLowerCase().includes(searchTerm);
        const titleMatches = profile.title?.toLowerCase().includes(searchTerm);

        return hasSkill || nameMatches || titleMatches;
    });

    // Filtrar candidatos reservados
    const reservedCandidateIds = allMatches
        .filter(match => match.isReserved === true)
        .map(match => match.candidateId);

    const availableFiltered = filteredCandidates.filter(candidate =>
        !reservedCandidateIds.includes(candidate.id)
    );

    if (availableFiltered.length === 0) {
        candidatesGrid.innerHTML = '<div class="empty-state">No se encontraron candidatos con esos criterios.</div>';
        return;
    }

    candidatesGrid.innerHTML = availableFiltered.map(candidate => {
        const profile = candidate.candidateProfile || {};
        return `
            <div class="candidate-card" data-candidate-id="${candidate.id}">
                <div class="candidate-header">
                    <div>
                        <h3 class="candidate-name">${candidate.name || 'Sin nombre'}</h3>
                        <p class="candidate-title">${profile.title || 'Sin título profesional'}</p>
                    </div>
                    <span class="available-badge">Disponible</span>
                </div>
                <div class="candidate-skills">
                    ${profile.skills && profile.skills.length > 0 ?
                profile.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('') :
                '<span class="skill-tag">Sin habilidades</span>'
            }
                </div>
                <div class="candidate-actions">
                    <button class="btn btn-primary view-profile" data-candidate-id="${candidate.id}">
                        <i class="fas fa-eye"></i> Ver perfil
                    </button>
                    <button class="btn btn-success create-match" data-candidate-id="${candidate.id}">
                        <i class="fas fa-handshake"></i> Crear Match
                    </button>
                </div>
            </div>
        `;
    }).join('');

    // Re-asignar event listeners
    document.querySelectorAll('.view-profile').forEach(btn => {
        btn.addEventListener('click', function () {
            const candidateId = this.dataset.candidateId;
            showCandidateProfile(candidateId);
        });
    });

    document.querySelectorAll('.create-match').forEach(btn => {
        btn.addEventListener('click', function () {
            const candidateId = this.dataset.candidateId;
            openMatchModal(candidateId);
        });
    });
}

// Cargar matches
function loadMatches() {
    const matchesList = document.getElementById('matchesList');
    const statusFilter = document.getElementById('statusFilter').value;

    let filteredMatches = allMatches;
    if (statusFilter !== 'all') {
        filteredMatches = allMatches.filter(match => match.status === statusFilter);
    }

    if (!filteredMatches || filteredMatches.length === 0) {
        matchesList.innerHTML = '<div class="empty-state">No hay matches en este estado.</div>';
        return;
    }

    matchesList.innerHTML = filteredMatches.map(match => {
        const candidate = allCandidates.find(c => c.id === match.candidateId);
        const job = allJobs.find(j => j.id === match.jobId);
        const candidateName = candidate ? candidate.name : 'Candidato desconocido';
        const jobTitle = job ? job.title : 'Oferta desconocida';
        const statusText = getStatusText(match.status);

        return `
            <div class="match-card" data-match-id="${match.id}">
                <div class="match-info">
                    <h4>${candidateName}</h4>
                    <p><strong>Oferta:</strong> ${jobTitle}</p>
                    <p><strong>Fecha de reserva:</strong> ${match.reservationDate || 'No especificada'}</p>
                    ${match.notes ? `<p><strong>Notas:</strong> ${match.notes}</p>` : ''}
                </div>
                <div class="match-actions">
                    <span class="match-status status-${match.status}">${statusText}</span>
                    <button class="btn btn-primary update-status" data-match-id="${match.id}">
                        <i class="fas fa-sync-alt"></i> Actualizar
                    </button>
                    ${match.isReserved ? `
                        <button class="btn btn-danger release-reservation" data-match-id="${match.id}">
                            <i class="fas fa-unlock"></i> Liberar
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }).join('');

    // Agregar event listeners
    document.querySelectorAll('.update-status').forEach(btn => {
        btn.addEventListener('click', function () {
            const matchId = this.dataset.matchId;
            openStatusModal(matchId);
        });
    });

    document.querySelectorAll('.release-reservation').forEach(btn => {
        btn.addEventListener('click', function () {
            const matchId = this.dataset.matchId;
            releaseReservation(matchId);
        });
    });
}

// Cargar perfil de la empresa
function loadCompanyProfile() {
    const companyProfile = document.getElementById('companyProfile');

    if (!currentCompany) {
        companyProfile.innerHTML = '<div class="empty-state">No se pudo cargar el perfil de la empresa.</div>';
        return;
    }

    companyProfile.innerHTML = `
        <div class="profile-info">
            <div class="profile-field">
                <label for="companyNameInput">Nombre de la empresa:</label>
                <input type="text" id="companyNameInput" value="${currentCompany.companyname || ''}" readonly>
            </div>
            <div class="profile-field">
                <label for="companyEmail">Email:</label>
                <input type="email" id="companyEmail" value="${currentCompany.email || ''}" readonly>
            </div>
            <div class="profile-field">
                <label for="companyDescription">Descripción:</label>
                <textarea id="companyDescription" readonly>${currentCompany.description || ''}</textarea>
            </div>
            <div class="profile-actions">
                <button class="btn btn-primary edit-profile">
                    <i class="fas fa-edit"></i> Editar perfil
                </button>
                <button class="btn btn-success save-profile" style="display: none;">
                    <i class="fas fa-save"></i> Guardar cambios
                </button>
            </div>
        </div>
    `;
}

// Abrir modal para crear match
function openMatchModal(candidateId) {
    const candidate = allCandidates.find(c => c.id === candidateId);
    if (!candidate) return;

    const matchCandidateInfo = document.getElementById('matchCandidateInfo');
    const profile = candidate.candidateProfile || {};

    matchCandidateInfo.innerHTML = `
        <div class="candidate-preview">
            <h4>${candidate.name}</h4>
            <p><strong>Puesto:</strong> ${profile.title || 'No especificado'}</p>
            <p><strong>Experiencia:</strong> ${profile.yearsOfExperience || '0'} años</p>
            <p><strong>Habilidades:</strong> ${profile.skills ? profile.skills.join(', ') : 'No especificadas'}</p>
        </div>
    `;

    // Cargar ofertas activas en el select
    const matchJobSelect = document.getElementById('matchJobSelect');
    const activeJobs = allJobs.filter(job => job.status === 'active');

    if (activeJobs.length === 0) {
        matchJobSelect.innerHTML = '<option value="">No hay ofertas activas</option>';
        Swal.fire('Advertencia', 'Debes tener al menos una oferta activa para crear un match', 'warning');
        return;
    }

    matchJobSelect.innerHTML = activeJobs.map(job =>
        `<option value="${job.id}">${job.title}</option>`
    ).join('');

    // Guardar candidateId en el form
    document.getElementById('matchForm').dataset.candidateId = candidateId;
    document.getElementById('matchModal').classList.add('active');
}

// Abrir modal para actualizar estado
function openStatusModal(matchId) {
    const match = allMatches.find(m => m.id === matchId);
    if (!match) return;

    const candidate = allCandidates.find(c => c.id === match.candidateId);
    const job = allJobs.find(j => j.id === match.jobId);

    const statusCandidateInfo = document.getElementById('statusCandidateInfo');
    statusCandidateInfo.innerHTML = `
        <div class="match-preview">
            <h4>${candidate ? candidate.name : 'Candidato desconocido'}</h4>
            <p><strong>Oferta:</strong> ${job ? job.title : 'Oferta desconocida'}</p>
            <p><strong>Estado actual:</strong> ${getStatusText(match.status)}</p>
        </div>
    `;

    // Configurar select con estado actual seleccionado
    const newStatusSelect = document.getElementById('newStatus');
    newStatusSelect.value = match.status;

    // Guardar matchId
    document.getElementById('statusForm').dataset.matchId = matchId;
    currentMatchId = matchId;
    document.getElementById('statusModal').classList.add('active');
}

// Mostrar perfil completo del candidato
function showCandidateProfile(candidateId) {
    const candidate = allCandidates.find(c => c.id === candidateId);
    if (!candidate) return;

    const profile = candidate.candidateProfile || {};
    const modalBody = document.getElementById('candidateModalBody');

    // Buscar si hay match con este candidato
    const match = allMatches.find(m => m.candidateId === candidateId);

    modalBody.innerHTML = `
        <div class="candidate-full-profile">
            <h3>${candidate.name || 'Sin nombre'}</h3>
            <p class="candidate-title">${profile.title || 'Sin título profesional'}</p>
            
            <div class="profile-section">
                <h4><i class="fas fa-info-circle"></i> Información personal</h4>
                <div class="profile-details">
                    <p><strong>Ciudad:</strong> ${profile.city || 'No especificada'}</p>
                    <p><strong>Experiencia:</strong> ${profile.yearsOfExperience || '0'} años</p>
                    ${profile.birthdate ? `<p><strong>Fecha de nacimiento:</strong> ${profile.birthdate}</p>` : ''}
                </div>
            </div>
            
            <div class="profile-section">
                <h4><i class="fas fa-tools"></i> Habilidades</h4>
                <div class="skills-container">
                    ${profile.skills && profile.skills.length > 0 ?
            profile.skills.map(skill => `<span class="skill-tag large">${skill}</span>`).join('') :
            '<span class="skill-tag">Sin habilidades especificadas</span>'
        }
                </div>
            </div>
            
            <div class="profile-section">
                <h4><i class="fas fa-toggle-on"></i> Estado</h4>
                <p><span class="available-badge">Open to Work: ACTIVADO</span></p>
            </div>
            
            ${match && match.status === 'contactado' && profile.phone ? `
                <div class="profile-section contact-section">
                    <h4><i class="fas fa-phone"></i> Contacto</h4>
                    <p><strong>Teléfono:</strong> ${profile.phone}</p>
                    <a href="https://wa.me/${profile.phone.replace(/\D/g, '')}" 
                       target="_blank" 
                       class="btn btn-success">
                        <i class="fab fa-whatsapp"></i> Contactar por WhatsApp
                    </a>
                </div>
            ` : ''}
            
            ${match ? `
                <div class="profile-section">
                    <h4><i class="fas fa-handshake"></i> Estado del Match</h4>
                    <p><strong>Estado:</strong> ${getStatusText(match.status)}</p>
                    ${match.isReserved ? '<p><strong>⚠️ Candidato actualmente reservado</strong></p>' : ''}
                </div>
            ` : ''}
        </div>
    `;

    document.getElementById('candidateModal').classList.add('active');
}


// Manejar creación de nueva oferta
async function handleCreateJob(e) {
    e.preventDefault();

    const title = document.getElementById('jobTitle').value.trim();
    const description = document.getElementById('jobDescription').value.trim();
    const skillsInput = document.getElementById('jobSkills').value.trim(); // Nuevo campo

    if (!title || !description) {
        Swal.fire('Error', 'Por favor completa todos los campos obligatorios', 'error');
        return;
    }

    try {
        // Versión alternativa que usa respaldo de extracción
        let skills = [];
        if (skillsInput) {
            skills = skillsInput.split(',')
                .map(skill => skill.trim())
                .filter(skill => skill.length > 0);
        } else {
            // Si no se ingresaron habilidades, extraer de la descripción
            skills = extractSkills(description);
        }

        const newJob = {
            id: 'job_' + Date.now(),
            companyId: currentCompanyId,
            companyName: currentCompany.companyname || currentCompany.name,
            title,
            description,
            skills: skills, // Usar las habilidades ingresadas
            status: 'inactive' // Se crea inactiva por defecto
        };

        // Guardar en API
        const savedJob = await fetchData('jobs', 'POST', newJob);

        // Actualizar lista local
        allJobs.push(savedJob);

        // Limpiar formulario
        document.getElementById('jobForm').reset();
        document.getElementById('jobModal').classList.remove('active');

        // Actualizar caché
        updateCache();

        // Recargar ofertas
        loadJobs();

        Swal.fire('Éxito', 'Oferta creada correctamente', 'success');

    } catch (error) {
        console.error('Error creando oferta:', error);
        Swal.fire('Error', 'No se pudo crear la oferta', 'error');
    }
}

// Manejar creación de match
async function handleCreateMatch(e) {
    e.preventDefault();

    const candidateId = e.target.dataset.candidateId;
    const jobId = document.getElementById('matchJobSelect').value;
    const notes = document.getElementById('matchNotes').value.trim();

    if (!jobId) {
        Swal.fire('Error', 'Debes seleccionar una oferta', 'error');
        return;
    }

    try {
        // Verificar si ya existe un match con este candidato
        const existingMatch = allMatches.find(match =>
            match.candidateId === candidateId && match.isReserved === true
        );

        if (existingMatch) {
            Swal.fire('Error', 'Este candidato ya está reservado', 'error');
            return;
        }

        const newMatch = {
            id: 'match_' + Date.now(),
            companyId: currentCompanyId,
            jobId,
            candidateId,
            status: 'pending',
            isReserved: true,
            reservationDate: new Date().toISOString().split('T')[0],
            notes
        };

        // Guardar en API
        const savedMatch = await fetchData('matches', 'POST', newMatch);

        // Actualizar lista local
        allMatches.push(savedMatch);

        // Actualizar caché
        updateCache();

        // Cerrar modal
        document.getElementById('matchModal').classList.remove('active');
        document.getElementById('matchForm').reset();

        // Recargar secciones
        loadCandidates();
        loadMatches();

        Swal.fire('Éxito', 'Match creado y candidato reservado', 'success');

    } catch (error) {
        console.error('Error creando match:', error);
        Swal.fire('Error', 'No se pudo crear el match', 'error');
    }
}

// Manejar actualización de estado
async function handleUpdateStatus(e) {
    e.preventDefault();

    const matchId = e.target.dataset.matchId;
    const newStatus = document.getElementById('newStatus').value;
    const notes = document.getElementById('statusNotes').value.trim();

    try {
        // Encontrar el match
        const matchIndex = allMatches.findIndex(m => m.id === matchId);
        if (matchIndex === -1) {
            Swal.fire('Error', 'Match no encontrado', 'error');
            return;
        }

        const updatedMatch = {
            ...allMatches[matchIndex],
            status: newStatus,
            notes: notes || allMatches[matchIndex].notes
        };

        // Actualizar en el servidor
        await fetchData(`matches/${matchId}`, 'PUT', updatedMatch);

        // Actualizar localmente
        allMatches[matchIndex] = updatedMatch;

        // Actualizar caché
        updateCache();

        // Cerrar modal
        document.getElementById('statusModal').classList.remove('active');
        document.getElementById('statusForm').reset();

        // Recargar matches
        loadMatches();

        // Mostrar mensaje especial si se contactó al candidato
        if (newStatus === 'contactado') {
            Swal.fire({
                title: '¡Candidato contactado!',
                html: `Ahora puedes ver la información de contacto del candidato.<br>
                      Recuerda que solo es visible cuando el estado es "contactado".`,
                icon: 'success'
            });
        } else {
            Swal.fire('Éxito', 'Estado actualizado correctamente', 'success');
        }

    } catch (error) {
        console.error('Error actualizando estado:', error);
        Swal.fire('Error', 'No se pudo actualizar el estado', 'error');
    }
}

// Liberar reserva de candidato
async function releaseReservation(matchId) {
    try {
        Swal.fire({
            title: '¿Liberar reserva?',
            text: 'El candidato quedará disponible para otras empresas',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, liberar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const matchIndex = allMatches.findIndex(m => m.id === matchId);

                if (matchIndex === -1) {
                    Swal.fire('Error', 'Match no encontrado', 'error');
                    return;
                }

                // Cambiar estado a descartado y quitar reserva
                const updatedMatch = {
                    ...allMatches[matchIndex],
                    status: 'descartado',
                    isReserved: false
                };

                await fetchData(`matches/${matchId}`, 'PUT', updatedMatch);

                // Actualizar localmente
                allMatches[matchIndex] = updatedMatch;

                // Actualizar caché
                updateCache();

                // Recargar secciones
                loadCandidates();
                loadMatches();

                Swal.fire('Liberado', 'La reserva ha sido liberada', 'success');
            }
        });

    } catch (error) {
        console.error('Error liberando reserva:', error);
        Swal.fire('Error', 'No se pudo liberar la reserva', 'error');
    }
}

// Cambiar estado de oferta (activar/desactivar)
async function toggleJobStatus(jobId, newStatus) {
    try {
        const jobIndex = allJobs.findIndex(j => j.id === jobId);

        if (jobIndex === -1) {
            Swal.fire('Error', 'Oferta no encontrada', 'error');
            return;
        }

        const updatedJob = {
            ...allJobs[jobIndex],
            status: newStatus
        };

        await fetchData(`jobs/${jobId}`, 'PUT', updatedJob);

        // Actualizar localmente
        allJobs[jobIndex] = updatedJob;

        // Actualizar caché
        updateCache();

        // Recargar ofertas
        loadJobs();

        Swal.fire('Éxito', `Oferta ${newStatus === 'active' ? 'activada' : 'desactivada'}`, 'success');

    } catch (error) {
        console.error('Error cambiando estado de oferta:', error);
        Swal.fire('Error', 'No se pudo cambiar el estado', 'error');
    }
}

// Eliminar oferta
async function deleteJob(jobId) {
    try {
        Swal.fire({
            title: '¿Eliminar oferta?',
            text: 'Esta acción no se puede deshacer',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sí, eliminar',
            cancelButtonText: 'Cancelar'
        }).then(async (result) => {
            if (result.isConfirmed) {
                // Verificar si hay matches asociados
                const matchesWithJob = allMatches.filter(match => match.jobId === jobId);

                if (matchesWithJob.length > 0) {
                    Swal.fire('Error', 'No se puede eliminar una oferta con matches activos', 'error');
                    return;
                }

                await fetchData(`jobs/${jobId}`, 'DELETE');

                // Actualizar localmente
                allJobs = allJobs.filter(job => job.id !== jobId);

                // Actualizar caché
                updateCache();

                // Recargar ofertas
                loadJobs();

                Swal.fire('Eliminada', 'Oferta eliminada correctamente', 'success');
            }
        });

    } catch (error) {
        console.error('Error eliminando oferta:', error);
        Swal.fire('Error', 'No se pudo eliminar la oferta', 'error');
    }
}

// Actualizar perfil de empresa
async function handleUpdateProfile() {
    const companyNameInput = document.getElementById('companyNameInput').value.trim();
    const companyDescription = document.getElementById('companyDescription').value.trim();

    if (!companyNameInput) {
        Swal.fire('Error', 'El nombre de la empresa es requerido', 'error');
        return;
    }

    try {
        const updatedCompany = {
            ...currentCompany,
            companyname: companyNameInput,
            description: companyDescription
        };

        await fetchData(`users/${currentCompanyId}`, 'PUT', updatedCompany);

        // Actualizar localmente
        currentCompany = updatedCompany;
        localStorage.setItem('currentUser', JSON.stringify(currentCompany));
        document.getElementById('companyName').textContent = companyNameInput;

        // Deshabilitar edición
        disableProfileEditing();

        Swal.fire('Éxito', 'Perfil actualizado correctamente', 'success');

    } catch (error) {
        console.error('Error actualizando perfil:', error);
        Swal.fire('Error', 'No se pudo actualizar el perfil', 'error');
    }
}

// Habilitar edición del perfil
function enableProfileEditing() {
    document.getElementById('companyNameInput').readOnly = false;
    document.getElementById('companyDescription').readOnly = false;
    document.querySelector('.edit-profile').style.display = 'none';
    document.querySelector('.save-profile').style.display = 'inline-block';
}

// Deshabilitar edición del perfil
function disableProfileEditing() {
    document.getElementById('companyNameInput').readOnly = true;
    document.getElementById('companyDescription').readOnly = true;
    document.querySelector('.edit-profile').style.display = 'inline-block';
    document.querySelector('.save-profile').style.display = 'none';
}

// Mostrar candidatos para una oferta específica
function showCandidatesForJob(jobId) {
    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    // Mostrar sección de candidatos
    showSection('candidates');

    // Filtrar candidatos por habilidades de la oferta
    const jobSkills = job.skills || [];
    if (jobSkills.length === 0) {
        Swal.fire('Info', 'Esta oferta no tiene habilidades especificadas', 'info');
        return;
    }

    // Buscar candidatos que tengan al menos una habilidad coincidente
    const searchTerm = jobSkills[0]; // Usar la primera habilidad como término de búsqueda
    document.getElementById('candidateSearch').value = searchTerm;
    searchCandidates();
}

// Cerrar sesión
function handleLogout() {
    Swal.fire({
        title: '¿Cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, cerrar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Limpiar localStorage
            localStorage.removeItem('isAuthenticated');
            localStorage.removeItem('userRole');
            localStorage.removeItem('userId');
            localStorage.removeItem('currentUser');

            Swal.fire({
                title: 'Sesión cerrada',
                text: 'Has cerrado sesión correctamente',
                icon: 'success',
                timer: 2000,
                showConfirmButton: false
            }).then(() => {
                window.location.href = 'index.html';
            });
        }
    });
}

// Funciones auxiliares
function getStatusText(status) {
    const statusMap = {
        'pending': 'Pendiente',
        'contactado': 'Contactado',
        'entrevista': 'Entrevista',
        'contratado': 'Contratado',
        'descartado': 'Descartado'
    };
    return statusMap[status] || status;
}

// OPCIONAL: Puedes eliminar esta función o dejarla como respaldo
function extractSkills(text) {
    // Solo se usará si no se ingresaron habilidades manualmente
    const commonSkills = ['JavaScript', 'Python', 'Java', 'React', 'Angular', 'Vue', 'Node.js',
        'TypeScript', 'HTML', 'CSS', 'SQL', 'MongoDB', 'AWS', 'Docker',
        'Git', 'PHP', 'C#', 'Ruby', 'Go', 'Swift', 'Kotlin'];

    return commonSkills.filter(skill =>
        text.toLowerCase().includes(skill.toLowerCase())
    );
}

// Funciones de cache
function saveToCache(key, data) {
    try {
        localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(data));
    } catch (error) {
        console.error('Error guardando en caché:', error);
    }
}

function loadFromCache(key) {
    try {
        const cached = localStorage.getItem(CACHE_PREFIX + key);
        if (!cached) return null;

        const data = JSON.parse(cached);
        // Verificar si la caché es reciente (menos de 5 minutos) y pertenece a la empresa actual
        if (data.timestamp && data.companyId === currentCompanyId && Date.now() - data.timestamp < 5 * 60 * 1000) {
            return data;
        }
        return null;
    } catch (error) {
        console.error('Error cargando caché:', error);
        return null;
    }
}

function updateCache() {
    saveToCache('initial_data', {
        companyId: currentCompanyId,
        candidates: allCandidates,
        jobs: allJobs,
        matches: allMatches,
        timestamp: Date.now()
    });
}

// Función para hacer fetch a la API
async function fetchData(endpoint, method = 'GET', data = null) {
    const url = `${API_URL}/${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }

    try {
        const response = await fetch(url, options);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Para DELETE no hay cuerpo de respuesta
        if (method === 'DELETE') {
            return true;
        }

        return await response.json();
    } catch (error) {
        console.error('Error en fetch:', error);
        throw error;
    }
}

// Verificar si el servidor está activo al cargar
async function checkServerStatus() {
    try {
        await fetchData('users');
        console.log('Servidor conectado');
    } catch (error) {
        console.error('No se pudo conectar al servidor:', error);
        Swal.fire({
            icon: 'warning',
            title: 'Servidor no disponible',
            text: 'Verifica que json-server esté ejecutándose en http://localhost:3000',
            confirmButtonText: 'Entendido'
        });
    }
}

// Llamar a la verificación del servidor al inicio
checkServerStatus();