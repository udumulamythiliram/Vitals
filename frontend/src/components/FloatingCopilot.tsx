import React, { useState, useRef, useEffect } from 'react';
import { PatientProfile, ChatMessage } from '../types';
import { api } from '../api';
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  Copy,
  Check,
  FileText,
  Sparkles,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface FloatingCopilotProps {
  activePatient: PatientProfile | null;
  onOpenDocument?: (docId: string) => void;
  elderlyMode?: boolean;
}

export const FloatingCopilot: React.FC<FloatingCopilotProps> = ({
  activePatient,
  onOpenDocument,
  elderlyMode = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with greeting if empty
  useEffect(() => {
    if (activePatient && messages.length === 0) {
      setMessages([
        {
          id: 'welcome_msg',
          role: 'assistant',
          content: `Hello! I am Vitalis Copilot, personalized for **${activePatient.full_name}**. Upload any prescription or test report, or ask me anything grounded in your records.`,
          created_at: new Date().toISOString(),
          sources: []
        }
      ]);
    }
  }, [activePatient]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input;
    if (!textToSend.trim() || !activePatient || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      role: 'user',
      content: textToSend,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!customText) setInput('');
    setIsLoading(true);

    try {
      const resp = await api.sendMessage({
        patient_id: activePatient.id,
        message: textToSend,
        conversation_id: conversationId || undefined
      });

      if (resp.conversation_id) setConversationId(resp.conversation_id);

      const asstMsg: ChatMessage = {
        id: resp.message_id || `asst_${Date.now()}`,
        role: 'assistant',
        content: resp.content,
        safety_flag: resp.safety_flag,
        model_used: resp.model_used,
        created_at: new Date().toISOString(),
        sources: resp.sources
      };
      setMessages((prev) => [...prev, asstMsg]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: 'Unable to reach the assistant. Please verify your connection or check system status.',
          created_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  // Text-to-speech read aloud
  const handleReadAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_`]/g, ''));
      utterance.rate = elderlyMode ? 0.85 : 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Voice recognition via Web Speech API
  const handleToggleVoice = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser. Please use keyboard input.');
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onstart = () => setIsRecording(true);
    recognition.onend = () => setIsRecording(false);
    recognition.onerror = () => setIsRecording(false);
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsRecording(false);
    };
    recognition.start();
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className={`fixed bottom-6 right-6 z-40 bg-primary hover:bg-primary-hover text-primary-contrast rounded-full shadow-2xl flex items-center space-x-2 transition-all transform hover:scale-105 ${
            elderlyMode ? 'p-5 text-lg' : 'p-4'
          }`}
          title="Ask Vitalis Copilot"
          aria-label="Open Vitalis Copilot"
        >
          <Bot className={elderlyMode ? 'w-8 h-8' : 'w-6 h-6'} />
          <span className="font-bold hidden sm:inline">Ask Vitalis</span>
        </button>
      )}

      {/* Floating Drawer */}
      {isOpen && (
        <div
          role="complementary"
          aria-label="Vitalis Copilot Assistant"
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[95vw] sm:w-[450px] h-[600px] max-h-[85vh] bg-surface border-2 border-border rounded-theme shadow-2xl z-50 flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="p-3 bg-surface-2 border-b border-border flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="p-1.5 rounded-full bg-primary text-primary-contrast">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="font-bold text-sm text-text">Vitalis Copilot</div>
                <div className="text-xs text-text-muted truncate max-w-[200px]">
                  Patient: {activePatient?.full_name}
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full hover:bg-border text-text-muted hover:text-text transition-colors"
              aria-label="Close Copilot"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-theme p-3 text-sm leading-relaxed ${
                      isUser
                        ? 'bg-primary text-primary-contrast'
                        : 'bg-surface-2 text-text border border-border shadow-sm'
                    } ${elderlyMode ? 'text-base p-4' : ''}`}
                  >
                    <div className="whitespace-pre-line">{m.content}</div>

                    {/* Sources citations */}
                    {!isUser && m.sources && m.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-border/50 text-xs">
                        <div className="font-semibold text-text-muted mb-1 flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Sources Grounded in Records:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {m.sources.map((s, idx) => (
                            <span
                              key={idx}
                              onClick={() => onOpenDocument && onOpenDocument(s.document_id)}
                              className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-surface border border-border hover:border-primary text-primary cursor-pointer text-[11px] font-medium"
                              title={s.excerpt}
                            >
                              <span>{s.doc_name}</span>
                              <ExternalLink className="w-3 h-3" />
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions for Assistant Messages */}
                  {!isUser && (
                    <div className="flex items-center space-x-2 mt-1 text-xs text-text-muted">
                      <button
                        onClick={() => handleReadAloud(m.content)}
                        className="p-1 hover:text-text flex items-center space-x-1"
                        title="Read aloud"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>Read</span>
                      </button>
                      <button
                        onClick={() => handleCopy(m.id, m.content)}
                        className="p-1 hover:text-text flex items-center space-x-1"
                        title="Copy message"
                      >
                        {copiedId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                        <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex items-center space-x-2 text-text-muted text-xs p-2">
                <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                <span>Vitalis is analyzing your records...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="px-3 py-1.5 bg-surface-2/60 border-t border-border flex items-center space-x-2 overflow-x-auto text-xs whitespace-nowrap">
            <button
              onClick={() => handleSend('Explain my latest blood test simply')}
              className="px-2 py-1 rounded-full bg-surface border border-border hover:border-primary text-text-muted hover:text-primary transition-colors"
            >
              Explain blood test
            </button>
            <button
              onClick={() => handleSend('Explain this in Telugu (తెలుగు)')}
              className="px-2 py-1 rounded-full bg-surface border border-border hover:border-primary text-text-muted hover:text-primary transition-colors"
            >
              తెలుగు (Telugu)
            </button>
            <button
              onClick={() => handleSend('Explain this in Hindi (हिन्दी)')}
              className="px-2 py-1 rounded-full bg-surface border border-border hover:border-primary text-text-muted hover:text-primary transition-colors"
            >
              हिन्दी (Hindi)
            </button>
            <button
              onClick={() => handleSend('What questions should I ask my doctor?')}
              className="px-2 py-1 rounded-full bg-surface border border-border hover:border-primary text-text-muted hover:text-primary transition-colors"
            >
              Doctor questions
            </button>
          </div>

          {/* Input Bar */}
          <div className="p-3 bg-surface border-t border-border flex items-center space-x-2">
            <button
              onClick={handleToggleVoice}
              className={`p-2 rounded-theme transition-colors ${
                isRecording
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'text-text-muted hover:bg-surface-2 hover:text-text'
              }`}
              title={isRecording ? 'Listening...' : 'Voice dictation'}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              placeholder={elderlyMode ? 'Type or speak question...' : 'Ask about your medications or lab tests...'}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="flex-1 bg-surface-2 border border-border rounded-theme px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-ring"
            />

            <button
              onClick={() => handleSend()}
              disabled={isLoading || !input.trim()}
              className="p-2 rounded-theme bg-primary hover:bg-primary-hover disabled:opacity-40 text-primary-contrast transition-colors"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};
