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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className={cn(
          "bg-white dark:bg-stone-900 p-4 w-full shadow-xl",
          "sm:rounded-xl sm:max-w-sm sm:mx-4",
          "rounded-t-xl",
          "border-t sm:border border-stone-200 dark:border-stone-800",
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-sm text-stone-900 dark:text-stone-100">
            Farbe auswahlen
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 text-stone-400"
          >
            <XIcon className="size-4" />
          </button>
        </div>

        <div className="grid grid-cols-6 gap-2">
          {TOPIC_COLOR_OPTIONS.map((option) => (
            <button
              key={option.name}
              onClick={() => onSelect(option.name)}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center",
                "active:scale-90 transition-transform",
                option.bg,
                selected === option.name &&
                  "ring-2 ring-offset-2 ring-stone-900 dark:ring-stone-100 dark:ring-offset-stone-900",
              )}
            >
              {selected === option.name && (
                <CheckIcon className={cn("size-4", option.text)} />
              )}
            </button>
          ))}
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
