import { readSession, logout } from "../utils/storage.js";

function roleLabel(role) {
  return role === "vendedor" ? "Vendedor" : "Comprador";
}

export function renderNavbar(containerSelector = "#app-navbar") {
  const mount = document.querySelector(containerSelector);
  if (!mount) return;

  const session = readSession();

  mount.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark nav-glass sticky-top">
      <div class="container-fluid px-4">
        <a class="navbar-brand fw-bold" href="index.html">AutoPulse</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navMain" aria-controls="navMain" aria-expanded="false" aria-label="Toggle navigation">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMain">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link" href="listado.html">Autos</a></li>
            <li class="nav-item"><a class="nav-link" href="publicar.html">Publicar</a></li>
            <li class="nav-item"><a class="nav-link" href="perfil.html">Panel</a></li>
            <li class="nav-item"><a class="nav-link" href="wishlist.html">Lista de deseos</a></li>
          </ul>
          <div class="d-flex align-items-center gap-2" id="nav-auth-zone">
            ${
              session
                ? `<span class="badge text-bg-danger">${roleLabel(session.role)}</span>
                   <a class="btn btn-outline-light btn-sm" href="perfil.html">${session.nombre}</a>
                   <button id="logout-btn" class="btn btn-danger btn-sm">Salir</button>`
                : `<a class="btn btn-outline-light btn-sm" href="login.html">Ingresar</a>
                   <a class="btn btn-danger btn-sm" href="registro.html">Crear cuenta</a>`
            }
          </div>
        </div>
      </div>
    </nav>
  `;

  const logoutBtn = document.querySelector("#logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      logout();
      window.location.href = "index.html";
    });
  }
}
