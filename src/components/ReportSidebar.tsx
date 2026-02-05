import { useMutation, useQuery } from "convex/react";
import { FileTextIcon, PlusIcon, TrashIcon } from "lucide-react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { getUserId } from "../lib/auth";
import { cn } from "../lib/cn";

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
  "Marz",
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
    if (confirm("Diesen Monat und alle Eintrage loschen?")) {
      await removeReport({
        userId: userId as Id<"users">,
        reportId: reportId as Id<"reports">,
      });
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
    <aside className="w-72 md:w-60 bg-white dark:bg-stone-900 md:bg-stone-50/50 md:dark:bg-stone-900/50 border-r border-stone-200 dark:border-stone-800 h-full flex flex-col">
      <div className="px-4 py-3.5 border-b border-stone-100 dark:border-stone-800">
        <h2 className="font-medium text-sm text-stone-500 dark:text-stone-400 flex items-center gap-2 uppercase tracking-wide">
          <FileTextIcon className="size-4" />
          Berichte
        </h2>
      </div>

      {/* Mobile view toggle - only show if user can view notes */}
      {canViewNotes && (
        <div className="sm:hidden p-2 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-0.5 bg-stone-100 dark:bg-stone-800 rounded-lg p-0.5">
            <button
              onClick={onSwitchToNotes}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                currentView === "notes"
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                  : "text-stone-500 dark:text-stone-400",
              )}
            >
              Mitschreiben
            </button>
            <button
              onClick={onSwitchToReports}
              className={cn(
                "flex-1 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                currentView === "reports"
                  ? "bg-white dark:bg-stone-700 text-stone-900 dark:text-stone-100 shadow-sm"
                  : "text-stone-500 dark:text-stone-400",
              )}
            >
              Bericht
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto p-2">
        {reports === undefined ? (
          <div className="p-4 text-stone-400 text-sm">Laden...</div>
        ) : sortedReports.length === 0 ? (
          <div className="p-4 text-stone-400 text-sm text-center">
            Noch keine Berichte
          </div>
        ) : (
          <ul className="space-y-0.5">
            {sortedReports.map((report) => (
              <li key={report._id}>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => onSelectMonth(report.month)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      onSelectMonth(report.month);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2.5 md:py-2 rounded-lg flex items-center justify-between group",
                    "transition-colors cursor-pointer",
                    selectedMonth === report.month
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                      : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400",
                  )}
                >
                  <span className="text-[13px] font-medium">
                    {formatMonth(report.month)}
                  </span>
                  {canEdit && (
                    <button
                      onClick={(e) => void handleDeleteReport(report._id, e)}
                      className={cn(
                        "p-1 rounded opacity-0 group-hover:opacity-100",
                        "transition-opacity",
                        selectedMonth === report.month
                          ? "hover:bg-white/20 text-white/60 hover:text-white"
                          : "hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-300 hover:text-red-500 dark:text-stone-600 dark:hover:text-red-400",
                      )}
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canEdit && (
        <div className="p-3 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={() => void handleCreateCurrentMonth()}
            className={cn(
              "w-full py-2.5 md:py-2 px-4 rounded-lg font-medium text-[13px]",
              "bg-stone-900 hover:bg-stone-800 active:bg-stone-700 text-white",
              "dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900",
              "flex items-center justify-center gap-2",
              "transition-colors",
            )}
          >
            <PlusIcon className="size-3.5" />
            Aktuellen Monat hinzufugen
          </button>
        </div>
      )}
    </aside>
  );
}
