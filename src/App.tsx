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
  const [session, setSession] = useState<UserSession | null>(() => getStoredSession());
  const [selectedDate, setSelectedDate] = useState<string | null>(() => {
    if (!getStoredSession() || !canViewItems()) return null;
    if (getViewFromUrl() === "reports") return null;
    return getDateFromUrl() || new Date().toISOString().split("T")[0];
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    if (!getStoredSession()) return "notes";
    if (!canViewItems()) return "reports";
    return getViewFromUrl();
  });
  const [selectedMonth, setSelectedMonth] = useState<string | null>(() => {
    if (!getStoredSession()) return null;
    const effectiveView = !canViewItems() ? "reports" : getViewFromUrl();
    if (effectiveView !== "reports") return null;
    return getMonthFromUrl() || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
  });

  // Sync URL for forced reports view on mount
  useEffect(() => {
    if (session && !canViewItems() && !getMonthFromUrl() && selectedMonth) {
      setReportViewInUrl(selectedMonth);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // Initialize view state for new login
    const canSeeItems = canViewItems();
    const view = getViewFromUrl();
    if (!canSeeItems) {
      setCurrentView("reports");
      const urlMonth = getMonthFromUrl();
      const month = urlMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
      setSelectedMonth(month);
      if (!urlMonth) setReportViewInUrl(month);
    } else {
      setCurrentView(view);
      if (view === "reports") {
        setSelectedMonth(getMonthFromUrl() || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`);
      } else {
        setSelectedDate(getDateFromUrl() || new Date().toISOString().split("T")[0]);
      }
    }
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
    <div className="h-screen flex flex-col bg-stone-50 dark:bg-stone-950">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-4 sm:px-5 border-b border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 flex-shrink-0 z-20">
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className={cn(
              "p-2 -ml-2 rounded-lg md:hidden",
              "hover:bg-stone-100 dark:hover:bg-stone-800",
              "text-stone-500 dark:text-stone-400",
              "transition-colors",
            )}
            aria-label="Menu umschalten"
          >
            {sidebarOpen ? (
              <XIcon className="size-5" />
            ) : (
              <MenuIcon className="size-5" />
            )}
          </button>
          <h1 className="font-semibold text-base tracking-tight text-stone-900 dark:text-stone-100">
            Schoolset
          </h1>
          {/* View toggle - only show if user can view items */}
          {canSeeItems && (
            <div className="hidden sm:flex items-center gap-0.5 ml-3 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
              <button
                onClick={handleSwitchToNotes}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                  currentView === "notes"
                    ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200",
                )}
              >
                Mitschreiben
              </button>
              <button
                onClick={handleSwitchToReports}
                className={cn(
                  "px-3 py-1.5 rounded-md text-[13px] font-medium transition-colors",
                  currentView === "reports"
                    ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                    : "text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200",
                )}
              >
                Bericht
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs text-stone-400 dark:text-stone-500">
            {session.username}
            <span className="hidden sm:inline">
              {" "}
              &middot; {getPermissionLabel(session.permissions)}
            </span>
          </span>
          <button
            onClick={handleLogout}
            className={cn(
              "p-2 rounded-lg",
              "hover:bg-stone-100 dark:hover:bg-stone-800",
              "text-stone-400 dark:text-stone-500",
              "transition-colors",
            )}
            title="Abmelden"
          >
            <LogOutIcon className="size-4" />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-30 md:hidden backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar - fixed on mobile, static on desktop */}
        <div
          className={cn(
            "fixed md:static inset-y-0 left-0 z-40 md:z-auto",
            "transform transition-transform duration-200 ease-in-out md:transform-none",
            "pt-14 md:pt-0",
            "bg-white dark:bg-stone-900 md:bg-transparent md:dark:bg-transparent",
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
