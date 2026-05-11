// La página de wishlist redirige al perfil en modo comprador
// Los favoritos se gestionan desde el panel de comprador
import { getModo, setModo, readSession } from "../utils/storage.js";

const sesion = readSession();
if (!sesion) {
  window.location.href = "login.html";
} else {
  // Asegurarse de estar en modo comprador y redirigir al perfil
  setModo("comprador");
  window.location.href = "perfil.html";
}
