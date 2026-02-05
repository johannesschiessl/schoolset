import { TOPIC_ICON_OPTIONS } from "../constants";
import { cn } from "../lib/cn";
import { XIcon } from "lucide-react";
import type { TopicIcon } from "../LessonIcon";

interface IconPickerProps {
  selected: TopicIcon;
  onSelect: (icon: TopicIcon) => void;
  onClose: () => void;
}

export function IconPicker({ selected, onSelect, onClose }: IconPickerProps) {
  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-stone-900 p-4 w-full shadow-xl",
          "sm:rounded-xl sm:max-w-md sm:mx-4",
          "rounded-t-xl max-h-[80vh] overflow-y-auto",
          "border-t sm:border border-stone-200 dark:border-stone-800",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm text-stone-900 dark:text-stone-100">
            Symbol auswahlen
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-6 gap-1.5">
          {TOPIC_ICON_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.name}
                onClick={() => onSelect(option.name)}
                className={cn(
                  "p-3 rounded-lg flex items-center justify-center",
                  "hover:bg-stone-100 dark:hover:bg-stone-800",
                  "active:scale-95 transition-all",
                  selected === option.name &&
                    "bg-stone-900 dark:bg-stone-100",
                )}
              >
                <Icon className={cn(
                  "size-5",
                  selected === option.name
                    ? "text-white dark:text-stone-900"
                    : "text-stone-600 dark:text-stone-400",
                )} />
              </button>
            );
          })}
        </div>

        {/* Mobile close button at bottom */}
        <button
          onClick={onClose}
          className={cn(
            "sm:hidden w-full mt-4 py-3 rounded-lg font-medium text-sm",
            "bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300",
          )}
        >
          Schliessen
        </button>
      </div>
    </div>
  );
}
