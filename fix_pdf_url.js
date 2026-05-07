import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = "https://tame-beagle-646.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
    try {
        console.log("Corrigindo URL do PDF no banco de produção...");
        const url = await client.mutation("storage:fixPdfUrl", {
            storageId: "kg27v6f8zjeha0re2b9jyqcsv1869wwe",
        });
        console.log("URL corrigida para:", url);
    } catch (e) {
        console.error("Erro:", e);
    }
}

main();
