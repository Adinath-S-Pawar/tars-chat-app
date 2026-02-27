import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Tracks last read time per user per conversation.
 * Used to calculate unread message counts.
 */

/** Marks a conversation as read for the current user. */
export const markAsRead = mutation({
  args: {
    conversationId: v.id("conversations"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("lastRead")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("clerkId", args.clerkId)
      )
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { lastReadTime: Date.now() });
    } else {
      await ctx.db.insert("lastRead", {
        conversationId: args.conversationId,
        clerkId: args.clerkId,
        lastReadTime: Date.now(),
      });
    }
  },
});

/** Returns unread message count for a conversation for the current user. */
export const getUnreadCount = query({
  args: {
    conversationId: v.id("conversations"),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const lastReadRecord = await ctx.db
      .query("lastRead")
      .withIndex("by_conversation_and_user", (q) =>
        q.eq("conversationId", args.conversationId).eq("clerkId", args.clerkId)
      )
      .first();

    const lastReadTime = lastReadRecord?.lastReadTime ?? 0;

    const messages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .collect();

    return messages.filter(
      (m) => m._creationTime > lastReadTime && m.senderId !== args.clerkId
    ).length;
  },
});
