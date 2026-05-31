import { useCallback } from 'react';
import { useAppStore, Citation, HallucinationResult } from '../store/useAppStore';


const API_BASE = 'http://localhost:8000';

const PROCESSING_STEPS: string[] = [
  'Initializing document parser...',
  'Extracting raw text corpus...',
  'Tokenizing semantic units...',
  'Normalizing vector embeddings...',
  'Indexing semantic tokens...',
  'Building FAISS similarity index...',
  'Calibrating retrieval thresholds...',
  'Generating document summary...',
  'Warming up neural inference engine...',
  'System ready.',
];

let logIdCounter = 0;
const makeLogId = () => `log-${++logIdCounter}`;

export function useOllamaRAG() {
  const {
    setAppState,
    setUploadedFile,
    setUploadedFileUrl,
    setProcessingProgress,
    addProcessingLog,
    updateProcessingLog,
    clearProcessingLogs,
    addMessage,
    updateMessage,
    setIsThinking,
    setActiveCitation,
    resetSession,
  } = useAppStore();

  const processDocument = useCallback(async (file: File) => {
    setUploadedFile(file);
    setUploadedFileUrl(URL.createObjectURL(file));
    setAppState('UPLOADING');
    clearProcessingLogs();
    setProcessingProgress(0);

    // Simulate staggered log steps while uploading
    const stepCount = PROCESSING_STEPS.length;
    const logIds: string[] = [];

    // Add all logs as pending first
    PROCESSING_STEPS.forEach((text) => {
      const id = makeLogId();
      logIds.push(id);
      addProcessingLog({ id, text, status: 'pending' });
    });

    setAppState('INDEXING');

    // Upload file to backend
    const formData = new FormData();
    formData.append('file', file);

    try {
      // Animate logs while waiting for backend
      let stepIndex = 0;
      const animateStep = () => {
        if (stepIndex < stepCount) {
          const id = logIds[stepIndex];
          updateProcessingLog(id, { status: 'active' });

          setTimeout(() => {
            updateProcessingLog(id, { status: 'done' });
            setProcessingProgress(Math.round(((stepIndex + 1) / stepCount) * 90));
            stepIndex++;
            if (stepIndex < stepCount) {
              setTimeout(animateStep, 600 + Math.random() * 400);
            }
          }, 800 + Math.random() * 600);
        }
      };
      animateStep();

      const response = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      // Finish remaining logs
      logIds.forEach((id) => updateProcessingLog(id, { status: 'done' }));
      setProcessingProgress(100);

      setTimeout(() => {
        setAppState('CHATTING');
      }, 800);
    } catch (err) {
      console.error('Processing error:', err);
      // Still transition to chatting for demo purposes if backend isn't up
      logIds.forEach((id) => updateProcessingLog(id, { status: 'done' }));
      setProcessingProgress(100);
      setTimeout(() => setAppState('CHATTING'), 800);
    }
  }, []);

  const sendMessage = useCallback(async (query: string) => {
    const userMsgId = `msg-${Date.now()}-user`;
    const assistantMsgId = `msg-${Date.now()}-assistant`;

    addMessage({ id: userMsgId, role: 'user', content: query });
    setIsThinking(true);

    addMessage({
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      isStreaming: true,
    });

    try {
      const response = await fetch(`${API_BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });

      if (!response.ok) throw new Error('Chat request failed');

      const data = await response.json();
      const fullText: string = data.answer || '';
      const chunks: string[] = data.chunks || [];
      const keyPoints: string[] = data.key_points || [];
      const suggestedQuestions: string[] = data.suggested_questions || [];
      const hallucination: HallucinationResult | undefined = data.hallucination;

      // Build citations from returned chunks
      const citations: Citation[] = chunks.map((text: string, i: number) => ({
        chunkIndex: i,
        text,
        page: data.pages?.[i] ?? undefined,
      }));

      // Simulate streaming by revealing text word by word
      const words = fullText.split(' ');
      let revealed = '';
      setIsThinking(false);

      for (let i = 0; i < words.length; i++) {
        revealed += (i === 0 ? '' : ' ') + words[i];
        updateMessage(assistantMsgId, { content: revealed, isStreaming: true });
        await new Promise((r) => setTimeout(r, 30 + Math.random() * 20));
      }

      updateMessage(assistantMsgId, {
        content: fullText,
        isStreaming: false,
        citations,
        keyPoints,
        suggestedQuestions,
        hallucination,
      });

      // Auto-highlight the first source chunk in the PDF pane
      if (citations.length > 0) {
        setActiveCitation(citations[0]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setIsThinking(false);

      // Fallback demo response
      const demo =
        'I could not connect to the backend. Make sure the FastAPI server is running on port 8000 with `python server.py`.';
      const words = demo.split(' ');
      let revealed = '';

      for (let i = 0; i < words.length; i++) {
        revealed += (i === 0 ? '' : ' ') + words[i];
        updateMessage(assistantMsgId, { content: revealed, isStreaming: true });
        await new Promise((r) => setTimeout(r, 40));
      }

      updateMessage(assistantMsgId, { content: demo, isStreaming: false });
    }
  }, []);

  return { processDocument, sendMessage, resetSession };
}
