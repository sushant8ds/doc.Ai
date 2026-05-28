import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, BookOpen } from 'lucide-react';
import { useAppStore, Citation } from '../store/useAppStore';
import { useOllamaRAG } from '../hooks/useOllamaRAG';
import { BrainwaveLoader } from './BrainwaveLoader';

function CitationBadge({
  citation,
  index,
  onClick,
}: {
  citation: Citation;
  index: number;
  onClick: (c: Citation) => void;
}) {
  return (
    <button
      onClick={() => onClick(citation)}
      className="inline-flex items-center gap-1 text-xs font-mono bg-primary/10 border border-primary/30 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors ml-1"
      title={citation.text.slice(0, 100)}
    >
      <BookOpen className="w-3 h-3" />
      [{index + 1}]
    </button>
  );
}

function StreamingText({ text }: { text: string }) {
  return (
    <span>
      {text}
      <motion.span
        className="inline-block w-0.5 h-4 bg-primary ml-0.5 align-middle"
        animate={{ opacity: [1, 0] }}
        transition={{ repeat: Infinity, duration: 0.6 }}
      />
    </span>
  );
}

export function ChatPane() {
  const { messages, isThinking, setActiveCitation } = useAppStore();
  const { sendMessage } = useOllamaRAG();
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  // ID of the latest assistant message with citations
  const latestCitedMsgId = (() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i].role === 'assistant' && messages[i].citations?.length) {
        return messages[i].id;
      }
    }
    return null;
  })();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const handleSend = () => {
    const q = input.trim();
    if (!q) return;
    setInput('');
    sendMessage(q);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
        <span className="text-sm font-mono text-subtle">Neural Chat Interface</span>
        <span className="ml-auto text-xs font-mono text-slate-600">
          {messages.length} messages
        </span>
      </div>

      {/* Messages — scrollable, shrinks to give room to input */}
      <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  msg.role === 'user'
                    ? 'bg-primary/20 border border-primary/30'
                    : 'bg-slate-800 border border-slate-700'
                }`}
              >
                {msg.role === 'user' ? (
                  <User className="w-4 h-4 text-primary" />
                ) : (
                  <Bot className="w-4 h-4 text-subtle" />
                )}
              </div>

              {/* Bubble */}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-primary/15 border border-primary/20 text-white rounded-tr-sm'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
                }`}
              >
                {msg.isStreaming ? (
                  <StreamingText text={msg.content} />
                ) : (
                  <span>{msg.content}</span>
                )}

                {/* Citations */}
                {msg.citations && msg.citations.length > 0 && !msg.isStreaming && (
                  <div className="mt-2 pt-2 border-t border-slate-700/50">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-xs text-slate-500 font-mono">Sources:</span>
                      {msg.id === latestCitedMsgId && (
                        <motion.span
                          className="text-xs font-mono text-primary flex items-center gap-1"
                          initial={{ opacity: 0, x: -4 }}
                          animate={{ opacity: 1, x: 0 }}
                        >
                          <span className="w-1 h-1 rounded-full bg-primary inline-block animate-pulse" />
                          auto-highlighted →
                        </motion.span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {msg.citations.map((c, i) => (
                        <CitationBadge
                          key={i}
                          citation={c}
                          index={i}
                          onClick={setActiveCitation}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Thinking indicator */}
        <AnimatePresence>
          {isThinking && (
            <motion.div
              className="flex gap-3"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                <Bot className="w-4 h-4 text-subtle" />
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-sm overflow-hidden">
                <BrainwaveLoader />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} />
      </div>

      {/* Input — always pinned at bottom */}
      <div className="flex-shrink-0 px-5 py-4 border-t border-slate-800 bg-[#020617]">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about your document..."
              rows={1}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 resize-none focus:outline-none focus:border-primary/50 transition-colors font-mono"
              style={{ minHeight: 48, maxHeight: 120 }}
            />
          </div>
          <motion.button
            onClick={handleSend}
            disabled={!input.trim() || isThinking}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
        <p className="text-xs text-slate-600 font-mono mt-2">
          Enter to send · Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}
