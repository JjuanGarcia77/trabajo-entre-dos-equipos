(function () {
    const auth = localStorage.getItem('isAuthenticated');
    const role = localStorage.getItem('userRole');
    const path = window.location.pathname;

    const publicPages = ['index.html', 'login.html'];
    const isPublic = publicPages.some(page => path.includes(page)) || path === '/';

    if (!auth && !isPublic) {
        window.location.href = 'login.html';
        return;
    }

    if (auth && isPublic) {
        window.location.href = role === 'company'
            ? 'company.html'
            : 'candidate.html';
        return;
    }

    if (auth) {
        if (role === 'candidate') {
            if (!path.includes('candidate.html')) {
                window.location.href = 'candidate.html';
            }
        }

        if (role === 'company') {
            if (path.includes('candidate.html')) {
                window.location.href = 'company.html';
            }
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