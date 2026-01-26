import ReactMarkdown from "react-markdown";
import { cn } from "../lib/cn";
import { isEditor } from "../lib/auth";
import {
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
} from "lucide-react";

interface ReportItemCardProps {
  item: {
    _id: string;
    date: string;
    subject: string;
    description: string;
    order: number;
  };
  isFirst: boolean;
  isLast: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

const GERMAN_WEEKDAYS = [
  "Sonntag",
  "Montag",
  "Dienstag",
  "Mittwoch",
  "Donnerstag",
  "Freitag",
  "Samstag",
];

function formatDate(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  const weekday = GERMAN_WEEKDAYS[date.getDay()];
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${weekday}, ${day}.${month}.${year}`;
}

export function ReportItemCard({
  item,
  isFirst,
  isLast,
  onEdit,
  onDelete,
  onMoveUp,
  onMoveDown,
}: ReportItemCardProps) {
  const canEdit = isEditor();

  return (
    <div
      className={cn(
        "border border-neutral-200 dark:border-neutral-700 rounded-lg",
        "bg-white dark:bg-neutral-800/50",
        "overflow-hidden",
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border-b border-neutral-200 dark:border-neutral-700">
        <div>
          <div className="text-sm text-neutral-500 dark:text-neutral-400">
            {formatDate(item.date)}
          </div>
          <h3 className="font-semibold text-neutral-900 dark:text-white">
            {item.subject}
          </h3>
        </div>

        {canEdit && (
          <div className="flex items-center gap-1">
            {/* Reorder buttons */}
            <button
              onClick={onMoveUp}
              disabled={isFirst}
              className={cn(
                "p-1.5 rounded",
                "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
                "transition-colors",
                "disabled:opacity-30 disabled:cursor-not-allowed",
              )}
              title="Nach oben"
            >
              <ChevronUpIcon className="size-4" />
            </button>
            <button
              onClick={onMoveDown}
              disabled={isLast}
              className={cn(
                "p-1.5 rounded",
                "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
                "transition-colors",
                "disabled:opacity-30 disabled:cursor-not-allowed",
              )}
              title="Nach unten"
            >
              <ChevronDownIcon className="size-4" />
            </button>

            {/* Edit button */}
            <button
              onClick={onEdit}
              className={cn(
                "p-1.5 rounded",
                "hover:bg-blue-100 dark:hover:bg-blue-900/30",
                "text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400",
                "transition-colors",
              )}
              title="Bearbeiten"
            >
              <PencilIcon className="size-4" />
            </button>

            {/* Delete button */}
            <button
              onClick={onDelete}
              className={cn(
                "p-1.5 rounded",
                "hover:bg-red-100 dark:hover:bg-red-900/30",
                "text-neutral-400 hover:text-red-600 dark:hover:text-red-400",
                "transition-colors",
              )}
              title="Löschen"
            >
              <TrashIcon className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {item.description ? (
          <div className="prose dark:prose-invert prose-sm max-w-none">
            <ReactMarkdown>{item.description}</ReactMarkdown>
          </div>
        ) : (
          <p className="text-neutral-400 dark:text-neutral-500 italic text-sm">
            Keine Beschreibung
          </p>
        )}
      </div>
    </div>
  );
}
