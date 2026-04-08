# Proyecto: Plataforma Inteligente de Compra y Venta de Autos Usados

## 1. Introducción y Objetivos
[cite_start]El mercado de autos usados ha crecido impulsado por plataformas digitales, pero los compradores suelen tener dificultades para evaluar el estado real de un vehículo o su precio[cite: 6, 7]. 
[cite_start]El objetivo de este proyecto es desarrollar una plataforma web completa donde los vendedores publiquen vehículos y los compradores puedan buscarlos, analizarlos y compararlos[cite: 8, 21]. 
[cite_start]Como elemento innovador, se debe integrar inteligencia artificial (IA) para analizar fotografías de los vehículos y estimar su estado, daños y valor de mercado[cite: 9, 10, 11, 12].

## 2. Tipos de Usuarios
[cite_start]La plataforma permite la interacción de dos roles principales[cite: 31]:

* [cite_start]**Vendedor**: Puede registrarse, iniciar sesión, publicar autos, subir imágenes, editar/eliminar sus publicaciones y recibir consultas[cite: 32, 33, 34, 35, 36, 37, 38, 39, 40, 41].
* [cite_start]**Comprador**: Puede registrarse, buscar autos, aplicar filtros, ver detalles, analizar la estimación de la IA, comparar vehículos y contactar al vendedor[cite: 42, 43, 44, 45, 46, 47, 48, 49, 50, 51].

## 3. Funcionalidades Principales
* [cite_start]**Gestión de Usuarios**: Registro, login, gestión de perfil y diferenciación de roles[cite: 54, 55, 56, 59].
* [cite_start]**Publicación de Vehículos**: Formularios para ingresar marca, modelo, año, kilometraje, combustible, transmisión, precio, ubicación, descripción y múltiples fotografías[cite: 62, 63, 65, 66, 67, 68, 69, 70, 71, 72, 73, 74].
* [cite_start]**Búsqueda y Filtros**: Búsqueda por marca, modelo, precio, año, kilometraje y ubicación, mostrando resultados en formato de listado[cite: 75, 76, 77, 78, 79, 80, 81, 82, 83].
* [cite_start]**Detalle del Vehículo**: Página con galería de imágenes, características, descripción, precio, ubicación y el análisis generado por la IA[cite: 84, 85, 86, 87, 88, 89, 90, 91].
* [cite_start]**Integración de IA**: Servicio que analiza las fotos para identificar daños visibles, estimar el estado general (excelente, bueno, regular, requiere reparación) y sugerir un rango de precio[cite: 95, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106].
* [cite_start]**Comparación y Contacto**: Seleccionar múltiples vehículos para comparar atributos y enviar consultas al vendedor[cite: 107, 108, 109, 110, 111, 112, 113, 115].

## 4. Arquitectura y Tecnologías Obligatorias
[cite_start]El sistema implementa una arquitectura cliente-servidor[cite: 117].

* **Frontend**: 
    * [cite_start]Lenguajes: HTML, CSS y JavaScript Vanilla (manipulación del DOM, validaciones, fetch/axios)[cite: 125, 127, 128, 129, 131, 133, 134].
    * **Restricción**: NO se permite el uso de frameworks de JavaScript (React, Angular, Vue, etc.).
    * **Estilos**: Se utilizará exclusivamente Bootstrap para el diseño responsivo e interfaz gráfica.
* **Backend**: 
    * [cite_start]Framework: NestJS[cite: 135, 136, 137].
    * [cite_start]Responsabilidades: API REST, CRUD de publicaciones, gestión de usuarios, manejo de imágenes e integración con el servicio de IA[cite: 138, 139, 140, 141, 142, 143].
* **Base de Datos**: Supabase.

## 5. ⚠️ DIRECTIVAS ESTRICTAS DE DESARROLLO Y MODIFICACIÓN (REQUISITO OBLIGATORIO) ⚠️
Para garantizar la integridad y el correcto funcionamiento del proyecto durante todo su ciclo de vida, cualquier desarrollador o asistente de IA debe cumplir obligatoriamente las siguientes reglas al interactuar con el código:

