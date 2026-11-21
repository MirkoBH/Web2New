/**
 * Convierte un <input> en un selector con búsqueda (combobox accesible).
 * `opciones` es una función que devuelve la lista actual, para que el
 * selector de modelos cambie según la marca elegida.
 */
export function selectorBuscable(input, opciones, { alElegir, maximo = 60 } = {}) {
  const lista = document.createElement('ul');
  lista.className = 'selector__lista';
  lista.id = `${input.id}-lista`;
  lista.setAttribute('role', 'listbox');
  lista.hidden = true;
  input.parentElement.classList.add('selector');
  input.after(lista);
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', lista.id);
  input.setAttribute('aria-expanded', 'false');
  input.autocomplete = 'off';

  let activa = -1;

  const normalizar = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function abrir() {
    const filtro = normalizar(input.value.trim());
    const coincidencias = opciones().filter((o) => normalizar(o).includes(filtro)).slice(0, maximo);
    lista.replaceChildren(
      ...coincidencias.map((texto, i) => {
        const item = document.createElement('li');
        item.id = `${lista.id}-${i}`;
        item.setAttribute('role', 'option');
        item.textContent = texto;
        return item;
      }),
    );
    activa = -1;
    lista.hidden = coincidencias.length === 0;
    input.setAttribute('aria-expanded', String(!lista.hidden));
  }

  function cerrar() {
    lista.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function elegir(texto) {
    input.value = texto;
    cerrar();
    alElegir?.(texto);
  }

  function marcar(indice) {
    const items = [...lista.children];
    if (!items.length) return;
    activa = (indice + items.length) % items.length;
    items.forEach((item, i) => item.setAttribute('aria-selected', String(i === activa)));
    input.setAttribute('aria-activedescendant', items[activa].id);
    items[activa].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', abrir);
  input.addEventListener('focus', abrir);
  input.addEventListener('blur', () => setTimeout(cerrar, 120));
  input.addEventListener('keydown', (evento) => {
    if (evento.key === 'ArrowDown') { evento.preventDefault(); if (lista.hidden) abrir(); marcar(activa + 1); }
    else if (evento.key === 'ArrowUp') { evento.preventDefault(); marcar(activa - 1); }
    else if (evento.key === 'Enter' && !lista.hidden && activa >= 0) { evento.preventDefault(); elegir(lista.children[activa].textContent); }
    else if (evento.key === 'Escape') cerrar();
  });
  lista.addEventListener('mousedown', (evento) => {
    const item = evento.target.closest('li');
    if (item) { evento.preventDefault(); elegir(item.textContent); }
  });
}
