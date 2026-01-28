import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { getStoredPassword, isEditor } from "../lib/auth";
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
  const password = getStoredPassword() ?? "";
  const day = useQuery(api.days.getByDate, { password, date });
  const lessons = useQuery(
    api.lessons.listByDay,
    day ? { password, dayId: day._id } : "skip",
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
    await createDay({ password, date });
  };

  const handleCreateLesson = async () => {
    if (!day || !newLessonName.trim()) return;
    await createLesson({
      password,
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
    if (!lessons) return;
    const lesson = lessons.find((l) => l._id === lessonId);
    if (!lesson) return;
    const newOrder = direction === "up" ? lesson.order - 1 : lesson.order + 1;
    if (newOrder < 0 || newOrder >= lessons.length) return;
    await reorderLesson({ password, lessonId, newOrder });
  };

  // Day doesn't exist yet
  if (day === null) {
    return (
      <div className="p-4 sm:p-8 flex flex-col items-center justify-center h-full">
        <CalendarIcon className="size-12 sm:size-16 text-neutral-300 dark:text-neutral-600 mb-4" />
        <h2 className="text-lg sm:text-xl font-semibold text-neutral-900 dark:text-white mb-2 text-center">
          <span className="hidden sm:inline">{formatDisplayDate(date)}</span>
          <span className="sm:hidden">{formatShortDate(date)}</span>
        </h2>
        <p className="text-neutral-500 dark:text-neutral-400 mb-4 text-sm sm:text-base">
          Noch keine Einträge für diesen Tag
        </p>
        {canEdit && (
          <button
            onClick={handleCreateDay}
            className={cn(
              "py-3 px-6 rounded-lg font-medium text-sm",
              "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
              "flex items-center gap-2",
              "transition-colors active:scale-[0.98]",
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
      <div className="p-4 sm:p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3"></div>
          <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
          <div className="h-32 bg-neutral-200 dark:bg-neutral-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto">
      <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4 sm:mb-6">
        <span className="hidden sm:inline">{formatDisplayDate(date)}</span>
        <span className="sm:hidden">{formatShortDate(date)}</span>
      </h2>

      <div className="space-y-3 sm:space-y-4">
        {lessons.map((lesson, index) => (
          <LessonCard
            key={lesson._id}
            lesson={lesson}
            isFirst={index === 0}
            isLast={index === lessons.length - 1}
            onMoveUp={() => handleMoveLesson(lesson._id, "up")}
            onMoveDown={() => handleMoveLesson(lesson._id, "down")}
          />
        ))}

        {lessons.length === 0 && !showNewLesson && (
          <div className="text-center py-8 text-neutral-500 dark:text-neutral-400">
            Noch keine Stunden hinzugefügt
          </div>
        )}

        {/* Add new lesson form */}
        {canEdit && showNewLesson && (
          <div className="bg-neutral-50 dark:bg-neutral-800 rounded-xl p-4 border border-neutral-200 dark:border-neutral-700">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowIconPicker(true)}
                  className="p-2 rounded-lg bg-white dark:bg-neutral-700 border border-neutral-200 dark:border-neutral-600 hover:border-blue-500 transition-colors"
                >
                  <span className="text-lg">{newLessonIcon}</span>
                </button>
                <button
                  onClick={() => setShowColorPicker(true)}
                  className={cn(
                    "w-8 h-8 rounded-lg border border-neutral-200 dark:border-neutral-600 hover:border-blue-500 transition-colors",
                  )}
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
                  "flex-1 px-4 py-3 sm:py-2 rounded-lg border bg-white dark:bg-neutral-700",
                  "text-neutral-900 dark:text-white placeholder-neutral-400",
                  "border-neutral-200 dark:border-neutral-600",
                  "focus:outline-none focus:ring-2 focus:ring-blue-500",
                  "text-base sm:text-sm",
                )}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateLesson();
                  if (e.key === "Escape") setShowNewLesson(false);
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowNewLesson(false)}
                className="px-4 py-2 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              >
                Abbrechen
              </button>
              <button
                onClick={handleCreateLesson}
                disabled={!newLessonName.trim()}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium",
                  "bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white",
                  "disabled:opacity-50 disabled:cursor-not-allowed",
                  "transition-colors",
                )}
              >
                Stunde hinzufügen
              </button>
            </div>
          </div>
        )}

        {canEdit && !showNewLesson && (
          <button
            onClick={() => setShowNewLesson(true)}
            className={cn(
              "w-full py-4 sm:py-3 px-4 rounded-xl font-medium text-sm",
              "border-2 border-dashed border-neutral-300 dark:border-neutral-600",
              "text-neutral-500 dark:text-neutral-400",
              "hover:border-blue-500 hover:text-blue-500 active:bg-blue-50 dark:active:bg-blue-900/20",
              "flex items-center justify-center gap-2",
              "transition-colors",
            )}
          >
            <PlusIcon className="size-4" />
            Stunde hinzufügen
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
