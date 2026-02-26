import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Conversation mutations and queries.
 * Handles creating and fetching one-on-one conversations.
 */

/** Creates a new conversation between two users, or returns existing one. */
export const getOrCreate = mutation({
  args: {
    currentClerkId: v.string(),
    otherClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("conversations")
      .filter((q) =>
        q.or(
          q.and(
            q.eq(q.field("participantOne"), args.currentClerkId),
            q.eq(q.field("participantTwo"), args.otherClerkId)
          ),
          q.and(
            q.eq(q.field("participantOne"), args.otherClerkId),
            q.eq(q.field("participantTwo"), args.currentClerkId)
          )
        )
      )
      .unique();

    if (existing) return existing._id;

    return await ctx.db.insert("conversations", {
      participantOne: args.currentClerkId,
      participantTwo: args.otherClerkId,
    });
  },
});

/** Returns all conversations for the current user with other user's details. */
export const getUserConversations = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    const asOne = await ctx.db
      .query("conversations")
      .withIndex("by_participant_one", (q) =>
        q.eq("participantOne", args.clerkId)
      )
      .collect();

    const asTwo = await ctx.db
      .query("conversations")
      .withIndex("by_participant_two", (q) =>
        q.eq("participantTwo", args.clerkId)
      )
      .collect();

    const all = [...asOne, ...asTwo];

    const withUsers = await Promise.all(
      all.map(async (conv) => {
        const otherClerkId =
          conv.participantOne === args.clerkId
            ? conv.participantTwo
            : conv.participantOne;

        const otherUser = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", otherClerkId))
          .unique();

        return { ...conv, otherUser };
      })
    );

    return withUsers;
  },
});
