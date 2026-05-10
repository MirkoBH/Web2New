import { getKey, readJson, writeJson } from "../utils/storage.js";

// ─── Datos de usuarios de prueba ─────────────────────────────────────────────
const usuariosSemilla = [
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
    id: "u-vendedor-2",
    role: "vendedor",
    nombre: "Rodrigo Méndez",
    email: "rodrigo@demo.com",
    telefono: "+54 351 444 4444",
    password: "Demo1234!",
    emailVerificado: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "u-comprador-1",
    role: "comprador",
    nombre: "Lucas Pérez",
    email: "comprador@demo.com",
    telefono: "+54 11 4444 4444",
    password: "Demo1234!",
    emailVerificado: true,
    createdAt: new Date().toISOString()
  }
];

// ─── Datos de autos de prueba ─────────────────────────────────────────────────
const autosSemilla = [
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
    descripcion: "Único dueño, services al día. Excelente estado general, nunca chocado.",
    detallesDanios: "Sin choques. Pequeño rayón en paragolpes trasero.",
    imagenes: [
      "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1493238792000-8113da705763?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Buen estado",
      score: 8.3,
      danios: "Rayón superficial en paragolpes.",
      rangoPrecioMin: 17500,
      rangoPrecioMax: 19500,
      resumen: "Auto válido y consistente con descripción. Daños leves.",
      aprobado: true
    },
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString()
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
    ubicacion: "Córdoba",
    descripcion: "Uso familiar y ruta. Mantenimiento al día. Muy buen estado mecánico.",
    detallesDanios: "Sin daños visibles importantes.",
    imagenes: [
      "https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549924231-f129b911e442?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617531653520-4893f7bde2d8?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Buen estado",
      score: 8.1,
      danios: "Desgaste normal para el kilometraje.",
      rangoPrecioMin: 22500,
      rangoPrecioMax: 24600,
      resumen: "Publicación coherente y auto detectado correctamente.",
      aprobado: true
    },
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "c-3",
    vendedorId: "u-vendedor-2",
    marca: "Volkswagen",
    modelo: "Golf",
    color: "Negro",
    anio: 2021,
    kilometraje: 31000,
    transmision: "Automatico",
    combustible: "Nafta",
    precio: 22000,
    ubicacion: "Rosario",
    descripcion: "Full equipo. Pantalla táctil, sensores de estacionamiento, cámara de reversa. Impecable.",
    detallesDanios: "Sin daños. Auto en perfectas condiciones.",
    imagenes: [
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1489824904134-891ab64532f1?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Excelente",
      score: 9.2,
      danios: "Sin daños detectados.",
      rangoPrecioMin: 21000,
      rangoPrecioMax: 23500,
      resumen: "Vehículo en condición superior. Precio justo para el mercado.",
      aprobado: true
    },
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString()
  },
  {
    id: "c-4",
    vendedorId: "u-vendedor-1",
    marca: "Chevrolet",
    modelo: "Cruze",
    color: "Rojo",
    anio: 2019,
    kilometraje: 68000,
    transmision: "Automatico",
    combustible: "Nafta",
    precio: 14900,
    ubicacion: "Buenos Aires",
    descripcion: "Excelente para ciudad. Bajo consumo, interior impecable. Papeles al día.",
    detallesDanios: "Rayón en puerta trasera izquierda, tamaño pequeño.",
    imagenes: [
      "https://images.unsplash.com/photo-1471444928139-48c5bf5173f8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1536700503279-b1b7d5b2d9c5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Buen estado",
      score: 7.6,
      danios: "Rayón superficial en puerta trasera izquierda.",
      rangoPrecioMin: 13800,
      rangoPrecioMax: 15500,
      resumen: "Auto en buen estado general con daño menor documentado.",
      aprobado: true
    },
    createdAt: new Date(Date.now() - 4 * 86400000).toISOString()
  },
  {
    id: "c-5",
    vendedorId: "u-vendedor-2",
    marca: "Renault",
    modelo: "Duster",
    color: "Gris",
    anio: 2022,
    kilometraje: 18000,
    transmision: "Manual",
    combustible: "Nafta",
    precio: 19800,
    ubicacion: "Mendoza",
    descripcion: "SUV compacta. Ideal para todos los terrenos. Casi nuevo, garantía de fábrica vigente.",
    detallesDanios: "Sin daños. Garantía de fábrica vigente.",
    imagenes: [
      "https://images.unsplash.com/photo-1518987048-93e29699e79a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1544636331-e26879cd4d9b?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Excelente",
      score: 9.5,
      danios: "Sin daños detectados.",
      rangoPrecioMin: 19000,
      rangoPrecioMax: 21000,
      resumen: "Vehículo casi nuevo. Precio muy competitivo para el año y kilometraje.",
      aprobado: true
    },
    createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
  },
  {
    id: "c-6",
    vendedorId: "u-vendedor-2",
    marca: "Honda",
    modelo: "HR-V",
    color: "Blanco",
    anio: 2020,
    kilometraje: 44000,
    transmision: "Automatico",
    combustible: "Nafta",
    precio: 21500,
    ubicacion: "Tucumán",
    descripcion: "SUV urbana en excelente estado. Nafta bajo consumo. Aire doble zona, tapizado cuero.",
    detallesDanios: "Pequeño golpe en paragolpes delantero, sin pintura expuesta.",
    imagenes: [
      "https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1590362891991-f776e747a588?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Buen estado",
      score: 8.0,
      danios: "Deformación leve en paragolpes delantero.",
      rangoPrecioMin: 20000,
      rangoPrecioMax: 22500,
      resumen: "Vehículo bien conservado. Daño menor que no compromete la seguridad.",
      aprobado: true
    },
    createdAt: new Date(Date.now() - 6 * 86400000).toISOString()
  },
  {
    id: "c-7",
    vendedorId: "u-vendedor-1",
    marca: "Peugeot",
    modelo: "208",
    color: "Azul",
    anio: 2023,
    kilometraje: 9000,
    transmision: "Automatico",
    combustible: "Nafta",
    precio: 17200,
    ubicacion: "Buenos Aires",
    descripcion: "Último modelo. Como nuevo. Cero kilómetros de uso cotidiano. Muy equipado.",
    detallesDanios: "Sin daños. Primer dueño.",
    imagenes: [
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1553440569-bcc63803a83d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1520031441872-265e4ff70366?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Excelente",
      score: 9.7,
      danios: "Sin daños detectados.",
      rangoPrecioMin: 16800,
      rangoPrecioMax: 18000,
      resumen: "Vehículo en condición premium. Precio acorde al mercado actual.",
      aprobado: true
    },
    createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
  },
  {
    id: "c-8",
    vendedorId: "u-vendedor-2",
    marca: "Nissan",
    modelo: "Kicks",
    color: "Naranja",
    anio: 2021,
    kilometraje: 39000,
    transmision: "Automatico",
    combustible: "Nafta",
    precio: 20100,
    ubicacion: "Córdoba",
    descripcion: "SUV compacta muy completa. Bluetooth, cámara 360°, control crucero. Ideal familia.",
    detallesDanios: "Sin daños visibles.",
    imagenes: [
      "https://images.unsplash.com/photo-1597007066704-67bf2068d5b2?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1617469767053-d3b523a0b982?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1592198084033-aade902d1aae?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Buen estado",
      score: 8.6,
      danios: "Sin daños detectados.",
      rangoPrecioMin: 19200,
      rangoPrecioMax: 21000,
      resumen: "Publicación coherente. Precio levemente sobre mercado, negociable.",
      aprobado: true
    },
    createdAt: new Date(Date.now() - 8 * 86400000).toISOString()
  },
  {
    id: "c-9",
    vendedorId: "u-vendedor-1",
    marca: "Fiat",
    modelo: "Argo",
    color: "Blanco",
    anio: 2022,
    kilometraje: 26000,
    transmision: "Manual",
    combustible: "Nafta",
    precio: 11900,
    ubicacion: "Santa Fe",
    descripcion: "Auto de ciudad. Muy económico. Ideal para primer auto o uso diario.",
    detallesDanios: "Sin daños de importancia. Pequeño rayón en techo.",
    imagenes: [
      "https://images.unsplash.com/photo-1461640134319-4b3d746985c0?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Buen estado",
      score: 7.9,
      danios: "Rayón superficial en techo, posiblemente de granizo.",
      rangoPrecioMin: 11200,
      rangoPrecioMax: 12500,
      resumen: "Vehículo en buen estado. Precio competitivo para el segmento.",
      aprobado: true
    },
    createdAt: new Date(Date.now() - 9 * 86400000).toISOString()
  },
  {
    id: "c-10",
    vendedorId: "u-vendedor-2",
    marca: "Toyota",
    modelo: "Hilux",
    color: "Gris",
    anio: 2019,
    kilometraje: 95000,
    transmision: "Automatico",
    combustible: "Diesel",
    precio: 32000,
    ubicacion: "Salta",
    descripcion: "Hilux SRX full. 4x4, cuero, pantalla Android. Usada para trabajo en campo.",
    detallesDanios: "Desgaste normal de uso rural. Sin choques importantes.",
    imagenes: [
      "https://images.unsplash.com/photo-1585776245991-cf89dd7fc73a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1504215680853-026ed2a45def?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1569464315538-cf96e1fcdcc1?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Regular",
      score: 6.4,
      danios: "Desgaste notable en paragolpes y estribos laterales. Rayones de uso rural.",
      rangoPrecioMin: 28000,
      rangoPrecioMax: 31000,
      resumen: "Vehículo funcional pero con desgaste visible. Precio algo elevado para el estado detectado.",
      aprobado: true
    },
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString()
  },
  {
    id: "c-11",
    vendedorId: "u-vendedor-1",
    marca: "Hyundai",
    modelo: "Tucson",
    color: "Gris",
    anio: 2021,
    kilometraje: 47000,
    transmision: "Automatico",
    combustible: "Nafta",
    precio: 26500,
    ubicacion: "Buenos Aires",
    descripcion: "Tucson full equipo. Techo panorámico, tapizado cuero, sensores 360°. Una joya.",
    detallesDanios: "Sin daños. Siempre guardado en cochera.",
    imagenes: [
      "https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1549927681-0b673b8243ab?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1609521263047-f8f205293f24?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Excelente",
      score: 9.1,
      danios: "Sin daños detectados.",
      rangoPrecioMin: 25500,
      rangoPrecioMax: 27500,
      resumen: "Vehículo de alta gama en condición superior. Precio justo de mercado.",
      aprobado: true
    },
    createdAt: new Date(Date.now() - 11 * 86400000).toISOString()
  },
  {
    id: "c-12",
    vendedorId: "u-vendedor-2",
    marca: "Jeep",
    modelo: "Renegade",
    color: "Verde",
    anio: 2020,
    kilometraje: 58000,
    transmision: "Automatico",
    combustible: "Nafta",
    precio: 22800,
    ubicacion: "Mendoza",
    descripcion: "Renegade Longitude 4x2. Ideal para montaña. Excelente rendimiento en todo terreno.",
    detallesDanios: "Golpe menor en guardabarro trasero derecho.",
    imagenes: [
      "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1574023671036-79b7b7e5aa3a?auto=format&fit=crop&w=1200&q=80",
      "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?auto=format&fit=crop&w=1200&q=80"
    ],
    ia: {
      estado: "Buen estado",
      score: 7.8,
      danios: "Deformación leve en guardabarro trasero derecho.",
      rangoPrecioMin: 21500,
      rangoPrecioMax: 23500,
      resumen: "SUV en buen estado con daño menor documentado. Precio apropiado.",
      aprobado: true
    },
    createdAt: new Date(Date.now() - 12 * 86400000).toISOString()
  }
];

// ─── Función para inicializar datos si no existen ─────────────────────────────
export function inicializarDatos() {
  const yaIniciado = localStorage.getItem(getKey("SEEDED"));
  if (yaIniciado) return;

  writeJson(getKey("USERS"), usuariosSemilla);
  writeJson(getKey("CARS"), autosSemilla);
  writeJson(getKey("COMPARE"), []);
  writeJson(getKey("QUESTIONS"), []);
  writeJson(getKey("WISHLIST"), []);
  writeJson(getKey("IA_LOGS"), []);
  localStorage.setItem(getKey("SEEDED"), "1");
}

// Alias para compatibilidad con imports existentes
export const ensureSeedData = inicializarDatos;

export function obtenerAutos() {
  return readJson(getKey("CARS"), []);
}

export function obtenerUsuarios() {
  return readJson(getKey("USERS"), []);
}

// Alias para compatibilidad con imports existentes
export const getCars = obtenerAutos;
export const getUsers = obtenerUsuarios;
