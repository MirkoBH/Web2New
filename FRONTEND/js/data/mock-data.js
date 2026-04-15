import { getKey, readJson, writeJson } from "../utils/storage.js";

const seedUsers = [
  {
    id: "u-vendedor-1",
    role: "vendedor",
    nombre: "Valentina Beas",
    email: "vendedor@demo.com",
    telefono: "+54 11 5555 5555",
    password: "Demo1234!",
    emailVerificado: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "u-comprador-1",
    role: "comprador",
    nombre: "Lucas Perez",
    email: "comprador@demo.com",
    telefono: "+54 11 4444 4444",
    password: "Demo1234!",
    emailVerificado: true,
    createdAt: new Date().toISOString()
  }
];

const seedCars = [
  {
    id: "c-1",
    vendedorId: "u-vendedor-1",
    marca: "Toyota",
    modelo: "Corolla",
    color: "Gris",
    anio: 2020,
    kilometraje: 52000,
    transmision: "Automatico",
    combustible: "Nafta",
    precio: 18500,
    ubicacion: "Buenos Aires",
    descripcion: "Unico duenio, services al dia.",
    detallesDanios: "Sin choques. Pequeno rayon en paragolpes trasero.",
    imagenes: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Buen estado",
      score: 8.3,
      danios: "Rayon superficial en paragolpes.",
      rangoPrecioMin: 17500,
      rangoPrecioMax: 19500,
      resumen: "Auto valido y consistente con descripcion. Danios leves.",
      aprobado: true
    },
    createdAt: new Date().toISOString()
  },
  {
    id: "c-2",
    vendedorId: "u-vendedor-1",
    marca: "Ford",
    modelo: "Ranger",
    color: "Blanco",
    anio: 2018,
    kilometraje: 87000,
    transmision: "Manual",
    combustible: "Diesel",
    precio: 23900,
    ubicacion: "Cordoba",
    descripcion: "Uso familiar y ruta.",
    detallesDanios: "Sin danios visibles importantes.",
    imagenes: [
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617531653520-4893f7bde2d8?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Buen estado",
      score: 8.1,
      danios: "Desgaste normal para kilometraje.",
      rangoPrecioMin: 22500,
      rangoPrecioMax: 24600,
      resumen: "Publicacion coherente y auto detectado correctamente.",
      aprobado: true
    },
    createdAt: new Date().toISOString()
  }
];

export function ensureSeedData() {
  const seeded = localStorage.getItem(getKey("SEEDED"));
  if (seeded) return;

  writeJson(getKey("USERS"), seedUsers);
  writeJson(getKey("CARS"), seedCars);
  writeJson(getKey("COMPARE"), []);
  writeJson(getKey("QUESTIONS"), []);
  writeJson(getKey("WISHLIST"), []);
  writeJson(getKey("IA_LOGS"), []);
  localStorage.setItem(getKey("SEEDED"), "1");
}

export function getCars() {
  return readJson(getKey("CARS"), []);
}

export function getUsers() {
  return readJson(getKey("USERS"), []);
}
