(function () {
    const auth = localStorage.getItem('isAuthenticated');
    const role = localStorage.getItem('userRole');
    const path = window.location.pathname;

    const publicPages = ['index.html', 'login.html'];

    if (!auth && !publicPages.some(p => path.includes(p))) {
        return window.location.href = 'login.html';
    }

    if (auth && publicPages.some(p => path.includes(p))) {
        if (role === 'admin') return window.location.href = 'dashboard.html';
        if (role === 'company') return window.location.href = 'company.html';
        return window.location.href = 'candidate.html';
    }

    if (role === 'admin' && !path.includes('dashboard.html')) {
        return window.location.href = 'dashboard.html';
    }

    if (role === 'company' && !path.includes('company.html')) {
        return window.location.href = 'company.html';
    }

    if (role === 'candidate' && !path.includes('candidate.html')) {
        return window.location.href = 'candidate.html';
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