import { useState, useEffect } from 'react'
import { BookHeadphones, Sparkles, MessageSquare, LayoutList, ChevronRight, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

const STORAGE_KEY = 'audioleitor_onboarding_complete'

const SLIDES = [
  {
    icon: BookHeadphones,
    title: 'Ouça seu livro',
    description: 'Player persistente com controle de velocidade, seek e pular prefácio. Ouça enquanto acompanha a leitura.',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
  },
  {
    icon: Sparkles,
    title: 'Leitura Sincronizada',
    description: 'O texto do PDF é lido em tempo real, permitindo que você acompanhe a leitura de forma imersiva.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/20',
  },
  {
    icon: MessageSquare,
    title: 'Converse com o Livro',
    description: 'O Expert IA responde como se fosse o próprio livro. Pergunte conceitos, peça resumos ou tire dúvidas.',
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/20',
  },
  {
    icon: LayoutList,
    title: 'Navegue por Capítulos',
    description: 'Use a barra lateral para pular direto para qualquer capítulo. O PDF rola automaticamente até a página certa.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10 border-amber-400/20',
  },
]

export default function OnboardingModal() {
  const [show, setShow] = useState(false)
  const [slide, setSlide] = useState(0)

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY)
    if (!done) setShow(true)
  }, [])

  const handleComplete = () => {
    localStorage.setItem(STORAGE_KEY, 'true')
    setShow(false)
  }

  const handleNext = () => {
    if (slide === SLIDES.length - 1) {
      handleComplete()
    } else {
      setSlide((s) => s + 1)
    }
  }

  if (!show) return null

  const current = SLIDES[slide]
  const isLast = slide === SLIDES.length - 1

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md">
      <div
        className="relative bg-background border border-border/50 rounded-3xl shadow-2xl w-[90vw] max-w-md overflow-hidden"
        style={{ animation: 'fadeInUp 0.4s ease-out' }}
      >
        {/* Close */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleComplete}
          className="absolute top-3 right-3 z-10 h-8 w-8 text-muted-foreground"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Content */}
        <div className="p-8 flex flex-col items-center text-center">
          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl ${current.bg} border flex items-center justify-center mb-6`}>
            <current.icon className={`w-8 h-8 ${current.color}`} />
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-foreground mb-2">{current.title}</h2>

          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
            {current.description}
          </p>
        </div>

        {/* Footer */}
        <div className="px-8 pb-6 flex items-center justify-between">
          {/* Dots */}
          <div className="flex gap-1.5">
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => setSlide(i)}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === slide ? 'bg-primary w-5' : 'bg-muted-foreground/30'
                }`}
              />
            ))}
          </div>

          {/* Next */}
          <Button onClick={handleNext} className="rounded-xl gap-1">
            {isLast ? 'Começar' : 'Próximo'}
            {!isLast && <ChevronRight className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </div>
  )
}
