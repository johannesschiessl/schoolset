import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getStoredPassword, isEditor } from "../lib/auth";
import { cn } from "../lib/cn";
import { PlusIcon, CalendarIcon, TrashIcon } from "lucide-react";

interface DaySidebarProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

export function DaySidebar({ selectedDate, onSelectDate }: DaySidebarProps) {
  const password = getStoredPassword() ?? "";
  const days = useQuery(api.days.list, { password });
  const createDay = useMutation(api.days.create);
  const removeDay = useMutation(api.days.remove);
  const canEdit = isEditor();

  const handleCreateToday = async () => {
    const today = new Date().toISOString().split("T")[0];
    await createDay({ password, date: today });
    onSelectDate(today);
  };

  const handleDeleteDay = async (dayId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Delete this day and all its lessons?")) {
      await removeDay({ password, dayId: dayId as any });
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

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays === -1) return "Tomorrow";

    return date.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  return (
    <aside className="w-72 md:w-64 bg-neutral-100 dark:bg-neutral-800 md:dark:bg-neutral-800/50 border-r border-neutral-200 dark:border-neutral-700 h-full flex flex-col">
      <div className="p-4 border-b border-neutral-200 dark:border-neutral-700">
        <h2 className="font-semibold text-neutral-900 dark:text-white flex items-center gap-2">
          <CalendarIcon className="size-5" />
          Days
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {days === undefined ? (
          <div className="p-4 text-neutral-500 text-sm">Loading...</div>
        ) : days.length === 0 ? (
          <div className="p-4 text-neutral-500 text-sm text-center">
            No days yet
          </div>
        ) : (
          <ul className="space-y-1">
            {[...days].reverse().map((day) => (
              <li key={day._id}>
                <button
                  onClick={() => onSelectDate(day.date)}
                  className={cn(
                    "w-full text-left px-3 py-3 md:py-2 rounded-lg flex items-center justify-between",
                    "transition-colors active:scale-[0.98]",
                    selectedDate === day.date
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                      : "hover:bg-neutral-200 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300",
                  )}
                >
                  <span className="text-sm font-medium">
                    {formatDate(day.date)}
                  </span>
                  {canEdit && (
                    <button
                      onClick={(e) => handleDeleteDay(day._id, e)}
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
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {canEdit && (
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-700">
          <button
            onClick={handleCreateToday}
            className={cn(
              "w-full py-3 md:py-2 px-4 rounded-lg font-medium text-sm",
              "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
              "flex items-center justify-center gap-2",
              "transition-colors active:scale-[0.98]",
            )}
          >
            <PlusIcon className="size-4" />
            Add Today
          </button>
        </div>
      )}
    </aside>
  );
}
