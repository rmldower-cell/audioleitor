import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const getAudiobooks = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("audiobooks").collect();
    },
});

export const addAudiobook = mutation({
    args: {
        title: v.string(),
        author_name: v.string(),
        cover_url: v.optional(v.string()),
        pdf_url: v.string(),
        audio_url: v.optional(v.string()),
        voice_label: v.string(),
        voice_gender: v.optional(v.string()),
        voice_description: v.optional(v.string()),
        chapters: v.optional(v.any()), // Permite inserção inicial rápida
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert("audiobooks", args);
    },
});
