import { useEffect, useState, useRef, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useQuery } from "convex/react"
import { api } from "../../convex/_generated/api"
import { useAudioStore } from '@/stores/audioStore'
import AudioPlayer from '@/components/player/AudioPlayer'
import VoiceSelector from '@/components/player/VoiceSelector'
import RagChatWidget from '@/components/chat/RagChatWidget'
import PdfViewer from '@/components/reader/PdfViewer'
import ExpertIAPage from '@/pages/ExpertIAPage'
import Sidebar, { type Chapter } from '@/components/layout/Sidebar'
import LoadingOverlay from '@/components/ui/LoadingOverlay'
import OnboardingModal from '@/components/onboarding/OnboardingModal'
import { Loader2, Mic2 } from 'lucide-react'

interface Audiobook {
  id: string
  title: string
  author_name: string
  cover_url: string | null
  pdf_url: string
  audio_url: string
  voice_label: string
  voice_id: string | null
  skip_to_timestamp: number
  total_duration: number | null
  chapters: Chapter[] | null
}

export default function ReaderPage() {
  const [audiobooks, setAudiobooks] = useState<Audiobook[]>([])
  const [currentBook, setCurrentBook] = useState<Audiobook | null>(null)
  const [loading, setLoading] = useState(true)
  const [voiceChosen, setVoiceChosen] = useState(false)
  const [currentView, setCurrentView] = useState<'reader' | 'expert'>('reader')
  const [activeChapter, setActiveChapter] = useState<number | null>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const {
    setAudioUrl,
    setBookInfo,
    setSkipToTimestamp,
    setDuration,
    setVoice,
  } = useAudioStore()

  const convexAudiobooks = useQuery(api.audiobooks.getAudiobooks)

  // selectBook precisa estar definida ANTES do useEffect que a utiliza
  const selectBook = useCallback((book: Audiobook) => {
    setCurrentBook(book)
    setAudioUrl(book.audio_url)
    setBookInfo(book.title, 'Capítulo 1', book.author_name)
    setSkipToTimestamp(book.skip_to_timestamp || 0)
    if (book.total_duration) setDuration(book.total_duration)
    if (book.voice_label) setVoice(book.voice_id || book.id, book.voice_label)
  }, [setAudioUrl, setBookInfo, setSkipToTimestamp, setDuration, setVoice])

  // Sincroniza o Convex com o estado local para compatibilidade
  useEffect(() => {
    if (convexAudiobooks !== undefined) {
      const mappedBooks = convexAudiobooks.map(b => ({
        ...b,
        id: b._id,
        voice_id: b._id,
        audio_url: b.audio_url || '',
        cover_url: b.cover_url || null,
        skip_to_timestamp: b.skip_to_timestamp || 0,
        total_duration: b.total_duration || null,
        chapters: b.chapters || null,
      })) as Audiobook[]

      setAudiobooks(mappedBooks)
      if (mappedBooks.length === 1 && !voiceChosen) {
        selectBook(mappedBooks[0])
        setVoiceChosen(true)
      }
      setLoading(false)
    }
  }, [convexAudiobooks, voiceChosen, selectBook])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
  }, [])

  const handleChapterClick = useCallback((ch: Chapter) => {
    setActiveChapter(ch.num)
    setCurrentView('reader')
    // Scroll no PDF até a página do capítulo
    setTimeout(() => {
      const scrollFn = (window as any).__pdfScrollToPage
      if (scrollFn) scrollFn(ch.startPage)
    }, 100)
  }, [])

  const handlePageChange = useCallback((page: number) => {
    if (!currentBook?.chapters) return
    // Detecta capítulo ativo pela página
    const chapters = currentBook.chapters
    let active: number | null = null
    for (let i = chapters.length - 1; i >= 0; i--) {
      if (page >= chapters[i].startPage) {
        active = chapters[i].num
        break
      }
    }
    setActiveChapter(active)
  }, [currentBook])

  if (loading) {
    return <LoadingOverlay visible={true} />
  }

  if (audiobooks.length === 0) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background px-4">
        <div className="text-center space-y-4 max-w-md">
          <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">
            Nenhum audiobook disponível
          </h2>
          <p className="text-muted-foreground text-sm">
            Seu audiobook está sendo preparado. Volte em breve!
          </p>
        </div>
      </div>
    )
  }

  const voiceOptions = audiobooks.map(b => ({
    id: b.voice_id || b.id,
    audiobookId: b.id,
    label: b.voice_label,
    audioUrl: b.audio_url,
    duration: b.total_duration,
    skipTimestamp: b.skip_to_timestamp || 0,
    gender: (b as any).voice_gender as 'male' | 'female' | undefined,
    description: (b as any).voice_description as string | undefined,
  }))

  const handleVoiceChange = (opt: any) => {
    const book = audiobooks.find(b => b.id === opt.audiobookId)
    if (!book) return
    selectBook(book)
  }

  // Tela de seleção de voz (antes do reader)
  if (!voiceChosen && audiobooks.length > 1) {
    return (
      <div className="dark">
        <VoiceSelector
          voices={voiceOptions}
          onSelectVoice={(v) => {
            handleVoiceChange(v)
            setVoiceChosen(true)
          }}
          compact={false}
        />
      </div>
    )
  }

  if (!currentBook) {
    return <LoadingOverlay visible={true} />
  }

  return (
    <div className="flex min-h-dvh bg-background">
      {/* Onboarding */}
      <OnboardingModal />

      {/* Sidebar */}
      <Sidebar
        bookTitle={currentBook.title}
        authorName={currentBook.author_name}
        chapters={currentBook.chapters || []}
        activeChapter={activeChapter}
        onChapterClick={handleChapterClick}
        currentView={currentView}
        onNavigate={setCurrentView}
        onLogout={handleLogout}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-16">

        {/* Floating Voice Selector Button */}
        {currentView === 'reader' && (
          <button
            onClick={() => setVoiceChosen(false)}
            className="fixed bottom-[80px] right-4 md:right-8 z-40 bg-background/80 backdrop-blur-md border border-border/50 shadow-xl px-4 py-2.5 rounded-full text-sm font-medium flex items-center gap-2 hover:bg-muted transition-all active:scale-95 text-foreground cursor-pointer"
          >
            <Mic2 className="w-4 h-4 text-primary" />
            <span>Trocar Voz</span>
          </button>
        )}

        {/* View Switch */}
        {currentView === 'reader' ? (
          <main className="flex-1 w-full max-w-5xl mx-auto px-2 sm:px-4 py-4 md:py-8 mt-12 md:mt-0">
            <PdfViewer
              pdfUrl={currentBook.pdf_url}
              onPageChange={handlePageChange}
            />
          </main>
        ) : (
          <ExpertIAPage bookTitle={currentBook.title} />
        )}

        {/* Chat RAG Widget (só no reader) */}
        {currentView === 'reader' && <RagChatWidget />}

        {/* Audio Player — Footer persistente */}
        <AudioPlayer audioRef={audioRef} />
        <audio ref={audioRef} preload="auto" />
      </div>
    </div>
  )
}
