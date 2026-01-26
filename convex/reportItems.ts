import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validatePassword } from "./auth";

export const listByReport = query({
  args: { password: v.string(), reportId: v.id("reports") },
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
    if (!validatePassword(args.password, "viewer")) {
      throw new Error("Invalid password");
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
    password: v.string(),
    reportId: v.id("reports"),
    date: v.string(),
    subject: v.string(),
    description: v.string(),
  },
  returns: v.id("reportItems"),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
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
    password: v.string(),
    itemId: v.id("reportItems"),
    date: v.optional(v.string()),
    subject: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    const updates: Partial<{
      date: string;
      subject: string;
      description: string;
    }> = {};
    if (args.date !== undefined) updates.date = args.date;
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.description !== undefined) updates.description = args.description;

    await ctx.db.patch("reportItems", args.itemId, updates);
    return null;
  },
});

export const reorder = mutation({
  args: {
    password: v.string(),
    itemId: v.id("reportItems"),
    newOrder: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    const item = await ctx.db.get("reportItems", args.itemId);
    if (!item) throw new Error("Item not found");

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
        await ctx.db.patch("reportItems", i._id, { order: args.newOrder });
      } else if (oldOrder < args.newOrder) {
        // Moving down: shift items in between up
        if (i.order > oldOrder && i.order <= args.newOrder) {
          await ctx.db.patch("reportItems", i._id, { order: i.order - 1 });
        }
      } else {
        // Moving up: shift items in between down
        if (i.order >= args.newOrder && i.order < oldOrder) {
          await ctx.db.patch("reportItems", i._id, { order: i.order + 1 });
        }
      }
    }

    return null;
  },
});

export const remove = mutation({
  args: { password: v.string(), itemId: v.id("reportItems") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    await ctx.db.delete("reportItems", args.itemId);
    return null;
  },
});
