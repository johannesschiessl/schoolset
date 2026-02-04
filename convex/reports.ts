import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateUserSession } from "./auth";

export const list = query({
  args: { userId: v.id("users") },
  returns: v.array(
    v.object({
      _id: v.id("reports"),
      _creationTime: v.number(),
      month: v.string(),
      userId: v.optional(v.id("users")), // TODO: revert to required after migration
    }),
  ),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");
    // Filter by userId - users only see their own reports
    // Also include reports without userId (pre-migration)
    const userReports = await ctx.db
      .query("reports")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    const orphanReports = await ctx.db
      .query("reports")
      .filter((q) => q.eq(q.field("userId"), undefined))
      .collect();
    return [...userReports, ...orphanReports];
  },
});

export const getByMonth = query({
  args: { userId: v.id("users"), month: v.string() },
  returns: v.union(
    v.object({
      _id: v.id("reports"),
      _creationTime: v.number(),
      month: v.string(),
      userId: v.optional(v.id("users")), // TODO: revert to required after migration
    }),
    v.null(),
  ),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");
    // Filter by userId AND month, also check orphan reports
    const userReport = await ctx.db
      .query("reports")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", args.userId).eq("month", args.month)
      )
      .first();
    if (userReport) return userReport;
    // Check for pre-migration orphan report with this month
    const orphan = await ctx.db
      .query("reports")
      .withIndex("by_month", (q) => q.eq("month", args.month))
      .filter((q) => q.eq(q.field("userId"), undefined))
      .first();
    return orphan ?? null;
  },
});

export const create = mutation({
  args: { userId: v.id("users"), month: v.string() },
  returns: v.id("reports"),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");
    // Check if report already exists for this user and month
    const existing = await ctx.db
      .query("reports")
      .withIndex("by_user_month", (q) =>
        q.eq("userId", args.userId).eq("month", args.month)
      )
      .first();
    if (existing) {
      return existing._id;
    }
    return await ctx.db.insert("reports", { month: args.month, userId: args.userId });
  },
});

export const remove = mutation({
  args: { userId: v.id("users"), reportId: v.id("reports") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");

    // Verify ownership before deletion
    const report = await ctx.db.get(args.reportId);
    // TODO: revert to strict check after migration: report.userId !== args.userId
    if (!report || (report.userId && report.userId !== args.userId)) {
      throw new Error("Report not found or not owned by user");
    }

    // Delete all report items for this report
    const items = await ctx.db
      .query("reportItems")
      .withIndex("by_report", (q) => q.eq("reportId", args.reportId))
      .collect();

    for (const item of items) {
      // Delete attachments for this report item
      const attachments = await ctx.db
        .query("reportAttachments")
        .withIndex("by_reportItem", (q) => q.eq("reportItemId", item._id))
        .collect();

      for (const attachment of attachments) {
        await ctx.storage.delete(attachment.storageId);
        await ctx.db.delete(attachment._id);
      }

      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.reportId);
    return null;
  },
});