1.  **Revisión del Documento Base**: Antes de crear o modificar cualquier archivo, es obligatorio revisar las consignas y restricciones documentadas en este archivo `consignas.md`.
2.  **Análisis de Impacto e Interdependencias**: Al modificar un archivo, se deben rastrear, abrir y revisar **todos los archivos vinculados** (archivos que el archivo actual importa, y archivos donde el archivo actual es importado). 
3.  **Prevención de Errores en Cascada**: Se debe verificar exhaustivamente que la modificación propuesta no rompa la lógica, los contratos de las funciones o los estilos en los archivos dependientes. Si un cambio requiere actualizar un archivo vinculado para que el sistema siga funcionando, esa modificación debe realizarse de inmediato y en el mismo paso.

## 6. Buenas Prácticas y Planificación
Para asegurar un desarrollo ordenado y profesional, se aplicarán los siguientes requisitos de planificación:

* **Estructura Modular**: Mantener el backend en NestJS estrictamente separado por módulos (Auth, Cars, Users, AI-Integration). En el frontend, separar la lógica de JavaScript por funcionalidades o vistas (ej. `auth.js`, `publicar.js`, `filtros.js`) para evitar archivos monolíticos.
* **Manejo de Variables de Entorno (.env)**: Ninguna credencial (Supabase, claves de IA, URLs de APIs) debe estar *hardcodeada*. Todas deben gestionarse mediante variables de entorno preparadas para su uso local y en producción.
* **Gestión de Errores y Validaciones**: El backend debe validar los datos de entrada (Data Transfer Objects en NestJS) y devolver códigos de estado HTTP correctos. El frontend debe atrapar estos errores y mostrar alertas de Bootstrap claras al usuario.
* **CORS**: Configurar correctamente las políticas CORS en el backend de NestJS para aceptar peticiones exclusivamente desde las URLs de despliegue en Vercel/Netlify.

## 7. Despliegue del Proyecto
[cite_start]El sistema debe estar publicado en internet integrando distintas plataformas[cite: 171, 172]:

* **Frontend**: Despliegue en **Vercel** o **Netlify**.
* **Base de Datos**: Instancia gestionada en **Supabase**.
* **Backend y Orquestación**: Despliegue del servidor NestJS en **Railway**, asegurando la correcta vinculación entre el frontend (orígenes permitidos), el backend y la conexión a la base de datos Supabase.

## 8. Entregables
[cite_start]El equipo deberá entregar y defender lo siguiente[cite: 189]:

1.  [cite_start]**Código Fuente**: Repositorio en GitHub conteniendo Frontend, Backend y Documentación[cite: 190, 191, 192, 193, 194].
2.  [cite_start]**Aplicación Funcional**: URLs de producción del Frontend y Backend[cite: 195, 197, 198].
3.  [cite_start]**Documentación**: Descripción, arquitectura, modelo de datos, endpoints y explicación de la IA[cite: 199, 200, 201, 202, 203, 204, 205].
4.  [cite_start]**Presentación/Demo**: Mostrando registro, publicación, búsqueda, y el análisis de IA en vivo[cite: 206, 207, 208, 209, 210, 211, 212].

## 9. Funcionalidades Extras Opcionales (A considerar para escalar)
[cite_start]Se proponen mejoras adicionales para el sistema[cite: 228, 229]:
* [cite_start]Recomendador de autos con IA basado en búsquedas[cite: 230, 231].
* [cite_start]Estimador de precio basado en mercado (bajo, promedio, sobrevalorado)[cite: 232, 233, 234, 235, 236].
* [cite_start]Sistema de favoritos e historial de búsquedas[cite: 237, 238, 239, 240].
* [cite_start]Comparador avanzado y chat comprador/vendedor[cite: 241, 242, 256, 257].
* [cite_start]Sistema de calificaciones y dashboard de estadísticas para vendedores[cite: 243, 244, 247, 248].
* [cite_start]Detección automática de marca/modelo y detector de fotos repetidas mediante IA[cite: 252, 253, 273, 274].
* [cite_start]Mapa de ubicaciones, simulador de financiación y calculadora de costo total (patente, seguro, etc.)[cite: 261, 262, 263, 264, 275, 276, 277, 278, 279].