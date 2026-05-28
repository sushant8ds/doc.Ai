import { motion } from 'framer-motion';
import { Brain, RotateCcw, Cpu } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useOllamaRAG } from '../hooks/useOllamaRAG';

export function Header() {
  const { appState, uploadedFile } = useAppStore();
  const { resetSession } = useOllamaRAG();

  return (
    <motion.header
      className="flex items-center justify-between px-6 py-3 border-b border-slate-800 bg-[#020617]/80 backdrop-blur-sm sticky top-0 z-30"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3">
        <motion.div
          animate={{ rotate: appState === 'INDEXING' ? 360 : 0 }}
          transition={
            appState === 'INDEXING'
              ? { repeat: Infinity, duration: 3, ease: 'linear' }
              : {}
          }
        >
          <Brain className="w-7 h-7 text-primary" strokeWidth={1.5} />
        </motion.div>
        <div>
          <span
            className="text-lg font-bold text-white tracking-tight"
            style={{ fontFamily: 'JetBrains Mono, monospace' }}
          >
            DocMind
            <span className="text-primary ml-1 text-sm font-normal">AI</span>
          </span>
        </div>
      </div>

      {/* Status pill */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5">
          <motion.div
            className={`w-1.5 h-1.5 rounded-full ${
              appState === 'CHATTING'
                ? 'bg-green-400'
                : appState === 'INDEXING'
                ? 'bg-yellow-400'
                : appState === 'UPLOADING'
                ? 'bg-blue-400'
                : 'bg-slate-600'
            }`}
            animate={
              appState !== 'IDLE'
                ? { opacity: [1, 0.4, 1] }
                : {}
            }
            transition={{ repeat: Infinity, duration: 1.5 }}
          />
          <span className="text-xs font-mono text-subtle">
            {appState === 'CHATTING'
              ? uploadedFile?.name ?? 'Document loaded'
              : appState === 'INDEXING'
              ? 'Indexing...'
              : appState === 'UPLOADING'
              ? 'Uploading...'
              : 'Idle'}
          </span>
        </div>

        {/* Ollama indicator */}
        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-full px-3 py-1.5">
          <Cpu className="w-3 h-3 text-subtle" />
          <span className="text-xs font-mono text-slate-500">Ollama · Local</span>
        </div>

        {/* Reset button */}
        {appState !== 'IDLE' && (
          <motion.button
            onClick={resetSession}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 hover:border-primary/40 rounded-full px-3 py-1.5 transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <RotateCcw className="w-3 h-3 text-subtle" />
            <span className="text-xs font-mono text-subtle">New Doc</span>
          </motion.button>
        )}
      </div>
    </motion.header>
  );
}
