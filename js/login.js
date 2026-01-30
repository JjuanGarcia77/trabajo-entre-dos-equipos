const API_USERS = "http://localhost:3000/users";

function showRegister() {
    const login = document.getElementById("loginForm");
    const register = document.getElementById("registerForm");
    login.classList.remove("show");
    setTimeout(() => {
        login.classList.add("d-none");
        register.classList.remove("d-none");
        setTimeout(() => register.classList.add("show"), 50);
    }, 250);
}

function showLogin() {
    const login = document.getElementById("loginForm");
    const register = document.getElementById("registerForm");
    register.classList.remove("show");
    setTimeout(() => {
        register.classList.add("d-none");
        login.classList.remove("d-none");
        setTimeout(() => login.classList.add("show"), 50);
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

            const user = document.getElementById('userReg').value.trim();
            const email = document.getElementById('emailReg').value.trim();
            const pass = document.getElementById('passReg').value.trim();
            const role = roleSelectReg.value;

            if (!user || !email || !pass || !role) {
                return Swal.fire({ icon: "error", title: "Campos incompletos", text: "Por favor llena todos los campos.", heightAuto: false });
            }

            let companyData = {};
            if (role === 'company') {
                const cName = document.getElementById('companyName').value.trim();
                const cDesc = document.getElementById('companyDesc').value.trim();
                if (!cName || !cDesc) {
                    return Swal.fire({ icon: "error", title: "Datos de empresa vacíos", heightAuto: false });
                }
                companyData = { companyName: cName, companyDesc: cDesc };
            }

            try {
                const check = await fetch(`${API_USERS}?email=${email}`);
                const dataCheck = await check.json();
                if (dataCheck.length > 0) {
                    return Swal.fire({ icon: "warning", title: "Email duplicado", text: "Este correo ya existe.", heightAuto: false });
                }

                const newUser = { username: user, email, password: pass, role, ...companyData };
                await fetch(API_USERS, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newUser)
                });

                Swal.fire({ icon: "success", title: "Registro exitoso", showConfirmButton: false, timer: 1200, heightAuto: false });
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
            const userVal = document.getElementById('userLogin').value.trim();
            const passVal = document.getElementById('passLogin').value.trim();
            const roleVal = document.getElementById('roleSelectLogin').value;

            try {
                const res = await fetch(`${API_USERS}?username=${userVal}&password=${passVal}&role=${roleVal}`);
                const data = await res.json();

                if (data.length > 0) {
                    const userFound = data[0];

                    localStorage.setItem('isAuthenticated', 'true');
                    localStorage.setItem('userRole', userFound.role);
                    localStorage.setItem('userName', userFound.username);

                    Swal.fire({
                        icon: "success",
                        title: "Bienvenido"+ ` ${userVal}`,
                        text: `Bienvenido ${userFound.username}`,
                        showConfirmButton: false,
                        timer: 1500,
                        heightAuto: false
                    }).then(() => {
                        if (userFound.role === 'company') {
                            window.location.replace("company.html");
                        } else if (userFound.role === 'user') {
                            window.location.replace("candidate.html");
                        } else {
                            window.location.replace("dashboard.html");
                        }
                    });
                } else {
                    Swal.fire({
                        icon: "error",
                        title: "Error de acceso",
                        text: "Usuario, contraseña o rol incorrectos.",
                        heightAuto: false
                    });
                }
            } catch (error) {
                Swal.fire({ icon: "error", title: "Error de conexión", heightAuto: false });
            }
        });
    }
});