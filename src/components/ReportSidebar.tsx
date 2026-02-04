import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getUserId } from "../lib/auth";
import { cn } from "../lib/cn";
import { PlusIcon, FileTextIcon, TrashIcon } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface ReportSidebarProps {
  selectedMonth: string | null;
  onSelectMonth: (month: string) => void;
  onSwitchToNotes: () => void;
  onSwitchToReports: () => void;
  currentView: "notes" | "reports";
  canViewNotes?: boolean;
}

const GERMAN_MONTHS = [
  "Januar",
  "Februar",
  "März",
  "April",
  "Mai",
  "Juni",
  "Juli",
  "August",
  "September",
  "Oktober",
  "November",
  "Dezember",
];

function formatMonth(monthStr: string): string {
  const [year, month] = monthStr.split("-");
  const monthIndex = parseInt(month, 10) - 1;
  return `${GERMAN_MONTHS[monthIndex]} ${year}`;
}

export function ReportSidebar({
  selectedMonth,
  onSelectMonth,
  onSwitchToNotes,
  onSwitchToReports,
  currentView,
  canViewNotes = true,
}: ReportSidebarProps) {
  const userId = getUserId();
  const reports = useQuery(
    api.reports.list,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );
  const createReport = useMutation(api.reports.create);
  const removeReport = useMutation(api.reports.remove);
  const canEdit = !!userId;

  const handleCreateCurrentMonth = async () => {
    if (!userId) return;
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    await createReport({ userId: userId as Id<"users">, month });
    onSelectMonth(month);
  };

  const handleDeleteReport = async (reportId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    if (confirm("Diesen Monat und alle Einträge löschen?")) {
      await removeReport({ userId: userId as Id<"users">, reportId: reportId as Id<"reports"> });
      if (reports && reports.length > 1) {
        const remaining = reports.filter((r) => r._id !== reportId);
        if (remaining.length > 0) {
          onSelectMonth(remaining[remaining.length - 1].month);
        }
      }
    }
  };

  // Sort reports by month (newest first)
  const sortedReports = reports
    ? [...reports].sort((a, b) => b.month.localeCompare(a.month))
    : [];

  return (
    <aside className="w-72 md:w-64 bg-neutral-100 dark:bg-neutral-800 md:dark:bg-neutral-800/50 border-r border-neutral-200 dark:border-neutral-700 h-full flex flex-col">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
          <FileTextIcon className="size-5" />
          Tätigkeitsbericht
        </h2>
      </div>

      {/* Mobile view toggle - only show if user can view notes */}
      {canViewNotes && (
        <div className="sm:hidden p-2 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center gap-1 bg-neutral-200 dark:bg-neutral-700 rounded-lg p-1">
            <button
              onClick={onSwitchToNotes}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                currentView === "notes"
                  ? "bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400",
              )}
            >
              Notizen
            </button>
            <button
              onClick={onSwitchToReports}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                currentView === "reports"
                  ? "bg-white dark:bg-neutral-600 text-neutral-900 dark:text-white shadow-sm"
                  : "text-neutral-600 dark:text-neutral-400",
              )}
            >
              Bericht
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {reports === undefined ? (
          <div className="p-4 text-neutral-500 text-sm">Laden...</div>
        ) : sortedReports.length === 0 ? (
          <div className="p-4 text-neutral-500 text-sm text-center">
            Noch keine Berichte
          </div>
        ) : (
          <ul className="space-y-1">
            {sortedReports.map((report) => (
              <li key={report._id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectMonth(report.month)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onSelectMonth(report.month); }}
                  className={cn(
                    "w-full text-left px-3 py-3 md:py-2 rounded-lg flex items-center justify-between",
                    "transition-colors active:scale-[0.98] cursor-pointer",
                    selectedMonth === report.month
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300",
                  )}
                >
                  <span className="text-sm font-medium">
                    {formatMonth(report.month)}
                  </span>
                  {canEdit && (
                    <button
                      onClick={(e) => handleDeleteReport(report._id, e)}
                      className={cn(
                        "p-1.5 rounded",
                        "hover:bg-red-100 dark:hover:bg-red-900/30",
                        "text-neutral-300 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400",
                        "transition-colors",
                      )}
                    >
                      <TrashIcon className="size-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canEdit && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={handleCreateCurrentMonth}
            className={cn(
              "w-full py-3 md:py-2 px-4 rounded-lg font-medium text-sm",
              "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
              "flex items-center justify-center gap-2",
              "transition-colors active:scale-[0.98]",
            )}
          >
            <PlusIcon className="size-4" />
            Aktuellen Monat hinzufügen
          </button>
        </div>
      )}
    </aside>
  );
}
