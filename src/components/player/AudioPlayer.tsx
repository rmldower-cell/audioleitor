import { useEffect, useCallback, useRef } from 'react'
import { useAudioStore } from '@/stores/audioStore'
import { formatTime } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FastForward,
  Volume2,
} from 'lucide-react'

interface AudioPlayerProps {
  audioRef: React.RefObject<HTMLAudioElement | null>
}

export default function AudioPlayer({ audioRef }: AudioPlayerProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    audioUrl,
    playbackRate,
    skipToTimestamp,
    bookTitle,
    narratorName,
    currentVoiceLabel,
    setIsPlaying,
    setCurrentTime,
    setDuration,
    setPlaybackRate,
  } = useAudioStore()

  const progressRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  // Sync audio element with store
  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    audio.src = audioUrl
    audio.load()
  }, [audioUrl, audioRef])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    audio.playbackRate = playbackRate
  }, [playbackRate, audioRef])

  // Audio event listeners
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onTimeUpdate = () => {
      if (!isDragging.current) {
        setCurrentTime(audio.currentTime)
      }
    }
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
    }
  }, [audioRef, setCurrentTime, setDuration, setIsPlaying])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio || !audioUrl) return

    if (audio.paused) {
      audio.play().catch(console.warn)
    } else {
      audio.pause()
    }
  }, [audioRef, audioUrl])

  const seekRelative = useCallback((seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Math.max(0, Math.min(audio.currentTime + seconds, audio.duration || 0))
  }, [audioRef])

  const handleSkipToContent = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = skipToTimestamp
    if (audio.paused) audio.play().catch(console.warn)
  }, [audioRef, skipToTimestamp])

  const handleProgressClick = useCallback((e: React.MouseEvent) => {
    const audio = audioRef.current
    const bar = progressRef.current
    if (!audio || !bar || !audio.duration) return

    const rect = bar.getBoundingClientRect()
    const percentage = Math.max(0, Math.min((e.clientX - rect.left) / rect.width, 1))
    audio.currentTime = percentage * audio.duration
  }, [audioRef])

  const cyclePlaybackRate = useCallback(() => {
    const rates = [0.75, 1, 1.25, 1.5, 1.75, 2]
    const currentIdx = rates.indexOf(playbackRate)
    const nextIdx = (currentIdx + 1) % rates.length
    const nextRate = rates[nextIdx]
    setPlaybackRate(nextRate)
  }, [playbackRate, setPlaybackRate])

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <footer className="sticky bottom-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-md">
      <div className="max-w-5xl mx-auto px-4">
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="h-1.5 -mt-0.5 cursor-pointer group relative"
          onClick={handleProgressClick}
        >
          <div className="absolute inset-0 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
          {/* Thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 bg-primary rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
            style={{ left: `${progress}%` }}
          />
        </div>

        {/* Controls */}
        <div className="h-16 flex items-center justify-between gap-4">
          {/* Left — Book Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">
              {bookTitle}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {currentVoiceLabel} · {narratorName}
            </p>
          </div>

          {/* Center — Controls */}
          <div className="flex items-center gap-1">
            {/* Skip to Content */}
            {skipToTimestamp > 0 && currentTime < skipToTimestamp && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkipToContent}
                className="text-primary text-xs h-8 px-2 hover:bg-primary/10"
              >
                <FastForward className="w-3.5 h-3.5 mr-1" />
                Pular Prefácio
              </Button>
            )}

            <Button variant="ghost" size="icon" onClick={() => seekRelative(-10)} className="h-9 w-9">
              <SkipBack className="w-4 h-4" />
            </Button>

            <Button
              variant="default"
              size="icon"
              onClick={togglePlay}
              className="h-10 w-10 rounded-full"
              disabled={!audioUrl}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </Button>

            <Button variant="ghost" size="icon" onClick={() => seekRelative(10)} className="h-9 w-9">
              <SkipForward className="w-4 h-4" />
            </Button>
          </div>

          {/* Right — Time & Speed */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={cyclePlaybackRate}
              className="h-7 px-2 text-xs font-mono min-w-[3rem]"
            >
              {playbackRate}x
            </Button>

            <Volume2 className="w-4 h-4 text-muted-foreground hidden sm:block" />
          </div>
        </div>
      </div>
    </footer>
  )
}
