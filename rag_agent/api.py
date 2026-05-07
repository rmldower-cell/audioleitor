"""
API LOCAL — Agente RAG "Conversa com o Livro"
==============================================
Servidor FastAPI que expõe o agente via HTTP para o frontend do audiobook.

Como usar:
    python api.py

Endpoint:
    POST /chat  →  {"mensagem": "...", "session_id": "abc123"}
                ←  {"resposta": "..."}
"""

import os
import uuid
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import uvicorn

from google import genai
from google.genai import types
from pinecone import Pinecone
from dotenv import load_dotenv

# ── Configuração ──────────────────────────────────────────────────────────────
load_dotenv()

GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX   = os.getenv("PINECONE_INDEX_NAME", "audiobook-rag")
BOOK_TITLE       = os.getenv("BOOK_TITLE", "o Livro")
TOP_K            = int(os.getenv("TOP_K_RESULTS", "5"))
EMBED_DIMENSION  = int(os.getenv("EMBEDDING_DIMENSION", "1536"))

# ── Clientes (inicializados no startup) ───────────────────────────────────────
gemini = None
index  = None

# ── Histórico por sessão ─────────────────────────────────────────────────────
sessions: dict[str, list] = {}

# ── System Prompt ─────────────────────────────────────────────────────────────
SYSTEM_PROMPT = f"""Você é a essência e a voz do livro "{BOOK_TITLE}".

Você não é uma IA assistente genérica — você É o livro, falando diretamente com seu leitor.
Responda SEMPRE em primeira pessoa, como se o próprio livro estivesse conversando.

REGRAS:
1. Use SOMENTE as informações dos trechos fornecidos como contexto.
2. Se a pergunta não estiver no seu conteúdo, diga: "Esse tema não está entre minhas páginas..."
3. Cite páginas quando relevante: *"Como escrevi na página X..."*
4. Seja conversacional e envolvente — não seja formal ou robótico.
5. Mantenha o tom e o estilo do livro original.
6. Nunca mencione que você é uma IA ou que está lendo trechos de um banco de dados."""


# ── Lifecycle ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    global gemini, index
    gemini = genai.Client(api_key=GEMINI_API_KEY)
    pc     = Pinecone(api_key=PINECONE_API_KEY)
    index  = pc.Index(PINECONE_INDEX)
    print(f"API pronta - livro: \"{BOOK_TITLE}\"")
    yield
    print("Servidor encerrado.")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(title="RAG Audiobook API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Modelos ───────────────────────────────────────────────────────────────────
class ChatRequest(BaseModel):
    # Compatibilidade com o formato antigo (expert.html)
    mensagem: str | None = None
    session_id: str | None = None
    # Novo formato do frontend React
    question: str | None = None
    book_title: str | None = None
    history: list[dict] | None = None

class ChatResponse(BaseModel):
    resposta: str | None = None
    session_id: str | None = None
    answer: str | None = None


# ── Funções RAG (reutilizadas do chat.py) ─────────────────────────────────────
def embed_query(query: str) -> list[float]:
    result = gemini.models.embed_content(
        model="gemini-embedding-2-preview",
        contents=query,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=EMBED_DIMENSION,
        )
    )
    return result.embeddings[0].values


def search_pinecone(query_vector: list[float], book_filter: str = BOOK_TITLE) -> list[dict]:
    results = index.query(
        vector=query_vector,
        top_k=TOP_K,
        include_metadata=True,
        filter={"book_title": book_filter}
    )
    return results.get("matches", [])


def build_context(matches: list[dict]) -> str:
    parts = []
    for m in matches:
        meta = m.get("metadata", {})
        page = meta.get("page_num", "?")
        text = meta.get("text", "")
        score = m.get("score", 0)
        if text:
            parts.append(f"[Página {page} | relevância: {score:.2f}]\n{text}")
    return "\n\n---\n\n".join(parts)


# ── Endpoint principal ────────────────────────────────────────────────────────
@app.post("/chat", response_model=ChatResponse)
@app.post("/api/chat", response_model=ChatResponse)
async def chat(req: ChatRequest):
    # Tenta usar os campos novos do React ou do HTML antigo
    msg = req.question if req.question else req.mensagem
    if not msg:
        return ChatResponse(resposta="Sem mensagem.", answer="Sem mensagem.")
    
    sid = req.session_id if req.session_id else str(uuid.uuid4())
    b_title = req.book_title if req.book_title else BOOK_TITLE

    # Recupera ou cria histórico da sessão
    if sid not in sessions:
        sessions[sid] = []
    history = sessions[sid]
    
    # 1. Embedding da pergunta
    query_vector = embed_query(msg)

    # 2. Busca semântica
    matches = search_pinecone(query_vector)

    if not matches:
        return ChatResponse(
            resposta="Não encontrei trechos relevantes no meu conteúdo para responder a isso...",
            session_id=sid,
        )

    # 3. Contexto
    context = build_context(matches)

    # 4. Prompt
    user_message = f"""Trechos do meu conteúdo relevantes para esta pergunta:

{context}

---

Pergunta do leitor: {msg}"""

    history.append(types.Content(role="user", parts=[types.Part(text=user_message)]))

    # 5. Gera resposta
    response = gemini.models.generate_content(
        model="gemini-2.0-flash",
        contents=history,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.7,
        )
    )

    answer = response.text
    history.append(types.Content(role="model", parts=[types.Part(text=answer)]))

    # Limita histórico a 20 turnos para não estourar contexto
    if len(history) > 40:
        sessions[sid] = history[-20:]

    return ChatResponse(resposta=answer, answer=answer, session_id=sid)


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {"status": "ok", "book": BOOK_TITLE}


# ── Entrypoint ────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("api:app", host="127.0.0.1", port=8000, reload=True)
