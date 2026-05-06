import { useState } from 'react'
import { Check, Mic2, ArrowLeft, User, Volume2 } from 'lucide-react'
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

const GENDER_STYLES = {
  male: {
    icon: 'text-blue-400',
    bg: 'bg-blue-400/10',
    border: 'border-blue-400/20',
    activeBorder: 'border-blue-400',
  },
  female: {
    icon: 'text-pink-400',
    bg: 'bg-pink-400/10',
    border: 'border-pink-400/20',
    activeBorder: 'border-pink-400',
  },
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

      <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {voices.map((voice) => {
            const isActive = selected === voice.id
            const gender = voice.gender || 'male'
            const styles = GENDER_STYLES[gender]

            return (
              <button
                key={voice.id}
                onClick={() => setSelected(voice.id)}
                className={`
                  group relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all duration-200
                  bg-card/50 hover:bg-card/80
                  ${isActive
                    ? `${styles.activeBorder} bg-card shadow-lg shadow-primary/5`
                    : 'border-border/40 hover:border-border'
                  }
                `}
              >
                <div className={`w-14 h-14 rounded-2xl ${styles.bg} border ${styles.border} flex items-center justify-center transition-transform group-hover:scale-105`}>
                  <User className={`w-7 h-7 ${styles.icon}`} />
                </div>
                <span className="text-sm font-semibold text-foreground">{voice.label}</span>
                {voice.description && (
                  <span className="text-[10px] text-muted-foreground leading-tight text-center -mt-1">
                    {voice.description}
                  </span>
                )}
                {isActive && (
                  <div className="absolute top-2 right-2">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8 flex items-center justify-center gap-2">
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
