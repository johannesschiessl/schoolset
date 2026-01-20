import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validatePassword } from "./auth";

export const list = query({
  args: { password: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("days"),
      _creationTime: v.number(),
      date: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "viewer")) {
      throw new Error("Invalid password");
    }
    return await ctx.db.query("days").withIndex("by_date").collect();
  },
});

export const getByDate = query({
  args: { password: v.string(), date: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("days"),
      _creationTime: v.number(),
      date: v.string(),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "viewer")) {
      throw new Error("Invalid password");
    }
    return await ctx.db
      .query("days")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
  },
});

export const create = mutation({
  args: { password: v.string(), date: v.string() },
  returns: v.id("days"),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    // Check if day already exists
    const existing = await ctx.db
      .query("days")
      .withIndex("by_date", (q) => q.eq("date", args.date))
      .first();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("days", { date: args.date });
  },
});

export const remove = mutation({
  args: { password: v.string(), dayId: v.id("days") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    // Delete all lessons and their items for this day
    const lessons = await ctx.db
      .query("lessons")
      .withIndex("by_day", (q) => q.eq("dayId", args.dayId))
      .collect();

    for (const lesson of lessons) {
      // Delete items for this lesson
      const items = await ctx.db
        .query("items")
        .withIndex("by_lesson", (q) => q.eq("lessonId", lesson._id))
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
      await ctx.db.delete(lesson._id);
    }

    await ctx.db.delete(args.dayId);
    return null;
  },
});
