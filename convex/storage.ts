import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const getStorageUrl = query({
    args: { storageId: v.id("_storage") },
    handler: async (ctx, args) => {
        return await ctx.storage.getUrl(args.storageId);
    },
});

export const fixPdfUrl = mutation({
    args: {
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) throw new Error("URL não gerada para o storageId");

        const books = await ctx.db.query("audiobooks").collect();
        for (const book of books) {
            await ctx.db.patch(book._id, { pdf_url: url });
        }
        return url;
    },
});

export const setBookAudioUrl = mutation({
    args: {
        voiceLabel: v.string(),
        storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const url = await ctx.storage.getUrl(args.storageId);
        if (!url) throw new Error("URL não gerada");

        // Procura o audio
        const books = await ctx.db
            .query("audiobooks")
            .filter((q) => q.eq(q.field("voice_label"), args.voiceLabel))
            .collect();

        for (const book of books) {
            await ctx.db.patch(book._id, { audio_url: url });
        }
    },
});
