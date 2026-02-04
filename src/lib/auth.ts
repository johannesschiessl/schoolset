export type Permission = "editor" | "viewer" | "none";

export interface UserSession {
  userId: string;
  username: string;
  permissions: Permission;
}

const SESSION_KEY = "schoolset_session";

export function getStoredSession(): UserSession | null {
  const stored = sessionStorage.getItem(SESSION_KEY);
  if (!stored) return null;
  try {
    const parsed = JSON.parse(stored);
    if (parsed && parsed.userId && parsed.username && parsed.permissions) {
      return parsed as UserSession;
    }
    return null;
  } catch {
    return null;
  }
}

export function storeSession(session: UserSession): void {
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getUserId(): string | null {
  const session = getStoredSession();
  return session?.userId ?? null;
}

export function getPermissions(): Permission | null {
  const session = getStoredSession();
  return session?.permissions ?? null;
}

export function isEditor(): boolean {
  return getPermissions() === "editor";
}

export function canViewItems(): boolean {
  const permissions = getPermissions();
  return permissions === "editor" || permissions === "viewer";
}
