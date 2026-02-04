import { v } from "convex/values";
import { query, internalMutation, QueryCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export type Permission = "editor" | "viewer" | "none";

const ITERATIONS = 10000;

function generateSalt(): string {
  const chars = "0123456789abcdef";
  let result = "";
  for (let i = 0; i < 32; i++) {
    result += chars[Math.floor(Math.random() * 16)];
  }
  return result;
}

function mix(str: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (h2 >>> 0).toString(16).padStart(8, "0") + (h1 >>> 0).toString(16).padStart(8, "0");
}

function hashPassword(password: string, salt?: string): string {
  const actualSalt = salt ?? generateSalt();
  let current = password;
  for (let i = 0; i < ITERATIONS; i++) {
    current = mix(current + actualSalt);
  }
  return `${actualSalt}:${current}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt] = storedHash.split(":");
  if (!salt) return false;
  return hashPassword(password, salt) === storedHash;
}

export const createUser = internalMutation({
  args: {
    username: v.string(),
    password: v.string(),
    permissions: v.union(v.literal("editor"), v.literal("viewer"), v.literal("none")),
  },
  returns: v.id("users"),
  handler: async (ctx, args) => {
    // Check if username already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();
    if (existing) {
      throw new Error("Username already exists");
    }

    const passwordHash = hashPassword(args.password);
    return await ctx.db.insert("users", {
      username: args.username,
      passwordHash,
      permissions: args.permissions,
    });
  },
});

export const login = query({
  args: {
    username: v.string(),
    password: v.string(),
  },
  returns: v.union(
    v.object({
      userId: v.id("users"),
      username: v.string(),
      permissions: v.union(v.literal("editor"), v.literal("viewer"), v.literal("none")),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", args.username))
      .first();

    if (!user) {
      return null;
    }

    if (!verifyPassword(args.password, user.passwordHash)) {
      return null;
    }

    return {
      userId: user._id,
      username: user.username,
      permissions: user.permissions,
    };
  },
});

export async function validateUserSession(
  ctx: QueryCtx,
  userId: Id<"users">,
  requiredPermission: Permission
): Promise<void> {
  const user = await ctx.db.get(userId);
  if (!user) {
    throw new Error("User not found");
  }

  // Check permission level
  // editor > viewer > none
  if (requiredPermission === "editor" && user.permissions !== "editor") {
    throw new Error("Insufficient permissions");
  }
  if (requiredPermission === "viewer" && user.permissions === "none") {
    throw new Error("Insufficient permissions");
  }
  // "none" permission means they can access reports only, which is checked at the call site
}
