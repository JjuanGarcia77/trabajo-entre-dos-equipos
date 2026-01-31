// --- DATOS DE PRUEBA ---
const INITIAL_CANDIDATES = [
    { id: 1, name: "Aral", role: "Frontend Developer", openToWork: true, isReserved: false },
    { id: 2, name: "Luis Perez", role: "Backend Developer", openToWork: true, isReserved: true },
    { id: 3, name: "Mateo Dev", role: "Fullstack", openToWork: true, isReserved: false },
    { id: 4, name: "Kevin Smith", role: "DevOps", openToWork: false, isReserved: false }
];

const INITIAL_COMPANIES = [
    { id: 101, name: "Riwi Tech", industry: "Educación", offers: 5 },
    { id: 102, name: "Crudzaso Corp", industry: "Software", offers: 2 }
];

// --- FUNCIONES DE BASE DE DATOS ---
function initDB() {
    if (!localStorage.getItem('candidates')) {
        localStorage.setItem('candidates', JSON.stringify(INITIAL_CANDIDATES));
    }
    if (!localStorage.getItem('companies')) {
        localStorage.setItem('companies', JSON.stringify(INITIAL_COMPANIES));
    }
}

function renderView(type) {
    const container = document.getElementById('cards-container');
    const title = document.getElementById('view-title');
    
    // Obtener datos actualizados de LocalStorage
    const data = JSON.parse(localStorage.getItem(type));

    if (!container) return;

    container.innerHTML = ''; 
    title.innerText = type === 'candidates' ? "Talento Disponible" : "Empresas en la Red";

    // Manejar clases de botones
    document.getElementById('btn-candidates').classList.toggle('active', type === 'candidates');
    document.getElementById('btn-companies').classList.toggle('active', type === 'companies');

    data.forEach(item => {
        if (type === 'candidates') {
            if (item.openToWork) {
                container.innerHTML += `
                    <div class="card card-candidate ${item.isReserved ? 'reserved' : ''}">
                        <div style="display:flex; justify-content:space-between; align-items:flex-start;">
                            <h3>${item.name}</h3>
                            <span class="badge ${item.isReserved ? 'badge-reserved' : 'badge-open'}">
                                ${item.isReserved ? 'Reservado' : 'Disponible'}
                            </span>
                        </div>
                        <p>${item.role}</p>
                        ${item.isReserved 
                            ? `<button class="btn-disabled" disabled>En proceso...</button>` 
                            : `<button onclick="reserve(${item.id})" class="btn-primary">Reservar Match</button>`
                        }
                    </div>
                `;
            }
        } else {
            container.innerHTML += `
                <div class="card card-company">
                    <h3>${item.name}</h3>
                    <p style="color:var(--primary); font-weight:bold; margin:0;">${item.industry}</p>
                    <p style="font-size:0.9rem; color:#64748b;">${item.offers} vacantes activas</p>
                    <button class="btn-nav" style="width:100%; margin-top:10px;">Ver Perfil</button>
                </div>
            `;
        }
    });
}

function reserve(id) {
    let candidates = JSON.parse(localStorage.getItem('candidates'));
    const idx = candidates.findIndex(c => c.id === id);
    
    if (idx !== -1) {
        candidates[idx].isReserved = true;
        localStorage.setItem('candidates', JSON.stringify(candidates));
        renderView('candidates'); // Recargar la vista
        alert("Candidato reservado exitosamente para tu empresa.");
    }
}

// Iniciar cuando el HTML esté listo
window.onload = () => {
    initDB();
    renderView('candidates');
};