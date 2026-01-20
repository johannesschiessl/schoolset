export type Role = "viewer" | "editor";

const PASSWORD_KEY = "mitschreiben_password";
const ROLE_KEY = "mitschreiben_role";

export function getStoredPassword(): string | null {
  return sessionStorage.getItem(PASSWORD_KEY);
}

export function getStoredRole(): Role | null {
  const role = sessionStorage.getItem(ROLE_KEY);
  if (role === "viewer" || role === "editor") {
    return role;
  }
  return null;
}

export function storeAuth(password: string, role: Role): void {
  sessionStorage.setItem(PASSWORD_KEY, password);
  sessionStorage.setItem(ROLE_KEY, role);
}

export function clearAuth(): void {
  sessionStorage.removeItem(PASSWORD_KEY);
  sessionStorage.removeItem(ROLE_KEY);
}

export function isEditor(): boolean {
  return getStoredRole() === "editor";
}
