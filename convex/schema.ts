import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

/**
 * Convex database schema.
 * Defines all tables and their fields used in the application.
 */
export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  conversations: defineTable({
    participantOne: v.string(),
    participantTwo: v.string(),
  })
    .index("by_participant_one", ["participantOne"])
    .index("by_participant_two", ["participantTwo"]),

  messages: defineTable({
    conversationId: v.id("conversations"),
    senderId: v.string(),
    text: v.string(),
  }).index("by_conversation", ["conversationId"]),

  presence: defineTable({
    clerkId: v.string(),
    online: v.boolean(),
    lastSeen: v.number(),
  }).index("by_clerk_id", ["clerkId"]),

  typing: defineTable({
  conversationId: v.string(),
  clerkId: v.string(),
  lastTyped: v.number(),
}).index("by_conversation", ["conversationId"])
  .index("by_conversation_and_user", ["conversationId", "clerkId"]),

});
