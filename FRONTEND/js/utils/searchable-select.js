function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function isPrintableKey(event) {
  return event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey;
}

export function setupSearchableSingleSelect({ selectEl, defaultOptionLabel, getOptions, onSelectionChange }) {
  let searchTerm = "";
  let clearTimer = null;

  function buildOptions(term) {
    const options = [...new Set((getOptions() || []).map((option) => String(option || "").trim()).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "es")
    );

    const normalizedTerm = normalizeText(term);
    if (!normalizedTerm) return options;
    return options.filter((option) => normalizeText(option).includes(normalizedTerm));
  }

  function render({ preserveValue = true } = {}) {
    const previousValue = preserveValue ? selectEl.value : "";
    const filtered = buildOptions(searchTerm);

    selectEl.innerHTML = "";

    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = defaultOptionLabel;
    selectEl.appendChild(defaultOption);

    filtered.forEach((option) => {
      const optionEl = document.createElement("option");
      optionEl.value = option;
      optionEl.textContent = option;
      selectEl.appendChild(optionEl);
    });

    if (previousValue && filtered.includes(previousValue)) {
      selectEl.value = previousValue;
    } else {
      selectEl.value = "";
    }
  }

  function scheduleClearSearch() {
    if (clearTimer) clearTimeout(clearTimer);
    clearTimer = setTimeout(() => {
      searchTerm = "";
      render({ preserveValue: true });
    }, 950);
  }

  selectEl.addEventListener("keydown", (event) => {
    if (isPrintableKey(event)) {
      event.preventDefault();
      searchTerm += event.key;
      render({ preserveValue: true });
      scheduleClearSearch();
      return;
    }

    if (event.key === "Backspace") {
      event.preventDefault();
      searchTerm = searchTerm.slice(0, -1);
      render({ preserveValue: true });
      scheduleClearSearch();
      return;
    }

    if (event.key === "Escape") {
      searchTerm = "";
      render({ preserveValue: true });
    }
  });

  selectEl.addEventListener("blur", () => {
    searchTerm = "";
    render({ preserveValue: true });
  });

  selectEl.addEventListener("change", () => {
    if (typeof onSelectionChange === "function") {
      onSelectionChange(selectEl.value);
    }
  });

  render({ preserveValue: false });

  return {
    render,
    clearSearch() {
      searchTerm = "";
      render({ preserveValue: true });
    }
  };
}
