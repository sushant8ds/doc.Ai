import { motion } from 'framer-motion';
import { ChatPane } from './ChatPane';
import { PDFPane } from './PDFPane';

export function Workspace() {
  return (
    <motion.div
      className="flex flex-1 overflow-hidden min-h-0 h-full"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Left: Chat */}
      <motion.div
        className="flex flex-col border-r border-slate-800 overflow-hidden min-h-0 h-full"
        style={{ width: '50%' }}
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <ChatPane />
      </motion.div>

      {/* Right: PDF */}
      <motion.div
        className="flex flex-col overflow-hidden min-h-0 h-full"
        style={{ width: '50%' }}
        initial={{ x: 40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.15 }}
      >
        <PDFPane />
      </motion.div>
    </motion.div>
  );
}
