import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getUserId, isEditor } from "../lib/auth";
import { cn } from "../lib/cn";
import {
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PaperclipIcon,
} from "lucide-react";
import { AttachmentList } from "./AttachmentList";
import { FileUpload } from "./FileUpload";
import type { Id } from "../../convex/_generated/dataModel";

interface Item {
  _id: Id<"items">;
  content: string;
  order: number;
}

interface ItemRowProps {
  item: Item;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function ItemRow({
  item,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: ItemRowProps) {
  const userId = getUserId();
  const updateItem = useMutation(api.items.update);
  const removeItem = useMutation(api.items.remove);
  const canEdit = isEditor();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [showUpload, setShowUpload] = useState(false);

  const handleSave = async () => {
    if (!userId) return;
    if (editContent.trim() && editContent !== item.content) {
      await updateItem({
        userId: userId as Id<"users">,
        itemId: item._id,
        content: editContent.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!userId) return;
    if (confirm("Diesen Eintrag loschen?")) {
      await removeItem({ userId: userId as Id<"users">, itemId: item._id });
    }
  };

  return (
    <li>
      <div className="flex items-start gap-2.5 sm:gap-3 p-3 sm:p-3.5 group">
        <div className="w-1.5 h-1.5 rounded-full bg-stone-300 dark:bg-stone-600 mt-2 flex-shrink-0" />

        {isEditing ? (
          <div className="flex-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg border bg-white dark:bg-stone-800",
                "text-stone-900 dark:text-stone-100 text-sm",
                "border-blue-500 focus:outline-none",
                "resize-none",
              )}
              rows={4}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) void handleSave();
                if (e.key === "Escape") {
                  setEditContent(item.content);
                  setIsEditing(false);
                }
              }}
            />
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => {
                  setEditContent(item.content);
                  setIsEditing(false);
                }}
                className="px-3 py-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => void handleSave()}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-sm font-medium",
                  "bg-stone-900 hover:bg-stone-800 text-white",
                  "dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900",
                  "transition-colors",
                )}
              >
                Speichern
              </button>
            </div>
          </div>
        ) : (
          <p className="flex-1 text-stone-600 dark:text-stone-300 whitespace-pre-wrap text-sm leading-relaxed">
            {item.content}
          </p>
        )}

        {canEdit && !isEditing && (
          <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {!isFirst && (
              <button
                onClick={onMoveUp}
                className={cn(
                  "p-1.5 rounded-lg",
                  "hover:bg-stone-100 dark:hover:bg-stone-800",
                  "text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400",
                  "transition-colors",
                )}
                title="Nach oben"
              >
                <ArrowUpIcon className="size-3.5" />
              </button>
            )}
            {!isLast && (
              <button
                onClick={onMoveDown}
                className={cn(
                  "p-1.5 rounded-lg",
                  "hover:bg-stone-100 dark:hover:bg-stone-800",
                  "text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400",
                  "transition-colors",
                )}
                title="Nach unten"
              >
                <ArrowDownIcon className="size-3.5" />
              </button>
            )}
            <button
              onClick={() => setShowUpload(true)}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-stone-100 dark:hover:bg-stone-800",
                "text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400",
                "transition-colors",
              )}
              title="Anhang hinzufugen"
            >
              <PaperclipIcon className="size-3.5" />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-stone-100 dark:hover:bg-stone-800",
                "text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400",
                "transition-colors",
              )}
              title="Bearbeiten"
            >
              <PencilIcon className="size-3.5" />
            </button>
            <button
              onClick={() => void handleDelete()}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-red-50 dark:hover:bg-red-900/20",
                "text-stone-300 hover:text-red-500 dark:text-stone-600 dark:hover:text-red-400",
                "transition-colors",
              )}
              title="Loschen"
            >
              <TrashIcon className="size-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* Attachments */}
      <AttachmentList itemId={item._id} />

      {/* File upload modal */}
      {showUpload && (
        <FileUpload itemId={item._id} onClose={() => setShowUpload(false)} />
      )}
    </li>
  );
}
