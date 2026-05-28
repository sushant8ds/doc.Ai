import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { IntroScreen } from './components/IntroScreen';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { ProcessingView } from './components/ProcessingView';
import { Workspace } from './components/Workspace';
import { useAppStore } from './store/useAppStore';

export default function App() {
  const [introComplete, setIntroComplete] = useState(false);
  const { appState } = useAppStore();

  return (
    <div className="h-screen bg-[#020617] flex flex-col overflow-hidden">
      {/* Intro splash */}
      <IntroScreen onComplete={() => setIntroComplete(true)} />

      <AnimatePresence>
        {introComplete && (
          <motion.div
            className="flex flex-col h-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Header />

            <main className="flex flex-col flex-1 overflow-hidden min-h-0">
              <AnimatePresence mode="wait">
                {appState === 'IDLE' && (
                  <motion.div
                    key="idle"
                    className="flex flex-1 items-center justify-center p-8 grid-bg overflow-hidden"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Dropzone />
                  </motion.div>
                )}

                {(appState === 'UPLOADING' || appState === 'INDEXING') && (
                  <motion.div
                    key="processing"
                    className="flex flex-1 items-center justify-center p-8 overflow-hidden"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ProcessingView />
                  </motion.div>
                )}

                {appState === 'CHATTING' && (
                  <motion.div
                    key="chatting"
                    className="flex flex-1 overflow-hidden min-h-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                  >
                    <Workspace />
                  </motion.div>
                )}
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
