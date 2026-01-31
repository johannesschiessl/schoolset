import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validatePassword } from "./auth";

export const generateUploadUrl = mutation({
  args: { password: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveReportAttachment = mutation({
  args: {
    password: v.string(),
    reportItemId: v.id("reportItems"),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
  },
  returns: v.id("reportAttachments"),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
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
  args: { password: v.string(), reportItemId: v.id("reportItems") },
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
    if (!validatePassword(args.password, "viewer")) {
      throw new Error("Invalid password");
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
  args: { password: v.string(), attachmentId: v.id("reportAttachments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    const attachment = await ctx.db.get("reportAttachments", args.attachmentId);
    if (attachment) {
      await ctx.storage.delete(attachment.storageId);
      await ctx.db.delete("reportAttachments", args.attachmentId);
    }
    return null;
  },
});
