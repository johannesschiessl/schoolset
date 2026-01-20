import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getStoredPassword, isEditor } from "../lib/auth";
import { LessonIcon, type TopicIcon, type TopicColor } from "../LessonIcon";
import { ItemRow } from "./ItemRow";
import { IconPicker } from "./IconPicker";
import { ColorPicker } from "./ColorPicker";
import { cn } from "../lib/cn";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  MoreVerticalIcon,
} from "lucide-react";
import type { Id } from "../../convex/_generated/dataModel";

interface Lesson {
  _id: Id<"lessons">;
  name: string;
  icon: string;
  color: string;
  order: number;
}

interface LessonCardProps {
  lesson: Lesson;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function LessonCard({
  lesson,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
}: LessonCardProps) {
  const password = getStoredPassword() ?? "";
  const items = useQuery(api.items.listByLesson, {
    password,
    lessonId: lesson._id,
  });
  const updateLesson = useMutation(api.lessons.update);
  const removeLesson = useMutation(api.lessons.remove);
  const createItem = useMutation(api.items.create);
  const reorderItem = useMutation(api.items.reorder);
  const canEdit = isEditor();

  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(lesson.name);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [newItemContent, setNewItemContent] = useState("");
  const [showNewItem, setShowNewItem] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleSaveName = async () => {
    if (editName.trim() && editName !== lesson.name) {
      await updateLesson({
        password,
        lessonId: lesson._id,
        name: editName.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (confirm("Delete this lesson and all its items?")) {
      await removeLesson({ password, lessonId: lesson._id });
    }
  };

  const handleAddItem = async () => {
    if (!newItemContent.trim()) return;
    await createItem({
      password,
      lessonId: lesson._id,
      content: newItemContent.trim(),
    });
    setNewItemContent("");
    setShowNewItem(false);
  };

  const handleMoveItem = async (itemId: Id<"items">, direction: "up" | "down") => {
    if (!items) return;
    const item = items.find((i) => i._id === itemId);
    if (!item) return;
    const newOrder = direction === "up" ? item.order - 1 : item.order + 1;
    if (newOrder < 0 || newOrder >= items.length) return;
    await reorderItem({ password, itemId, newOrder });
  };

  const handleIconSelect = async (icon: TopicIcon) => {
    await updateLesson({ password, lessonId: lesson._id, icon });
    setShowIconPicker(false);
  };

  const handleColorSelect = async (color: TopicColor) => {
    await updateLesson({ password, lessonId: lesson._id, color });
    setShowColorPicker(false);
  };

  return (
    <div className="bg-white dark:bg-neutral-800 rounded-xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2 sm:gap-3 p-3 sm:p-4 cursor-pointer",
          "hover:bg-neutral-50 dark:hover:bg-neutral-750",
          "active:bg-neutral-100 dark:active:bg-neutral-700"
        )}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (canEdit) setShowIconPicker(true);
          }}
          className={cn(!canEdit && "cursor-default")}
        >
          <LessonIcon
            icon={lesson.icon as TopicIcon}
            color={lesson.color as TopicColor}
            size="default"
          />
        </button>

        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            onBlur={handleSaveName}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveName();
              if (e.key === "Escape") {
                setEditName(lesson.name);
                setIsEditing(false);
              }
            }}
            className={cn(
              "flex-1 px-2 py-1 rounded border bg-white dark:bg-neutral-700",
              "text-neutral-900 dark:text-white text-sm sm:text-base",
              "border-blue-500 focus:outline-none"
            )}
            autoFocus
          />
        ) : (
          <h3 className="flex-1 font-semibold text-neutral-900 dark:text-white text-sm sm:text-base truncate">
            {lesson.name}
          </h3>
        )}

        {canEdit && (
          <>
            {/* Desktop actions */}
            <div className="hidden sm:flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowColorPicker(true)}
                className={cn(
                  "p-1.5 rounded-lg",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                  "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
                  "transition-colors"
                )}
                title="Change color"
              >
                <div
                  className="w-4 h-4 rounded-full"
                  style={{
                    backgroundColor: `var(--color-${lesson.color}-500, #6b7280)`,
                  }}
                />
              </button>
              {!isFirst && (
                <button
                  onClick={onMoveUp}
                  className={cn(
                    "p-1.5 rounded-lg",
                    "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                    "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
                    "transition-colors"
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
                    "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
                    "transition-colors"
                  )}
                  title="Move down"
                >
                  <ArrowDownIcon className="size-4" />
                </button>
              )}
              <button
                onClick={() => setIsEditing(true)}
                className={cn(
                  "p-1.5 rounded-lg",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                  "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300",
                  "transition-colors"
                )}
                title="Edit name"
              >
                <PencilIcon className="size-4" />
              </button>
              <button
                onClick={handleDelete}
                className={cn(
                  "p-1.5 rounded-lg",
                  "hover:bg-red-100 dark:hover:bg-red-900/30",
                  "text-neutral-400 hover:text-red-600",
                  "transition-colors"
                )}
                title="Delete lesson"
              >
                <TrashIcon className="size-4" />
              </button>
            </div>

            {/* Mobile menu button */}
            <div className="relative sm:hidden" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className={cn(
                  "p-2 rounded-lg",
                  "hover:bg-neutral-100 dark:hover:bg-neutral-700",
                  "text-neutral-500"
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
                  <div className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-neutral-800 rounded-lg shadow-lg border border-neutral-200 dark:border-neutral-700 py-1 min-w-40">
                    <button
                      onClick={() => {
                        setShowColorPicker(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3"
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: `var(--color-${lesson.color}-500, #6b7280)`,
                        }}
                      />
                      Change color
                    </button>
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
                        setIsEditing(true);
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-neutral-100 dark:hover:bg-neutral-700 flex items-center gap-3"
                    >
                      <PencilIcon className="size-4" />
                      Edit name
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

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-1 text-neutral-400"
        >
          {isExpanded ? (
            <ChevronUpIcon className="size-5" />
          ) : (
            <ChevronDownIcon className="size-5" />
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-neutral-100 dark:border-neutral-700">
          {items === undefined ? (
            <div className="p-4 text-neutral-500 text-sm">Loading...</div>
          ) : items.length === 0 && !showNewItem ? (
            <div className="p-4 text-center text-neutral-400 text-sm">
              No items yet
            </div>
          ) : (
            <ul className="divide-y divide-neutral-100 dark:divide-neutral-700">
              {items.map((item, index) => (
                <ItemRow
                  key={item._id}
                  item={item}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                  onMoveUp={() => handleMoveItem(item._id, "up")}
                  onMoveDown={() => handleMoveItem(item._id, "down")}
                />
              ))}
            </ul>
          )}

          {/* Add new item */}
          {canEdit && showNewItem && (
            <div className="p-3 sm:p-4 border-t border-neutral-100 dark:border-neutral-700">
              <textarea
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                placeholder="What happened in this lesson?"
                className={cn(
                  "w-full px-3 py-2 rounded-lg border bg-neutral-50 dark:bg-neutral-700",
                  "text-neutral-900 dark:text-white placeholder-neutral-400",
                  "border-neutral-200 dark:border-neutral-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "resize-none text-base sm:text-sm"
                )}
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleAddItem();
                  if (e.key === "Escape") setShowNewItem(false);
                }}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowNewItem(false)}
                  className="px-3 py-2 text-sm text-neutral-600 dark:text-neutral-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddItem}
                  disabled={!newItemContent.trim()}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium",
                    "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Add
                </button>
              </div>
            </div>
          )}

          {canEdit && !showNewItem && (
            <button
              onClick={() => setShowNewItem(true)}
              className={cn(
                "w-full p-3 sm:p-3 text-sm",
                "text-neutral-400 hover:text-blue-500 active:text-blue-600",
                "hover:bg-neutral-50 dark:hover:bg-neutral-750",
                "flex items-center justify-center gap-2",
                "transition-colors"
              )}
            >
              <PlusIcon className="size-4" />
              Add item
            </button>
          )}
        </div>
      )}

      {showIconPicker && (
        <IconPicker
          selected={lesson.icon as TopicIcon}
          onSelect={handleIconSelect}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      {showColorPicker && (
        <ColorPicker
          selected={lesson.color as TopicColor}
          onSelect={handleColorSelect}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
}
