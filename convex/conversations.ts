import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Creates a new conversation between two users or returns existing one.
 */
export const getOrCreateConversation = mutation({
  args: {
    currentClerkId: v.string(),
    otherClerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const { currentClerkId, otherClerkId } = args;

    const asParticipantOne = await ctx.db
      .query("conversations")
      .withIndex("by_participant_one", (q) =>
        q.eq("participantOne", currentClerkId)
      )
      .collect();

    const existing = asParticipantOne.find(
      (c) => c.participantTwo === otherClerkId
    );
    if (existing) return existing._id;

    const asParticipantTwo = await ctx.db
      .query("conversations")
      .withIndex("by_participant_two", (q) =>
        q.eq("participantTwo", currentClerkId)
      )
      .collect();

    const existingReverse = asParticipantTwo.find(
      (c) => c.participantOne === otherClerkId
    );
    if (existingReverse) return existingReverse._id;

    return await ctx.db.insert("conversations", {
      participantOne: currentClerkId,
      participantTwo: otherClerkId,
    });
  },
});

/**
 * Returns all conversations for the current user with other user's profile.
 */
export const getUserConversations = query({
  args: { currentClerkId: v.string() },
  handler: async (ctx, args) => {
    const { currentClerkId } = args;

    const asOne = await ctx.db
      .query("conversations")
      .withIndex("by_participant_one", (q) =>
        q.eq("participantOne", currentClerkId)
      )
      .collect();

    const asTwo = await ctx.db
      .query("conversations")
      .withIndex("by_participant_two", (q) =>
        q.eq("participantTwo", currentClerkId)
      )
      .collect();

    const all = [...asOne, ...asTwo];

    const withUsers = await Promise.all(
      all.map(async (conv) => {
        const otherClerkId =
          conv.participantOne === currentClerkId
            ? conv.participantTwo
            : conv.participantOne;

        const otherUser = await ctx.db
          .query("users")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", otherClerkId))
          .unique();

        if (!otherUser) return null;

        return { ...conv, otherUser };
      })
    );

    return withUsers.filter(Boolean);
  },
});
