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

export const saveAttachment = mutation({
  args: {
    password: v.string(),
    itemId: v.id("items"),
    storageId: v.id("_storage"),
    filename: v.string(),
    contentType: v.string(),
  },
  returns: v.id("attachments"),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    return await ctx.db.insert("attachments", {
      itemId: args.itemId,
      storageId: args.storageId,
      filename: args.filename,
      contentType: args.contentType,
    });
  },
});

export const listByItem = query({
  args: { password: v.string(), itemId: v.id("items") },
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
    if (!validatePassword(args.password, "viewer")) {
      throw new Error("Invalid password");
    }
    return await ctx.db
      .query("attachments")
      .withIndex("by_item", (q) => q.eq("itemId", args.itemId))
      .collect();
  },
});

export const deleteAttachment = mutation({
  args: { password: v.string(), attachmentId: v.id("attachments") },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "editor")) {
      throw new Error("Invalid password");
    }
    const attachment = await ctx.db.get("attachments", args.attachmentId);
    if (attachment) {
      await ctx.storage.delete(attachment.storageId);
      await ctx.db.delete("attachments", args.attachmentId);
    }
    return null;
  },
});

export const getDownloadUrl = query({
  args: { password: v.string(), storageId: v.id("_storage") },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    if (!validatePassword(args.password, "viewer")) {
      throw new Error("Invalid password");
    }
    return await ctx.storage.getUrl(args.storageId);
  },
});
