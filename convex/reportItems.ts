import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateUserSession } from "./auth";

export const listByReport = query({
  args: { userId: v.id("users"), reportId: v.id("reports") },
  returns: v.array(
    v.object({
      _id: v.id("reportItems"),
      _creationTime: v.number(),
      reportId: v.id("reports"),
      date: v.string(),
      subject: v.string(),
      description: v.string(),
      order: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");

    // Verify report ownership
    const report = await ctx.db.get(args.reportId);
    if (!report || report.userId !== args.userId) {
      throw new Error("Report not found or not owned by user");
    }

    const items = await ctx.db
      .query("reportItems")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();
    // Sort by order
    return items.sort((a, b) => a.order - b.order);
  },
});

export const create = mutation({
  args: {
    userId: v.id("users"),
    reportId: v.id("reports"),
    date: v.string(),
    subject: v.string(),
    description: v.string(),
  },
  returns: v.id("reportItems"),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");

    // Verify report ownership
    const report = await ctx.db.get(args.reportId);
    if (!report || report.userId !== args.userId) {
      throw new Error("Report not found or not owned by user");
    }

    // Get max order for this report
    const existingItems = await ctx.db
      .query("reportItems")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();
    const maxOrder =
      existingItems.length > 0
        ? Math.max(...existingItems.map((i) => i.order))
        : -1;

    return await ctx.db.insert("reportItems", {
      reportId: args.reportId,
      date: args.date,
      subject: args.subject,
      description: args.description,
      order: maxOrder + 1,
    });
  },
});

export const update = mutation({
  args: {
    userId: v.id("users"),
    itemId: v.id("reportItems"),
    date: v.optional(v.string()),
    subject: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");

    // Get the report item and verify ownership
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Report item not found");
    }

    const report = await ctx.db.get(item.reportId);
    if (!report || report.userId !== args.userId) {
      throw new Error("Report not found or not owned by user");
    }

    const updates: Partial<{
      date: string;
      subject: string;
      description: string;
    }> = {};
    if (args.date !== undefined) updates.date = args.date;
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch(args.itemId, updates);
    return null;
  },
});

export const reorder = mutation({
  args: {
    userId: v.id("users"),
    itemId: v.id("reportItems"),
    newOrder: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");

    const item = await ctx.db.get(args.itemId);
    if (!item) throw new Error("Item not found");

    // Verify report ownership
    const report = await ctx.db.get(item.reportId);
    if (!report || report.userId !== args.userId) {
      throw new Error("Report not found or not owned by user");
    }

    const oldOrder = item.order;
    const reportId = item.reportId;

    // Get all items in this report
    const items = await ctx.db
      .query("reportItems")
      .withIndex("by_report", (q) => q.eq("reportId", reportId))
      .collect();

    // Update orders
    for (const i of items) {
      if (i._id === args.itemId) {
        await ctx.db.patch(i._id, { order: args.newOrder });
      } else if (oldOrder < args.newOrder) {
        // Moving down: shift items in between up
        if (i.order > oldOrder && i.order <= args.newOrder) {
          await ctx.db.patch(i._id, { order: i.order - 1 });
        }
      } else {
        // Moving up: shift items in between down
        if (i.order >= args.newOrder && i.order < oldOrder) {
          await ctx.db.patch(i._id, { order: i.order + 1 });
        }
      }
    }

    return null;
  },
});

export const remove = mutation({
  args: { userId: v.id("users"), itemId: v.id("reportItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");

    // Get the report item and verify ownership
    const item = await ctx.db.get(args.itemId);
    if (!item) {
      throw new Error("Report item not found");
    }

    const report = await ctx.db.get(item.reportId);
    if (!report || report.userId !== args.userId) {
      throw new Error("Report not found or not owned by user");
    }

    // Delete attachments for this report item
    const attachments = await ctx.db
      .query("reportAttachments")
      .withIndex("by_reportItem", (q) => q.eq("reportItemId", args.itemId))
      .collect();

    for (const attachment of attachments) {
      await ctx.storage.delete(attachment.storageId);
      await ctx.db.delete(attachment._id);
    }

    await ctx.db.delete(args.itemId);
    return null;
  },
});
