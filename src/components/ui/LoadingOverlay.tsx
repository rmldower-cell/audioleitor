import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

const FLAVOR_TEXTS = [
  "Acelerando a leitura do documento...",
  "Acordando a Inteligência Artificial...",
  "Extraindo e limpando o texto das páginas...",
  "Otimizando parágrafos para uma leitura natural...",
  "Conectando aos servidores de síntese de voz...",
  "Processando a entonação e ritmo...",
  "Transformando palavras em som...",
  "Gerando os primeiros blocos de áudio...",
  "Sincronizando o texto com as faixas de áudio...",
  "Preparando uma experiência imersiva...",
  "Estamos quase lá, a magia está acontecendo...",
]

interface LoadingOverlayProps {
  visible: boolean
  progress?: number // 0-100, se null usa simulação
}

export default function LoadingOverlay({ visible, progress: externalProgress }: LoadingOverlayProps) {
  const [textIndex, setTextIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const [simulatedProgress, setSimulatedProgress] = useState(0)

  const progress = externalProgress ?? simulatedProgress

  // Rotação de mensagens
  useEffect(() => {
    if (!visible) return
    const interval = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setTextIndex(prev => (prev + 1) % FLAVOR_TEXTS.length)
        setFading(false)
      }, 400)
    }, 2500)
    return () => clearInterval(interval)
  }, [visible])

  // Simulação de progresso quando não é fornecido externamente
  useEffect(() => {
    if (!visible || externalProgress !== undefined) return
    setSimulatedProgress(0)
    const interval = setInterval(() => {
      setSimulatedProgress(prev => {
        if (prev >= 98.5) return 98.5
        const increment = prev < 50 ? Math.random() * 4 : prev < 85 ? Math.random() * 0.5 : Math.random() * 0.1
        return Math.min(98.5, prev + increment)
      })
    }, 500)
    return () => clearInterval(interval)
  }, [visible, externalProgress])

  // Reset ao fechar
  useEffect(() => {
    if (!visible) {
      setTextIndex(0)
      setSimulatedProgress(0)
    }
  }, [visible])

  if (!visible) return null

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl">
      {/* Ícone central */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <div className="absolute -inset-4 rounded-3xl bg-primary/5 animate-pulse -z-10" />
      </div>

      {/* Mensagem dinâmica */}
      <p
        className="text-sm text-foreground/80 text-center max-w-xs px-4 transition-opacity duration-300"
        style={{ opacity: fading ? 0 : 1 }}
      >
        {FLAVOR_TEXTS[textIndex]}
      </p>

      {/* Barra de progresso */}
      <div className="mt-8 w-64 max-w-[80vw]">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-[10px] text-muted-foreground text-center mt-2 tabular-nums">
          {progress.toFixed(1)}%
        </p>
      </div>
    </div>
  )
}
