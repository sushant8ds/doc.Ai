import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '../store/useAppStore';
import { ParticleCanvas } from './ParticleCanvas';

export function ProcessingView() {
  const { processingProgress, processingLogs, uploadedFile } = useAppStore();
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [processingLogs]);

  return (
    <div className="flex flex-col items-center justify-center w-full max-w-2xl mx-auto gap-6">
      {/* Particle canvas */}
      <motion.div
        className="relative w-full rounded-2xl overflow-hidden border border-slate-800"
        style={{ height: 280 }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div className="absolute inset-0 bg-[#050d1a]">
          <ParticleCanvas progress={processingProgress} />
        </div>

        {/* Center overlay text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <p className="text-4xl font-bold font-mono text-primary">
              {processingProgress}%
            </p>
            <p className="text-subtle text-xs font-mono mt-1 tracking-widest uppercase">
              {processingProgress < 100 ? 'Indexing Document' : 'Complete'}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* File name */}
      <motion.p
        className="text-sm font-mono text-subtle"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Processing:{' '}
        <span className="text-primary">{uploadedFile?.name ?? 'document.pdf'}</span>
      </motion.p>

      {/* Progress bar */}
      <div className="w-full h-1 bg-slate-800 rounded overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-cyan-400 rounded"
          style={{ width: `${processingProgress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Log window */}
      <motion.div
        className="w-full rounded-xl border border-slate-800 bg-[#050d1a] overflow-hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {/* Header */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-slate-800 bg-slate-900/50">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          </div>
          <span className="text-xs font-mono text-slate-500 ml-2">
            system.log — DocMind Neural Engine
          </span>
        </div>

        {/* Log entries */}
        <div className="p-4 h-40 overflow-y-auto font-mono text-xs space-y-1.5">
          {processingLogs.map((log) => (
            <motion.div
              key={log.id}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {log.status === 'active' && (
                <motion.span
                  className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
              )}
              {log.status === 'done' && (
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 flex-shrink-0" />
              )}
              {log.status === 'pending' && (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600 flex-shrink-0" />
              )}
              <span
                className={
                  log.status === 'done'
                    ? 'text-green-400'
                    : log.status === 'active'
                    ? 'text-primary'
                    : 'text-slate-600'
                }
              >
                {log.status === 'done' ? '✓' : log.status === 'active' ? '›' : '·'}{' '}
                {log.text}
              </span>
            </motion.div>
          ))}
          <div ref={logEndRef} />
        </div>
      </motion.div>
    </div>
  );
}
