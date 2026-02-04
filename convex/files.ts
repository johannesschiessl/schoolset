import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { validateUserSession } from "./auth";

export const generateUploadUrl = mutation({
  args: { userId: v.id("users") },
  returns: v.string(),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "editor");
    return await ctx.storage.generateUploadUrl();
  },
});

export const saveAttachment = mutation({
  args: {
    userId: v.id("users"),
    itemId: v.id("items"),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
  },
  returns: v.id("attachments"),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "editor");
    return await ctx.db.insert("attachments", {
      itemId: args.itemId,
      storageId: args.storageId,
      filename: args.filename,
      contentType: args.contentType,
    });
  },
});

export const listByItem = query({
  args: { userId: v.id("users"), itemId: v.id("items") },
  returns: v.array(
    v.object({
      _id: v.id("attachments"),
      _creationTime: v.number(),
      itemId: v.id("items"),
      storageId: v.id("_storage"),
      filename: v.string(),
      contentType: v.string(),
    }),
  ),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "viewer");
    return await ctx.db
      .query("attachments")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();
  },
});

export const deleteAttachment = mutation({
  args: { userId: v.id("users"), attachmentId: v.id("attachments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "editor");
    const attachment = await ctx.db.get(args.attachmentId);
    if (attachment) {
      await ctx.storage.delete(attachment.storageId);
      await ctx.db.delete(args.attachmentId);
    }
    return null;
  },
});

export const getDownloadUrl = query({
  args: { userId: v.id("users"), storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    await validateUserSession(ctx, args.userId, "none");
    return await ctx.storage.getUrl(args.storageId);
  },
});
