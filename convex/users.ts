import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// get user by clerk userId
export const getUserByClerkUserId = query({
  args: { userId: v.string() },
  handler: async (ctx, { userId }) => {
    if (!userId) return null;

    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
  },
});

// create or update user (based on Clerk )
export const upsertUser = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  },
  handler: async (ctx, { userId, name, email, imageUrl }) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();
    if (existingUser) {
      await ctx.db.patch(existingUser._id, { name, imageUrl });
      return existingUser._id;
    }

    return await ctx.db.insert("users", { userId, name, email, imageUrl });
  },
});

// search users by name/email
export const searchUsers = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, { searchTerm }) => {
    if (!searchTerm.trim()) return {};
    const normalizedSearch = searchTerm.toLowerCase().trim();

    // get all users and filter them
    const allUsers = await ctx.db.query("users").collect();

    return allUsers
      .filter(
        (user) =>
          user.name.toLocaleLowerCase().includes(normalizedSearch) ||
          user.email.toLowerCase().includes(normalizedSearch)
      )
      .slice(0, 20); // grab first 20, to improve performance ...
  },
});
