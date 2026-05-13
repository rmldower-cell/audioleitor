import { useState, useRef } from 'react'
import { Check, Mic2, Volume2, X, Play, Pause } from 'lucide-react'
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
  // Fábio = autor = verde esmeralda
  if (name.includes('fábio') || name.includes('fabio')) {
    return {
      gradient: 'bg-[radial-gradient(circle_at_35%_35%,_#6ee7b7,_#059669_50%,_#064e3b_85%,_#022c22)]',
      shadow: 'shadow-emerald-900/20',
      ring: 'border-emerald-500',
    }
  }
  // Femininas = rosa/roxo
  if (voice.gender === 'female' || name.includes('mulher')) {
    return {
      gradient: 'bg-[radial-gradient(circle_at_35%_35%,_#f0abfc,_#a855f7_50%,_#7e22ce_85%,_#3b0764)]',
      shadow: 'shadow-purple-900/20',
      ring: 'border-purple-500',
    }
  }
  // Masculinas (Cris, Sid, etc.) = azul
  return {
    gradient: 'bg-[radial-gradient(circle_at_35%_35%,_#93c5fd,_#3b82f6_50%,_#1e40af_85%,_#172554)]',
    shadow: 'shadow-blue-900/20',
    ring: 'border-blue-500',
  }
}

function VoiceModal({
  voices,
  onSelectVoice,
  onClose,
}: {
  voices: VoiceOption[]
  onSelectVoice: (v: VoiceOption) => void
  onClose: () => void
}) {
  const currentVoiceId = useAudioStore((s) => s.currentVoiceId)
  const [selected, setSelected] = useState<string>(currentVoiceId || voices[0]?.id || '')
  const [playingId, setPlayingId] = useState<string | null>(null)
  const previewAudioRef = useRef<HTMLAudioElement | null>(null)

  const handleConfirm = () => {
    const voice = voices.find((v) => v.id === selected)
    if (voice) {
      onSelectVoice(voice)
      onClose()
    }
  }

  const togglePreview = (e: React.MouseEvent, voice: VoiceOption) => {
    e.stopPropagation()

    if (playingId === voice.id) {
      previewAudioRef.current?.pause()
      setPlayingId(null)
      return
    }

    // Parar qualquer preview anterior
    previewAudioRef.current?.pause()

    // Tocar preview do audiobook da voz (primeiros 5 segundos)
    const audio = new Audio(voice.audioUrl)
    previewAudioRef.current = audio
    audio.currentTime = 360 // Começa do prefácio para ter narração
    audio.play().catch(console.warn)
    setPlayingId(voice.id)

    // Para após 5 segundos
    setTimeout(() => {
      audio.pause()
      setPlayingId((curr) => (curr === voice.id ? null : curr))
    }, 5000)
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-[91] flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-background border border-border/50 rounded-2xl shadow-2xl max-w-lg w-full pointer-events-auto animate-in fade-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/50">
            <h2 className="text-base font-bold text-foreground">Escolha uma voz</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground transition-colors rounded-full p-1 hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Vozes */}
          <div className="px-5 py-6">
            <div className="flex flex-wrap justify-center gap-6">
              {voices.map((voice) => {
                const isActive = selected === voice.id
                const styles = getSphereStyles(voice)
                const isPreviewing = playingId === voice.id

                return (
                  <div key={voice.id} className="flex flex-col items-center gap-2 w-20 sm:w-24">
                    {/* Esfera — clique seleciona */}
                    <button
                      onClick={() => setSelected(voice.id)}
                      className="relative group focus:outline-none"
                    >
                      {/* Anel de seleção */}
                      <div
                        className={`absolute inset-[-6px] rounded-full border-2 transition-all duration-300 ${
                          isActive ? `${styles.ring} scale-100 opacity-100` : 'border-transparent scale-90 opacity-0'
                        }`}
                      />

                      {/* Esfera 3D */}
                      <div
                        className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full shadow-md transition-transform duration-300 ease-out group-hover:scale-110 group-hover:-translate-y-1 ${styles.gradient} ${styles.shadow}`}
                      />

                      {/* Checkmark */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center shadow-md">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </div>
                      )}
                    </button>

                    {/* Nome */}
                    <span className={`block text-xs font-semibold transition-colors duration-200 text-center ${isActive ? 'text-primary' : 'text-foreground'}`}>
                      {voice.label}
                    </span>

                    {/* Descrição */}
                    {voice.description && (
                      <span className="block text-[9px] text-muted-foreground leading-tight text-center -mt-1">
                        {voice.description}
                      </span>
                    )}

                    {/* Botão Preview — separado da esfera */}
                    <button
                      onClick={(e) => togglePreview(e, voice)}
                      className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {isPreviewing ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                      <span>Ouvir</span>
                    </button>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border/50">
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Volume2 className="w-3 h-3" />
              Cada voz possui uma narração única
            </p>
            <Button onClick={handleConfirm} className="rounded-xl px-5 h-8 text-sm font-semibold" disabled={!selected}>
              Confirmar
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}

export default function VoiceSelector({ voices, onSelectVoice, compact = true }: VoiceSelectorProps) {
  const [open, setOpen] = useState(!compact)

  if (voices.length <= 1) return null

  return (
    <>
      {/* Botão para abrir */}
      {compact && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-2 bg-background/50 backdrop-blur-sm"
          onClick={() => setOpen(true)}
        >
          <Mic2 className="w-4 h-4" />
          <span className="hidden sm:inline">Mudar Voz</span>
        </Button>
      )}

      {/* Modal */}
      {open && (
        <VoiceModal
          voices={voices}
          onSelectVoice={(v) => {
            onSelectVoice(v)
            setOpen(false)
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  )
}

export type { VoiceOption }
