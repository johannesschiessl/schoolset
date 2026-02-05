import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getUserId, isEditor } from "../lib/auth";
import { LessonCard } from "./LessonCard";
import { cn } from "../lib/cn";
import { PlusIcon, CalendarIcon } from "lucide-react";
import { useState } from "react";
import { IconPicker } from "./IconPicker";
import { ColorPicker } from "./ColorPicker";
import type { TopicIcon, TopicColor } from "../LessonIcon";
import type { Id } from "../../convex/_generated/dataModel";

interface DayViewProps {
  date: string;
}

export function DayView({ date }: DayViewProps) {
  const userId = getUserId();
  const day = useQuery(
    api.days.getByDate,
    userId ? { userId: userId as Id<"users">, date } : "skip",
  );
  const lessons = useQuery(
    api.lessons.listByDay,
    day && userId ? { userId: userId as Id<"users">, dayId: day._id } : "skip",
  );
  const createDay = useMutation(api.days.create);
  const createLesson = useMutation(api.lessons.create);
  const reorderLesson = useMutation(api.lessons.reorder);
  const canEdit = isEditor();

  const [showNewLesson, setShowNewLesson] = useState(false);
  const [newLessonName, setNewLessonName] = useState("");
  const [newLessonIcon, setNewLessonIcon] = useState<TopicIcon>("book");
  const [newLessonColor, setNewLessonColor] = useState<TopicColor>("blue");
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const formatDisplayDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("de-DE", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const formatShortDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("de-DE", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const handleCreateDay = async () => {
    if (!userId) return;
    await createDay({ userId: userId as Id<"users">, date });
  };

  const handleCreateLesson = async () => {
    if (!day || !newLessonName.trim() || !userId) return;
    await createLesson({
      userId: userId as Id<"users">,
      dayId: day._id,
      name: newLessonName.trim(),
      icon: newLessonIcon,
      color: newLessonColor,
    });
    setNewLessonName("");
    setShowNewLesson(false);
  };

  const handleMoveLesson = async (
    lessonId: Id<"lessons">,
    direction: "up" | "down",
  ) => {
    if (!lessons || !userId) return;
    const lesson = lessons.find((l) => l._id === lessonId);
    if (!lesson) return;
    const newOrder = direction === "up" ? lesson.order - 1 : lesson.order + 1;
    if (newOrder < 0 || newOrder >= lessons.length) return;
    await reorderLesson({ userId: userId as Id<"users">, lessonId, newOrder });
  };

  // Day doesn't exist yet
  if (day === null) {
    return (
      <div className="p-4 sm:p-8 flex flex-col items-center justify-center h-full">
        <CalendarIcon className="size-12 sm:size-14 text-stone-200 dark:text-stone-700 mb-4" />
        <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-1.5 text-center">
          <span className="hidden sm:inline">{formatDisplayDate(date)}</span>
          <span className="sm:hidden">{formatShortDate(date)}</span>
        </h2>
        <p className="text-stone-400 dark:text-stone-500 mb-5 text-sm">
          Noch keine Eintrage fur diesen Tag
        </p>
        {canEdit && (
          <button
            onClick={() => void handleCreateDay()}
            className={cn(
              "py-2.5 px-5 rounded-lg font-medium text-sm",
              "bg-stone-900 hover:bg-stone-800 active:bg-stone-700 text-white",
              "dark:bg-stone-100 dark:hover:bg-stone-200 dark:text-stone-900",
              "flex items-center gap-2",
              "transition-colors",
            )}
          >
            <PlusIcon className="size-4" />
            Tag erstellen
          </button>
        )}
      </div>
    );
  }

  // Loading
  if (day === undefined || lessons === undefined) {
    return (
      <div className="p-4 sm:p-8 max-w-3xl mx-auto">
        <div className="animate-pulse space-y-4">
          <div className="h-7 bg-stone-100 dark:bg-stone-800 rounded w-1/3"></div>
          <div className="h-28 bg-stone-100 dark:bg-stone-800 rounded-xl"></div>
          <div className="h-28 bg-stone-100 dark:bg-stone-800 rounded-xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <h2 className="text-lg sm:text-xl font-semibold text-stone-900 dark:text-stone-100 mb-5 sm:mb-6 tracking-tight">
        <span className="hidden sm:inline">{formatDisplayDate(date)}</span>
        <span className="sm:hidden">{formatShortDate(date)}</span>
      </h2>

      <div className="space-y-3">
        {lessons.map((lesson, index) => (
          <LessonCard
            key={lesson._id}
            lesson={lesson}
            isFirst={index === 0}
            isLast={index === lessons.length - 1}
            onMoveUp={() => void handleMoveLesson(lesson._id, "up")}
            onMoveDown={() => void handleMoveLesson(lesson._id, "down")}
          />
        ))}

        {lessons.length === 0 && !showNewLesson && (
          <div className="text-center py-8 text-stone-400 dark:text-stone-500 text-sm">
            Noch keine Stunden hinzugefugt
          </div>
        )}

        {/* Add new lesson form */}
        {canEdit && showNewLesson && (
          <div className="bg-white dark:bg-stone-900 rounded-xl p-4 border border-stone-200 dark:border-stone-800">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowIconPicker(true)}
                  className="p-2 rounded-lg bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 transition-colors"
                >
                  <span className="text-lg">{newLessonIcon}</span>
                </button>
                <button
                  onClick={() => setShowColorPicker(true)}
                  className="w-8 h-8 rounded-lg border border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 transition-colors"
                  style={{
                    backgroundColor: `var(--color-${newLessonColor}-500, #3b82f6)`,
                  }}
                />
              </div>
              <input
                type="text"
                value={newLessonName}
                onChange={(e) => setNewLessonName(e.target.value)}
                placeholder="Name der Stunde (z.B. Mathematik)"
                className={cn(
                  "flex-1 px-3.5 py-2.5 sm:py-2 rounded-lg border bg-stone-50 dark:bg-stone-800",
                  "text-stone-900 dark:text-stone-100 placeholder-stone-400",
                  "border-stone-200 dark:border-stone-700",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500",
                  "text-sm",
                )}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") void handleCreateLesson();
                  if (e.key === "Escape") setShowNewLesson(false);
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewLesson(false)}
                className="px-3 py-1.5 text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => void handleCreateLesson()}
                disabled={!newLessonName.trim()}
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

        {canEdit && !showNewLesson && (
          <button
            onClick={() => setShowNewLesson(true)}
            className={cn(
              "w-full py-3.5 sm:py-3 px-4 rounded-xl font-medium text-sm",
              "border border-dashed border-stone-300 dark:border-stone-700",
              "text-stone-400 dark:text-stone-500",
              "hover:border-stone-400 hover:text-stone-500 dark:hover:border-stone-600 dark:hover:text-stone-400",
              "flex items-center justify-center gap-2",
              "transition-colors",
            )}
          >
            <PlusIcon className="size-4" />
            Stunde hinzufugen
          </button>
        )}
      </div>

      {showIconPicker && (
        <IconPicker
          selected={newLessonIcon}
          onSelect={(icon) => {
            setNewLessonIcon(icon);
            setShowIconPicker(false);
          }}
          onClose={() => setShowIconPicker(false)}
        />
      )}

      {showColorPicker && (
        <ColorPicker
          selected={newLessonColor}
          onSelect={(color) => {
            setNewLessonColor(color);
            setShowColorPicker(false);
          }}
          onClose={() => setShowColorPicker(false)}
        />
      )}
    </div>
  );
}
