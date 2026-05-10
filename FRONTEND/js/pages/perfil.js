import { initAppShell } from "../app-init.js";
import { carsApi, consultasApi } from "../utils/api.js";
import { requireAuth } from "../utils/auth.js";
import { carCardTemplate, toggleCompare, toggleWishlist } from "../components/car-card.js";
import { getKey, readJson, writeJson } from "../utils/storage.js";
import { qs } from "../utils/dom.js";

const sesion = requireAuth(["comprador", "vendedor"]);
if (!sesion) {
  // redirigido
} else {
  initAppShell();

  const mount = qs("#perfil-mount");

  function mapearAuto(auto) {
    return {
      ...auto,
      imagenes: (auto.imagenes || []).sort((a,b) => a.orden - b.orden).map((img) =>
        typeof img === "string" ? img : img.urlPublica),
      ia: auto.iaEstado ? { estado: auto.iaEstado, score: auto.iaPuntaje } : null,
    };
  }

  // ── PANEL VENDEDOR ────────────────────────────────────────────
  if (sesion.role === "vendedor") {
    mount.innerHTML = `
      <section class="glass-panel p-4 mb-4">
        <h1 class="h3 mb-1">Panel vendedor</h1>
        <p class="text-secondary mb-0">Gestioná tus publicaciones y respondé consultas.</p>
      </section>
      <section class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="h4 mb-0">Mis autos</h2>
          <a class="btn btn-danger btn-sm" href="publicar.html">Publicar nuevo</a>
        </div>
        <div id="mis-autos-grid" class="perfil-cars-grid">
          <p class="text-secondary small">Cargando...</p>
        </div>
      </section>
      <section class="glass-panel p-4">
        <h2 class="h4 mb-3">Consultas recibidas</h2>
        <div id="consultas-vendedor" class="d-grid gap-2">
          <p class="text-secondary small">Cargando...</p>
        </div>
      </section>`;

    // Cargar autos del vendedor
    carsApi.misAutos().then((autos) => {
      const grid = qs("#mis-autos-grid");
      if (!autos.length) {
        grid.innerHTML = `<p class="text-secondary mb-0">Aún no tenés publicaciones. <a href="publicar.html" class="text-danger">Publicá tu primer auto.</a></p>`;
        return;
      }
      grid.innerHTML = autos.map((a) => {
        const auto = mapearAuto(a);
        return `
          <article class="perfil-car-item">
            ${carCardTemplate(auto)}
            <div class="perfil-actions">
              <a class="btn btn-outline-light btn-sm" href="editar.html?id=${a.id}">Editar</a>
              <button class="btn btn-outline-danger btn-sm" data-delete-id="${a.id}">Eliminar</button>
            </div>
          </article>`;
      }).join("");

      // Eliminar auto
      grid.querySelectorAll("[data-delete-id]").forEach((btn) => {
        btn.addEventListener("click", async () => {
          if (!confirm("¿Eliminás esta publicación? Esta acción no se puede deshacer.")) return;
          try {
            await carsApi.eliminar(btn.dataset.deleteId);
            window.location.reload();
          } catch (err) { alert(err.message); }
        });
      });
    }).catch(() => {
      qs("#mis-autos-grid").innerHTML = `<p class="text-secondary">Error cargando tus autos.</p>`;
    });

    // Cargar consultas del vendedor
    consultasApi.misConsultas().then((consultas) => {
      const zona = qs("#consultas-vendedor");
      if (!consultas.length) {
        zona.innerHTML = `<p class="small text-secondary mb-0">No tenés consultas por responder.</p>`;
        return;
      }
      zona.innerHTML = consultas.map((c) => `
        <article class="p-3 rounded perfil-question-item" style="background:rgba(255,255,255,.035)">
          <p class="small mb-0 text-secondary">Auto: <strong>${c.auto?.marca} ${c.auto?.modelo}</strong></p>
          <p class="mb-1 small mt-1"><strong>${c.comprador?.nombre || "Comprador"}</strong> pregunta:</p>
          <p class="small mb-2 text-secondary">${c.pregunta}</p>
          ${c.respuesta
            ? `<p class="small text-secondary mb-0">✓ Respuesta enviada: ${c.respuesta}</p>`
            : `<form data-consulta-id="${c.id}" class="d-grid gap-2">
                <textarea class="form-control" minlength="5" placeholder="Escribí tu respuesta..." required></textarea>
                <button class="btn btn-danger btn-sm" type="submit">Responder</button>
               </form>`}
        </article>`).join("");

      zona.querySelectorAll("form[data-consulta-id]").forEach((formEl) => {
        formEl.addEventListener("submit", async (e) => {
          e.preventDefault();
          const respuesta = formEl.querySelector("textarea").value.trim();
          if (respuesta.length < 5) return;
          const btn = formEl.querySelector("button");
          btn.disabled = true;
          try {
            await consultasApi.responder(formEl.dataset.consultaId, respuesta);
            window.location.reload();
          } catch (err) { alert(err.message); btn.disabled = false; }
        });
      });
    }).catch(() => {
      qs("#consultas-vendedor").innerHTML = `<p class="text-secondary">Error cargando consultas.</p>`;
    });

  // ── PANEL COMPRADOR ───────────────────────────────────────────
  } else {
    const wishlistIds = new Set(readJson(getKey("WISHLIST"), []).filter((x) => x.userId === sesion.userId).map((x) => x.carId));

    mount.innerHTML = `
      <section class="glass-panel p-4 mb-4">
        <h1 class="h3 mb-1">Panel comprador</h1>
        <p class="text-secondary mb-0">Tus autos favoritos y consultas enviadas.</p>
      </section>
      <section>
        <h2 class="h4 mb-3">Mis favoritos</h2>
        <div id="favoritos-grid" class="cars-grid">
          ${wishlistIds.size === 0
            ? `<p class="text-secondary">Aún no tenés autos guardados. <a href="listado.html" class="text-danger">Explorá el listado.</a></p>`
            : `<p class="text-secondary small">Cargando...</p>`}
        </div>
      </section>`;

    if (wishlistIds.size > 0) {
      // Cargar los autos guardados en favoritos
      Promise.all([...wishlistIds].map((id) => carsApi.obtener(id).catch(() => null)))
        .then((autos) => {
          const validos = autos.filter(Boolean).map(mapearAuto);
          const grid = qs("#favoritos-grid");
          if (!validos.length) {
            grid.innerHTML = `<p class="text-secondary">No se encontraron los autos guardados.</p>`;
            return;
          }
          grid.innerHTML = validos.map((a) => carCardTemplate(a)).join("");

          grid.querySelectorAll(".btn-favorito").forEach((btn) => {
            btn.addEventListener("click", () => { toggleWishlist(btn.dataset.id); window.location.reload(); });
          });
          grid.querySelectorAll(".btn-compare").forEach((btn) => {
            btn.addEventListener("click", () => { toggleCompare(btn.dataset.id); window.location.reload(); });
          });
        });
    }
  }
}
