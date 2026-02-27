import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Typing indicators functionality - allows users to see when the other participant is typing.
 */

export const setTyping = mutation({
  args: {
    conversationId: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("typing", {
      conversationId: args.conversationId as unknown as import("./_generated/dataModel").Id<"conversations">,
      clerkId: args.clerkId,
      lastTyped: Date.now(),
    });
  },
});

export const clearTyping = mutation({
  args: {
    conversationId: v.string(),
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId as unknown as import("./_generated/dataModel").Id<"conversations">)
      )
      .collect();

    const mine = records.filter((r) => r.clerkId === args.clerkId);
    await Promise.all(mine.map((r) => ctx.db.delete(r._id)));
  },
});

export const getTyping = query({
  args: {
    conversationId: v.string(),
    currentClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const records = await ctx.db
      .query("typing")
      .withIndex("by_conversation", (q) =>
        q.eq("conversationId", args.conversationId as unknown as import("./_generated/dataModel").Id<"conversations">)
      )
      .collect();

    return records.filter((r) => r.clerkId !== args.currentClerkId);
  },
});