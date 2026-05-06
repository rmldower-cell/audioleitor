import { useState, useRef, useEffect } from 'react'
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAudioStore } from '@/stores/audioStore'

interface ChatMessage {
  role: 'user' | 'model'
  content: string
}

export default function RagChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const bookTitle = useAudioStore(s => s.bookTitle)
  const isPlaying = useAudioStore(s => s.isPlaying)

  // Auto-scroll para a última mensagem
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const checkAndPauseAudio = () => {
    if (isPlaying) {
      useAudioStore.getState().setIsPlaying(false)
    }
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    checkAndPauseAudio()

    const userMessage = input.trim()
    setInput('')
    
    const newHistory: ChatMessage[] = [
      ...messages, 
      { role: 'user', content: userMessage }
    ]
    setMessages(newHistory)
    setLoading(true)

    try {
      const url = import.meta.env.VITE_RAG_API_URL || 'http://localhost:8000'
      const response = await fetch(`${url}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: userMessage,
          history: messages, // passa o historico antigo
          book_title: bookTitle
        }),
      })

      if (!response.ok) throw new Error('Falha na API RAG')

      const data = await response.json()
      
      setMessages(prev => [...prev, { role: 'model', content: data.answer }])
    } catch (error) {
      console.error(error)
      setMessages(prev => [
        ...prev, 
        { role: 'model', content: "Ops, perdi minha linha de raciocínio. O servidor FastAPI está rodando?" }
      ])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Botão Flutuante */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-24 right-4 h-14 w-14 rounded-full shadow-xl bg-primary hover:bg-primary/90 transition-transform hover:scale-105 z-40"
        >
          <Sparkles className="w-6 h-6 text-primary-foreground" />
        </Button>
      )}

      {/* Janela de Chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 w-[350px] h-[500px] max-h-[80vh] flex flex-col bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl z-50 overflow-hidden" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
          {/* Header */}
          <div className="h-14 border-b border-border/50 bg-primary/10 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <div>
                <h3 className="font-semibold text-sm text-foreground leading-none">Falar com o Livro</h3>
                <p className="text-[10px] text-muted-foreground mt-0.5 max-w-[200px] truncate">
                  {bookTitle}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2" onClick={() => setIsOpen(false)}>
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Messages Area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center mt-10 opacity-60">
                <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
                <p className="text-xs text-foreground">Eu sou a essência deste livro.</p>
                <p className="text-xs text-muted-foreground mt-1 text-balance">Faça uma pergunta sobre a obra e eu responderei.</p>
              </div>
            )}
            
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col max-w-[85%] ${
                  msg.role === 'user' ? 'ml-auto items-end' : 'mr-auto items-start'
                }`}
              >
                <div
                  className={`px-3 py-2 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'bg-muted text-foreground rounded-bl-sm border border-border/50'
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex items-center gap-2 text-muted-foreground ml-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="text-[10px]">O livro está refletindo...</span>
              </div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-3 border-t border-border/50 bg-background/50">
            <form onSubmit={handleSend} className="relative flex items-center">
              <Input
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Pergunte ao livro..."
                className="pr-10 bg-background text-foreground border-border h-10 rounded-full text-sm placeholder:text-muted-foreground focus-visible:ring-primary"
                disabled={loading}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!input.trim() || loading}
                variant="ghost"
                className="absolute right-1 w-8 h-8 rounded-full text-primary hover:bg-primary/10 hover:text-primary"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
