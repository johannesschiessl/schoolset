import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "../lib/cn";

interface MarkdownTabsProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MarkdownTabs({
  value,
  onChange,
  placeholder,
}: MarkdownTabsProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");

  return (
    <div className="border border-stone-200 dark:border-stone-700 rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800">
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={cn(
            "px-4 py-2 text-[13px] font-medium transition-colors",
            activeTab === "edit"
              ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100"
              : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300",
          )}
        >
          Bearbeiten
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={cn(
            "px-4 py-2 text-[13px] font-medium transition-colors",
            activeTab === "preview"
              ? "bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 border-b-2 border-stone-900 dark:border-stone-100"
              : "text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-300",
          )}
        >
          Vorschau
        </button>
      </div>

      {/* Content */}
      {activeTab === "edit" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full min-h-[200px] p-4 resize-y text-sm",
            "bg-white dark:bg-stone-900",
            "text-stone-900 dark:text-stone-100",
            "placeholder:text-stone-400 dark:placeholder:text-stone-500",
            "focus:outline-none",
          )}
        />
      ) : (
        <div className="min-h-[200px] p-4 bg-white dark:bg-stone-900">
          {value ? (
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-stone-400 dark:text-stone-500 italic text-sm">
              Keine Vorschau verfugbar
            </p>
          )}
        </div>
      )}
    </div>
  );
}
