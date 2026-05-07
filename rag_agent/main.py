import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict
from dotenv import load_dotenv

# Reutilizar a lógica de busca do chat.py
from chat import ask_book, BOOK_TITLE

# Carrega .env
load_dotenv()

app = FastAPI(title="AudioLeitor RAG API", version="1.0")

# Permitir requisições do frontend (Vite = porta 5173 e 3000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    question: str
    history: List[ChatMessage] = []
    book_title: str

class ChatResponse(BaseModel):
    answer: str

@app.post("/api/chat", response_model=ChatResponse)
async def chat_endpoint(req: ChatRequest):
    try:
        # No futuro, passaremos req.book_title para o construtor do chat.py para suportar múltiplos livros.
        # Por enquanto, mantemos global.
        
        # Converter histórico pro formato google.genai.types.Content 
        # (O chat.py atualiza o histórico inplace, mas em API statless vamos recriá-lo)
        from google.genai import types
        
        chat_history = []
        for msg in req.history:
            chat_history.append(
                types.Content(role=msg.role, parts=[types.Part(text=msg.content)])
            )

        answer = ask_book(req.question, chat_history)

        return ChatResponse(answer=answer)
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
