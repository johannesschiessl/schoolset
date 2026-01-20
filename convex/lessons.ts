import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validatePassword } from "./auth";

export const listByDay = query({
  args: { password: v.string(), dayId: v.id("days") },
  returns: v.array(
    v.object({
      _id: v.id("lessons"),
      _creationTime: v.number(),
      dayId: v.id("days"),
      name: v.string(),
      icon: v.string(),
      color: v.string(),
      order: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "viewer")) {
      throw new Error("Invalid password");
    }
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_day", (q) => q.eq("dayId", args.dayId))
      .collect();
    return lessons.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    password: v.string(),
    dayId: v.id("days"),
    name: v.string(),
    icon: v.string(),
    color: v.string(),
  },
  returns: v.id("lessons"),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    // Get max order for this day
    const existingLessons = await ctx.db
      .query("lessons")
      .withIndex("by_day", (q) => q.eq("dayId", args.dayId))
      .collect();
    const maxOrder = existingLessons.reduce(
      (max, lesson) => Math.max(max, lesson.order),
      -1
    );

    return await ctx.db.insert("lessons", {
      dayId: args.dayId,
      name: args.name,
      icon: args.icon,
      color: args.color,
      order: maxOrder + 1,
    });
  },
});

export const update = mutation({
  args: {
    password: v.string(),
    lessonId: v.id("lessons"),
    name: v.optional(v.string()),
    icon: v.optional(v.string()),
    color: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    const updates: Partial<{ name: string; icon: string; color: string }> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.icon !== undefined) updates.icon = args.icon;
    if (args.color !== undefined) updates.color = args.color;

    await ctx.db.patch(args.lessonId, updates);
    return null;
  },
});

export const reorder = mutation({
  args: {
    password: v.string(),
    lessonId: v.id("lessons"),
    newOrder: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    const lesson = await ctx.db.get(args.lessonId);
    if (!lesson) throw new Error("Lesson not found");

    const allLessons = await ctx.db
      .query("lessons")
      .withIndex("by_day", (q) => q.eq("dayId", lesson.dayId))
      .collect();

    const oldOrder = lesson.order;
    const newOrder = args.newOrder;

    // Update orders for affected lessons
    for (const l of allLessons) {
      if (l._id === args.lessonId) {
        await ctx.db.patch(l._id, { order: newOrder });
      } else if (oldOrder < newOrder && l.order > oldOrder && l.order <= newOrder) {
        await ctx.db.patch(l._id, { order: l.order - 1 });
      } else if (oldOrder > newOrder && l.order >= newOrder && l.order < oldOrder) {
        await ctx.db.patch(l._id, { order: l.order + 1 });
      }
    }
    return null;
  },
});

export const remove = mutation({
  args: { password: v.string(), lessonId: v.id("lessons") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    // Delete all items and their attachments for this lesson
    const items = await ctx.db
      .query("items")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();

    for (const item of items) {
      // Delete attachments for this item
      const attachments = await ctx.db
        .query("attachments")
        .withIndex("by_item", (q) => q.eq("itemId", item._id))
        .collect();

      for (const attachment of attachments) {
        await ctx.storage.delete(attachment.storageId);
        await ctx.db.delete(attachment._id);
      }
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.lessonId);
    return null;
  },
});
