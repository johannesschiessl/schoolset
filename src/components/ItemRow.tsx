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
  MoreVerticalIcon,
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
  const [showMobileMenu, setShowMobileMenu] = useState(false);

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
    <li className="group">
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
                "resize-none"
              )}
              rows={4}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSave();
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
                onClick={handleSave}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white"
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
          <>
            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {!isFirst && (
                <button
                  onClick={onMoveUp}
                  className={cn(
                    "p-1.5 rounded-lg",
                    "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                    "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
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
                    "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
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
                  "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
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
                  "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                )}
                title="Edit"
              >
                <PencilIcon className="size-4" />
              </button>
              <button
                onClick={handleDelete}
                className={cn(
                  "p-1.5 rounded-lg",
                  "hover:bg-red-100 dark:hover:bg-red-900/30",
                  "text-neutral-400 hover:text-red-600"
                )}
                title="Delete"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="relative sm:hidden">
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={cn(
                  "p-2 rounded-lg -mr-1",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                  "text-neutral-400"
                )}
              >
                <MoreVerticalIcon className="size-5" />
              </button>

              {/* Mobile dropdown menu */}
              {showMobileMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowMobileMenu(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 min-w-36">
                    {!isFirst && (
                      <button
                        onClick={() => {
                          onMoveUp();
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3"
                      >
                        <ArrowUpIcon className="size-4" />
                        Move up
                      </button>
                    )}
                    {!isLast && (
                      <button
                        onClick={() => {
                          onMoveDown();
                          setShowMobileMenu(false);
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3"
                      >
                        <ArrowDownIcon className="size-4" />
                        Move down
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setShowUpload(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3"
                    >
                      <PaperclipIcon className="size-4" />
                      Attach file
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3"
                    >
                      <PencilIcon className="size-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        handleDelete();
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 flex items-center gap-3"
                    >
                      <TrashIcon className="size-4" />
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>

      {/* Attachments */}
      <AttachmentList itemId={item._id} />

      {/* File upload modal */}
      {showUpload && (
        <FileUpload
          itemId={item._id}
          onClose={() => setShowUpload(false)}
        />
      )}
    </li>
  );
}
