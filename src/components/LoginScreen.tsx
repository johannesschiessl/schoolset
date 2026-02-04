import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { storeSession, type UserSession } from "../lib/auth";
import { cn } from "../lib/cn";

interface LoginScreenProps {
  onLogin: (session: UserSession) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const loginResult = useQuery(
    api.auth.login,
    isChecking ? { username, password } : "skip",
  );

  // Handle login response
  if (isChecking && loginResult !== undefined) {
    if (loginResult) {
      const session: UserSession = {
        userId: loginResult.userId,
        username: loginResult.username,
        permissions: loginResult.permissions,
      };
      storeSession(session);
      onLogin(session);
    } else {
      setError("Ungültiger Benutzername oder Passwort");
      setIsChecking(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setError("Bitte Benutzername eingeben");
      return;
    }
    if (!password.trim()) {
      setError("Bitte Passwort eingeben");
      return;
    }
    setError(null);
    setIsChecking(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-900 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-lg p-6 sm:p-8">
          <h1 className="text-xl sm:text-2xl font-bold text-center mb-2 text-neutral-900 dark:text-white">
            Schoolset
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-center mb-6 text-sm">
            Anmelden, um fortzufahren
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="Benutzername"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border bg-neutral-50 dark:bg-neutral-700",
                  "text-neutral-900 dark:text-white placeholder-neutral-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "text-base",
                  error
                    ? "border-red-500"
                    : "border-neutral-200 dark:border-neutral-600",
                )}
                autoFocus
                autoComplete="username"
              />
            </div>

            <div className="mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Passwort"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border bg-neutral-50 dark:bg-neutral-700",
                  "text-neutral-900 dark:text-white placeholder-neutral-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "text-base",
                  error
                    ? "border-red-500"
                    : "border-neutral-200 dark:border-neutral-600",
                )}
                autoComplete="current-password"
              />
              {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={isChecking}
              className={cn(
                "w-full py-3 px-4 rounded-lg font-medium",
                "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors active:scale-[0.98]",
              )}
            >
              {isChecking ? "Wird geprüft..." : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
