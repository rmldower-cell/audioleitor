import { useState } from 'react'
import { Check, Mic2, ArrowLeft, Volume2 } from 'lucide-react'
import { useAudioStore } from '@/stores/audioStore'
import { Button } from '@/components/ui/button'

interface VoiceOption {
  id: string
  audiobookId: string
  label: string
  audioUrl: string
  duration: number | null
  skipTimestamp: number
  gender?: 'male' | 'female'
  description?: string
}

interface VoiceSelectorProps {
  voices: VoiceOption[]
  onSelectVoice: (voice: VoiceOption) => void
  compact?: boolean
}



const getSphereStyles = (voice: VoiceOption) => {
  const name = voice.label.toLowerCase()
  if (name.includes('fábio') || name.includes('fabio')) {
    return 'bg-[radial-gradient(circle_at_30%_30%,_#a7f3d0,_#10b981_60%,_#064e3b)] shadow-emerald-500/30'
  }
  if (voice.gender === 'female' || name.includes('mulher')) {
    return 'bg-[radial-gradient(circle_at_30%_30%,_#fbcfe8,_#db2777_60%,_#831843)] shadow-pink-500/30'
  }
  // Padrão: Azul (para Cris, Sid e outras vozes masculinas)
  return 'bg-[radial-gradient(circle_at_30%_30%,_#bfdbfe,_#3b82f6_60%,_#1e3a8a)] shadow-blue-500/30'
}

function VoiceGrid({
  voices,
  onSelectVoice,
  onBack,
}: {
  voices: VoiceOption[]
  onSelectVoice: (v: VoiceOption) => void
  onBack?: () => void
}) {
  const currentVoiceId = useAudioStore((s) => s.currentVoiceId)
  const [selected, setSelected] = useState<string>(currentVoiceId || voices[0]?.id || '')

  const handleConfirm = () => {
    const voice = voices.find((v) => v.id === selected)
    if (voice) onSelectVoice(voice)
  }

  const playPreview = (e: React.MouseEvent) => {
    e.stopPropagation()
    // Como é um rascunho, tocar um áudio genérico
    const audio = new Audio('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3')
    audio.play()
    setTimeout(() => audio.pause(), 3000) // Toca só 3 segundos
  }

  return (
    <div className="min-h-dvh flex flex-col bg-background">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/90 backdrop-blur-xl">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onBack && (
              <button onClick={onBack} className="text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h1 className="text-lg font-bold text-foreground">Escolha uma voz</h1>
          </div>
          <Button onClick={handleConfirm} className="rounded-xl px-5 h-9 font-semibold" disabled={!selected}>
            Confirmar seleção
          </Button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-12">
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          {voices.map((voice) => {
            const isActive = selected === voice.id
            const sphereStyles = getSphereStyles(voice)

            return (
              <div key={voice.id} className="flex flex-col items-center gap-4 w-28 sm:w-32">
                {/* Esfera / Botão */}
                <button
                  onClick={() => setSelected(voice.id)}
                  className="relative group focus:outline-none"
                >
                  {/* Anel de seleção (se ativo) */}
                  <div
                    className={`absolute inset-[-12px] rounded-full border-[3px] transition-all duration-300 ${
                      isActive ? 'border-primary scale-100 opacity-100' : 'border-transparent scale-90 opacity-0'
                    }`}
                  />
                  
                  {/* Esfera 3D */}
                  <div
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full shadow-xl transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-2 ${sphereStyles}`}
                  >
                    {/* Botão Play Preview invisível até o hover/focus */}
                    <div 
                      onClick={(e) => playPreview(e)}
                      className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center">
                        <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg transform scale-110">
                      <Check className="w-3.5 h-3.5 text-primary-foreground" />
                    </div>
                  )}
                </button>

                {/* Informações da Voz */}
                <div className="text-center">
                  <span className={`block font-semibold transition-colors duration-200 ${isActive ? 'text-primary' : 'text-foreground'}`}>
                    {voice.label}
                  </span>
                  {voice.description && (
                    <span className="block text-[10px] text-muted-foreground leading-tight mt-1">
                      {voice.description}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-16 flex items-center justify-center gap-2">
          <Volume2 className="w-3.5 h-3.5" />
          Cada voz possui uma narração única do audiobook completo
        </p>
      </main>
    </div>
  )
}

function VoiceCompact({ voices, onSelectVoice }: { voices: VoiceOption[]; onSelectVoice: (v: VoiceOption) => void }) {
  const [open, setOpen] = useState(false)

  if (voices.length <= 1) return null

  if (open) {
    return (
      <div className="fixed inset-0 z-[80] bg-background">
        <VoiceGrid
          voices={voices}
          onSelectVoice={(v) => {
            onSelectVoice(v)
            setOpen(false)
          }}
          onBack={() => setOpen(false)}
        />
      </div>
    )
  }

  return (
    <Button variant="outline" size="sm" className="h-8 gap-2 bg-background/50 backdrop-blur-sm" onClick={() => setOpen(true)}>
      <Mic2 className="w-4 h-4" />
      <span className="hidden sm:inline">Mudar Voz</span>
    </Button>
  )
}

export default function VoiceSelector({ voices, onSelectVoice, compact = true }: VoiceSelectorProps) {
  if (compact) return <VoiceCompact voices={voices} onSelectVoice={onSelectVoice} />
  return <VoiceGrid voices={voices} onSelectVoice={onSelectVoice} />
}

export type { VoiceOption }
