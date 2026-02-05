import { TOPIC_COLOR_OPTIONS, TOPIC_ICON_OPTIONS } from "./constants";
import { cn } from "./lib/cn";

export type TopicIcon = (typeof TOPIC_ICON_OPTIONS)[number]["name"];
export type TopicColor = (typeof TOPIC_COLOR_OPTIONS)[number]["name"];

interface LessonIconProps {
  icon: TopicIcon;
  color: TopicColor;
  size?: "xs" | "sm" | "default" | "xl";
  className?: string;
}

export function LessonIcon({
  icon,
  color,
  size = "default",
  className,
}: LessonIconProps) {
  const IconComponent = TOPIC_ICON_OPTIONS.find(
    (option) => option.name === icon,
  )?.icon;

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        TOPIC_COLOR_OPTIONS.find((option) => option.name === color)?.bg,
        className,
        size === "xs" && "rounded-md p-1",
        size === "sm" && "rounded-full p-1.5",
        size === "default" && "rounded-xl p-1.5",
        size === "xl" && "rounded-2xl p-2",
      )}
    >
      {IconComponent && (
        <IconComponent
          className={cn(
            TOPIC_COLOR_OPTIONS.find((option) => option.name === color)?.text,
            size === "xs" && "size-4",
            size === "sm" && "size-4",
            size === "default" && "size-5",
            size === "xl" && "size-12",
          )}
        />
      )}
    </div>
  );
}
