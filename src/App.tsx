import { LogOutIcon, MenuIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { DaySidebar } from "./components/DaySidebar";
import { DayView } from "./components/DayView";
import { LoginScreen } from "./components/LoginScreen";
import { ReportSidebar } from "./components/ReportSidebar";
import { ReportView } from "./components/ReportView";
import {
  canViewItems,
  clearSession,
  getStoredSession,
  type UserSession,
} from "./lib/auth";
import { cn } from "./lib/cn";

type ViewType = "notes" | "reports";

function getDateFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("day");
}

function getViewFromUrl(): ViewType {
  const params = new URLSearchParams(window.location.search);
  const view = params.get("view");
  return view === "reports" ? "reports" : "notes";
}

function getMonthFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get("month");
}

function setDateInUrl(date: string | null) {
  const url = new URL(window.location.href);
  if (date) {
    url.searchParams.set("day", date);
  } else {
    url.searchParams.delete("day");
  }
  url.searchParams.delete("view");
  url.searchParams.delete("month");
  window.history.pushState({}, "", url.toString());
}

function setReportViewInUrl(month: string | null) {
  const url = new URL(window.location.href);
  url.searchParams.set("view", "reports");
  if (month) {
    url.searchParams.set("month", month);
  } else {
    url.searchParams.delete("month");
  }
  url.searchParams.delete("day");
  window.history.pushState({}, "", url.toString());
}

function getPermissionLabel(permissions: string): string {
  switch (permissions) {
    case "editor":
      return "Bearbeiter";
    case "viewer":
      return "Betrachter";
    case "none":
      return "Nur Berichte";
    default:
      return permissions;
  }
}

export default function App() {
  const [session, setSession] = useState<UserSession | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>("notes");
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // Check for existing session on mount
  useEffect(() => {
    const storedSession = getStoredSession();
    if (storedSession) {
      setSession(storedSession);
    }
  }, []);

  // Initialize view and selected date/month from URL
  // Also handle permission-based view restrictions
  useEffect(() => {
    if (!session) return;

    const canSeeItems = canViewItems();
    const view = getViewFromUrl();

    // If user has "none" permission, force reports view
    if (!canSeeItems) {
      setCurrentView("reports");
      const urlMonth = getMonthFromUrl();
      if (urlMonth) {
        setSelectedMonth(urlMonth);
      } else {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        setSelectedMonth(currentMonth);
        setReportViewInUrl(currentMonth);
      }
      return;
    }

    setCurrentView(view);

    if (view === "reports") {
      const urlMonth = getMonthFromUrl();
      if (urlMonth) {
        setSelectedMonth(urlMonth);
      } else {
        const now = new Date();
        const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
        setSelectedMonth(currentMonth);
      }
    } else {
      const urlDate = getDateFromUrl();
      if (urlDate) {
        setSelectedDate(urlDate);
      } else {
        const today = new Date().toISOString().split("T")[0];
        setSelectedDate(today);
      }
    }
  }, [session]);

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
    setSidebarOpen(false);
  }, []);

  const handleSelectMonth = useCallback((month: string) => {
    setSelectedMonth(month);
    setReportViewInUrl(month);
    setSidebarOpen(false);
  }, []);

  const handleSwitchToNotes = useCallback(() => {
    if (!canViewItems()) return;
    setCurrentView("notes");
    const date = selectedDate || new Date().toISOString().split("T")[0];
    setSelectedDate(date);
    setDateInUrl(date);
  }, [selectedDate]);

  const handleSwitchToReports = useCallback(() => {
    setCurrentView("reports");
    const month =
      selectedMonth ||
      `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    setSelectedMonth(month);
    setReportViewInUrl(month);
  }, [selectedMonth]);

  const handleLogin = (newSession: UserSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    clearSession();
    setSession(null);
  };

  if (!session) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  const canSeeItems = canViewItems();

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
              "transition-colors",
            )}
            aria-label="Menü umschalten"
          >
            {sidebarOpen ? (
              <XIcon className="size-5" />
            ) : (
              <MenuIcon className="size-5" />
            )}
          </button>
          <h1 className="font-bold text-lg text-neutral-900 dark:text-white">
            Schoolset
          </h1>
          {/* View toggle - only show if user can view items */}
          {canSeeItems && (
            <div className="hidden sm:flex items-center gap-1 ml-4 bg-neutral-100 dark:bg-neutral-800 rounded-lg p-1">
              <button
                onClick={handleSwitchToNotes}
                className={cn(
                  "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                  currentView === "notes"
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
                )}
              >
                Mitschreiben
              </button>
              <button
                onClick={handleSwitchToReports}
                className={cn(
                  "px-3 py-1 rounded-md text-sm font-medium transition-colors",
                  currentView === "reports"
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white",
                )}
              >
                Bericht
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <span className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            {session.username} ({getPermissionLabel(session.permissions)})
          </span>
          <button
            onClick={handleLogout}
            className={cn(
              "p-2 rounded-lg",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800",
              "text-neutral-600 dark:text-neutral-400",
              "transition-colors",
            )}
            title="Abmelden"
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
            "pt-14 md:pt-0",
            "bg-neutral-100 dark:bg-neutral-800 md:bg-transparent md:dark:bg-transparent",
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full md:translate-x-0",
          )}
        >
          {currentView === "notes" && canSeeItems ? (
            <DaySidebar
              selectedDate={selectedDate}
              onSelectDate={handleSelectDate}
              onSwitchToNotes={handleSwitchToNotes}
              onSwitchToReports={handleSwitchToReports}
              currentView={currentView}
            />
          ) : (
            <ReportSidebar
              selectedMonth={selectedMonth}
              onSelectMonth={handleSelectMonth}
              onSwitchToNotes={handleSwitchToNotes}
              onSwitchToReports={handleSwitchToReports}
              currentView={currentView}
              canViewNotes={canSeeItems}
            />
          )}
        </div>

        {/* Main area */}
        <main className="flex-1 overflow-y-auto">
          {currentView === "notes" && canSeeItems
            ? selectedDate && <DayView date={selectedDate} />
            : selectedMonth && <ReportView month={selectedMonth} />}
        </main>
      </div>
    </div>
  );
}
