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
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-neutral-800 p-4 w-full shadow-xl",
          "sm:rounded-xl sm:max-w-md sm:mx-4",
          "rounded-t-xl max-h-[80vh] overflow-y-auto",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            Choose an icon
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
          {TOPIC_ICON_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.name}
                onClick={() => onSelect(option.name as TopicIcon)}
                className={cn(
                  "p-3 sm:p-3 rounded-lg flex items-center justify-center",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                  "active:scale-95 transition-all",
                  selected === option.name &&
                    "bg-blue-100 dark:bg-blue-900/30 ring-2 ring-blue-500",
                )}
              >
                <Icon className="size-6 text-neutral-700 dark:text-neutral-300" />
              </button>
            );
          })}
        </div>

        {/* Mobile close button at bottom */}
        <button
          onClick={onClose}
          className={cn(
            "sm:hidden w-full mt-4 py-3 rounded-lg font-medium",
            "bg-neutral-100 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300",
            "active:bg-neutral-200 dark:active:bg-neutral-600",
          )}
        >
          Close
        </button>
      </div>
    </div>
  );
}
