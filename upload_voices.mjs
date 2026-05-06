import { ConvexClient } from "convex/browser";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const convex = new ConvexClient(process.env.VITE_CONVEX_URL);

async function uploadFile(filePath, voiceLabel) {
    console.log(`[+] Uploading ${voiceLabel}...`);
    // 1. Get a short-lived upload URL
    const uploadUrl = await convex.mutation("storage:generateUploadUrl");

    // 2. Read file and POST it
    const fileData = fs.readFileSync(filePath);
    const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": filePath.endsWith("mpeg") ? "audio/mpeg" : "audio/mp3" },
        body: fileData,
    });

    if (!result.ok) {
        throw new Error(`Failed to upload ${voiceLabel}: ${result.statusText}`);
    }

    const { storageId } = await result.json();

    // 3. Save the ID to the audiobook record
    await convex.mutation("storage:setBookAudioUrl", {
        voiceLabel,
        storageId,
    });

    console.log(`[OK] ${voiceLabel} uploaded and attached.`);
}

async function main() {
    const dir = path.join(process.cwd(), "vozes");

    const mappings = [
        { file: "voz cris.mp3", label: "Cris" },
        { file: "voz fabio.mpeg", label: "Fabio Arruda" },
        { file: "voz mulher 25 anos.mp3", label: "Ana Clara" },
        { file: "voz sid.mpeg", label: "Sid Moreira" }
    ];

    for (const m of mappings) {
        const fullPath = path.join(dir, m.file);
        if (fs.existsSync(fullPath)) {
            await uploadFile(fullPath, m.label);
        } else {
            console.log(`Arquivo não encontrado: ${fullPath}`);
        }
    }

    console.log("Uploads completos!");
}

main().catch(console.error);
