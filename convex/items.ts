import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateUserSession } from "./auth";

export const listByLesson = query({
  args: { userId: v.id("users"), lessonId: v.id("lessons") },
  returns: v.array(
    v.object({
      _id: v.id("items"),
      _creationTime: v.number(),
      lessonId: v.id("lessons"),
      content: v.string(),
      order: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "viewer");
    const items = await ctx.db
      .query("items")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();
    return items.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    lessonId: v.id("lessons"),
    content: v.string(),
  },
  returns: v.id("items"),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "editor");
    // Get max order for this lesson
    const existingItems = await ctx.db
      .query("items")
      .withIndex("by_lesson", (q) => q.eq("lessonId", args.lessonId))
      .collect();
    const maxOrder = existingItems.reduce(
      (max, item) => Math.max(max, item.order),
      -1,
    );

    return await ctx.db.insert("items", {
      lessonId: args.lessonId,
      content: args.content,
      order: maxOrder + 1,
    });
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    itemId: v.id("items"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "editor");
    await ctx.db.patch(args.itemId, { content: args.content });
    return null;
  },
});

export const reorder = mutation({
  args: {
    userId: v.id("users"),
    itemId: v.id("items"),
    newOrder: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "editor");
    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    const allItems = await ctx.db
      .query("items")
      .withIndex("by_lesson", (q) => q.eq("lessonId", item.lessonId))
      .collect();

    const oldOrder = item.order;
    const newOrder = args.newOrder;

    // Update orders for affected items
    for (const i of allItems) {
      if (i._id === args.itemId) {
        await ctx.db.patch(i._id, { order: newOrder });
      } else if (
        oldOrder < newOrder &&
        i.order > oldOrder &&
        i.order <= newOrder
      ) {
        await ctx.db.patch(i._id, { order: i.order - 1 });
      } else if (
        oldOrder > newOrder &&
        i.order >= newOrder &&
        i.order < oldOrder
      ) {
        await ctx.db.patch(i._id, { order: i.order + 1 });
      }
    }
    return null;
  },
});

export const remove = mutation({
  args: { userId: v.id("users"), itemId: v.id("items") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "editor");
    // Delete all attachments for this item
    const attachments = await ctx.db
      .query("attachments")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();

    for (const attachment of attachments) {
      await ctx.storage.delete(attachment.storageId);
      await ctx.db.delete(attachment._id);
    }

    await ctx.db.delete(args.itemId);
    return null;
  },
});
