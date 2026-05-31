import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, User, Bot, BookOpen, Lightbulb, ChevronRight, Sparkles, ShieldCheck, ShieldAlert, ShieldX, ShieldQuestion } from 'lucide-react';
import { useAppStore, Citation, HallucinationResult } from '../store/useAppStore';
import { useOllamaRAG } from '../hooks/useOllamaRAG';
import { BrainwaveLoader } from './BrainwaveLoader';

// ── Citation badge ──────────────────────────────────────────────────────────
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
      className="inline-flex items-center gap-1 text-xs font-mono bg-primary/10 border border-primary/30 text-primary px-2 py-0.5 rounded-full hover:bg-primary/20 transition-colors"
      title={citation.text.slice(0, 100)}
    >
      <BookOpen className="w-3 h-3" />
      [{index + 1}]
    </button>
  );
}

// ── Streaming cursor ────────────────────────────────────────────────────────
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

// ── Key points panel ────────────────────────────────────────────────────────
function KeyPoints({ points }: { points: string[] }) {
  if (!points.length) return null;
  return (
    <motion.div
      className="mt-3 rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
          Key Points
        </span>
      </div>
      <ul className="space-y-1.5">
        {points.map((pt, i) => (
          <motion.li
            key={i}
            className="flex items-start gap-2 text-xs text-slate-300 leading-relaxed"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 + i * 0.07 }}
          >
            <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
            {pt}
          </motion.li>
        ))}
      </ul>
    </motion.div>
  );
}

// ── Suggested questions chips ───────────────────────────────────────────────
function SuggestedQuestions({
  questions,
  onSelect,
}: {
  questions: string[];
  onSelect: (q: string) => void;
}) {
  if (!questions.length) return null;
  return (
    <motion.div
      className="mt-3 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
        <span className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
          Ask Next
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {questions.map((q, i) => (
          <motion.button
            key={i}
            onClick={() => onSelect(q)}
            className="flex items-center gap-2 text-left text-xs text-slate-300 hover:text-white bg-slate-800/60 hover:bg-violet-500/15 border border-slate-700/50 hover:border-violet-500/40 rounded-lg px-3 py-2 transition-all duration-200 group"
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 + i * 0.07 }}
            whileHover={{ x: 2 }}
          >
            <ChevronRight className="w-3 h-3 text-violet-400 flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
            {q}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}

// ── Hallucination badge ─────────────────────────────────────────────────────
const VERDICT_CONFIG = {
  SUPPORTED: {
    icon: ShieldCheck,
    label: 'Grounded',
    color: 'text-green-400',
    border: 'border-green-500/30',
    bg: 'bg-green-500/8',
    bar: 'bg-green-400',
    desc: 'All claims are supported by the source document.',
  },
  PARTIALLY_SUPPORTED: {
    icon: ShieldAlert,
    label: 'Partial',
    color: 'text-yellow-400',
    border: 'border-yellow-500/30',
    bg: 'bg-yellow-500/8',
    bar: 'bg-yellow-400',
    desc: 'Some claims may go beyond the source document.',
  },
  NOT_SUPPORTED: {
    icon: ShieldX,
    label: 'Unverified',
    color: 'text-red-400',
    border: 'border-red-500/30',
    bg: 'bg-red-500/8',
    bar: 'bg-red-400',
    desc: 'Claims could not be verified against the source.',
  },
  UNKNOWN: {
    icon: ShieldQuestion,
    label: 'Unknown',
    color: 'text-slate-400',
    border: 'border-slate-600/30',
    bg: 'bg-slate-700/20',
    bar: 'bg-slate-500',
    desc: 'Verification could not be completed.',
  },
} as const;

function HallucinationBadge({ result }: { result: HallucinationResult }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = VERDICT_CONFIG[result.verdict] ?? VERDICT_CONFIG.UNKNOWN;
  const Icon = cfg.icon;

  return (
    <motion.div
      className={`mt-3 rounded-xl border ${cfg.border} ${cfg.bg} overflow-hidden`}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      {/* Header row — always visible */}
      <button
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors"
      >
        <Icon className={`w-4 h-4 ${cfg.color} flex-shrink-0`} />
        <span className={`text-xs font-semibold ${cfg.color} uppercase tracking-wider`}>
          Fact Check
        </span>
        <span className={`text-xs font-mono ${cfg.color} ml-1`}>
          {cfg.label}
        </span>

        {/* Confidence bar */}
        <div className="flex-1 mx-2 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${cfg.bar}`}
            initial={{ width: 0 }}
            animate={{ width: `${result.confidence}%` }}
            transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
          />
        </div>
        <span className={`text-xs font-mono ${cfg.color} flex-shrink-0`}>
          {result.confidence}%
        </span>
        <motion.span
          className="text-slate-500 text-xs ml-1"
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          ▾
        </motion.span>
      </button>

      {/* Expanded reason */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            className="px-3 pb-3"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <p className="text-xs text-slate-400 leading-relaxed border-t border-slate-700/50 pt-2">
              <span className="text-slate-500">Reason: </span>
              {result.reason || cfg.desc}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Main ChatPane ───────────────────────────────────────────────────────────
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

  const handleSend = (text?: string) => {
    const q = (text ?? input).trim();
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

      {/* Messages */}
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
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'max-w-[80%] bg-primary/15 border border-primary/20 text-white rounded-tr-sm'
                    : 'w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'
                }`}
              >
                {/* Answer text */}
                {msg.isStreaming ? (
                  <StreamingText text={msg.content} />
                ) : (
                  <span>{msg.content}</span>
                )}

                {/* Only show extras after streaming is done */}
                {!msg.isStreaming && msg.role === 'assistant' && (
                  <>
                    {/* Key points */}
                    {msg.keyPoints && msg.keyPoints.length > 0 && (
                      <KeyPoints points={msg.keyPoints} />
                    )}

                    {/* Hallucination check badge */}
                    {msg.hallucination && (
                      <HallucinationBadge result={msg.hallucination} />
                    )}

                    {/* Suggested questions */}
                    {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                      <SuggestedQuestions
                        questions={msg.suggestedQuestions}
                        onSelect={(q) => handleSend(q)}
                      />
                    )}

                    {/* Citations */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-700/50">
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
                  </>
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
            onClick={() => handleSend()}
            disabled={!input.trim() || isThinking}
            className="flex-shrink-0 w-11 h-11 rounded-xl bg-primary flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Send className="w-4 h-4 text-white" />
          </motion.button>
        </div>
        <p className="text-xs text-slate-600 font-mono mt-2">
          Enter to send · Shift+Enter for new line · Click suggested questions to ask
        </p>
      </div>
    </div>
  );
}
