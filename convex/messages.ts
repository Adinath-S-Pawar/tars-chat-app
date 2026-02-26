import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Message mutations and queries.
 * Handles sending and fetching messages in a conversation.
 */

/** Sends a new message in a conversation. */
export const send = mutation({
  args: {
    conversationId: v.id("conversations"),
    senderId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("messages", {
      conversationId: args.conversationId,
      senderId: args.senderId,
      text: args.text,
      createdAt: Date.now(),
    });
  },
});

/** Fetches all messages for a conversation. Auto-updates in real time. */
export const list = query({
  args: { conversationId: v.id("conversations") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId)
      )
      .order("asc")
      .collect();
  },
});

