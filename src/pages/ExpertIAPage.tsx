import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Sparkles, Bot, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface ChatMsg {
  role: 'user' | 'model'
  content: string
  time: string
}

const SUGGESTED_PROMPTS = [
  "Qual é a ideia central deste livro?",
  "Resumo do capítulo atual em 3 pontos",
  "Explique o conceito principal em linguagem simples",
  "Quais são as aplicações práticas deste conteúdo?",
  "O que o autor quis dizer com...",
  "Compare os conceitos dos capítulos 1 e 2",
]

interface ExpertIAPageProps {
  bookTitle: string
}

export default function ExpertIAPage({ bookTitle }: ExpertIAPageProps) {
  const [messages, setMessages] = useState<ChatMsg[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const getTime = () => {
    const now = new Date()
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`
  }

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return

    setShowSuggestions(false)
    const userMsg: ChatMsg = { role: 'user', content: text.trim(), time: getTime() }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    setLoading(true)

    try {
      const url = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8000'
      const res = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: text.trim(),
          history: messages.map((m) => ({ role: m.role, content: m.content })),
          book_title: bookTitle,
        }),
      })

      if (!res.ok) throw new Error('Erro na API RAG')
      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        { role: 'model', content: data.answer, time: getTime() },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: 'O servidor RAG está offline. Execute `python -m uvicorn main:app --reload` no terminal.',
          time: getTime(),
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-80px)] max-w-3xl mx-auto w-full">
      {/* Header */}
      <div className="border-b border-border/50 px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Expert IA</h1>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <BookOpen className="w-3 h-3" />
              Conversando com "{bookTitle}"
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Eu sou a essência deste livro
            </h2>
            <p className="text-sm text-muted-foreground mb-8 max-w-md">
              Faça qualquer pergunta sobre o conteúdo e eu responderei como se o próprio livro estivesse conversando com você.
            </p>

            {/* Suggested prompts */}
            {showSuggestions && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {SUGGESTED_PROMPTS.map((p, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(p)}
                    className="text-left px-3 py-2.5 rounded-xl border border-border/50 bg-card/50 hover:bg-primary/5 hover:border-primary/30 text-xs text-muted-foreground hover:text-foreground transition-all"
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Chat messages */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            {msg.role === 'model' && (
              <span className="text-[10px] font-semibold text-primary mb-0.5 ml-1">Expert IA</span>
            )}
            <div
              className={`max-w-[85%] px-4 py-3 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary/15 border border-primary/30 rounded-tl-2xl rounded-tr-2xl rounded-bl-2xl rounded-br-sm text-foreground'
                  : 'bg-card border border-border/50 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl rounded-bl-sm text-foreground shadow-lg'
              }`}
            >
              {msg.content}
            </div>
            <span className="text-[10px] text-muted-foreground/50 mx-1">{msg.time}</span>
          </div>
        ))}

        {/* Loading skeleton */}
        {loading && (
          <div className="flex flex-col gap-1 items-start">
            <span className="text-[10px] font-semibold text-primary mb-0.5 ml-1">Expert IA</span>
            <div className="bg-card border border-border/50 rounded-2xl rounded-bl-sm px-4 py-4 w-48 shadow-lg">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-xs">Refletindo...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-border/50 px-4 py-3 bg-background/50 backdrop-blur-md">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-2xl mx-auto">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte ao livro..."
            className="flex-1 bg-card/50 border-border/50 h-11 rounded-xl"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || loading}
            className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90 shrink-0"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  )
}
