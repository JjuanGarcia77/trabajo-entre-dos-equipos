const API_USERS = "http://localhost:3000/users";

function showRegister() {
    document.getElementById("loginForm").classList.remove("show");
    setTimeout(() => {
        document.getElementById("loginForm").classList.add("d-none");
        document.getElementById("registerForm").classList.remove("d-none");
        setTimeout(() => document.getElementById("registerForm").classList.add("show"), 50);
    }, 250);
}

function showLogin() {
    document.getElementById("registerForm").classList.remove("show");
    setTimeout(() => {
        document.getElementById("registerForm").classList.add("d-none");
        document.getElementById("loginForm").classList.remove("d-none");
        setTimeout(() => document.getElementById("loginForm").classList.add("show"), 50);
    }, 250);
}

document.addEventListener('DOMContentLoaded', () => {
    const roleSelectReg = document.getElementById('roleSelectReg');
    const companyFields = document.getElementById('companyFields');
    const formRegister = document.getElementById('formRegister');
    const formLogin = document.getElementById('formLogin');

    if (roleSelectReg) {
        roleSelectReg.addEventListener('change', function () {
            if (this.value === 'company') {
                companyFields.classList.remove('d-none');
                setTimeout(() => companyFields.classList.add('show-extra'), 10);
            } else {
                companyFields.classList.remove('show-extra');
                setTimeout(() => companyFields.classList.add('d-none'), 350);
            }
        });
    }

    if (formRegister) {
        formRegister.addEventListener('submit', async (e) => {
            e.preventDefault();

            const email = document.getElementById('emailReg').value.trim();
            const password = document.getElementById('passReg').value.trim();
            const name = document.getElementById('userReg').value.trim();
            const role = roleSelectReg.value;

            if (!email || !password || !name || !role) {
                return Swal.fire({ icon: "error", title: "Faltan datos", heightAuto: false });
            }

            try {
                const check = await fetch(`${API_USERS}?email=${email}`);
                const exists = await check.json();
                if (exists.length > 0) {
                    return Swal.fire({ icon: "warning", title: "Email ya registrado", heightAuto: false });
                }

                let newUser = {
                    role,
                    email,
                    password,
                    name
                };

                if (role === 'candidate') {
                    newUser.candidateProfile = { title: "", skills: [], openToWork: true };
                } else {
                    newUser.companyname = document.getElementById('companyName').value.trim();
                    newUser.description = document.getElementById('companyDesc').value.trim();
                }

                await Swal.fire({ icon: "success", title: "Registro exitoso", showConfirmButton: false, timer: 1500, heightAuto: false });

                await fetch(API_USERS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser)
                });

                formRegister.reset();
                showLogin();
            } catch (err) {
                Swal.fire({ icon: "error", title: "Error de servidor", heightAuto: false });
            }
        });
    }

if (formLogin) {
        formLogin.addEventListener('submit', async (e) => {
            e.preventDefault();
            const emailInp = document.getElementById('userLogin').value.trim();
            const passInp = document.getElementById('passLogin').value.trim();
            const roleInp = document.getElementById('roleSelectLogin').value;

            try {
                const res = await fetch(`${API_USERS}?email=${emailInp}&password=${passInp}&role=${roleInp}`);
                const data = await res.json();

                if (data.length > 0) {
                    const user = data[0];
                    
                    // --- AQUÍ ESTABA EL ERROR: FALTABA GUARDAR currentUser ---
                    localStorage.setItem('isAuthenticated', 'true');
                    localStorage.setItem('userRole', user.role);
                    localStorage.setItem('userId', user.id);
                    localStorage.setItem('currentUser', JSON.stringify(user)); // <--- ESTA LÍNEA ES LA CLAVE
                    // ---------------------------------------------------------

                    Swal.fire({ icon: "success", title: `Bienvenido ${user.name}`, showConfirmButton: false, timer: 1500, heightAuto: false })
                    .then(() => {
                        window.location.replace(user.role === 'company' ? "company.html" : "candidate.html");
                    });
                } else {
                    Swal.fire({ icon: "error", title: "Credenciales inválidas", text: "Verifique email, clave y perfil", heightAuto: false });
                }
            } catch (err) {
                Swal.fire({ icon: "error", title: "Error de conexión", heightAuto: false });
            }
        });
    }
});