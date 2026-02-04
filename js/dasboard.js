// Apuntamos a nuestro server local
const API_URL = "http://localhost:3000";
let currentUser = JSON.parse(localStorage.getItem("currentUser"));

// Al arrancar, chequeamos que no se nos cuele nadie que no sea admin
document.addEventListener("DOMContentLoaded", () => {
    if (!currentUser || currentUser.role !== 'admin') {
        window.location.href = 'login.html';
        return;
    }
    // Si todo ok, cargamos la primera vista
    loadAllUsers();
});

// Para movernos entre las pestañas del sidebar sin recargar la página
function showSection(sectionId) {
    // Escondemos todo primero
    document.querySelectorAll('.dashboard-section').forEach(el => el.classList.add('d-none'));
    // Mostramos solo la que clickearon
    document.getElementById(`section-${sectionId}`).classList.remove('d-none');
    
    // El efecto de "botón seleccionado" en el menú
    document.querySelectorAll('.list-group-item').forEach(el => el.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // Dependiendo de qué clickeó, disparamos la carga de datos
    if(sectionId === 'users') loadAllUsers();
    if(sectionId === 'all-jobs') loadAllJobs();
    if(sectionId === 'all-matches') loadAllMatchesMonitor();
}

// Trae a todos los registrados (Candidatos y Empresas)
async function loadAllUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = 'Cargando lista...';
    
    try {
        const res = await fetch(`${API_URL}/users`);
        const users = await res.json();
        
        tbody.innerHTML = '';
        users.forEach(u => {
            const esCandidato = u.role === 'candidate';
            // Pintamos la fila. Si es candidato, miramos si está buscando camello
            tbody.innerHTML += `
                <tr>
                    <td><small class="text-muted">${u.id}</small></td>
                    <td><span class="fw-bold">${u.name || u.companyname}</span></td>
                    <td>${u.email}</td>
                    <td><span class="badge ${esCandidato ? 'bg-info' : 'bg-primary'}">${u.role}</span></td>
                    <td>
                        ${esCandidato 
                            ? (u.candidateProfile?.openToWork ? '🟢 Disponible' : '⚪ En pausa')
                            : '🏢 Empresa'}
                    </td>
                </tr>
            `;
        });
    } catch (err) {
        tbody.innerHTML = 'Error al conectar con el servidor.';
    }
}

// Aquí vemos qué ofertas han subido las empresas
async function loadAllJobs() {
    const tbody = document.getElementById('allJobsTableBody');
    tbody.innerHTML = 'Buscando vacantes...';
    
    const res = await fetch(`${API_URL}/jobs`);
    const jobs = await res.json();
    
    tbody.innerHTML = '';
    jobs.forEach(j => {
        tbody.innerHTML += `
            <tr>
                <td><b style="color: #6F4E37;">${j.companyName || 'Empresa X'}</b></td>
                <td>${j.title}</td>
                <td>${j.skills ? j.skills.join(', ') : 'No pide skills'}</td>
                <td><span class="badge bg-success">Activa</span></td>
            </tr>
        `;
    });
}

// Este es el monitor "pro": cruza los IDs de matches con nombres reales
async function loadAllMatchesMonitor() {
    const grid = document.getElementById('matchesMonitorGrid');
    grid.innerHTML = 'Sincronizando...';

    // Tiramos 3 peticiones al tiempo para no perder tiempo
    const [matches, users, jobs] = await Promise.all([
        fetch(`${API_URL}/matches`).then(r => r.json()),
        fetch(`${API_URL}/users`).then(r => r.json()),
        fetch(`${API_URL}/jobs`).then(r => r.json())
    ]);

    grid.innerHTML = '';
    
    if(matches.length === 0) {
        grid.innerHTML = '<p class="p-3">Nada por aquí... aún no hay matches.</p>';
        return;
    }

    // Buscamos los nombres correspondientes a cada ID del match
    matches.forEach(m => {
        const candidate = users.find(u => u.id === m.candidateId);
        const company = users.find(u => u.id === m.companyId);
        const job = jobs.find(j => j.id === m.jobId);

        grid.innerHTML += `
            <div class="col-md-4">
                <div class="card border-0 shadow-sm p-3">
                    <div class="d-flex justify-content-between mb-2">
                        <small class="text-muted">ID Match: ${m.id}</small>
                        <span class="badge bg-warning text-dark text-capitalize">${m.status}</span>
                    </div>
                    <div class="small">
                        <p class="mb-1">🏢 <b>Empresa:</b> ${company?.name || company?.companyname}</p>
                        <p class="mb-1">👤 <b>Candidato:</b> ${candidate?.name}</p>
                        <p class="mb-0 text-muted">💼 ${job?.title || 'Oferta ya no existe'}</p>
                    </div>
                </div>
            </div>
        `;
    });
}

// Limpiamos todo al salir
function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}