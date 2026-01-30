(function () {
    const auth = localStorage.getItem('isAuthenticated');
    const role = localStorage.getItem('userRole');
    const path = window.location.pathname;

    const isPublicPage = path.includes('index.html') || path.includes('login.html') || path === '/' || path.includes('login.html');

    if (!auth && !isPublicPage) {
        window.location.href = 'login.html';
        return;
    }

    if (auth && isPublicPage) {
        if (role === 'company') window.location.href = 'company.html';
        else window.location.href = 'candidate.html';
        return;
    }

    if (auth) {
        if (path.includes('company.html') && role !== 'company') {
            window.location.href = 'candidate.html';
        }
        if (path.includes('candidate.html') && role !== 'user') {
            window.location.href = 'company.html';
        }
    }
})();

function logout() {
    localStorage.clear();
    window.location.href = 'login.html';
}

function goBack() {
    window.location.href = 'login.html';
}