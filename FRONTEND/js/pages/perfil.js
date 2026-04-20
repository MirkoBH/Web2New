import { initAppShell } from "../app-init.js";
import { getCars } from "../data/mock-data.js";
import { requireAuth } from "../utils/auth.js";
import { carCardTemplate } from "../components/car-card.js";
import { getKey, readJson, writeJson } from "../utils/storage.js";
import { qs } from "../utils/dom.js";

const session = requireAuth(["comprador", "vendedor"]);
if (!session) {
  // redirected
} else {
  initAppShell();

  const mount = qs("#perfil-mount");

  if (session.role === "vendedor") {
    const myCars = getCars().filter((x) => x.vendedorId === session.userId);
    const questions = readJson(getKey("QUESTIONS"), []).filter((q) => q.sellerId === session.userId);

    mount.innerHTML = `
      <section class="glass-panel p-4 mb-4">
        <h1 class="h3 mb-1">Panel vendedor</h1>
        <p class="text-secondary mb-0">Gestiona tus publicaciones y responde consultas publicas.</p>
      </section>

      <section class="mb-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h2 class="h4 mb-0">Mis autos</h2>
          <a class="btn btn-danger btn-sm" href="publicar.html">Publicar nuevo</a>
        </div>
        <div class="perfil-cars-grid">
          ${
            myCars.length === 0
              ? '<p class="text-secondary mb-0">Aun no tienes publicaciones. Crea tu primer auto.</p>'
              : myCars
                  .map(
                    (c) => `
                      <article class="perfil-car-item">
                        ${carCardTemplate(c)}
                        <div class="perfil-actions">
                          <a class="btn btn-outline-light btn-sm" href="editar.html?id=${c.id}">Editar</a>
                          <button class="btn btn-outline-danger btn-sm" data-delete-id="${c.id}">Eliminar</button>
                        </div>
                      </article>
                    `
                  )
                  .join("")
          }
        </div>
      </section>

      <section class="glass-panel p-4 perfil-questions-section">
        <h2 class="h4 mb-3">Consultas pendientes</h2>
        <div id="seller-questions" class="d-grid gap-2"></div>
      </section>
    `;

    mount.querySelectorAll("[data-delete-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const nextCars = getCars().filter((x) => x.id !== btn.dataset.deleteId);
        writeJson(getKey("CARS"), nextCars);
        window.location.reload();
      });
    });

    const qMount = qs("#seller-questions");
    if (questions.length === 0) {
      qMount.innerHTML = '<p class="small text-secondary mb-0">No tienes consultas por responder.</p>';
    } else {
      qMount.innerHTML = questions
        .map(
          (q) => `
            <article class="p-3 rounded perfil-question-item">
              <p class="mb-1"><strong>${q.userName}</strong> pregunto:</p>
              <p class="small">${q.question}</p>
              ${q.answer ? `<p class="small text-secondary mb-0">Respuesta enviada: ${q.answer}</p>` : `<form data-answer-id="${q.id}" class="d-grid gap-2"><textarea class="form-control" minlength="5" required></textarea><button class="btn btn-danger btn-sm" type="submit">Responder</button></form>`}
            </article>
          `
        )
        .join("");

      qMount.querySelectorAll("form[data-answer-id]").forEach((formEl) => {
        formEl.addEventListener("submit", (event) => {
          event.preventDefault();
          const id = formEl.dataset.answerId;
          const text = formEl.querySelector("textarea").value.trim();
          if (text.length < 5) return;
          const allQ = readJson(getKey("QUESTIONS"), []);
          const target = allQ.find((x) => x.id === id);
          if (target) target.answer = text;
          writeJson(getKey("QUESTIONS"), allQ);
          window.location.reload();
        });
      });
    }
  } else {
    const wishlist = readJson(getKey("WISHLIST"), []).filter((x) => x.userId === session.userId);

    mount.innerHTML = `
      <section class="glass-panel p-4 mb-4">
        <h1 class="h3 mb-1">Panel comprador</h1>
        <p class="text-secondary mb-0">Consulta tu lista de deseos y usa el comparador lateral.</p>
      </section>
      <section class="glass-panel p-4">
        <h2 class="h5 mb-2">Resumen</h2>
        <p class="mb-0">Autos guardados: <strong>${wishlist.length}</strong></p>
        <a class="btn btn-outline-light btn-sm mt-3" href="wishlist.html">Ir a lista de deseos</a>
      </section>
    `;
  }
}
