import { useState, useMemo } from 'react'
import { ZoomIn, ZoomOut, Maximize2, Download, Share2 } from 'lucide-react'
import { Button } from '../ui/button'

interface LivePreviewProps {
  htmlContent: string
  title?: string
  onDownloadPdf?: () => void
  onShare?: () => void
  loading?: boolean
  className?: string
}

export const LivePreview: React.FC<LivePreviewProps> = ({
  htmlContent,
  title = 'Vista Previa',
  onDownloadPdf,
  onShare,
  loading = false,
  className = '',
}) => {
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

  const zoomIn = () => setZoom(prev => Math.min(200, prev + 10))
  const zoomOut = () => setZoom(prev => Math.max(50, prev - 10))
  const resetZoom = () => setZoom(100)

  const previewStyle = useMemo(() => ({
    transform: `scale(${zoom / 100})`,
    transformOrigin: 'top center',
    width: '100%',
    minHeight: '100%',
  }), [zoom])

  return (
    <div className={`flex flex-col h-full bg-slate-50 ${className}`}>
      {/* Header con controles */}
      <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1">
            <button
              onClick={zoomOut}
              disabled={zoom <= 50}
              className="p-1.5 rounded hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Alejar"
            >
              <ZoomOut className="h-4 w-4 text-slate-600" />
            </button>
            <button
              onClick={resetZoom}
              className="px-3 py-1.5 rounded hover:bg-white transition-colors text-sm font-medium text-slate-700 min-w-[60px]"
              title="Reestablecer zoom"
            >
              {zoom}%
            </button>
            <button
              onClick={zoomIn}
              disabled={zoom >= 200}
              className="p-1.5 rounded hover:bg-white disabled:opacity-40 disabled:hover:bg-transparent transition-colors"
              title="Acercar"
            >
              <ZoomIn className="h-4 w-4 text-slate-600" />
            </button>
          </div>

          <span className="text-sm text-slate-600 hidden md:inline ml-2">
            {title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onShare && (
            <Button
              variant="outline"
              size="sm"
              onClick={onShare}
              disabled={loading}
            >
              <Share2 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Compartir</span>
            </Button>
          )}
          {onDownloadPdf && (
            <Button
              size="sm"
              onClick={onDownloadPdf}
              disabled={loading}
              className="bg-gradient-to-r from-amber-600 to-yellow-600 hover:from-amber-700 hover:to-yellow-700"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Descargar PDF</span>
            </Button>
          )}
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            <Maximize2 className="h-4 w-4 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Preview area */}
      <div className="flex-1 overflow-auto p-4 flex justify-center items-start">
        <div
          className="bg-white shadow-2xl rounded-lg overflow-hidden"
          style={previewStyle}
        >
          {loading ? (
            <div className="flex items-center justify-center h-96 text-slate-400">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slate-400 mx-auto mb-4"></div>
                <p>Generando vista previa...</p>
              </div>
            </div>
          ) : (
            <div
              className="flyer-preview-content"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            />
          )}
        </div>
      </div>

      {/* Status bar */}
      <div className="px-4 py-2 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
        <span>✓ Actualización en tiempo real</span>
        <span className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Sincronizado
        </span>
      </div>
    </div>
  )
}
