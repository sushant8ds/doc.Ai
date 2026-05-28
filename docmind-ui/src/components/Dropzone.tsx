import { useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useOllamaRAG } from '../hooks/useOllamaRAG';

type DropState = 'idle' | 'hover' | 'success' | 'error';

export function Dropzone() {
  const [dropState, setDropState] = useState<DropState>('idle');
  const [fileName, setFileName] = useState('');
  const { processDocument } = useOllamaRAG();

  const handleFile = useCallback(
    (file: File) => {
      if (file.type !== 'application/pdf') {
        setDropState('error');
        setTimeout(() => setDropState('idle'), 2000);
        return;
      }
      setFileName(file.name);
      setDropState('success');
      setTimeout(() => processDocument(file), 600);
    },
    [processDocument]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDropState('idle');
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDropState('hover');
  };

  const onDragLeave = () => setDropState('idle');

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-xl mx-auto gap-6">
      {/* Label */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-2xl font-semibold text-white mb-2">
          Upload a PDF Document
        </h2>
        <p className="text-subtle text-sm font-mono">
          Drag & drop or click to select · PDF only
        </p>
      </motion.div>

      {/* Drop zone */}
      <motion.label
        htmlFor="pdf-input"
        className="relative w-full cursor-pointer"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
      >
        {/* Liquid border wrapper */}
        <AnimatePresence>
          {dropState === 'hover' && (
            <motion.div
              className="absolute -inset-0.5 rounded-2xl liquid-border"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ zIndex: 0 }}
            />
          )}
        </AnimatePresence>

        <motion.div
          className="relative z-10 flex flex-col items-center justify-center gap-5 rounded-2xl border-2 p-12 transition-colors duration-300"
          animate={{
            borderColor:
              dropState === 'hover'
                ? '#3b82f6'
                : dropState === 'success'
                ? '#22c55e'
                : dropState === 'error'
                ? '#ef4444'
                : '#1e3a5f',
            backgroundColor:
              dropState === 'hover'
                ? 'rgba(59,130,246,0.05)'
                : 'rgba(15,23,42,0.8)',
          }}
        >
          <AnimatePresence mode="wait">
            {dropState === 'success' ? (
              <motion.div
                key="success"
                className="flex flex-col items-center gap-3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <CheckCircle className="w-14 h-14 text-green-400" />
                <p className="text-green-400 font-mono text-sm">{fileName}</p>
                <p className="text-subtle text-xs">Processing...</p>
              </motion.div>
            ) : dropState === 'error' ? (
              <motion.div
                key="error"
                className="flex flex-col items-center gap-3"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
              >
                <AlertCircle className="w-14 h-14 text-red-400" />
                <p className="text-red-400 font-mono text-sm">
                  Only PDF files are supported
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                className="flex flex-col items-center gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  animate={
                    dropState === 'hover'
                      ? { y: [-4, 4, -4], transition: { repeat: Infinity, duration: 1 } }
                      : {}
                  }
                >
                  {dropState === 'hover' ? (
                    <FileText className="w-14 h-14 text-primary" />
                  ) : (
                    <Upload className="w-14 h-14 text-slate-500" />
                  )}
                </motion.div>
                <div className="text-center">
                  <p className="text-white font-medium">
                    {dropState === 'hover'
                      ? 'Release to upload'
                      : 'Drop your PDF here'}
                  </p>
                  <p className="text-subtle text-xs mt-1 font-mono">
                    or click to browse files
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <input
          id="pdf-input"
          type="file"
          accept=".pdf,application/pdf"
          className="hidden"
          onChange={onInputChange}
        />
      </motion.label>

      {/* Feature badges */}
      <motion.div
        className="flex gap-3 flex-wrap justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        {['100% Local', 'No API Keys', 'Privacy First', 'Ollama Powered'].map(
          (badge) => (
            <span
              key={badge}
              className="text-xs font-mono text-subtle border border-slate-700 px-3 py-1 rounded-full"
            >
              {badge}
            </span>
          )
        )}
      </motion.div>
    </div>
  );
}
