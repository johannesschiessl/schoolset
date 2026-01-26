import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getStoredPassword, isEditor } from "../lib/auth";
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
  const password = getStoredPassword() ?? "";
  const updateItem = useMutation(api.items.update);
  const removeItem = useMutation(api.items.remove);
  const canEdit = isEditor();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(item.content);
  const [showUpload, setShowUpload] = useState(false);

  const handleSave = async () => {
    if (editContent.trim() && editContent !== item.content) {
      await updateItem({
        password,
        itemId: item._id,
        content: editContent.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("Delete this item?")) {
      await removeItem({ password, itemId: item._id });
    }
  };

  return (
    <li>
      <div className="flex items-start gap-2 sm:gap-3 p-3 sm:p-4">
        <div className="w-2 h-2 rounded-full bg-neutral-300 dark:bg-neutral-600 mt-2 flex-shrink-0" />

        {isEditing ? (
          <div className="flex-1">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className={cn(
                "w-full px-3 py-2 rounded-lg border bg-white dark:bg-neutral-700",
                "text-neutral-900 dark:text-white text-base sm:text-sm",
                "border-blue-500 focus:outline-none",
                "resize-none",
              )}
              rows={4}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                  void handleSave();
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
                className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  void handleSave();
                }}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
                )}
              >
                Save
              </button>
            </div>
          </div>
        ) : (
          <p className="flex-1 text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap text-sm sm:text-base leading-relaxed">
            {item.content}
          </p>
        )}

        {canEdit && !isEditing && (
          <div className="flex items-center gap-0.5 flex-shrink-0">
            {!isFirst && (
              <button
                onClick={onMoveUp}
                className={cn(
                  "p-1.5 rounded-lg",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                  "text-neutral-300 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-300",
                  "transition-colors",
                )}
                title="Move up"
              >
                <ArrowUpIcon className="size-4" />
              </button>
            )}
            {!isLast && (
              <button
                onClick={onMoveDown}
                className={cn(
                  "p-1.5 rounded-lg",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                  "text-neutral-300 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-300",
                  "transition-colors",
                )}
                title="Move down"
              >
                <ArrowDownIcon className="size-4" />
              </button>
            )}
            <button
              onClick={() => setShowUpload(true)}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                "text-neutral-300 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-300",
                "transition-colors",
              )}
              title="Add attachment"
            >
              <PaperclipIcon className="size-4" />
            </button>
            <button
              onClick={() => setIsEditing(true)}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                "text-neutral-300 hover:text-neutral-500 dark:text-neutral-500 dark:hover:text-neutral-300",
                "transition-colors",
              )}
              title="Edit"
            >
              <PencilIcon className="size-4" />
            </button>
            <button
              onClick={() => {
                void handleDelete();
              }}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-red-100 dark:hover:bg-red-900/30",
                "text-neutral-300 hover:text-red-500 dark:text-neutral-500 dark:hover:text-red-400",
                "transition-colors",
              )}
              title="Delete"
            >
              <TrashIcon className="size-4" />
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
