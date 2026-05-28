import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, BookOpen, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import { useAppStore, Citation } from '../store/useAppStore';

// Point pdfjs at its worker bundled with react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.js',
  import.meta.url,
).toString();

// ---------------------------------------------------------------------------
// Highlight overlay — drawn on a canvas that sits on top of the PDF page
// ---------------------------------------------------------------------------
interface HighlightOverlayProps {
  pageRef: React.RefObject<HTMLDivElement>;
  searchTexts: string[];   // all active chunk texts to highlight
  pageWidth: number;
  pageHeight: number;
}

function HighlightOverlay({ pageRef, searchTexts, pageWidth, pageHeight }: HighlightOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const drawHighlights = useCallback(() => {
    const canvas = canvasRef.current;
    const container = pageRef.current;
    if (!canvas || !container || searchTexts.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const textLayer = container.querySelector('.react-pdf__Page__textContent');
    if (!textLayer) return;

    const spans = Array.from(textLayer.querySelectorAll('span')) as HTMLSpanElement[];
    if (spans.length === 0) return;

    const containerRect = container.getBoundingClientRect();

    searchTexts.forEach((searchText) => {
      const needle = searchText.replace(/\s+/g, ' ').trim().toLowerCase();
      const words = needle.split(' ').filter((w) => w.length > 3); // skip tiny words

      spans.forEach((span) => {
        const spanText = (span.textContent || '').toLowerCase().trim();
        if (!spanText) return;

        const matches = words.some((w) => spanText.includes(w));
        if (!matches) return;

        const rect = span.getBoundingClientRect();
        const x = rect.left - containerRect.left;
        const y = rect.top - containerRect.top;
        const w = rect.width;
        const h = rect.height;

        // Translucent blue fill
        ctx.fillStyle = 'rgba(59, 130, 246, 0.28)';
        ctx.fillRect(x - 2, y - 1, w + 4, h + 2);

        // Bottom underline
        ctx.fillStyle = 'rgba(59, 130, 246, 0.7)';
        ctx.fillRect(x - 2, y + h, w + 4, 2);
      });
    });
  }, [searchTexts, pageWidth, pageHeight, pageRef]);

  useEffect(() => {
    const container = pageRef.current;
    if (!container) return;

    // Try immediately, then watch for the text layer to appear
    drawHighlights();

    const observer = new MutationObserver(() => {
      drawHighlights();
    });

    observer.observe(container, { childList: true, subtree: true });

    // Also retry after short delays to catch async text layer paint
    const t1 = setTimeout(drawHighlights, 300);
    const t2 = setTimeout(drawHighlights, 800);

    return () => {
      observer.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [drawHighlights]);

  return (
    <canvas
      ref={canvasRef}
      width={pageWidth}
      height={pageHeight}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 10 }}
    />
  );
}

// ---------------------------------------------------------------------------
// Main PDF Pane
// ---------------------------------------------------------------------------
export function PDFPane() {
  const { uploadedFileUrl, uploadedFile, activeCitation, messages, setActiveCitation } =
    useAppStore();

  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const pageContainerRef = useRef<HTMLDivElement>(null);

  // All citations from the latest assistant message
  const latestCitations: Citation[] = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role === 'assistant' && msg.citations && msg.citations.length > 0) {
        return msg.citations;
      }
    }
    return [];
  })();

  // When activeCitation changes, jump to its page
  useEffect(() => {
    if (activeCitation?.page) {
      setCurrentPage(activeCitation.page);
    }
  }, [activeCitation]);

  // Texts to highlight on the current page — all chunks whose page matches
  const highlightTexts = latestCitations
    .filter((c) => !c.page || c.page === currentPage)
    .map((c) => c.text);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  }, []);

  const onPageLoadSuccess = useCallback((page: any) => {
    const viewport = page.getViewport({ scale });
    setPageSize({ width: viewport.width, height: viewport.height });
  }, [scale]);

  const prevPage = () => setCurrentPage((p) => Math.max(1, p - 1));
  const nextPage = () => setCurrentPage((p) => Math.min(numPages, p + 1));
  const zoomIn = () => setScale((s) => Math.min(2.5, +(s + 0.2).toFixed(1)));
  const zoomOut = () => setScale((s) => Math.max(0.6, +(s - 0.2).toFixed(1)));

  if (!uploadedFileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-slate-600">
        <FileText className="w-16 h-16 opacity-20" />
        <p className="text-sm font-mono">No document loaded</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#050d1a]">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <BookOpen className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-sm font-mono text-subtle truncate flex-1 min-w-0">
          {uploadedFile?.name ?? 'Document'}
        </span>
        {latestCitations.length > 0 && (
          <motion.span
            className="text-xs font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full flex-shrink-0"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            {latestCitations.length} highlighted
          </motion.span>
        )}
      </div>

      {/* ── Toolbar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 flex-shrink-0 bg-slate-900/40">
        {/* Page nav */}
        <div className="flex items-center gap-1">
          <button
            onClick={prevPage}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="w-4 h-4 text-subtle" />
          </button>
          <span className="text-xs font-mono text-subtle px-2 min-w-[80px] text-center">
            {currentPage} / {numPages || '—'}
          </span>
          <button
            onClick={nextPage}
            disabled={currentPage >= numPages}
            className="p-1.5 rounded-lg hover:bg-slate-800 disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="w-4 h-4 text-subtle" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ZoomOut className="w-4 h-4 text-subtle" />
          </button>
          <span className="text-xs font-mono text-slate-500 w-10 text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ZoomIn className="w-4 h-4 text-subtle" />
          </button>
        </div>

        {/* Citation page jumps */}
        {latestCitations.length > 0 && (
          <div className="flex items-center gap-1">
            {latestCitations.map((c, i) => (
              <button
                key={i}
                onClick={() => {
                  setActiveCitation(c);
                  if (c.page) setCurrentPage(c.page);
                }}
                className={`text-xs font-mono px-2 py-0.5 rounded-full border transition-colors ${
                  activeCitation?.chunkIndex === c.chunkIndex
                    ? 'bg-primary text-white border-primary'
                    : 'text-subtle border-slate-700 hover:border-primary/50'
                }`}
              >
                [{i + 1}]
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── PDF Viewer ── */}
      <div className="flex-1 overflow-auto flex justify-center py-4 px-2">
        <Document
          file={uploadedFileUrl}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-64 text-slate-500 font-mono text-sm">
              Loading PDF...
            </div>
          }
          error={
            <div className="flex items-center justify-center h-64 text-red-400 font-mono text-sm">
              Failed to load PDF
            </div>
          }
        >
          <div
            ref={pageContainerRef}
            className="relative shadow-2xl"
            style={{ width: pageSize.width || 'auto' }}
          >
            <Page
              pageNumber={currentPage}
              scale={scale}
              onLoadSuccess={onPageLoadSuccess}
              renderTextLayer={true}
              renderAnnotationLayer={false}
              className="rounded-sm overflow-hidden"
            />

            {/* Highlight overlay — drawn after page renders */}
            {pageSize.width > 0 && highlightTexts.length > 0 && (
              <HighlightOverlay
                pageRef={pageContainerRef}
                searchTexts={highlightTexts}
                pageWidth={pageSize.width}
                pageHeight={pageSize.height}
              />
            )}

            {/* Active citation glow border */}
            <AnimatePresence>
              {latestCitations.some((c) => !c.page || c.page === currentPage) && (
                <motion.div
                  className="absolute inset-0 rounded-sm pointer-events-none"
                  style={{
                    boxShadow: '0 0 0 2px rgba(59,130,246,0.4), 0 0 30px rgba(59,130,246,0.1)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              )}
            </AnimatePresence>
          </div>
        </Document>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 py-2 border-t border-slate-800 flex-shrink-0 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" />
        <p className="text-xs font-mono text-slate-600">
          {latestCitations.length > 0
            ? `Highlighting ${latestCitations.length} source chunks · click [n] to jump to page`
            : 'Ask a question to highlight source text in the PDF'}
        </p>
      </div>
    </div>
  );
}
