import { TOPIC_COLOR_OPTIONS } from "../constants";
import { cn } from "../lib/cn";
import { XIcon, CheckIcon } from "lucide-react";
import type { TopicColor } from "../LessonIcon";

interface ColorPickerProps {
  selected: TopicColor;
  onSelect: (color: TopicColor) => void;
  onClose: () => void;
}

export function ColorPicker({ selected, onSelect, onClose }: ColorPickerProps) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-neutral-800 p-4 w-full shadow-xl",
          "sm:rounded-xl sm:max-w-sm sm:mx-4",
          "rounded-t-xl",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            Choose a color
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-500"
          >
            <XIcon className="size-5" />
          </button>
        </div>

        <div className="grid grid-cols-6 gap-2 sm:gap-2">
          {TOPIC_COLOR_OPTIONS.map((option) => (
            <button
              key={option.name}
              onClick={() => onSelect(option.name as TopicColor)}
              className={cn(
                "w-10 h-10 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center",
                "active:scale-90 transition-transform",
                option.bg,
                selected === option.name &&
                  "ring-2 ring-offset-2 ring-blue-500",
              )}
            >
              {selected === option.name && (
                <CheckIcon className={cn("size-5", option.text)} />
              )}
            </button>
          ))}
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
