import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  MessageSquare, 
  X, 
  Send, 
  Loader2, 
  Sparkles, 
  ShoppingCart, 
  ArrowUpRight, 
  Clock, 
  Compass, 
  Gift, 
  ShieldCheck 
} from "lucide-react";
import { cn } from "../lib/utils";

interface Watch {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
}

interface Message {
  role: "user" | "model";
  text: string;
  recommended_watch_ids?: string[];
  suggested_questions?: string[];
  timestamp: Date;
}

interface WatchAssistantProps {
  watches: Watch[];
  onAddToCart: (watch: Watch) => void;
  onViewDetails: (watch: Watch) => void;
}

const WatchAssistant = ({ watches, onAddToCart, onViewDetails }: WatchAssistantProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "model",
      text: "Welcome to **Pingaksh**.\n\nI am your AI watch assistant, here to help you find the right tribute timepiece. We design elegant, luxury-inspired statement timepieces inspired by timeless styles, offering a refined appearance at an accessible price.\n\nWhat style of watch are you looking for today?",
      suggested_questions: [
        "Show me Iconic Homages",
        "A watch under $200",
        "Classic Gift suggestions",
      ],
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMessage: Message = {
      role: "user",
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      // Gather dynamic client history for Gemini model context
      const chatHistory = messages.map(msg => ({
        role: msg.role,
        text: msg.text
      }));

      const response = await fetch("/api/recommend-watch", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          prompt: textToSend,
          history: chatHistory
        })
      });

      if (!response.ok) {
        throw new Error("Handshake with horology server failed.");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        role: "model",
        text: data.message || "I have cataloged your desire, and recommend appreciating our classic Aurelius Gold.",
        recommended_watch_ids: data.recommended_watch_ids || [],
        suggested_questions: data.suggested_questions || [],
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("AI assistant error:", error);
      const errorMessage: Message = {
        role: "model",
        text: "The connection is taking longer than expected. While we reconnect, I can recommend exploring the classic **Aurelius Gold** or the clean **Nordic Silver** for simple excellence.",
        recommended_watch_ids: ["1", "3"],
        suggested_questions: ["Tell me about Aurelius Gold", "What is the budget option?"],
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to parse message text and render bolding elegantly with serif design
  const parseMessageText = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      if (!line.trim()) {
        return <div key={`empty-${lineIdx}`} className="h-2" />;
      }

      // Match **bold** patterns
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={lineIdx} className="mb-1 last:mb-0 leading-relaxed text-[13px] tracking-normal font-sans text-neutral-300">
          {parts.map((part, partIdx) => {
            if (partIdx % 2 === 1) {
              return (
                <strong key={partIdx} className="text-gold font-semibold font-serif uppercase tracking-[0.05em]">
                  {part}
                </strong>
              );
            }
            return part;
          })}
        </p>
      );
    });
  };

  // Quick preset queries to recommend watches
  const presetPrompts = [
    { label: "Iconic Look", icon: Sparkles, query: "Recommend a luxury-inspired statement timepiece from Pingaksh." },
    { label: "Sport Homage", icon: Clock, query: "I need a durable classic sports watch homage." },
    { label: "Gift Ideas", icon: Gift, query: "I want to purchase a stylish, premium-style watch as a gift." },
    { label: "Minimalist", icon: Compass, query: "Show me comfortable, elegant minimalist watch models." }
  ];

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        id="watch-ai-assistant-btn"
        className={cn(
          "fixed bottom-6 right-6 z-40 flex items-center justify-center h-14 w-14 rounded-full shadow-2xl transition-all duration-300",
          "bg-gradient-to-tr from-neutral-900 to-black border border-gold/40 text-gold",
          "hover:scale-110 hover:border-gold active:scale-95 group focus:outline-none focus:ring-2 focus:ring-gold/50 cursor-pointer"
        )}
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="sr-only">AI Watch Assistant</span>
        <div className="relative">
          {isOpen ? (
            <X size={22} className="transition-transform duration-300 rotate-90" />
          ) : (
            <div className="flex items-center justify-center">
              <MessageSquare size={22} className="text-gold group-hover:rotate-6 transition-transform" />
              <div className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold/80 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
              </div>
            </div>
          )}
        </div>
      </motion.button>

      {/* Main Assistant Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="watch-assistant-sidebar"
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={cn(
              "fixed bottom-24 right-6 z-40 w-[380px] max-w-[calc(100vw-32px)] h-[580px] rounded-3xl overflow-hidden shadow-2xl flex flex-col",
              "bg-neutral-950 border border-neutral-900",
              "selection:bg-gold selection:text-black font-sans text-neutral-200"
            )}
          >
            {/* Elegant Premium Header */}
            <div className="bg-gradient-to-r from-neutral-950 via-[#0d0d0d] to-neutral-950 border-b border-neutral-900/80 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex h-3 w-3">
                  <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-gold/50 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-gold"></span>
                </div>
                <div>
                  <h3 className="text-sm font-serif font-black uppercase tracking-[0.2em] text-white">Watch Assistant</h3>
                  <p className="text-[10px] text-neutral-500 font-mono tracking-wider">PINGAKSH STUDIO AI</p>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors p-1 rounded-full hover:bg-neutral-900/50"
              >
                <X size={16} />
              </button>
            </div>

            {/* Quick action preset chips */}
            <div className="px-4 py-2 bg-neutral-950 border-b border-neutral-900/40 flex items-center gap-1.5 overflow-x-auto scrollbar-none scroll-smooth">
              {presetPrompts.map((p, idx) => {
                const IconComp = p.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSend(p.query)}
                    className="flex items-center gap-1 px-3 py-1 bg-neutral-900/60 hover:bg-gold/10 hover:border-gold/30 border border-neutral-900 rounded-full text-[10px] text-neutral-300 font-mono uppercase tracking-wider transition-all cursor-pointer shrink-0"
                  >
                    <IconComp size={10} className="text-gold" />
                    <span>{p.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[radial-gradient(circle_at_bottom,#111_0%,#000_80%)] scrollbar-thin scrollbar-thumb-neutral-900">
              {messages.map((msg, i) => (
                <div key={i} className={cn("flex flex-col max-w-[85%] space-y-1.5", msg.role === "user" ? "ml-auto items-end" : "mr-auto items-start")}>
                  {/* Speaker Label */}
                  <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase px-1">
                    {msg.role === "user" ? "CLIENT" : "PINGAKSH AI"}
                  </span>
                  
                  {/* Message Bubble */}
                  <div className={cn(
                    "rounded-2xl p-4 text-xs shadow-md transition-all duration-300",
                    msg.role === "user" 
                      ? "bg-gold text-neutral-950 font-medium rounded-tr-none" 
                      : "bg-[#0c0c0c] text-neutral-200 border border-neutral-900 rounded-tl-none font-light"
                  )}>
                    {msg.role === "user" ? (
                      <p className="leading-relaxed text-sm select-text whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      <div className="space-y-1.5 select-text">
                        {parseMessageText(msg.text)}
                      </div>
                    )}
                  </div>

                  {/* Render interactive recommended watch cards if attached */}
                  {msg.role === "model" && msg.recommended_watch_ids && msg.recommended_watch_ids.length > 0 && (
                    <div className="w-full pt-2 max-w-full overflow-x-auto flex gap-3 scroll-smooth py-1 scrollbar-none">
                      {msg.recommended_watch_ids.map(id => {
                        const targetWatch = watches.find(w => w.id === id);
                        if (!targetWatch) return null;
                        return (
                          <motion.div
                            key={id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="w-[185px] bg-neutral-950 border border-neutral-900 rounded-xl p-2.5 shrink-0 hover:border-gold/40 transition-colors"
                          >
                            <img 
                              src={targetWatch.image} 
                              alt={targetWatch.name} 
                              className="w-full h-18 object-cover rounded-md grayscale hover:grayscale-0 transition-all duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <div className="mt-2">
                              <span className="text-[9px] text-gold font-mono tracking-wider uppercase">{targetWatch.category}</span>
                              <h4 className="text-[11px] font-serif font-black text-white truncate max-w-full">{targetWatch.name}</h4>
                              <p className="text-[11px] text-neutral-400 font-mono mt-0.5">${targetWatch.price}</p>
                            </div>
                            <div className="grid grid-cols-2 gap-1.5 mt-2.5">
                              <button
                                onClick={() => onAddToCart(targetWatch)}
                                className="flex items-center justify-center gap-1 bg-gold text-black text-[9px] font-bold py-1 px-1.5 rounded hover:bg-white transition-colors cursor-pointer"
                              >
                                <ShoppingCart size={9} />
                                <span>Cart</span>
                              </button>
                              <button
                                onClick={() => onViewDetails(targetWatch)}
                                className="flex items-center justify-center gap-1 bg-neutral-900 border border-neutral-800 text-neutral-200 text-[9px] font-semibold py-1 px-1.5 rounded hover:border-gold hover:text-white transition-colors cursor-pointer"
                              >
                                <span>Details</span>
                                <ArrowUpRight size={9} className="text-gold" />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}

                  {/* Render model proposed interactive sub-questions */}
                  {msg.role === "model" && msg.suggested_questions && msg.suggested_questions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {msg.suggested_questions.map((q, qIndex) => (
                        <button
                          key={qIndex}
                          onClick={() => handleSend(q)}
                          className="text-[10px] bg-neutral-900 text-neutral-400 hover:text-white hover:border-gold/40 border border-neutral-900/80 px-2.5 py-1 rounded-full transition-all cursor-pointer font-mono"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Shimmering Concierge is typing Loader */}
              {isLoading && (
                <div className="flex flex-col max-w-[80%] space-y-1 mr-auto items-start">
                  <span className="text-[9px] font-mono tracking-widest text-neutral-500 uppercase px-1">
                    PINGAKSH AI TYPING
                  </span>
                  <div className="bg-[#0c0c0c] border border-neutral-900 rounded-2xl rounded-tl-none p-3.5 flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin text-gold" />
                    <span className="text-[11px] text-neutral-400 font-light font-mono italic">Selecting watch recommendations...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form Footer */}
            <div className="bg-[#070707] border-t border-neutral-900 p-4">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend(inputValue);
                }}
                className="flex items-center gap-2 bg-neutral-900 border border-neutral-850 rounded-2xl px-3.5 py-2.5"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Describe your perfect timepiece..."
                  disabled={isLoading}
                  className="flex-1 bg-transparent border-0 font-light text-xs text-neutral-200 outline-none focus:ring-0 placeholder:text-neutral-600 disabled:opacity-50"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isLoading}
                  className={cn(
                    "flex items-center justify-center h-8 w-8 rounded-xl bg-gold text-black transition-all cursor-pointer",
                    "hover:bg-white active:scale-95 disabled:bg-neutral-800 disabled:text-neutral-600 disabled:cursor-not-allowed"
                  )}
                >
                  <Send size={12} />
                </button>
              </form>
              <div className="flex items-center justify-center gap-1 mt-2.5 text-[9px] text-neutral-600 font-mono">
                <ShieldCheck size={10} className="text-gold/60" />
                <span>Powered by Google Gemini. Premium watch recommendations.</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default WatchAssistant;
