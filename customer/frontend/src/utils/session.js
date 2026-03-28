const SESSION_KEYS = {
  token: "customer_token",
  user: "customer_user",
};

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

  const legacyUser = parseStoredUser(localStorage.getItem("user"));

  return String(legacyUser?.role || "").trim().toLowerCase() === "customer"
    ? legacyUser
    : null;
}

export function getStoredToken() {
  const token = localStorage.getItem(SESSION_KEYS.token);

  if (token) {
    return token;
  }

  const legacyUser = parseStoredUser(localStorage.getItem("user"));
  const legacyToken = localStorage.getItem("token");

  return String(legacyUser?.role || "").trim().toLowerCase() === "customer"
    ? legacyToken || ""
    : "";
}

export function storeSession(token, user) {
  localStorage.setItem(SESSION_KEYS.token, token);
  localStorage.setItem(SESSION_KEYS.user, JSON.stringify(user));
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEYS.token);
  localStorage.removeItem(SESSION_KEYS.user);
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function getDashboardRoute() {
  return "/dashboard";
}

export function getLoginRoute() {
  return "/";
}

export function getForgotPasswordRoute() {
  return "/forgot-password";
}

export function getResetPasswordRoute() {
  return "/reset-password";
}

export function getProfileRoute() {
  return "/profile";
}

export function getAddVehicleRoute() {
  return "/vehicles/new";
}

export function getAddServiceRoute(recordId) {
  return recordId
    ? `/service-records/${recordId}/edit`
    : "/service-records/new";
}
