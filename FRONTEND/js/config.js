export const APP_CONFIG = {
  API_BASE_URL:
    window.__APP_CONFIG__?.API_BASE_URL ||
    window.API_BASE_URL ||
    "http://localhost:3000/api/v1",
  CURRENCY: "USD",
  COUNTRY_SCOPE: "Argentina"
};
