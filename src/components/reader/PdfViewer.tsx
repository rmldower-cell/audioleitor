import { useEffect, useRef, useState, useCallback } from 'react'
import * as pdfjsLib from 'pdfjs-dist'
import { Loader2 } from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

interface PdfViewerProps {
  pdfUrl: string
  onPageChange?: (page: number) => void
}

/**
 * PDF Viewer com EAGER RENDERING (todas as páginas de uma vez).
 * Sem IntersectionObserver — cachedSpans é capturado uma vez e fica estável.
 */
export default function PdfViewer({ pdfUrl, onPageChange }: PdfViewerProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const pdfDocRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)

  const [totalPages, setTotalPages] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [renderProgress, setRenderProgress] = useState(0)


  // ── Carregar documento ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false
    const loadPdf = async () => {
      try {
        setLoading(true)
        setError(null)
        const doc = await pdfjsLib.getDocument(pdfUrl).promise
        if (cancelled) return
        pdfDocRef.current = doc
        setTotalPages(doc.numPages)

        // EAGER RENDER — renderizar TODAS as páginas de uma vez
        const containerWidth = scrollContainerRef.current?.clientWidth || 800

        for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
          if (cancelled) return
          const page = await doc.getPage(pageNum)
          const baseViewport = page.getViewport({ scale: 1 })
          const scale = Math.min((containerWidth - 48) / baseViewport.width, 2)
          const viewport = page.getViewport({ scale })

          const wrapper = document.getElementById(`pdf-page-${pageNum}`)
          if (!wrapper) continue

          // Canvas
          const canvas = document.createElement('canvas')
          canvas.width = viewport.width
          canvas.height = viewport.height
          canvas.className = 'block bg-white rounded-sm'

          // Text layer
          const textLayerDiv = document.createElement('div')
          textLayerDiv.className = 'textLayer absolute top-0 left-0'
          textLayerDiv.style.width = `${viewport.width}px`
          textLayerDiv.style.height = `${viewport.height}px`
          textLayerDiv.style.pointerEvents = 'none'

          wrapper.innerHTML = ''
          wrapper.style.width = `${viewport.width}px`
          wrapper.style.height = `${viewport.height}px`
          wrapper.style.minHeight = 'unset'
          wrapper.style.aspectRatio = 'unset'
          wrapper.appendChild(canvas)
          wrapper.appendChild(textLayerDiv)

          const ctx = canvas.getContext('2d')!
          await page.render({ canvasContext: ctx, viewport }).promise

          const textContent = await page.getTextContent()
          textContent.items.forEach((item) => {
            if (!('str' in item) || !item.str.trim()) return
            const tx = pdfjsLib.Util.transform(viewport.transform, item.transform)
            const span = document.createElement('span')
            span.textContent = item.str
            span.style.position = 'absolute'
            span.style.left = `${tx[4]}px`
            span.style.top = `${viewport.height - tx[5]}px`
            span.style.fontSize = `${Math.abs(tx[0])}px`
            span.style.fontFamily = item.fontName || 'sans-serif'
            span.style.color = 'transparent'
            span.style.whiteSpace = 'pre'
            textLayerDiv.appendChild(span)
          })

          setRenderProgress(Math.round((pageNum / doc.numPages) * 100))
        }


        setLoading(false)
      } catch (err: any) {
        if (!cancelled) {
          console.error('Erro ao carregar PDF:', err)
          setError(`Não foi possível carregar o PDF. Detalhe: ${err?.message || String(err)}`)
          setLoading(false)
        }
      }
    }
    loadPdf()
    return () => { cancelled = true }
  }, [pdfUrl])

  // ── Scroll tracker para página ativa ───────────────────────────
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || totalPages === 0) return

    let timeout: ReturnType<typeof setTimeout>
    const handleScroll = () => {
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        const wrappers = container.querySelectorAll('[data-page]')
        let closest = 1
        let minDist = Infinity

        wrappers.forEach((el) => {
          const rect = el.getBoundingClientRect()
          const dist = Math.abs(rect.top - window.innerHeight / 3)
          if (dist < minDist) {
            minDist = dist
            closest = parseInt(el.getAttribute('data-page') || '1')
          }
        })

        if (closest !== currentPage) {
          setCurrentPage(closest)
          onPageChange?.(closest)
        }
      }, 120)
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [totalPages, currentPage, onPageChange])

  // ── Scroll programático (para sidebar/capítulos) ───────────────
  const scrollToPage = useCallback((page: number) => {
    const el = document.getElementById(`pdf-page-${page}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  useEffect(() => {
    (window as any).__pdfScrollToPage = scrollToPage
    return () => { delete (window as any).__pdfScrollToPage }
  }, [scrollToPage])

  if (error) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 min-h-[60vh] flex items-center justify-center">
        <p className="text-destructive text-sm">{error}</p>
      </div>
    )
  }

  return (
    <div className="relative flex flex-col h-full">
      {/* Indicador de página flutuante */}
      {totalPages > 0 && (
        <div className="sticky top-14 z-20 flex justify-center pointer-events-none mb-2">
          <div className="bg-background/80 backdrop-blur-md border border-border/50 rounded-full px-3 py-1 shadow-lg pointer-events-auto">
            <span className="text-[11px] text-muted-foreground tabular-nums">
              {currentPage} / {totalPages}
            </span>
          </div>
        </div>
      )}

      {/* Container scroll */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-border/50 bg-card/30"
        style={{ maxHeight: 'calc(100vh - 160px)' }}
      >
        {/* Loading com progresso de render */}
        {loading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">
                {renderProgress > 0
                  ? `Renderizando páginas... ${renderProgress}%`
                  : 'Carregando PDF...'
                }
              </p>
            </div>
          </div>
        )}

        {/* Páginas */}
        <div className="flex flex-col items-center gap-4 py-4 px-2">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <div
              key={num}
              id={`pdf-page-${num}`}
              data-page={num}
              className="relative shadow-xl bg-muted/10 rounded-sm mx-auto"
              style={{
                width: '100%',
                maxWidth: '800px',
                minHeight: '200px',
                aspectRatio: '210 / 297',
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] text-muted-foreground/30">Página {num}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
