import { readSession } from "./storage.js";

export function requireAuth(roles = []) {
  const session = readSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }

  if (roles.length > 0 && !roles.includes(session.role)) {
    window.location.href = "index.html";
    return null;
  }

  return session;
}
