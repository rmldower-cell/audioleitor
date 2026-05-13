import { mutation } from "./_generated/server";

export default mutation({
    handler: async (ctx) => {
        const chapters = [
            { num: 0, title: "Prefácio", startPage: 5, audioTimestamp: 360 },
            { num: 1, title: "Introdução", startPage: 14, audioTimestamp: 1028 },
            { num: 2, title: "Riscos Psicossociais", startPage: 16, audioTimestamp: 1320 },
            { num: 3, title: "Gestão e NR-01", startPage: 20, audioTimestamp: 1930 },
            { num: 4, title: "Gestão Prática", startPage: 22, audioTimestamp: 2285 },
            { num: 5, title: "Proposição de Framework", startPage: 30, audioTimestamp: 2949 },
            { num: 6, title: "Etapas do Framework", startPage: 33, audioTimestamp: 3207 },
            { num: 7, title: "Conclusão", startPage: 69, audioTimestamp: 5290 }
        ];

        const sync_json = [
            { start: 0, end: 3, text: "Bem vindo.", page: 1, spanIndex: 0 },
            { start: 3, end: 6, text: "Este é o sistema.", page: 1, spanIndex: 1 },
            { start: 6, end: 12, text: "Iniciando processo.", page: 1, spanIndex: 2 },
            { start: 12, end: 18, text: "Capítulo de diagnóstico.", page: 2, spanIndex: 0 },
            { start: 18, end: 25, text: "Buscando dados.", page: 2, spanIndex: 1 }
        ];

        const existing = await ctx.db.query("audiobooks").collect();
        for (const book of existing) {
            await ctx.db.patch(book._id, {
                chapters,
                sync_json
            });
        }
    }
});
