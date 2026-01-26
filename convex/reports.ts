import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validatePassword } from "./auth";

export const list = query({
  args: { password: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("reports"),
      _creationTime: v.number(),
      month: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "viewer")) {
      throw new Error("Invalid password");
    }
    return await ctx.db.query("reports").withIndex("by_month").collect();
  },
});

export const getByMonth = query({
  args: { password: v.string(), month: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("reports"),
      _creationTime: v.number(),
      month: v.string(),
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "viewer")) {
      throw new Error("Invalid password");
    }
    return await ctx.db
      .query("reports")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .first();
  },
});

export const create = mutation({
  args: { password: v.string(), month: v.string() },
  returns: v.id("reports"),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    // Check if report already exists for this month
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .first();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("reports", { month: args.month });
  },
});

export const remove = mutation({
  args: { password: v.string(), reportId: v.id("reports") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    // Delete all report items for this report
    const items = await ctx.db
      .query("reportItems")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    for (const item of items) {
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.reportId);
    return null;
  },
});
