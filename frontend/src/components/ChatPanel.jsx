import React, { useEffect, useRef, useState, useCallback } from "react";
import { X, Send, Radio, Circle } from "lucide-react";
import { getAppointmentMessages, sendAppointmentMessage } from "../api/auth";
import { getWsUrl } from "../api/client";
import { getToken } from "../api/session";

// currentRole: "student" | "teacher" — used to decide which side to align bubbles on
const ChatPanel = ({ appointmentId, currentRole, otherPartyLabel, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isOtherPartyOnline, setIsOtherPartyOnline] = useState(false);
  const [isOtherPartyTyping, setIsOtherPartyTyping] = useState(false);

  const bottomRef = useRef(null);
  const wsRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const otherRole = currentRole === "student" ? "teacher" : "student";

  // 1. Initial HTTP fetch of history
  const loadMessages = async () => {
    try {
      const res = await getAppointmentMessages(appointmentId);
      setMessages(res.data);
    } catch (err) {
      console.error("Failed to load message history:", err);
    }
  };

  // 2. Setup WebSocket connection
  useEffect(() => {
    loadMessages();

    const token = getToken();
    if (!token) return;

    const wsUrl = getWsUrl(`/api/appointments/${appointmentId}/ws?token=${encodeURIComponent(token)}`);
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "init") {
          const roles = data.online_roles || [];
          setIsOtherPartyOnline(roles.includes(otherRole));
        } else if (data.type === "presence") {
          const roles = data.online_roles || [];
          setIsOtherPartyOnline(roles.includes(otherRole));
        } else if (data.type === "chat") {
          if (data.message) {
            setMessages((prev) => {
              // Avoid duplicate messages if already present
              if (prev.some((m) => m.id === data.message.id)) {
                return prev;
              }
              return [...prev, data.message];
            });
            setIsOtherPartyTyping(false);
          }
        } else if (data.type === "typing") {
          if (data.sender_role === otherRole) {
            setIsOtherPartyTyping(Boolean(data.is_typing));
          }
        }
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    ws.onerror = (err) => {
      console.warn("WebSocket encountered an error:", err);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setIsOtherPartyOnline(false);
      setIsOtherPartyTyping(false);
    };

    // Fallback: poll every 6s in case WebSocket is blocked in certain proxy environments
    const fallbackPoll = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        loadMessages();
      }
    }, 6000);

    return () => {
      clearInterval(fallbackPoll);
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
      wsRef.current = null;
    };
  }, [appointmentId, otherRole]);

  // Auto-scroll on new message or typing change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOtherPartyTyping]);

  // 3. Typing indicator dispatch
  const handleInputChange = (e) => {
    setText(e.target.value);

    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        wsRef.current.send(JSON.stringify({ type: "typing", is_typing: true }));
      }

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: "typing", is_typing: false }));
        }
      }, 1500);
    }
  };

  // 4. Send message (WebSocket primary, HTTP fallback)
  const handleSend = async (e) => {
    e.preventDefault();
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);

    // Stop typing notification immediately
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    if (isTypingRef.current && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      isTypingRef.current = false;
      wsRef.current.send(JSON.stringify({ type: "typing", is_typing: false }));
    }

    try {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "chat", content }));
        setText("");
      } else {
        // Fallback to REST API
        const res = await sendAppointmentMessage(appointmentId, content);
        setText("");
        setMessages((prev) => [...prev, res.data]);
      }
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "";
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#0E1B1E]/40 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#F9FFFD] z-50 shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#0E1B1E]/10">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tracking-widest text-[#0E1B1E]/50">APPOINTMENT CHAT</span>
              {isConnected && (
                <span className="flex items-center gap-1 font-mono text-[9px] tracking-wider text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE
                </span>
              )}
            </div>
            {otherPartyLabel && <p className="font-display uppercase text-sm mt-0.5">{otherPartyLabel}</p>}
            <div className="flex items-center gap-1.5 mt-0.5">
              <Circle
                className={`w-2 h-2 ${
                  isOtherPartyOnline ? "fill-emerald-500 text-emerald-500" : "fill-gray-300 text-gray-300"
                }`}
              />
              <span className="font-mono text-[10px] text-[#0E1B1E]/60 tracking-wider">
                {isOtherPartyOnline ? "IN CHAT NOW" : "AWAY"}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-[#0E1B1E]/50 hover:text-[#0E1B1E] p-1 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* MESSAGE LIST */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages.length === 0 && (
            <div className="text-center py-8">
              <p className="font-mono text-xs tracking-widest text-[#0E1B1E]/40">NO MESSAGES YET</p>
              <p className="font-body text-xs text-[#0E1B1E]/50 mt-1">Send a message to start real-time chat.</p>
            </div>
          )}
          {messages.map((m) => {
            const isMine = m.sender_role === currentRole;
            return (
              <div key={m.id} className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[80%] px-4 py-2.5 font-body text-sm ${
                    isMine ? "bg-[#0E1B1E] text-white" : "bg-[#0E1B1E]/5 text-[#0E1B1E] border border-[#0E1B1E]/10"
                  }`}
                >
                  <p className="break-words whitespace-pre-wrap">{m.content}</p>
                  {m.created_at && (
                    <span
                      className={`block font-mono text-[9px] mt-1 text-right ${
                        isMine ? "text-white/60" : "text-[#0E1B1E]/40"
                      }`}
                    >
                      {formatTime(m.created_at)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* LIVE TYPING INDICATOR */}
          {isOtherPartyTyping && (
            <div className="flex items-center gap-2 text-[#0E1B1E]/60 py-1">
              <div className="flex gap-1 items-center px-3 py-2 bg-[#0E1B1E]/5 border border-[#0E1B1E]/10 rounded-full">
                <span className="w-1.5 h-1.5 bg-[#0E1B1E]/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-[#0E1B1E]/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-[#0E1B1E]/40 rounded-full animate-bounce" />
              </div>
              <span className="font-mono text-[10px] tracking-wider text-[#0E1B1E]/50">
                {currentRole === "student" ? "Faculty is typing..." : "Student is typing..."}
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* INPUT FORM */}
        <form onSubmit={handleSend} className="p-4 border-t border-[#0E1B1E]/10 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={handleInputChange}
            placeholder="Type a message..."
            className="flex-1 font-body text-sm px-3 py-2.5 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !text.trim()}
            className="bg-[#0E1B1E] text-white px-4 py-2.5 hover:bg-[#0E1B1E]/85 disabled:opacity-40 transition-colors flex items-center justify-center"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatPanel;
