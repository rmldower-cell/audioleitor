import { useState } from 'react'
import {
  BookHeadphones,
  Sparkles,
  Menu,
  X,
  CheckCircle2,
  LogOut,
  ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'

export interface Chapter {
  num: number
  title: string
  startPage: number
  audioTimestamp?: number
}

interface SidebarProps {
  bookTitle: string
  authorName: string
  chapters: Chapter[]
  activeChapter: number | null
  onChapterClick: (chapter: Chapter) => void
  onNavigate: (view: 'reader' | 'expert') => void
  currentView: 'reader' | 'expert'
  onLogout: () => void
  userName?: string
}

export default function Sidebar({
  bookTitle,
  authorName,
  chapters,
  activeChapter,
  onChapterClick,
  onNavigate,
  currentView,
  onLogout,
  userName,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const navItems = [
    { id: 'reader' as const, label: 'Leitura', icon: BookHeadphones },
    { id: 'expert' as const, label: 'Expert IA', icon: Sparkles },
  ]

  const sidebarContent = (
    <div className="flex flex-col h-full bg-background/95 backdrop-blur-xl border-r border-border/50">
      {/* Header — Branding */}
      <div className="p-5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
            <BookHeadphones className="w-5 h-5 text-primary" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-foreground truncate">{bookTitle}</h2>
            <p className="text-[10px] text-primary font-semibold uppercase tracking-wider">{authorName}</p>
          </div>
        </div>
      </div>

      {/* Navegação */}
      <div className="px-3 pt-4">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">
          Navegação
        </p>
        <div className="space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                onNavigate(item.id)
                setMobileOpen(false)
              }}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${currentView === item.id
                  ? 'bg-primary/15 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }
              `}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Capítulos */}
      {chapters.length > 0 && (
        <div className="px-3 pt-5 flex-1 overflow-y-auto">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest px-2 mb-2">
            Capítulos
          </p>
          <div className="space-y-0.5">
            {chapters.map((ch) => {
              const isActive = activeChapter === ch.num
              return (
                <button
                  key={ch.num}
                  onClick={() => {
                    onChapterClick(ch)
                    setMobileOpen(false)
                  }}
                  className={`
                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all group
                    ${isActive
                      ? 'bg-muted/80 text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
                    }
                  `}
                >
                  <span className="truncate text-left">
                    {ch.num === 0 ? ch.title : `Cap ${ch.num}: ${ch.title}`}
                  </span>
                  {isActive ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                  ) : (
                    <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-50 shrink-0 transition-opacity" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Footer — Usuário */}
      <div className="mt-auto p-4 border-t border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
            <span className="text-xs font-bold text-muted-foreground">
              {(userName || 'U')[0].toUpperCase()}
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-foreground truncate">
              {userName || 'Usuário'}
            </p>
            <p className="text-[10px] text-muted-foreground">Ouvinte</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onLogout}>
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile trigger */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-3 left-3 z-50 h-10 w-10 bg-background/80 backdrop-blur-md border border-border/50 shadow-lg"
      >
        <Menu className="w-5 h-5" />
      </Button>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 h-dvh sticky top-0">
        {sidebarContent}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 md:hidden"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className="fixed inset-y-0 left-0 w-72 z-50 md:hidden animate-in slide-in-from-left duration-300">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileOpen(false)}
              className="absolute top-3 right-3 z-10 h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
            {sidebarContent}
          </div>
        </>
      )}
    </>
  )
}
