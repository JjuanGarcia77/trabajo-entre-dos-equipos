// Cargar y mostrar ofertas dinámicamente en el index
// Mostrar info breve de la empresa en "Sobre nosotros" al pasar el mouse

document.addEventListener('DOMContentLoaded', () => {
  cargarOfertas();
  agregarHoverSobreNosotros();
});

function cargarOfertas() {
  fetch('./db/db.json')
    .then(res => res.json())
    .then(data => {
      const jobs = data.jobs || [];
      const contenedor = document.querySelector('.ofertas-destacadas');
      if (!contenedor) return;
      contenedor.innerHTML = '';
      jobs.forEach(job => {
        const div = document.createElement('div');
        div.className = 'job-card mb-3 p-3 border rounded d-flex justify-content-between align-items-center';
        div.innerHTML = `
          <div>
            <h5 class="mb-1">${job.title}</h5>
            <p class="mb-0 text-muted">${job.companyName} — ${job.description}</p>
          </div>
          <button class="btn btn-outline-dark btn-postular" data-jobid="${job.id}">Postular</button>
        `;
        contenedor.appendChild(div);
      });
      document.querySelectorAll('.btn-postular').forEach(btn => {
        btn.addEventListener('click', () => {
          window.location.href = 'login.html'; // O a candidate.html si está logueado
        });
      });
    });
}

function agregarHoverSobreNosotros() {
  const sobreNosotros = document.querySelector('a[href="#"]:contains("Sobre nosotros")');
  if (!sobreNosotros) return;
  let infoBox;
  sobreNosotros.addEventListener('mouseenter', () => {
    infoBox = document.createElement('div');
    infoBox.className = 'empresa-info-hover';
    infoBox.innerHTML = `<strong>EmpleaYa</strong><br>Conectamos talento y empresas en Colombia. Más de 10 años ayudando a miles de personas a encontrar su trabajo ideal.`;
    document.body.appendChild(infoBox);
    const rect = sobreNosotros.getBoundingClientRect();
    infoBox.style.position = 'absolute';
    infoBox.style.left = rect.left + 'px';
    infoBox.style.top = (rect.bottom + 5) + 'px';
    infoBox.style.background = '#fff';
    infoBox.style.border = '1px solid #ccc';
    infoBox.style.padding = '10px';
    infoBox.style.borderRadius = '8px';
    infoBox.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
    infoBox.style.zIndex = 9999;
  });
  sobreNosotros.addEventListener('mouseleave', () => {
    if (infoBox) infoBox.remove();
  });
}
