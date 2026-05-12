import fs from 'fs';
import path from 'path';
import { ConvexHttpClient } from "convex/browser";

const CONVEX_URL = "https://tame-beagle-646.convex.cloud";
const client = new ConvexHttpClient(CONVEX_URL);

const VOICES = [
    { file: "voz cris.mp3",           label: "Cris",            gender: "female", description: "Voz feminina suave",      mime: "audio/mpeg" },
    { file: "voz fabio.mpeg",         label: "Fábio",           gender: "male",   description: "Voz masculina natural",   mime: "audio/mpeg" },
    { file: "voz mulher 25 anos.mp3", label: "Mulher Jovem",    gender: "female", description: "Voz feminina jovem",      mime: "audio/mpeg" },
    { file: "voz sid.mpeg",           label: "Sid",             gender: "male",   description: "Voz masculina marcante",  mime: "audio/mpeg" },
];

const VOZES_DIR = "D:/antigravity/audioleitor-app/vozes";

async function uploadVoice(voice) {
    console.log(`\n── Processando: ${voice.label} (${voice.file})...`);

    // 1. Gerar URL de upload
    const uploadUrl = await client.mutation("storage:generateUploadUrl");

    // 2. Ler arquivo
    const filePath = path.join(VOZES_DIR, voice.file);
    const buffer = fs.readFileSync(filePath);
    const sizeMB = (buffer.length / 1024 / 1024).toFixed(1);
    console.log(`   Tamanho: ${sizeMB} MB`);

    // 3. Upload para Convex Storage
    console.log(`   Enviando para Storage...`);
    const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": voice.mime },
        body: buffer,
    });
    const { storageId } = await result.json();
    console.log(`   Storage ID: ${storageId}`);

    // 4. Obter URL real
    // Precisamos chamar a mutation setBookAudioUrl, mas primeiro verificar se já existe um audiobook com esse label
    // Vamos usar a mutation fixPdfUrl adaptada — na verdade vamos criar o audiobook completo

    return { storageId, label: voice.label, gender: voice.gender, description: voice.description };
}

async function main() {
    try {
        // Primeiro, pegar a URL do PDF que já está no banco
        // Buscar audiobooks existentes
        const existingBooks = await client.query("audiobooks:getAudiobooks");
        console.log(`Audiobooks existentes: ${existingBooks.length}`);

        // Pegar a URL do PDF do primeiro livro (todos compartilham o mesmo PDF)
        const pdfUrl = existingBooks[0]?.pdf_url;
        const chapters = existingBooks[0]?.chapters;
        console.log(`PDF URL: ${pdfUrl}`);

        // Deletar o audiobook existente (vamos recriar com as 4 vozes)
        // Na verdade, não temos uma mutation de delete. Vamos só adicionar as novas vozes.
        // O existente já tem label "Fábio", vamos pular duplicatas.

        const existingLabels = existingBooks.map(b => b.voice_label);
        console.log(`Labels existentes: ${existingLabels.join(", ")}`);

        for (const voice of VOICES) {
            // Upload do áudio
            const { storageId, label, gender, description } = await uploadVoice(voice);

            // Obter URL real do storage
            const uploadUrl2 = await client.mutation("storage:generateUploadUrl");
            // Vamos usar o storageId diretamente com setBookAudioUrl
            // Mas setBookAudioUrl procura por voice_label. Se o audiobook não existe, precisamos criar.

            if (existingLabels.includes(label)) {
                console.log(`   ⏭ Audiobook "${label}" já existe, atualizando áudio...`);
                await client.mutation("storage:setBookAudioUrl", {
                    voiceLabel: label,
                    storageId: storageId,
                });
            } else {
                // Precisamos obter a URL do áudio antes de inserir
                // Vamos criar uma rota temporária — ou usar a mesma abordagem do fixPdfUrl
                // Na verdade, a URL pública do storage é acessível via a API do Convex
                // Vamos inserir o audiobook COM o storageId e depois resolver a URL
                
                console.log(`   ✨ Criando audiobook "${label}"...`);
                
                // Inserir audiobook com áudio vazio primeiro
                await client.mutation("audiobooks:addAudiobook", {
                    title: "Gestão de Riscos Psicossociais",
                    author_name: "Audiobook Fabio",
                    pdf_url: pdfUrl,
                    voice_label: label,
                    voice_gender: gender,
                    voice_description: description,
                    chapters: chapters,
                });

                // Agora usar setBookAudioUrl para preencher o audio_url
                await client.mutation("storage:setBookAudioUrl", {
                    voiceLabel: label,
                    storageId: storageId,
                });
            }

            console.log(`   ✅ "${label}" concluído!`);
        }

        console.log("\n══════════════════════════════");
        console.log("✅ Todas as 4 vozes processadas!");
        console.log("══════════════════════════════\n");

    } catch (e) {
        console.error("Erro:", e);
    }
}

main();
