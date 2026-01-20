import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  days: defineTable({
    date: v.string(), // ISO date format "2024-01-20"
  }).index("by_date", ["date"]),

  lessons: defineTable({
    dayId: v.id("days"),
    name: v.string(),
    icon: v.string(), // matches TOPIC_ICON_OPTIONS names
    color: v.string(), // matches TOPIC_COLOR_OPTIONS names
    order: v.number(),
  }).index("by_day", ["dayId"]),

  items: defineTable({
    lessonId: v.id("lessons"),
    content: v.string(),
    order: v.number(),
  }).index("by_lesson", ["lessonId"]),

  attachments: defineTable({
    itemId: v.id("items"),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
  }).index("by_item", ["itemId"]),
});
