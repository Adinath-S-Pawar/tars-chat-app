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

/** Returns unread counts for all conversations for current user. */
export const getAllUnreadCounts = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const counts: Record<string, number> = {};

    const lastReadRecords = await ctx.db
      .query("lastRead")
      .collect();

    const userRecords = lastReadRecords.filter(
      (r) => r.clerkId === args.clerkId
    );

    const recordMap = new Map(
      userRecords.map((r) => [r.conversationId, r.lastReadTime])
    );

    const allMessages = await ctx.db.query("messages").collect();

    for (const msg of allMessages) {
      if (msg.senderId === args.clerkId) continue;

      const lastReadTime = recordMap.get(msg.conversationId) ?? 0;

      if (msg._creationTime > lastReadTime) {
        const key = msg.conversationId;
        counts[key] = (counts[key] ?? 0) + 1;
      }
    }

    return counts;
  },
});