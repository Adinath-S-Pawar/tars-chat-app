import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Presence mutations and queries.
 * Handles real-time online/offline status for users.
 */

/** Sets a user as online or offline. */
export const setPresence = mutation({
  args: {
    clerkId: v.string(),
    online: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("presence")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        online: args.online,
        lastSeen: Date.now(),
      });
    } else {
      await ctx.db.insert("presence", {
        clerkId: args.clerkId,
        online: args.online,
        lastSeen: Date.now(),
      });
    }
  },
});

/** Returns presence records for a list of clerkIds. */
export const getPresence = query({
  args: { clerkIds: v.array(v.string()) },
  handler: async (ctx, args) => {
    const records = await Promise.all(
      args.clerkIds.map((id) =>
        ctx.db
          .query("presence")
          .withIndex("by_clerk_id", (q) => q.eq("clerkId", id))
          .unique()
      )
    );
    return records.filter(Boolean);
  },
});
