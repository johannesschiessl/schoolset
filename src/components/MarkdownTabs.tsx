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
    <div className="border border-neutral-200 dark:border-neutral-700 rounded-lg overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-neutral-800">
        <button
          type="button"
          onClick={() => setActiveTab("edit")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "edit"
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-b-2 border-blue-500"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300",
          )}
        >
          Bearbeiten
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("preview")}
          className={cn(
            "px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "preview"
              ? "bg-white dark:bg-neutral-900 text-neutral-900 dark:text-white border-b-2 border-blue-500"
              : "text-neutral-500 dark:text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300",
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
            "w-full min-h-[200px] p-4 resize-y",
            "bg-white dark:bg-neutral-900",
            "text-neutral-900 dark:text-white",
            "placeholder:text-neutral-400 dark:placeholder:text-neutral-500",
            "focus:outline-none",
          )}
        />
      ) : (
        <div className="min-h-[200px] p-4 bg-white dark:bg-neutral-900">
          {value ? (
            <div className="prose dark:prose-invert prose-sm max-w-none">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          ) : (
            <p className="text-neutral-400 dark:text-neutral-500 italic">
              Keine Vorschau verfügbar
            </p>
          )}
        </div>
      )}
    </div>
  );
}
