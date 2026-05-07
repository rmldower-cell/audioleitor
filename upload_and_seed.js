import fs from 'fs';
import { ConvexHttpClient } from "convex/browser";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const CONVEX_URL = "https://tame-beagle-646.convex.cloud"; // Producao
const client = new ConvexHttpClient(CONVEX_URL);

async function main() {
    try {
        console.log("Gerando URL de upload...");
        // Call the mutation to generate upload URL
        const uploadUrl = await client.mutation("storage:generateUploadUrl");
        console.log("URL de upload:", uploadUrl);

        console.log("Lendo arquivo PDF...");
        const pdfBuffer = fs.readFileSync("D:/antigravity/rag_agent/media/gestao_de_riscos.pdf");
        
        console.log("Enviando arquivo para o Storage da Convex...");
        const result = await fetch(uploadUrl, {
            method: "POST",
            headers: { "Content-Type": "application/pdf" },
            body: pdfBuffer,
        });
        
        const { storageId } = await result.json();
        console.log("Storage ID retornado:", storageId);
        
        // We need the direct URL to the PDF. Convex provides `storage.getUrl()` but it's a server-side API.
        // Usually the client can access it via `${CONVEX_URL}/api/storage/${storageId}`.
        const pdfUrl = `${CONVEX_URL}/api/storage/${storageId}`;
        console.log("URL do PDF:", pdfUrl);

        console.log("Inserindo audiobook...");
        await client.mutation("audiobooks:addAudiobook", {
            title: "Gestão de Riscos Psicossociais",
            author_name: "Audiobook Fabio",
            pdf_url: pdfUrl,
            voice_label: "Fábio",
            chapters: [
                { num: 1, title: "Introdução", startPage: 15 },
                { num: 2, title: "Riscos Psicossociais", startPage: 17 },
                { num: 3, title: "Gestão e NR-01", startPage: 21 },
                { num: 4, title: "Gestão Prática", startPage: 23 },
                { num: 5, title: "Proposição de Framework", startPage: 31 },
                { num: 6, title: "Etapas do Framework", startPage: 34 },
                { num: 7, title: "Conclusão", startPage: 69 }
            ]
        });

        console.log("Audiobook inserido com sucesso!");
    } catch (e) {
        console.error("Erro:", e);
    }
}

main();
