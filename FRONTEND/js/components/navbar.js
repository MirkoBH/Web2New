import { readSession, logout, getModo, setModo } from "../utils/storage.js";

export function renderNavbar(containerSelector = "#app-navbar") {
  const mount = document.querySelector(containerSelector);
  if (!mount) return;

  const session = readSession();
  const modo    = getModo(); // "comprador" | "vendedor"
  const esVendedor = modo === "vendedor";

  mount.innerHTML = `
    <nav class="navbar navbar-expand-lg navbar-dark nav-glass sticky-top">
      <div class="container-fluid px-4">
        <a class="navbar-brand fw-bold" href="index.html">AutoPulse</a>
        <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
          data-bs-target="#navMain" aria-controls="navMain" aria-expanded="false">
          <span class="navbar-toggler-icon"></span>
        </button>
        <div class="collapse navbar-collapse" id="navMain">
          <ul class="navbar-nav me-auto mb-2 mb-lg-0">
            <li class="nav-item"><a class="nav-link" href="listado.html">Autos</a></li>
            ${session && esVendedor
              ? `<li class="nav-item"><a class="nav-link" href="publicar.html">Publicar</a></li>`
              : ""}
            ${session
              ? `<li class="nav-item"><a class="nav-link" href="perfil.html">Panel</a></li>`
              : ""}
            ${session && !esVendedor
              ? `<li class="nav-item"><a class="nav-link" href="wishlist.html">Favoritos</a></li>`
              : ""}
          </ul>
          <div class="d-flex align-items-center gap-2" id="nav-auth-zone">
            ${session
              ? `
                <button id="btn-cambiar-modo" class="btn btn-sm ${esVendedor ? "btn-danger" : "btn-outline-light"}"
                  title="Cambiar a modo ${esVendedor ? "comprador" : "vendedor"}">
                  ${esVendedor ? "🔧 Vendedor" : "🛒 Comprador"}
                </button>
                <a class="btn btn-outline-light btn-sm" href="perfil.html">${session.nombre}</a>
                <button id="logout-btn" class="btn btn-outline-danger btn-sm">Salir</button>`
              : `
                <a class="btn btn-outline-light btn-sm" href="login.html">Ingresar</a>
                <a class="btn btn-danger btn-sm" href="registro.html">Crear cuenta</a>`
            }
          </div>
        </div>
      </div>
    </nav>`;

  // ── Cambiar modo ──────────────────────────────────────────
  document.querySelector("#btn-cambiar-modo")?.addEventListener("click", () => {
    const nuevoModo = getModo() === "vendedor" ? "comprador" : "vendedor";
    setModo(nuevoModo);
    // Redirigir al panel si se cambia de modo
    window.location.href = "perfil.html";
  });

  // ── Logout ────────────────────────────────────────────────
  document.querySelector("#logout-btn")?.addEventListener("click", () => {
    logout();
    window.location.href = "index.html";
  });
}
