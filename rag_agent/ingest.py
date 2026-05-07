"""
PASSO 1: INGESTÃO DO LIVRO
==========================
Executa UMA VEZ para processar o PDF e salvar os embeddings no Pinecone.

Como usar:
1. Coloque o PDF do livro nesta pasta (renomeie para livro.pdf ou ajuste BOOK_PDF_PATH no .env)
2. Execute: python ingest.py

O que este script faz:
- Lê o PDF page by page
- Envia cada página para o Gemini Embedding 2 Preview (multimodal)
- Salva os vetores no Pinecone com metadados (nº da página, trecho de texto)
"""

import os
import io
import time
import pypdf
from google import genai
from google.genai import types
from pinecone import Pinecone
from dotenv import load_dotenv

# ── Carrega variáveis do .env ─────────────────────────────────────────────────
load_dotenv()

GEMINI_API_KEY    = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY  = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX    = os.getenv("PINECONE_INDEX_NAME", "audiobook-rag")
BOOK_TITLE        = os.getenv("BOOK_TITLE", "Livro")
BOOK_PDF_PATH     = os.getenv("BOOK_PDF_PATH", "./livro.pdf")
EMBED_DIMENSION   = int(os.getenv("EMBEDDING_DIMENSION", "1536"))

# ── Clientes ──────────────────────────────────────────────────────────────────
gemini  = genai.Client(api_key=GEMINI_API_KEY)
pc      = Pinecone(api_key=PINECONE_API_KEY)
index   = pc.Index(PINECONE_INDEX)

# ── Funções ───────────────────────────────────────────────────────────────────

def embed_pdf_page_bytes(page_bytes: bytes) -> list[float]:
    """Gera embedding de uma página PDF usando Gemini Embedding 2 Preview (multimodal)."""
    result = gemini.models.embed_content(
        model="gemini-embedding-2-preview",
        contents=[
            types.Part.from_bytes(
                data=page_bytes,
                mime_type="application/pdf",
            )
        ],
        config=types.EmbedContentConfig(output_dimensionality=EMBED_DIMENSION)
    )
    return result.embeddings[0].values


def ingest_book(pdf_path: str):
    """Processa o PDF página por página e upserta no Pinecone."""
    print(f"\n📖 Iniciando ingestão de: {BOOK_TITLE}")
    print(f"   Arquivo: {pdf_path}")

    reader = pypdf.PdfReader(pdf_path)
    total_pages = len(reader.pages)
    print(f"   Total de páginas: {total_pages}\n")

    batch = []
    BATCH_SIZE = 10  # Envia ao Pinecone a cada 10 páginas

    for page_num in range(total_pages):
        page = reader.pages[page_num]
        page_text = page.extract_text() or ""

        print(f"  [{page_num + 1}/{total_pages}] Gerando embedding da página {page_num + 1}...")

        try:
            # Cria um PDF de página única em bytes para embedding multimodal
            writer = pypdf.PdfWriter()
            writer.add_page(page)
            page_buffer = io.BytesIO()
            writer.write(page_buffer)
            page_bytes = page_buffer.getvalue()

            embedding = embed_pdf_page_bytes(page_bytes)
        except Exception as e:
            print(f"  ⚠️  Erro na página {page_num + 1}: {e}. Pulando...")
            continue

        # Prepara vetor para o Pinecone
        vector = {
            "id": f"{BOOK_TITLE.replace(' ', '_')}_page_{page_num + 1}",
            "values": embedding,
            "metadata": {
                "book_title": BOOK_TITLE,
                "page_num": page_num + 1,
                "text": page_text[:1000],  # Salva preview do texto como metadado
            }
        }
        batch.append(vector)

        # Upsert em lote
        if len(batch) >= BATCH_SIZE or page_num == total_pages - 1:
            index.upsert(vectors=batch)
            print(f"  ✅ Salvo lote de {len(batch)} páginas no Pinecone.")
            batch = []
            time.sleep(0.5)  # Evita rate limit

    print(f"\n🎉 Ingestão concluída! {total_pages} páginas indexadas no Pinecone.")
    print(f"   Index: {PINECONE_INDEX}")


# ── Execução ──────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    if not os.path.exists(BOOK_PDF_PATH):
        print(f"❌ PDF não encontrado em: {BOOK_PDF_PATH}")
        print("   Coloque o PDF nesta pasta e ajuste BOOK_PDF_PATH no .env")
    else:
        ingest_book(BOOK_PDF_PATH)
