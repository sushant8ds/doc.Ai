import { create } from 'zustand';

export type AppState = 'IDLE' | 'UPLOADING' | 'INDEXING' | 'CHATTING';

export interface Citation {
  chunkIndex: number;
  text: string;
  page?: number;
}

export interface HallucinationResult {
  verdict: 'SUPPORTED' | 'PARTIALLY_SUPPORTED' | 'NOT_SUPPORTED' | 'UNKNOWN';
  confidence: number;
  reason: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  keyPoints?: string[];
  suggestedQuestions?: string[];
  hallucination?: HallucinationResult;
  isStreaming?: boolean;
}

export interface ProcessingLog {
  id: string;
  text: string;
  status: 'pending' | 'done' | 'active';
}

interface AppStore {
  appState: AppState;
  uploadedFile: File | null;
  uploadedFileUrl: string | null;
  processingProgress: number;
  processingLogs: ProcessingLog[];
  messages: Message[];
  activeCitation: Citation | null;
  isThinking: boolean;

  setAppState: (state: AppState) => void;
  setUploadedFile: (file: File | null) => void;
  setUploadedFileUrl: (url: string | null) => void;
  setProcessingProgress: (progress: number) => void;
  addProcessingLog: (log: ProcessingLog) => void;
  updateProcessingLog: (id: string, updates: Partial<ProcessingLog>) => void;
  clearProcessingLogs: () => void;
  addMessage: (message: Message) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  setActiveCitation: (citation: Citation | null) => void;
  setIsThinking: (thinking: boolean) => void;
  resetSession: () => void;
}

export const useAppStore = create<AppStore>((set) => ({
  appState: 'IDLE',
  uploadedFile: null,
  uploadedFileUrl: null,
  processingProgress: 0,
  processingLogs: [],
  messages: [],
  activeCitation: null,
  isThinking: false,

  setAppState: (state) => set({ appState: state }),
  setUploadedFile: (file) => set({ uploadedFile: file }),
  setUploadedFileUrl: (url) => set({ uploadedFileUrl: url }),
  setProcessingProgress: (progress) => set({ processingProgress: progress }),
  addProcessingLog: (log) =>
    set((state) => ({ processingLogs: [...state.processingLogs, log] })),
  updateProcessingLog: (id, updates) =>
    set((state) => ({
      processingLogs: state.processingLogs.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
    })),
  clearProcessingLogs: () => set({ processingLogs: [] }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  updateMessage: (id, updates) =>
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),
  setActiveCitation: (citation) => set({ activeCitation: citation }),
  setIsThinking: (thinking) => set({ isThinking: thinking }),
  resetSession: () =>
    set({
      appState: 'IDLE',
      uploadedFile: null,
      uploadedFileUrl: null,
      processingProgress: 0,
      processingLogs: [],
      messages: [],
      activeCitation: null,
      isThinking: false,
    }),
}));
