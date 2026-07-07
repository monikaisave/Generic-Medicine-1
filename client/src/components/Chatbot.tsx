import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User, Volume2, VolumeX, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

const Chatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'bot', text: 'Namaste! I am GenMed AI, your generic medicine and general health AI assistant. I can answer any questions you have on medicines, health schemes, or any other topic. Ask me anything!', timestamp: new Date() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [speakEnabled, setSpeakEnabled] = useState(false);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const quickReplies = [
    "What is a generic medicine?",
    "Jan Aushadhi Scheme benefits?",
    "Generic alternative for Augmentin?",
    "Are generic medicines safe?"
  ];

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const speakText = (text: string) => {
    if (!speakEnabled) return;
    try {
      window.speechSynthesis.cancel();
      // Remove markdowns or bullet points to speak cleanly
      const cleanText = text.replace(/[*#`_-]/g, '').trim();
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Speech synthesis error:", e);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await res.json();
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: data.response || "I couldn't fetch an answer right now. Please try again.",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMsg]);
      speakText(botMsg.text);
    } catch (err) {
      console.error("Chat error:", err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'bot',
        text: "I am having trouble connecting to my servers. Please make sure the backend server is running on port 5000.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 999 }}>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0d9488, #10b981)',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 30px rgba(13, 148, 136, 0.4)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            animation: 'floatBubble 3s ease-in-out infinite'
          }}
          title="GenMed AI Assistant"
        >
          <MessageSquare size={26} />
          <span style={{
            position: 'absolute',
            top: '0', right: '0',
            width: '14px', height: '14px',
            borderRadius: '50%',
            backgroundColor: '#ef4444',
            border: '2px solid #090d16'
          }} />
        </button>
      )}

      {/* Chat Window Dialog */}
      {isOpen && (
        <div className="card" style={{
          width: '380px',
          height: '520px',
          background: '#0f172a',
          border: '1px solid rgba(13, 148, 136, 0.3)',
          borderRadius: '20px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            background: 'linear-gradient(to right, #0f172a, #134e4a)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px', height: '36px',
                borderRadius: '50%',
                backgroundColor: 'rgba(45, 212, 191, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '1px solid rgba(45, 212, 191, 0.3)'
              }}>
                <Bot size={20} color="#2dd4bf" />
              </div>
              <div>
                <h4 style={{ fontSize: '0.95rem', margin: 0, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  GenMed Assistant
                  <Sparkles size={12} color="#eab308" />
                </h4>
                <span style={{ fontSize: '0.75rem', color: '#2dd4bf', fontWeight: 500 }}>Online & Ready</span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {/* Voice output toggle */}
              <button
                onClick={() => {
                  setSpeakEnabled(!speakEnabled);
                  if (speakEnabled) window.speechSynthesis.cancel();
                }}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: speakEnabled ? '#2dd4bf' : '#94a3b8',
                  padding: '4px'
                }}
                title={speakEnabled ? "Mute Voice Out" : "Unmute Voice Out"}
              >
                {speakEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.speechSynthesis.cancel();
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div style={{
            flexGrow: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            background: 'radial-gradient(circle at top right, rgba(13, 148, 136, 0.05), transparent)'
          }}>
            {messages.map((msg) => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px',
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%'
                }}
              >
                {msg.sender === 'bot' && (
                  <div style={{
                    width: '24px', height: '24px', borderRadius: '50%', background: '#0d9488',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3px', marginTop: '4px'
                  }}>
                    <Bot size={14} color="white" />
                  </div>
                )}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: '14px',
                  borderTopLeftRadius: msg.sender === 'bot' ? '4px' : '14px',
                  borderTopRightRadius: msg.sender === 'user' ? '4px' : '14px',
                  background: msg.sender === 'user' ? '#0d9488' : 'rgba(255, 255, 255, 0.05)',
                  border: msg.sender === 'user' ? 'none' : '1px solid rgba(255,255,255,0.06)',
                  color: msg.sender === 'user' ? 'white' : '#cbd5e1',
                  fontSize: '0.88rem',
                  lineHeight: '1.4',
                  whiteSpace: 'pre-line'
                }}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', alignSelf: 'flex-start' }}>
                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#0d9488', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bot size={14} color="white" />
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '14px', background: 'rgba(255, 255, 255, 0.05)', color: '#94a3b8', fontSize: '0.85rem' }}>
                  AI is analyzing...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Quick Replies list */}
          {messages.length === 1 && (
            <div style={{ padding: '0 16px 12px 16px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>SUGGESTED QUESTIONS:</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {quickReplies.map(reply => (
                  <button
                    key={reply}
                    disabled={isLoading}
                    onClick={() => handleSend(reply)}
                    style={{
                      padding: '6px 10px',
                      fontSize: '0.78rem',
                      borderRadius: '8px',
                      background: 'rgba(13, 148, 136, 0.08)',
                      border: '1px solid rgba(13, 148, 136, 0.2)',
                      color: isLoading ? '#64748b' : '#2dd4bf',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      transition: 'all 0.2s',
                      opacity: isLoading ? 0.6 : 1
                    }}
                    onMouseOver={(e) => { if (!isLoading) e.currentTarget.style.background = 'rgba(13, 148, 136, 0.18)'; }}
                    onMouseOut={(e) => { if (!isLoading) e.currentTarget.style.background = 'rgba(13, 148, 136, 0.08)'; }}
                  >
                    {reply}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Footer */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(0, 0, 0, 0.2)',
            display: 'flex',
            gap: '8px'
          }}>
            <input
              type="text"
              value={input}
              disabled={isLoading}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !isLoading) handleSend(input); }}
              placeholder={isLoading ? "AI is typing..." : "Ask me anything..."}
              style={{
                flexGrow: 1,
                padding: '10px 14px',
                borderRadius: '10px',
                background: isLoading ? '#0f172a' : '#121b2d',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: isLoading ? '#64748b' : 'white',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: isLoading ? 'not-allowed' : 'text'
              }}
            />
            <button
              disabled={isLoading || !input.trim()}
              onClick={() => handleSend(input)}
              style={{
                width: '42px', height: '42px', borderRadius: '10px',
                background: (isLoading || !input.trim()) ? '#1e293b' : '#0d9488',
                border: 'none',
                color: (isLoading || !input.trim()) ? '#64748b' : 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (isLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                opacity: (isLoading || !input.trim()) ? 0.6 : 1
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes floatBubble {
          0% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0); }
        }
        @keyframes chatSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Chatbot;
