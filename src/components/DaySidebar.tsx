import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getUserId, isEditor } from "../lib/auth";
import { cn } from "../lib/cn";
import { PlusIcon, CalendarIcon, TrashIcon } from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface DaySidebarProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onSwitchToNotes: () => void;
  onSwitchToReports: () => void;
  currentView: "notes" | "reports";
}

export function DaySidebar({ selectedDate, onSelectDate, onSwitchToNotes, onSwitchToReports, currentView }: DaySidebarProps) {
  const userId = getUserId();
  const days = useQuery(
    api.days.list,
    userId ? { userId: userId as Id<"users"> } : "skip",
  );
  const createDay = useMutation(api.days.create);
  const removeDay = useMutation(api.days.remove);
  const canEdit = isEditor();

  const handleCreateToday = async () => {
    if (!userId) return;
    const today = new Date().toISOString().split("T")[0];
    await createDay({ userId: userId as Id<"users">, date: today });
    onSelectDate(today);
  };

  const handleDeleteDay = async (dayId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userId) return;
    if (confirm("Diesen Tag und alle Stunden loschen?")) {
      await removeDay({ userId: userId as Id<"users">, dayId: dayId as Id<"days"> });
      if (days && days.length > 1) {
        const remaining = days.filter((d) => d._id !== dayId);
        if (remaining.length > 0) {
          onSelectDate(remaining[0].date);
        }
      }
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateOnly = new Date(dateStr + "T00:00:00");

    const diffTime = today.getTime() - dateOnly.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Gestern";
    if (diffDays === -1) return "Morgen";

    return date.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <aside className="w-72 md:w-60 bg-white dark:bg-stone-900 md:bg-stone-50/50 md:dark:bg-stone-900/50 border-r border-stone-200 dark:border-stone-800 h-full flex flex-col">
      <div className="px-4 py-3.5 border-b border-stone-100 dark:border-stone-800">
        <h2 className="font-medium text-sm text-stone-500 dark:text-stone-400 flex items-center gap-2 uppercase tracking-wide">
          <CalendarIcon className="size-4" />
          Tage
        </h2>
      </div>

      {/* Mobile view toggle */}
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

      <div className="flex-1 overflow-y-auto p-2">
        {days === undefined ? (
          <div className="p-4 text-stone-400 text-sm">Laden...</div>
        ) : days.length === 0 ? (
          <div className="p-4 text-stone-400 text-sm text-center">
            Noch keine Tage
          </div>
        ) : (
          <ul className="space-y-0.5">
            {[...days].reverse().map((day) => (
              <li key={day._id}>
                <button
                  onClick={() => onSelectDate(day.date)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 md:py-2 rounded-lg flex items-center justify-between group",
                    "transition-colors",
                    selectedDate === day.date
                      ? "bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900"
                      : "hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-400",
                  )}
                >
                  <span className="text-[13px] font-medium">
                    {formatDate(day.date)}
                  </span>
                  {canEdit && (
                    <button
                      onClick={(e) => void handleDeleteDay(day._id, e)}
                      className={cn(
                        "p-1 rounded opacity-0 group-hover:opacity-100",
                        "transition-opacity",
                        selectedDate === day.date
                          ? "hover:bg-white/20 text-white/60 hover:text-white"
                          : "hover:bg-red-100 dark:hover:bg-red-900/30 text-stone-300 hover:text-red-500 dark:text-stone-600 dark:hover:text-red-400",
                      )}
                    >
                      <TrashIcon className="size-3.5" />
                    </button>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canEdit && (
        <div className="p-3 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={() => void handleCreateToday()}
            className={cn(
              "w-full py-2.5 md:py-2 px-4 rounded-lg font-medium text-[13px]",
              "bg-stone-900 hover:bg-stone-800 active:bg-stone-700 text-white",
              "dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900",
              "flex items-center justify-center gap-2",
              "transition-colors",
            )}
          >
            <PlusIcon className="size-3.5" />
            Heute hinzufugen
          </button>
        </div>
      )}
    </aside>
  );
}
