import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { storeAuth, type Role } from "../lib/auth";
import { cn } from "../lib/cn";

interface LoginScreenProps {
  onLogin: (role: Role) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const role = useQuery(
    api.auth.checkPassword,
    isChecking ? { password } : "skip"
  );

  // Handle role response
  if (isChecking && role !== undefined) {
    if (role === "editor" || role === "viewer") {
      storeAuth(password, role);
      onLogin(role);
    } else {
      setError("Invalid password");
      setIsChecking(false);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter a password");
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
            Mitschreiben
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-center mb-6 text-sm">
            Enter your password to continue
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <input
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(null);
                }}
                placeholder="Password"
                className={cn(
                  "w-full px-4 py-3 rounded-lg border bg-neutral-50 dark:bg-neutral-700",
                  "text-neutral-900 dark:text-white placeholder-neutral-400",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "text-base", // Prevent zoom on iOS
                  error
                    ? "border-red-500"
                    : "border-neutral-200 dark:border-neutral-600"
                )}
                autoFocus
                autoComplete="current-password"
              />
              {error && (
                <p className="mt-2 text-sm text-red-500">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isChecking}
              className={cn(
                "w-full py-3 px-4 rounded-lg font-medium",
                "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "transition-colors active:scale-[0.98]"
              )}
            >
              {isChecking ? "Checking..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
