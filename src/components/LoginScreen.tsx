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
      setError("Ungultiger Benutzername oder Passwort");
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
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-4">
      <div className="w-full max-w-sm">
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm border border-stone-200 dark:border-stone-800 p-7 sm:p-8">
          <h1 className="text-xl font-semibold text-center mb-1 text-stone-900 dark:text-stone-100 tracking-tight">
            Schoolset
          </h1>
          <p className="text-stone-400 dark:text-stone-500 text-center mb-7 text-sm">
            Anmelden, um fortzufahren
          </p>

          <form onSubmit={handleSubmit}>
            <div className="space-y-3">
              <input
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(null);
                }}
                placeholder="Benutzername"
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg border bg-stone-50 dark:bg-stone-800/50",
                  "text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500",
                  "text-sm",
                  error
                    ? "border-red-400 dark:border-red-500/50"
                    : "border-stone-200 dark:border-stone-700",
                )}
                autoFocus
                autoComplete="username"
              />

              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Passwort"
                className={cn(
                  "w-full px-3.5 py-2.5 rounded-lg border bg-stone-50 dark:bg-stone-800/50",
                  "text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500",
                  "text-sm",
                  error
                    ? "border-red-400 dark:border-red-500/50"
                    : "border-stone-200 dark:border-stone-700",
                )}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <p className="mt-3 text-[13px] text-red-500 dark:text-red-400">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isChecking}
              className={cn(
                "w-full mt-5 py-2.5 px-4 rounded-lg font-medium text-sm",
                "bg-stone-900 hover:bg-stone-800 active:bg-stone-700 text-white",
                "dark:bg-stone-100 dark:hover:bg-stone-200 dark:active:bg-stone-300 dark:text-stone-900",
                "focus:outline-none focus:ring-2 focus:ring-stone-900/20 dark:focus:ring-stone-100/20",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors",
              )}
            >
              {isChecking ? "Wird gepruft..." : "Anmelden"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
