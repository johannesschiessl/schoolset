import { useState } from "react";
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
  const [prevIsOpen, setPrevIsOpen] = useState(false);

  if (isOpen && !prevIsOpen) {
    setPrevIsOpen(true);
    if (initialData) {
      setDate(initialData.date);
      setSubject(initialData.subject);
      setDescription(initialData.description);
    } else {
      setDate(`${month}-01`);
      setSubject("");
      setDescription("");
    }
  }
  if (!isOpen && prevIsOpen) {
    setPrevIsOpen(false);
  }

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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div
        className={cn(
          "relative w-full max-w-2xl max-h-[90vh] overflow-y-auto",
          "bg-white dark:bg-stone-900 rounded-xl shadow-xl",
          "border border-stone-200 dark:border-stone-800",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-stone-100 dark:border-stone-800">
          <h2 className="text-base font-medium text-stone-900 dark:text-stone-100">
            {initialData ? "Eintrag bearbeiten" : "Neuer Eintrag"}
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "p-1.5 rounded-lg",
              "hover:bg-stone-100 dark:hover:bg-stone-800",
              "text-stone-400 dark:text-stone-500",
              "transition-colors",
            )}
          >
            <XIcon className="size-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-[13px] font-medium text-stone-500 dark:text-stone-400 mb-1.5">
              Datum
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm",
                "bg-stone-50 dark:bg-stone-800",
                "border border-stone-200 dark:border-stone-700",
                "text-stone-900 dark:text-stone-100",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500",
              )}
            />
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[13px] font-medium text-stone-500 dark:text-stone-400 mb-1.5">
              Betreff
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="z.B. Meeting, Entwicklung, etc."
              required
              className={cn(
                "w-full px-3 py-2 rounded-lg text-sm",
                "bg-stone-50 dark:bg-stone-800",
                "border border-stone-200 dark:border-stone-700",
                "text-stone-900 dark:text-stone-100",
                "placeholder:text-stone-400 dark:placeholder:text-stone-500",
                "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500",
              )}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-medium text-stone-500 dark:text-stone-400 mb-1.5">
              Beschreibung (Markdown)
            </label>
            <MarkdownTabs
              value={description}
              onChange={setDescription}
              placeholder="Beschreibung der Tatigkeit..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm",
                "hover:bg-stone-100 dark:hover:bg-stone-800",
                "text-stone-500 dark:text-stone-400",
                "transition-colors",
              )}
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className={cn(
                "px-4 py-2 rounded-lg font-medium text-sm",
                "bg-stone-900 hover:bg-stone-800 text-white",
                "dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900",
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
