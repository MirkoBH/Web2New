/**
 * Convierte un <input> en un selector con búsqueda (combobox accesible).
 * `opciones` es una función que devuelve la lista actual, para que el
 * selector de modelos cambie según la marca elegida.
 */
export function searchableSelect(input, options, { onSelect, max = 60 } = {}) {
  const list = document.createElement('ul');
  list.className = 'selector__lista';
  list.id = `${input.id}-lista`;
  list.setAttribute('role', 'listbox');
  list.hidden = true;
  input.parentElement.classList.add('selector');
  input.after(list);
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', list.id);
  input.setAttribute('aria-expanded', 'false');
  input.autocomplete = 'off';

  let activeIndex = -1;

  const normalize = (text) => text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

  function shouldOpen() {
    const filter = normalize(input.value.trim());
    const matchingOptions = options().filter((o) => normalize(o).includes(filter)).slice(0, max);
    list.replaceChildren(
      ...matchingOptions.map((text, i) => {
        const item = document.createElement('li');
        item.id = `${list.id}-${i}`;
        item.setAttribute('role', 'option');
        item.textContent = text;
        return item;
      }),
    );
    activeIndex = -1;
    list.hidden = matchingOptions.length === 0;
    input.setAttribute('aria-expanded', String(!list.hidden));
  }

  function close() {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
  }

  function choose(text) {
    input.value = text;
    close();
    onSelect?.(text);
  }

  function highlight(index) {
    const items = [...list.children];
    if (!items.length) return;
    activeIndex = (index + items.length) % items.length;
    items.forEach((item, i) => item.setAttribute('aria-selected', String(i === activeIndex)));
    input.setAttribute('aria-activedescendant', items[activeIndex].id);
    items[activeIndex].scrollIntoView({ block: 'nearest' });
  }

  input.addEventListener('input', shouldOpen);
  input.addEventListener('focus', shouldOpen);
  input.addEventListener('blur', () => setTimeout(close, 120));
  input.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowDown') { event.preventDefault(); if (list.hidden) shouldOpen(); highlight(activeIndex + 1); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); highlight(activeIndex - 1); }
    else if (event.key === 'Enter' && !list.hidden && activeIndex >= 0) { event.preventDefault(); choose(list.children[activeIndex].textContent); }
    else if (event.key === 'Escape') close();
  });
  list.addEventListener('mousedown', (event) => {
    const item = event.target.closest('li');
    if (item) { event.preventDefault(); choose(item.textContent); }
  });
}
