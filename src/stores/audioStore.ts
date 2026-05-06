import { create } from 'zustand'

interface AudioState {
  // Playback state
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackRate: number

  // Audio source
  audioUrl: string | null
  skipToTimestamp: number  // "Pular Prefácio" timestamp

  // Audiobook metadata
  bookTitle: string
  chapterTitle: string
  narratorName: string

  // Voice selection
  currentVoiceId: string | null
  currentVoiceLabel: string

  // Actions
  setIsPlaying: (playing: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setPlaybackRate: (rate: number) => void
  setAudioUrl: (url: string | null) => void
  setSkipToTimestamp: (timestamp: number) => void
  setBookInfo: (title: string, chapter: string, narrator: string) => void
  setVoice: (id: string, label: string) => void
  skipToContent: () => void
}

export const useAudioStore = create<AudioState>((set, get) => ({
  // Initial state
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackRate: 1,
  audioUrl: null,
  skipToTimestamp: 0,
  bookTitle: 'AudioLeitor',
  chapterTitle: 'Capítulo 1',
  narratorName: 'Narrador',
  currentVoiceId: null,
  currentVoiceLabel: 'Voz padrão',

  // Actions
  setIsPlaying: (playing) => set({ isPlaying: playing }),
  setCurrentTime: (time) => set({ currentTime: time }),
  setDuration: (duration) => set({ duration }),
  setPlaybackRate: (rate) => set({ playbackRate: rate }),
  setAudioUrl: (url) => set({ audioUrl: url, currentTime: 0 }),
  setSkipToTimestamp: (timestamp) => set({ skipToTimestamp: timestamp }),
  setBookInfo: (title, chapter, narrator) => set({
    bookTitle: title,
    chapterTitle: chapter,
    narratorName: narrator,
  }),
  setVoice: (id, label) => set({
    currentVoiceId: id,
    currentVoiceLabel: label,
  }),
  skipToContent: () => {
    const { skipToTimestamp } = get()
    set({ currentTime: skipToTimestamp })
  },
}))
