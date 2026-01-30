(function () {
    const auth = localStorage.getItem('isAuthenticated');
    const role = localStorage.getItem('userRole');
    const path = window.location.pathname;

    const isPublic = path.includes('index.html') || path.includes('login.html') || path === '/';

    // 1. No logueado -> Login
    if (!auth && !isPublic) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Logueado -> No puede ver Login ni Index
    if (auth && isPublic) {
        window.location.href = (role === 'company') ? 'company.html' : 'candidate.html';
        return;
    }

    // 3. Protección de roles cruzados
    if (auth) {
        if (path.includes('company.html') && role !== 'company') {
            window.location.href = 'candidate.html';
        }
        if (path.includes('candidate.html') && role !== 'candidate') {
            window.location.href = 'company.html';
        }
    }
})();

function goBack() {
    // Es vital limpiar para que el auth.js no te redireccione 
    // de nuevo adentro al detectar una sesión vieja.
    localStorage.clear(); 
    window.location.href = 'login.html';
}

function logout() {
    localStorage.clear(); // Esto es vital para que el login no te rebote
    window.location.href = 'login.html';
}