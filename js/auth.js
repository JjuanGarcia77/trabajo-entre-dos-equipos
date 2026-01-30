(function () {
    const auth = localStorage.getItem('isAuthenticated');
    const role = localStorage.getItem('userRole');
    const path = window.location.pathname;

    const isPublic = path.includes('index.html') || path.includes('login.html') || path === '/';

    if (!auth && !isPublic) {
        window.location.href = 'login.html';
        return;
    }

    if (auth && isPublic) {
        window.location.href = (role === 'company') ? 'company.html' : 'candidate.html';
        return;
    }

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
    localStorage.clear(); 
    window.location.href = 'login.html';
}

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}