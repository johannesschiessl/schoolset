import { useState, useEffect } from "react";
import { MarkdownTabs } from "./MarkdownTabs";
import { cn } from "../lib/cn";
import { XIcon } from "lucide-react";

interface ReportItemEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: {
    date: string;
    subject: string;
    description: string;
  }) => void;
  initialData?: {
    date: string;
    subject: string;
    description: string;
  };
  month: string; // "YYYY-MM" - used to set default date
}

export function ReportItemEditor({
  isOpen,
  onClose,
  onSave,
  initialData,
  month,
}: ReportItemEditorProps) {
  const [date, setDate] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setDate(initialData.date);
        setSubject(initialData.subject);
        setDescription(initialData.description);
      } else {
        // Default to first day of the month
        setDate(`${month}-01`);
        setSubject("");
        setDescription("");
      }
    }
  }, [isOpen, initialData, month]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (date && subject) {
      onSave({ date, subject, description });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-2xl max-h-[90vh] overflow-y-auto",
          "bg-white dark:bg-neutral-900 rounded-xl shadow-xl",
          "border border-neutral-200 dark:border-neutral-700",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-white">
            {initialData ? "Eintrag bearbeiten" : "Neuer Eintrag"}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "p-2 rounded-lg",
              "hover:bg-neutral-100 dark:hover:bg-neutral-800",
              "text-neutral-500 dark:text-neutral-400",
              "transition-colors",
            )}
          >
            <XIcon className="size-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Datum
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-white dark:bg-neutral-800",
                "border border-neutral-200 dark:border-neutral-700",
                "text-neutral-900 dark:text-white",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
              )}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Betreff
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="z.B. Meeting, Entwicklung, etc."
              required
              className={cn(
                "w-full px-3 py-2 rounded-lg",
                "bg-white dark:bg-neutral-800",
                "border border-neutral-200 dark:border-neutral-700",
                "text-neutral-900 dark:text-white",
                "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
                "focus:outline-none focus:ring-2 focus:ring-blue-500",
              )}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
              Beschreibung (Markdown)
            </label>
            <MarkdownTabs
              value={description}
              onChange={setDescription}
              placeholder="Beschreibung der Tätigkeit..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm",
                "bg-neutral-100 dark:bg-neutral-800",
                "hover:bg-neutral-200 dark:hover:bg-neutral-700",
                "text-neutral-700 dark:text-neutral-300",
                "transition-colors",
              )}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm",
                "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
                "text-white",
                "transition-colors",
              )}
            >
              Speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
