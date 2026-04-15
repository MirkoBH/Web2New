import { initAppShell } from "../app-init.js";
import { getCars, getUsers } from "../data/mock-data.js";
import { formatKm, formatUsd, qs } from "../utils/dom.js";
import { getKey, readJson, readSession, writeJson } from "../utils/storage.js";

initAppShell();

const mount = qs("#detalle-mount");
const session = readSession();
const params = new URLSearchParams(window.location.search);
const id = params.get("id");
const car = getCars().find((x) => x.id === id);

if (!car) {
  mount.innerHTML = '<div class="alert alert-danger">No se encontro la publicacion.</div>';
} else {
  const seller = getUsers().find((u) => u.id === car.vendedorId);

  mount.innerHTML = `
    <div class="row g-4">
      <div class="col-lg-7">
        <section class="glass-panel p-3">
          <img src="${car.imagenes[0]}" alt="${car.marca} ${car.modelo}" class="w-100 rounded mb-3" style="max-height:400px;object-fit:cover;" />
          <div class="row g-2">
            ${car.imagenes.map((img) => `<div class="col-4"><img src="${img}" class="w-100 rounded" style="height:100px;object-fit:cover;" /></div>`).join("")}
          </div>
        </section>
      </div>
      <div class="col-lg-5">
        <section class="glass-panel p-4 mb-3">
          <h1 class="h3">${car.marca} ${car.modelo}</h1>
          <p class="h4 text-danger">${formatUsd(car.precio)}</p>
          <ul class="list-unstyled text-secondary small">
            <li>Anio: ${car.anio}</li>
            <li>Kilometraje: ${formatKm(car.kilometraje)}</li>
            <li>Combustible: ${car.combustible}</li>
            <li>Transmision: ${car.transmision}</li>
            <li>Ubicacion: ${car.ubicacion}</li>
            <li>Vendedor: ${seller?.nombre || "N/A"}</li>
          </ul>
          <p class="small">${car.descripcion}</p>
          <p class="small text-secondary mb-0"><strong>Danios informados:</strong> ${car.detallesDanios}</p>
        </section>
        <section class="glass-panel p-4">
          <h2 class="h5">Informe IA</h2>
          <p class="mb-1">Estado: <span class="badge text-bg-danger">${car.ia.estado}</span> · Score: ${car.ia.score}/10</p>
          <p class="small text-secondary">${car.ia.resumen}</p>
          <p class="small mb-1">Danios detectados: ${car.ia.danios}</p>
          <p class="small mb-0">Rango sugerido: ${formatUsd(car.ia.rangoPrecioMin)} - ${formatUsd(car.ia.rangoPrecioMax)}</p>
        </section>
      </div>
    </div>

    <section class="glass-panel p-4 mt-4">
      <h2 class="h5 mb-3">Consultas publicas</h2>
      <div id="questions-list" class="d-grid gap-2 mb-3"></div>
      <form id="question-form" class="d-grid gap-2 ${session?.role === "comprador" ? "" : "d-none"}">
        <textarea class="form-control" id="question-text" rows="3" minlength="8" placeholder="Escribe tu consulta al vendedor"></textarea>
        <button class="btn btn-danger" type="submit">Enviar consulta</button>
      </form>
      <p class="small text-secondary ${session ? "d-none" : ""}">Debes iniciar sesion para enviar consultas.</p>
    </section>
  `;

  const listEl = qs("#questions-list");

  function renderQuestions() {
    const questions = readJson(getKey("QUESTIONS"), []).filter((q) => q.carId === car.id);
    if (questions.length === 0) {
      listEl.innerHTML = '<p class="small text-secondary mb-0">Aun no hay consultas para esta publicacion.</p>';
      return;
    }

    listEl.innerHTML = questions
      .map(
        (q) => `
          <article class="p-3 rounded" style="background: rgba(255,255,255,0.04)">
            <p class="mb-1"><strong>${q.userName}</strong> pregunta:</p>
            <p class="small mb-2">${q.question}</p>
            ${q.answer ? `<p class="mb-1"><strong>Vendedor responde:</strong></p><p class="small text-secondary mb-0">${q.answer}</p>` : '<p class="small text-secondary mb-0">Pendiente de respuesta.</p>'}
          </article>
        `
      )
      .join("");
  }

  renderQuestions();
  setInterval(renderQuestions, 6000);

  const questionForm = qs("#question-form");
  if (questionForm) {
    questionForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const text = qs("#question-text").value.trim();
      if (text.length < 8) return;

      const questions = readJson(getKey("QUESTIONS"), []);
      questions.push({
        id: crypto.randomUUID(),
        carId: car.id,
        sellerId: car.vendedorId,
        userId: session.userId,
        userName: session.nombre,
        question: text,
        answer: "",
        createdAt: new Date().toISOString()
      });

      writeJson(getKey("QUESTIONS"), questions);
      qs("#question-text").value = "";
      renderQuestions();
    });
  }
}
