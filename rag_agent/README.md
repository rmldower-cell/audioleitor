# 📚 Agente RAG — "Conversa com o Livro"

Agente RAG sem N8N. Usa **Gemini Embedding 2 Preview** (multimodal) + **Pinecone** + **Gemini Flash**.

## 🗂️ Estrutura

```
rag_agent/
├── .env.example   # Copie para .env e preencha suas chaves
├── .gitignore     # Protege .env e PDFs de serem comitados
├── requirements.txt
├── ingest.py      # PASSO 1: Processa o PDF e salva no Pinecone (roda 1 vez)
├── chat.py        # PASSO 2: Chat com o livro no terminal
└── livro.pdf      # ← Coloque seu PDF aqui (não é versionado)
```

## ⚡ Início Rápido

### 1. Instalar dependências
```bash
cd rag_agent
pip install -r requirements.txt
```

### 2. Configurar chaves
```bash
cp .env.example .env
# Edite .env e preencha GEMINI_API_KEY e PINECONE_API_KEY
```

### 3. Criar o Index no Pinecone
Antes de rodar, acesse [app.pinecone.io](https://app.pinecone.io/) e crie um index com:
- **Name:** `audiobook-rag`
- **Dimensions:** `1536`
- **Metric:** `cosine`

### 4. Colocar o PDF
Coloque o PDF do livro na pasta `rag_agent/` com o nome `livro.pdf`
(ou ajuste `BOOK_PDF_PATH` no `.env`)

### 5. Ingestão (roda uma vez)
```bash
python ingest.py
```

### 6. Conversar com o livro
```bash
python chat.py
```

---

## 🏗️ Arquitetura

```
[PDF do livro]
      │
      ▼
[ingest.py]
  PDF → página por página
  → Gemini Embedding 2 Preview (multimodal)
  → Pinecone (upsert com metadados de página)

[Usuário faz pergunta]
      │
      ▼
[chat.py]
  Pergunta → Embedding (Gemini)
  → Busca semântica Top-K no Pinecone
  → Contexto dos chunks recuperados
  → Gemini Flash (com persona "voz do livro")
  → Resposta
```

## 🤖 Modelos Usados

| Função | Modelo |
|--------|--------|
| Embeddings | `gemini-embedding-2-preview` |
| Chat / Geração | `gemini-2.0-flash` |
| Banco vetorial | Pinecone (`cosine`, `dim=1536`) |
