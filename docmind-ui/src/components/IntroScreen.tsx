import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain } from 'lucide-react';

const TYPEWRITER_TEXT = 'Synthesizing PDF Intelligence via Local Neural Networks.';

interface IntroScreenProps {
  onComplete: () => void;
}

export function IntroScreen({ onComplete }: IntroScreenProps) {
  const [typedText, setTypedText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i < TYPEWRITER_TEXT.length) {
        setTypedText(TYPEWRITER_TEXT.slice(0, i + 1));
        i++;
      } else {
        clearInterval(interval);
        setTimeout(() => setDone(true), 800);
        setTimeout(() => onComplete(), 1800);
      }
    }, 45);
    return () => clearInterval(interval);
  }, [onComplete]);

  // Cursor blink
  useEffect(() => {
    const t = setInterval(() => setShowCursor((c) => !c), 530);
    return () => clearInterval(t);
  }, []);

  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020617] grid-bg"
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Radial glow */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div
              className="w-[600px] h-[600px] rounded-full opacity-10"
              style={{
                background:
                  'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
              }}
            />
          </div>

          <motion.div
            className="flex flex-col items-center gap-8 z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            {/* Logo glitch */}
            <motion.div
              className="flex items-center gap-4"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
            >
              <motion.div
                animate={{
                  filter: [
                    'hue-rotate(0deg) brightness(1)',
                    'hue-rotate(90deg) brightness(1.5)',
                    'hue-rotate(0deg) brightness(1)',
                  ],
                }}
                transition={{ duration: 0.3, repeat: 3, repeatDelay: 0.5 }}
              >
                <Brain className="w-16 h-16 text-primary" strokeWidth={1.5} />
              </motion.div>

              <div className="relative">
                <motion.h1
                  className="text-6xl font-bold tracking-tight text-white glitch-text"
                  data-text="DocMind"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3, duration: 0.3 }}
                  style={{ fontFamily: 'JetBrains Mono, monospace' }}
                >
                  DocMind
                </motion.h1>
                <motion.span
                  className="absolute -top-1 -right-12 text-xs font-mono text-primary border border-primary/40 px-1.5 py-0.5 rounded"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  AI
                </motion.span>
              </div>
            </motion.div>

            {/* Divider */}
            <motion.div
              className="h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent"
              initial={{ width: 0 }}
              animate={{ width: 400 }}
              transition={{ delay: 0.6, duration: 0.8 }}
            />

            {/* Typewriter */}
            <motion.p
              className="text-subtle text-lg font-mono tracking-wide max-w-lg text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              {typedText}
              <span
                className="inline-block w-0.5 h-5 bg-primary ml-0.5 align-middle"
                style={{ opacity: showCursor ? 1 : 0 }}
              />
            </motion.p>

            {/* Scanning line */}
            <motion.div
              className="relative w-80 h-1 bg-slate-800 rounded overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
            >
              <motion.div
                className="absolute inset-y-0 left-0 bg-primary rounded"
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ delay: 1.1, duration: 1.5, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Status */}
            <motion.p
              className="text-xs font-mono text-slate-600 tracking-widest uppercase"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              Initializing local inference engine...
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
