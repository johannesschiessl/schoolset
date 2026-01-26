import { v } from "convex/values";
import { query } from "./_generated/server";

export type Role = "viewer" | "editor";

export function validatePassword(
  password: string,
  requiredRole: Role,
): boolean {
  const editorPassword = process.env.EDITOR_PASSWORD;
  const viewerPassword = process.env.VIEWER_PASSWORD;

  if (!editorPassword || !viewerPassword) {
    throw new Error("Passwords not configured in environment");
  }

  if (requiredRole === "editor") {
    return password === editorPassword;
  }
  // Viewer can use either password
  return password === viewerPassword || password === editorPassword;
}

export const checkPassword = query({
  args: { password: v.string() },
  returns: v.union(v.literal("editor"), v.literal("viewer"), v.null()),
  handler: async (_ctx, args) => {
    const editorPassword = process.env.EDITOR_PASSWORD;
    const viewerPassword = process.env.VIEWER_PASSWORD;

    if (!editorPassword || !viewerPassword) {
      throw new Error("Passwords not configured in environment");
    }

    if (args.password === editorPassword) {
      return "editor";
    }
    if (args.password === viewerPassword) {
      return "viewer";
    }
    return null;
  },
});
