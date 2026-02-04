import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateUserSession } from "./auth";

export const generateUploadUrl = mutation({
  args: { userId: v.id("users") },
  returns: v.string(),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveReportAttachment = mutation({
  args: {
    userId: v.id("users"),
    reportItemId: v.id("reportItems"),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
  },
  returns: v.id("reportAttachments"),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");

    // Verify report ownership through report item
    const reportItem = await ctx.db.get(args.reportItemId);
    if (!reportItem) {
      throw new Error("Report item not found");
    }

    const report = await ctx.db.get(reportItem.reportId);
    // TODO: revert to strict check after migration: report.userId !== args.userId
    if (!report || (report.userId && report.userId !== args.userId)) {
      throw new Error("Report not found or not owned by user");
    }

    return await ctx.db.insert("reportAttachments", {
      reportItemId: args.reportItemId,
      storageId: args.storageId,
      filename: args.filename,
      contentType: args.contentType,
    });
  },
});

export const listByReportItem = query({
  args: { userId: v.id("users"), reportItemId: v.id("reportItems") },
  returns: v.array(
    v.object({
      _id: v.id("reportAttachments"),
      _creationTime: v.number(),
      reportItemId: v.id("reportItems"),
      storageId: v.id("_storage"),
      filename: v.string(),
      contentType: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");

    // Verify report ownership through report item
    const reportItem = await ctx.db.get(args.reportItemId);
    if (!reportItem) {
      throw new Error("Report item not found");
    }

    const report = await ctx.db.get(reportItem.reportId);
    // TODO: revert to strict check after migration: report.userId !== args.userId
    if (!report || (report.userId && report.userId !== args.userId)) {
      throw new Error("Report not found or not owned by user");
    }

    return await ctx.db
      .query("reportAttachments")
      .withIndex("by_reportItem", (q) =>
        q.eq("reportItemId", args.reportItemId),
      )
      .collect();
  },
});

export const deleteReportAttachment = mutation({
  args: { userId: v.id("users"), attachmentId: v.id("reportAttachments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");

    const attachment = await ctx.db.get(args.attachmentId);
    if (!attachment) {
      return null;
    }

    // Verify report ownership through report item
    const reportItem = await ctx.db.get(attachment.reportItemId);
    if (!reportItem) {
      throw new Error("Report item not found");
    }

    const report = await ctx.db.get(reportItem.reportId);
    // TODO: revert to strict check after migration: report.userId !== args.userId
    if (!report || (report.userId && report.userId !== args.userId)) {
      throw new Error("Report not found or not owned by user");
    }

    await ctx.storage.delete(attachment.storageId);
    await ctx.db.delete(args.attachmentId);
    return null;
  },
});
