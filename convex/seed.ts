import { mutation } from "./_generated/server";

export default mutation({
    handler: async (ctx) => {
        const chapters = [
            { num: 1, title: "Introdução", startPage: 15 },
            { num: 2, title: "Riscos Psicossociais", startPage: 17 },
            { num: 3, title: "Gestão e NR-01", startPage: 21 },
            { num: 4, title: "Gestão Prática", startPage: 23 },
            { num: 5, title: "Proposição de Framework", startPage: 31 },
            { num: 6, title: "Etapas do Framework", startPage: 34 },
            { num: 7, title: "Conclusão", startPage: 69 }
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
