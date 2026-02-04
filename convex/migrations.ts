import { v } from "convex/values";
import { internalMutation } from "./_generated/server";

export const migrateOrphanReports = internalMutation({
  args: { targetUserId: v.id("users") },
  returns: v.object({ migrated: v.number() }),
  handler: async (ctx, args) => {
    // Get all reports
    const allReports = await ctx.db.query("reports").collect();

    // Filter for reports without userId (orphans)
    const orphans = allReports.filter((r) => !r.userId);

    // Assign each orphan to the target user
    for (const report of orphans) {
      await ctx.db.patch(report._id, { userId: args.targetUserId });
    }

    return { migrated: orphans.length };
  },
});
