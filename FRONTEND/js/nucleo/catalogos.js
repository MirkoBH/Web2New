// Catálogos locales de marcas/modelos y provincias argentinas (carpeta data/).

let cache = null;

export async function cargarCatalogos() {
  if (cache) return cache;
  const [marcas, provincias] = await Promise.all([
    fetch('data/car-brands.json').then((r) => r.json()),
    fetch('data/provinces.json').then((r) => r.json()),
  ]);
  cache = {
    marcas: marcas.marcas.map((m) => ({ marca: m.marca, modelos: m.modelos })),
    provincias: provincias.provincias,
  };
  return cache;
}

export function modelosDe(catalogos, marca) {
  const encontrada = catalogos.marcas.find((m) => m.marca.toLowerCase() === marca.trim().toLowerCase());
  return encontrada ? encontrada.modelos : [];
}
