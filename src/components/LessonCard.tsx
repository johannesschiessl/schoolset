import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getUserId, isEditor } from "../lib/auth";
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
  const userId = getUserId();
  const items = useQuery(
    api.items.listByLesson,
    userId ? { userId: userId as Id<"users">, lessonId: lesson._id } : "skip",
  );
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

  const handleSaveName = async () => {
    if (!userId) return;
    if (editName.trim() && editName !== lesson.name) {
      await updateLesson({
        userId: userId as Id<"users">,
        lessonId: lesson._id,
        name: editName.trim(),
      });
    }
    setIsEditing(false);
  };

  const handleDelete = async () => {
    if (!userId) return;
    if (confirm("Diese Stunde und alle Eintrage loschen?")) {
      await removeLesson({ userId: userId as Id<"users">, lessonId: lesson._id });
    }
  };

  const handleAddItem = async () => {
    if (!newItemContent.trim() || !userId) return;
    await createItem({
      userId: userId as Id<"users">,
      lessonId: lesson._id,
      content: newItemContent.trim(),
    });
    setNewItemContent("");
    setShowNewItem(false);
  };

  const handleMoveItem = async (
    itemId: Id<"items">,
    direction: "up" | "down",
  ) => {
    if (!items || !userId) return;
    const item = items.find((i) => i._id === itemId);
    if (!item) return;
    const newOrder = direction === "up" ? item.order - 1 : item.order + 1;
    if (newOrder < 0 || newOrder >= items.length) return;
    await reorderItem({ userId: userId as Id<"users">, itemId, newOrder });
  };

  const handleIconSelect = async (icon: TopicIcon) => {
    if (!userId) return;
    await updateLesson({ userId: userId as Id<"users">, lessonId: lesson._id, icon });
    setShowIconPicker(false);
  };

  const handleColorSelect = async (color: TopicColor) => {
    if (!userId) return;
    await updateLesson({ userId: userId as Id<"users">, lessonId: lesson._id, color });
    setShowColorPicker(false);
  };

  return (
    <div className="bg-white dark:bg-stone-900 rounded-xl border border-stone-200 dark:border-stone-800 overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "flex items-center gap-2.5 sm:gap-3 p-3 sm:p-3.5 cursor-pointer",
          "hover:bg-stone-50 dark:hover:bg-stone-800/50",
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
            onBlur={() => void handleSaveName()}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleSaveName();
              if (e.key === "Escape") {
                setEditName(lesson.name);
                setIsEditing(false);
              }
            }}
            className={cn(
              "flex-1 px-2 py-1 rounded border bg-white dark:bg-stone-800",
              "text-stone-900 dark:text-stone-100 text-sm",
              "border-blue-500 focus:outline-none",
            )}
            autoFocus
          />
        ) : (
          <h3 className="flex-1 font-medium text-stone-900 dark:text-stone-100 text-sm truncate">
            {lesson.name}
          </h3>
        )}

        {canEdit && (
          <div
            className="flex items-center gap-0.5"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowColorPicker(true)}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-stone-100 dark:hover:bg-stone-800",
                "text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400",
                "transition-colors",
              )}
              title="Farbe andern"
            >
              <div
                className="w-3.5 h-3.5 rounded-full"
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
              onClick={() => setIsEditing(true)}
              className={cn(
                "p-1.5 rounded-lg",
                "hover:bg-stone-100 dark:hover:bg-stone-800",
                "text-stone-300 hover:text-stone-500 dark:text-stone-600 dark:hover:text-stone-400",
                "transition-colors",
              )}
              title="Name bearbeiten"
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
              title="Stunde loschen"
            >
              <TrashIcon className="size-3.5" />
            </button>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          className="p-1 text-stone-300 dark:text-stone-600"
        >
          {isExpanded ? (
            <ChevronUpIcon className="size-4" />
          ) : (
            <ChevronDownIcon className="size-4" />
          )}
        </button>
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-stone-100 dark:border-stone-800">
          {items === undefined ? (
            <div className="p-4 text-stone-400 text-sm">Laden...</div>
          ) : items.length === 0 && !showNewItem ? (
            <div className="p-4 text-center text-stone-400 dark:text-stone-500 text-sm">
              Noch keine Eintrage
            </div>
          ) : (
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {items.map((item, index) => (
                <ItemRow
                  key={item._id}
                  item={item}
                  isFirst={index === 0}
                  isLast={index === items.length - 1}
                  onMoveUp={() => void handleMoveItem(item._id, "up")}
                  onMoveDown={() => void handleMoveItem(item._id, "down")}
                />
              ))}
            </ul>
          )}

          {/* Add new item */}
          {canEdit && showNewItem && (
            <div className="p-3 sm:p-4 border-t border-stone-100 dark:border-stone-800">
              <textarea
                value={newItemContent}
                onChange={(e) => setNewItemContent(e.target.value)}
                placeholder="Was ist in dieser Stunde passiert?"
                className={cn(
                  "w-full px-3 py-2 rounded-lg border bg-stone-50 dark:bg-stone-800",
                  "text-stone-900 dark:text-stone-100 placeholder-stone-400",
                  "border-stone-200 dark:border-stone-700",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500",
                  "resize-none text-sm",
                )}
                rows={3}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey))
                    void handleAddItem();
                  if (e.key === "Escape") setShowNewItem(false);
                }}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={() => setShowNewItem(false)}
                  className="px-3 py-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={() => void handleAddItem()}
                  disabled={!newItemContent.trim()}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-sm font-medium",
                    "bg-stone-900 hover:bg-stone-800 text-white",
                    "dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900",
                    "disabled:opacity-40 disabled:cursor-not-allowed",
                    "transition-colors",
                  )}
                >
                  Hinzufugen
                </button>
              </div>
            </div>
          )}

          {canEdit && !showNewItem && (
            <button
              onClick={() => setShowNewItem(true)}
              className={cn(
                "w-full p-3 text-[13px]",
                "text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300",
                "hover:bg-stone-50 dark:hover:bg-stone-800/50",
                "flex items-center justify-center gap-1.5",
                "transition-colors",
              )}
            >
              <PlusIcon className="size-3.5" />
              Eintrag hinzufugen
            </button>
          )}
        </div>
      )}

      {showIconPicker && (
        <IconPicker
          selected={lesson.icon as TopicIcon}
          onSelect={(icon) => void handleIconSelect(icon)}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      {showColorPicker && (
        <ColorPicker
          selected={lesson.color as TopicColor}
          onSelect={(color) => void handleColorSelect(color)}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
}
