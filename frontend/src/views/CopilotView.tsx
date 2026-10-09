import React, { useState, useEffect, useRef } from 'react';
import { PatientProfile, ChatMessage } from '../types';
import { api } from '../api';
import {
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  Copy,
  Check,
  FileText,
  Sparkles,
  ExternalLink,
  PlusCircle,
  MessageSquare,
  ShieldAlert,
  Info,
  RefreshCw
} from 'lucide-react';

interface CopilotViewProps {
  activePatient: PatientProfile | null;
  onOpenDocument?: (docId: string) => void;
  initialPrompt?: string;
  elderlyMode?: boolean;
}

export const CopilotView: React.FC<CopilotViewProps> = ({
  activePatient,
  onOpenDocument,
  initialPrompt,
  elderlyMode = false,
}) => {
  const [conversations, setConversations] = useState<any[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations list
  useEffect(() => {
    if (!activePatient) return;
    api.getConversations(activePatient.id)
      .then((convs) => {
        setConversations(convs || []);
        if (convs && convs.length > 0 && !currentConvId) {
          setCurrentConvId(convs[0].id);
        }
      })
      .catch((err) => console.error(err));
  }, [activePatient]);

  // Load messages when currentConvId changes
  useEffect(() => {
    if (currentConvId) {
      api.getMessages(currentConvId)
        .then((msgs) => setMessages(msgs || []))
        .catch((err) => console.error(err));
    } else if (activePatient) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: `Hello! I am Vitalis Copilot, personalized for **${activePatient.full_name}** (${activePatient.age_group.toUpperCase()}).\n\nI ground every answer in your uploaded prescriptions and lab reports. How can I assist you today?`,
          created_at: new Date().toISOString(),
          sources: []
        }
      ]);
    }
  }, [currentConvId, activePatient]);

  // Handle initial prompt from Dashboard if passed
  useEffect(() => {
    if (initialPrompt) {
      handleSend(initialPrompt);
    }
  }, [initialPrompt]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
        conversation_id: currentConvId || undefined
      });

      if (!currentConvId && resp.conversation_id) {
        setCurrentConvId(resp.conversation_id);
        api.getConversations(activePatient.id).then((convs) => setConversations(convs || []));
      }

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

  const handleNewChat = () => {
    setCurrentConvId(null);
    setMessages([
      {
        id: 'new_chat_welcome',
        role: 'assistant',
        content: `New conversation started for **${activePatient?.full_name}**. Ask about any tests, medications, or doctor appointment questions.`,
        created_at: new Date().toISOString(),
        sources: []
      }
    ]);
  };

  const handleReadAloud = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text.replace(/[#*_`]/g, ''));
      utterance.rate = elderlyMode ? 0.85 : 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    if (isRecording) {
      setIsRecording(false);
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = 'en-US';
    rec.onstart = () => setIsRecording(true);
    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);
    rec.onresult = (e: any) => {
      setInput(e.results[0][0].transcript);
      setIsRecording(false);
    };
    rec.start();
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col md:flex-row gap-4 animate-in fade-in duration-200">
      {/* Conversations History Sidebar */}
      {!elderlyMode && (
        <div className="w-full md:w-64 bg-surface rounded-theme border border-border p-3 flex flex-col h-auto md:h-full">
          <button
            onClick={handleNewChat}
            className="w-full py-2 px-3 rounded-theme bg-primary hover:bg-primary-hover text-primary-contrast font-bold flex items-center justify-center space-x-2 text-sm shadow-sm transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Chat</span>
          </button>

          <div className="mt-3 text-xs font-bold text-text-muted uppercase px-1">
            Previous Conversations
          </div>

          <div className="mt-2 flex-1 overflow-y-auto space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-text-muted p-2">No previous chats recorded.</p>
            ) : (
              conversations.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCurrentConvId(c.id)}
                  className={`w-full text-left p-2 rounded-theme text-xs font-semibold flex items-center space-x-2 transition-colors truncate ${
                    c.id === currentConvId
                      ? 'bg-primary/10 text-primary border border-primary/20'
                      : 'hover:bg-surface-2 text-text-muted hover:text-text'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="truncate">{c.title || 'Conversation'}</span>
                </button>
              ))
            )}
          </div>

          {/* Persona Card */}
          {activePatient && (
            <div className="mt-auto p-3 rounded-theme bg-surface-2 border border-border text-xs">
              <div className="font-bold text-text flex items-center space-x-1 mb-1">
                <Info className="w-3.5 h-3.5 text-primary" />
                <span>What Vitalis Knows:</span>
              </div>
              <div className="text-text-muted space-y-0.5">
                <div>Patient: {activePatient.full_name}</div>
                <div>Allergies: {activePatient.allergies || 'None'}</div>
                <div>Conditions: {activePatient.chronic_conditions || 'None'}</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Chat Area */}
      <div className="flex-1 bg-surface rounded-theme border border-border flex flex-col h-full shadow-theme overflow-hidden">
        {/* Chat Top Banner */}
        <div className="p-3 bg-surface-2 border-b border-border flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-primary text-primary-contrast rounded-full">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-text">Vitalis Copilot</div>
              <div className="text-xs text-text-muted">
                Patient: <span className="font-semibold text-text">{activePatient?.full_name}</span> • Scoped RAG Active
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {elderlyMode && (
              <button
                onClick={handleNewChat}
                className="px-3 py-1.5 rounded-theme bg-surface border border-border font-bold text-xs"
              >
                Start New Chat
              </button>
            )}
            <span className="text-xs bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded border border-emerald-300 dark:border-emerald-800">
              Citations Verified
            </span>
          </div>
        </div>

        {/* Messages Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {messages.map((m) => {
            const isUser = m.role === 'user';
            const isEmergency = m.safety_flag === 'emergency' || m.safety_flag === 'emergency_trigger';

            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-theme p-4 text-sm sm:text-base leading-relaxed ${
                    isUser
                      ? 'bg-primary text-primary-contrast'
                      : isEmergency
                      ? 'bg-red-50 dark:bg-red-950/40 text-red-950 dark:text-red-100 border-2 border-red-500'
                      : 'bg-surface-2 text-text border border-border shadow-sm'
                  } ${elderlyMode ? 'text-lg p-5' : ''}`}
                >
                  <div className="whitespace-pre-line">{m.content}</div>

                  {/* Sources Grounding Chip */}
                  {!isUser && m.sources && m.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-border/60 text-xs">
                      <div className="font-semibold text-text-muted mb-1.5 flex items-center space-x-1.5">
                        <FileText className="w-4 h-4 text-primary" />
                        <span>Records Cited:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {m.sources.map((s, idx) => (
                          <button
                            key={idx}
                            onClick={() => onOpenDocument && onOpenDocument(s.document_id)}
                            className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded bg-surface border border-border hover:border-primary text-primary font-medium transition-colors"
                            title={s.excerpt}
                          >
                            <span>{s.doc_name}</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Assistant controls */}
                {!isUser && (
                  <div className="flex items-center space-x-3 mt-1.5 text-xs text-text-muted px-1">
                    <button
                      onClick={() => handleReadAloud(m.content)}
                      className="hover:text-text flex items-center space-x-1"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Read Aloud</span>
                    </button>
                    <button
                      onClick={() => handleCopy(m.id, m.content)}
                      className="hover:text-text flex items-center space-x-1"
                    >
                      {copiedId === m.id ? (
                        <Check className="w-3.5 h-3.5 text-success" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === m.id ? 'Copied' : 'Copy'}</span>
                    </button>
                    {m.model_used && (
                      <span className="opacity-70 font-mono text-[10px]">
                        [{m.model_used}]
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center space-x-3 text-text-muted text-sm p-3">
              <RefreshCw className="w-5 h-5 animate-spin text-primary" />
              <span>Vitalis Copilot is retrieving and checking your medical records...</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-surface-2/60 border-t border-border flex items-center space-x-2 overflow-x-auto text-xs whitespace-nowrap">
          <button
            onClick={() => handleSend('Explain my latest blood test simply')}
            className="px-3 py-1.5 rounded-full bg-surface border border-border hover:border-primary text-text-muted hover:text-primary transition-colors font-medium"
          >
            Explain blood test
          </button>
          <button
            onClick={() => handleSend('Which values are outside the lab range?')}
            className="px-3 py-1.5 rounded-full bg-surface border border-border hover:border-primary text-text-muted hover:text-primary transition-colors font-medium"
          >
            Abnormal values
          </button>
          <button
            onClick={() => handleSend('Explain my medications in Telugu (తెలుగు)')}
            className="px-3 py-1.5 rounded-full bg-surface border border-border hover:border-primary text-text-muted hover:text-primary transition-colors font-medium"
          >
            తెలుగు (Telugu)
          </button>
          <button
            onClick={() => handleSend('Explain my medications in Hindi (हिन्दी)')}
            className="px-3 py-1.5 rounded-full bg-surface border border-border hover:border-primary text-text-muted hover:text-primary transition-colors font-medium"
          >
            हिन्दी (Hindi)
          </button>
          <button
            onClick={() => handleSend('What questions should I ask my doctor about these reports?')}
            className="px-3 py-1.5 rounded-full bg-surface border border-border hover:border-primary text-text-muted hover:text-primary transition-colors font-medium"
          >
            Questions for doctor
          </button>
        </div>

        {/* Chat Input Bar */}
        <div className="p-3 sm:p-4 bg-surface border-t border-border flex items-center space-x-2">
          <button
            onClick={handleVoiceInput}
            className={`p-2.5 rounded-theme transition-colors ${
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
            placeholder={elderlyMode ? 'Type or speak your question here...' : 'Ask about your test results, medicines, or upcoming doctor visit...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            className="flex-1 bg-surface-2 border border-border rounded-theme px-4 py-2.5 text-sm sm:text-base text-text focus:outline-none focus:ring-2 focus:ring-ring"
          />

          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="px-5 py-2.5 rounded-theme bg-primary hover:bg-primary-hover disabled:opacity-40 text-primary-contrast font-bold flex items-center space-x-1.5 shadow-sm transition-all"
            aria-label="Send message"
          >
            <span>Send</span>
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
