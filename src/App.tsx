import { useState, useEffect, useCallback } from "react";
import { getStoredPassword, getStoredRole, clearAuth, type Role } from "./lib/auth";
import { LoginScreen } from "./components/LoginScreen";
import { DaySidebar } from "./components/DaySidebar";
import { DayView } from "./components/DayView";
import { LogOutIcon, MenuIcon, XIcon } from "lucide-react";
import { cn } from "./lib/cn";

function getDateFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("day");
}

function setDateInUrl(date: string | null) {
  const url = new URL(window.location.href);
  if (date) {
    url.searchParams.set("day", date);
  } else {
    url.searchParams.delete("day");
  }
  window.history.pushState({}, "", url.toString());
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check for existing auth on mount
  useEffect(() => {
    const storedPassword = getStoredPassword();
    const storedRole = getStoredRole();
    if (storedPassword && storedRole) {
      setIsAuthenticated(true);
      setRole(storedRole);
    }
  }, []);

  // Initialize selected date from URL or default to today
  useEffect(() => {
    const urlDate = getDateFromUrl();
    if (urlDate) {
      setSelectedDate(urlDate);
    } else {
      const today = new Date().toISOString().split("T")[0];
      setSelectedDate(today);
    }
  }, []);

  // Close sidebar on window resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setSidebarOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleSelectDate = useCallback((date: string) => {
    setSelectedDate(date);
    setDateInUrl(date);
    setSidebarOpen(false); // Close sidebar on mobile after selection
  }, []);

  const handleLogin = (newRole: Role) => {
    setIsAuthenticated(true);
    setRole(newRole);
  };

  const handleLogout = () => {
    clearAuth();
    setIsAuthenticated(false);
    setRole(null);
  };

  if (!isAuthenticated) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-neutral-900">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "p-2 rounded-lg md:hidden",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800",
              "text-neutral-600 dark:text-neutral-400",
              "transition-colors"
            )}
            aria-label="Toggle menu"
          >
            {sidebarOpen ? (
              <XIcon className="size-5" />
            ) : (
              <MenuIcon className="size-5" />
            )}
          </button>
          <h1 className="font-bold text-lg text-neutral-900 dark:text-white">
            Mitschreiben
          </h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            {role === "editor" ? "Editor" : "Viewer"}
          </span>
          <button
            onClick={handleLogout}
            className={cn(
              "p-2 rounded-lg",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800",
              "text-neutral-600 dark:text-neutral-400",
              "transition-colors"
            )}
            title="Logout"
          >
            <LogOutIcon className="size-5" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-30 md:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - fixed on mobile, static on desktop */}
        <div
          className={cn(
            "fixed md:static inset-y-0 left-0 z-40 md:z-auto",
            "transform transition-transform duration-200 ease-in-out md:transform-none",
            "pt-14 md:pt-0", // Account for header on mobile
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <DaySidebar selectedDate={selectedDate} onSelectDate={handleSelectDate} />
        </div>

        {/* Main area */}
        <main className="flex-1 overflow-y-auto">
          {selectedDate && <DayView date={selectedDate} />}
        </main>
      </div>
    </div>
  );
}
