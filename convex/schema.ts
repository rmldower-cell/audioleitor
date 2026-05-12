import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    audiobooks: defineTable({
        title: v.string(),
        author_name: v.string(),
        cover_url: v.optional(v.string()),
        pdf_url: v.string(),
        audio_url: v.optional(v.string()),
        voice_label: v.string(),
        voice_gender: v.optional(v.string()),
        voice_description: v.optional(v.string()),
        skip_to_timestamp: v.optional(v.number()),
        total_duration: v.optional(v.number()),
        sync_json: v.optional(v.any()),
        chapters: v.optional(
            v.array(
                v.object({
                    num: v.number(),
                    title: v.string(),
                    startPage: v.number(),
                    audioTimestamp: v.optional(v.number()),
                })
            )
        ),
    }),
});
