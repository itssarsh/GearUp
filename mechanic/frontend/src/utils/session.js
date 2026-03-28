const SESSION_KEYS = {
  token: "mechanic_token",
  user: "mechanic_user",
};

function normalizeRole(role) {
  return String(role || "").trim().toLowerCase();
}

function isMechanicRole(role) {
  const normalizedRole = normalizeRole(role);
  return normalizedRole === "mechanic" || normalizedRole === "admin";
}

function parseStoredUser(rawUser) {
  try {
    return rawUser ? JSON.parse(rawUser) : null;
  } catch (error) {
    return null;
  }
}

export function getStoredUser() {
  const user = parseStoredUser(localStorage.getItem(SESSION_KEYS.user));

  if (user) {
    return user;
  }

  const legacyMechanicUser = parseStoredUser(localStorage.getItem("workshop_user"));

  if (legacyMechanicUser) {
    return legacyMechanicUser;
  }

  const legacyUser = parseStoredUser(localStorage.getItem("user"));

  return isMechanicRole(legacyUser?.role) ? legacyUser : null;
}

export function getStoredToken() {
  const token = localStorage.getItem(SESSION_KEYS.token);

  if (token) {
    return token;
  }

  const legacyMechanicToken = localStorage.getItem("workshop_token");

  if (legacyMechanicToken) {
    return legacyMechanicToken;
  }

  const legacyUser = parseStoredUser(localStorage.getItem("user"));
  const legacyToken = localStorage.getItem("token");

  return isMechanicRole(legacyUser?.role) ? legacyToken || "" : "";
}

export function storeSession(token, user) {
  localStorage.setItem(SESSION_KEYS.token, token);
  localStorage.setItem(SESSION_KEYS.user, JSON.stringify(user));
  localStorage.removeItem("workshop_token");
  localStorage.removeItem("workshop_user");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEYS.token);
  localStorage.removeItem(SESSION_KEYS.user);
  localStorage.removeItem("workshop_token");
  localStorage.removeItem("workshop_user");
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getDashboardRoute() {
  return "/workshop/dashboard";
}

export function getLoginRoute() {
  return "/workshop/login";
}

export function getForgotPasswordRoute() {
  return "/workshop/forgot-password";
}

export function getResetPasswordRoute() {
  return "/workshop/reset-password";
}

export function getProfileRoute() {
  return "/workshop/profile";
}

export function getAddVehicleRoute() {
  return "/workshop/vehicles/new";
}

export function getAddServiceRoute(recordId) {
  return recordId
    ? `/workshop/service-records/${recordId}/edit`
    : "/workshop/service-records/new";
}

export { isMechanicRole, normalizeRole };
