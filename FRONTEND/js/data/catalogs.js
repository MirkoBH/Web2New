const BRANDS_PATH = "data/car-brands.json";
const PROVINCES_PATH = "data/provinces.json";

async function readJsonFile(path) {
  const response = await fetch(path, {
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}: ${response.status}`);
  }

  return response.json();
}

export async function loadCatalogs() {
  const [brandsJson, provincesJson] = await Promise.all([readJsonFile(BRANDS_PATH), readJsonFile(PROVINCES_PATH)]);

  return {
    brands: Array.isArray(brandsJson?.marcas)
      ? brandsJson.marcas
          .filter((entry) => entry?.marca)
          .map((entry) => ({
            marca: String(entry.marca),
            modelos: Array.isArray(entry.modelos) ? entry.modelos.map((model) => String(model)) : []
          }))
      : [],
    provinces: Array.isArray(provincesJson?.provincias) ? provincesJson.provincias.map((p) => String(p)) : []
  };
}

export function getFallbackCatalogsFromCars(cars) {
  const brandMap = new Map();
  const provinces = new Set();

  cars.forEach((car) => {
    const brand = String(car.marca || "").trim();
    const model = String(car.modelo || "").trim();
    const province = String(car.ubicacion || "").trim();

    if (brand) {
      if (!brandMap.has(brand)) {
        brandMap.set(brand, new Set());
      }
      if (model) {
        brandMap.get(brand).add(model);
      }
    }

    if (province) {
      provinces.add(province);
    }
  });

  return {
    brands: Array.from(brandMap.entries())
      .map(([marca, modelosSet]) => ({
        marca,
        modelos: Array.from(modelosSet).sort((a, b) => a.localeCompare(b, "es"))
      }))
      .sort((a, b) => a.marca.localeCompare(b.marca, "es")),
    provinces: Array.from(provinces).sort((a, b) => a.localeCompare(b, "es"))
  };
}
