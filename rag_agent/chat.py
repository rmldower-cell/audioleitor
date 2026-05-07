"""
PASSO 2: CONVERSA COM O LIVRO
==============================
Execute este script para interagir com o livro via terminal.

Como usar:
    python chat.py

Fluxo por pergunta:
    1. Gera embedding da pergunta (Gemini Embedding 2 Preview)
    2. Busca os chunks mais relevantes no Pinecone (similarity search)
    3. Monta o prompt com os trechos como contexto
    4. Gemini Flash responde "na voz do livro"
"""

import os
from google import genai
from google.genai import types
from pinecone import Pinecone
from dotenv import load_dotenv

# ── Carrega variáveis do .env ─────────────────────────────────────────────────
load_dotenv()

GEMINI_API_KEY   = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX   = os.getenv("PINECONE_INDEX_NAME", "audiobook-rag")
BOOK_TITLE       = os.getenv("BOOK_TITLE", "o Livro")
TOP_K            = int(os.getenv("TOP_K_RESULTS", "5"))
EMBED_DIMENSION  = int(os.getenv("EMBEDDING_DIMENSION", "1536"))

# ── Clientes ──────────────────────────────────────────────────────────────────
gemini = genai.Client(api_key=GEMINI_API_KEY)
pc     = Pinecone(api_key=PINECONE_API_KEY)
index  = pc.Index(PINECONE_INDEX)

# ── System Prompt (Persona "Voz do Livro") ───────────────────────────────────
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

# ── Funções ───────────────────────────────────────────────────────────────────

def embed_query(query: str) -> list[float]:
    """Gera embedding textual da pergunta do usuário."""
    result = gemini.models.embed_content(
        model="gemini-embedding-2-preview",
        contents=query,
        config=types.EmbedContentConfig(
            task_type="RETRIEVAL_QUERY",
            output_dimensionality=EMBED_DIMENSION,
        )
    )
    return result.embeddings[0].values


def search_pinecone(query_vector: list[float]) -> list[dict]:
    """Busca os chunks mais relevantes no Pinecone."""
    results = index.query(
        vector=query_vector,
        top_k=TOP_K,
        include_metadata=True,
        filter={"book_title": BOOK_TITLE}
    )
    return results.get("matches", [])


def build_context(matches: list[dict]) -> str:
    """Monta o contexto a partir dos chunks recuperados."""
    context_parts = []
    for match in matches:
        meta = match.get("metadata", {})
        page  = meta.get("page_num", "?")
        text  = meta.get("text", "")
        score = match.get("score", 0)
        if text:
            context_parts.append(f"[Página {page} | relevância: {score:.2f}]\n{text}")
    return "\n\n---\n\n".join(context_parts)


def ask_book(question: str, chat_history: list) -> str:
    """Faz uma pergunta ao livro. Retorna a resposta como string."""
    print("\n[Buscando no livro...]")

    # 1. Embedding da pergunta
    query_vector = embed_query(question)

    # 2. Busca semântica no Pinecone
    matches = search_pinecone(query_vector)

    if not matches:
        return "Não encontrei trechos relevantes no meu conteúdo para responder a isso..."

    # 3. Contexto dos chunks recuperados
    context = build_context(matches)

    # 4. Prompt final
    user_message = f"""Trechos do meu conteúdo relevantes para esta pergunta:

{context}

---

Pergunta do leitor: {question}"""

    # 5. Adiciona ao histórico e chama o Gemini
    chat_history.append(types.Content(role="user", parts=[types.Part(text=user_message)]))

    response = gemini.models.generate_content(
        model="gemini-1.5-flash",
        contents=chat_history,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.7,
        )
    )

    answer = response.text

    # 6. Adiciona resposta ao histórico (memória de conversa)
    chat_history.append(types.Content(role="model", parts=[types.Part(text=answer)]))

    return answer


# ── Loop de conversa no terminal ──────────────────────────────────────────────

def main():
    print(f"\n[Bem-vindo!] Você agora está conversando com o livro:")
    print(f'   "{BOOK_TITLE}"\n')
    print("   Digite sua dúvida ou pergunta. Use 'sair' para encerrar.\n")

    chat_history = []  # Memória da conversa

    while True:
        question = input("Você: ").strip()

        if not question:
            continue
        if question.lower() in ["sair", "exit", "quit"]:
            print("\nObrigado por conversar comigo. Até a próxima leitura!")
            break

        answer = ask_book(question, chat_history)
        print(f"\n{BOOK_TITLE}: {answer}\n")
        print("-" * 60)


if __name__ == "__main__":
    main()
