// Catálogos locales de marcas/modelos y provincias argentinas (carpeta data/).

let cache = null;

export async function loadCatalogs() {
  if (cache) return cache;
  const [brands, provinces] = await Promise.all([
    fetch('data/car-brands.json').then((r) => r.json()),
    fetch('data/provinces.json').then((r) => r.json()),
  ]);
  cache = {
    brands: brands.brands.map((m) => ({ brand: m.brand, models: m.models })),
    provinces: provinces.provinces,
  };
  return cache;
}

export function modelsOf(catalogs, brand) {
  const found = catalogs.brands.find((m) => m.brand.toLowerCase() === brand.trim().toLowerCase());
  return found ? found.models : [];
}
