import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Typing indicator mutations and queries.
 * Tracks who is currently typing in a conversation.
 */

/** Sets or updates typing status for a user in a conversation. */
export const setTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typing")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("clerkId", args.clerkId)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { lastTyped: Date.now() });
    } else {
      await ctx.db.insert("typing", {
        conversationId: args.conversationId,
        clerkId: args.clerkId,
        lastTyped: Date.now(),
      });
    }
  },
});

/** Clears typing status for a user in a conversation. */
export const clearTyping = mutation({
  args: {
    conversationId: v.id("conversations"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("typing")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("clerkId", args.clerkId)
      )
      .unique();

    if (existing) {
      await ctx.db.delete(existing._id);
    }
  },
});

/** Returns typing users in a conversation excluding current user. */
export const getTyping = query({
  args: {
    conversationId: v.id("conversations"),
    currentClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    return records.filter((r) => r.clerkId !== args.currentClerkId);
  },
});
