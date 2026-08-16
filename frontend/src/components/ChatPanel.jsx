// PLACE AT: src/components/ChatPanel.jsx  (NEW FILE)

import React, { useEffect, useRef, useState } from "react";
import { X, Send } from "lucide-react";
import { getAppointmentMessages, sendAppointmentMessage } from "../api/auth";

// currentRole: "student" | "teacher" — used to decide which side to align bubbles on
const ChatPanel = ({ appointmentId, currentRole, otherPartyLabel, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  const loadMessages = async () => {
    try {
      const res = await getAppointmentMessages(appointmentId);
      setMessages(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  // POLLING: fetch messages immediately, then again every 3 seconds, for as long
  // as this component is on screen. The cleanup function (the "return" below)
  // is what stops the timer when the panel closes — without it, every time you
  // opened/closed the chat you'd add ANOTHER timer running in the background,
  // eventually firing dozens of requests per second. React runs the cleanup
  // automatically whenever the component unmounts.
  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, [appointmentId]);

  // Auto-scroll to the newest message whenever the list changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      await sendAppointmentMessage(appointmentId, text.trim());
      setText("");
      loadMessages();
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-[#0E1B1E]/40 z-40" onClick={onClose} />

      <div className="fixed top-0 right-0 h-full w-full sm:w-96 bg-[#F9FFFD] z-50 shadow-2xl flex flex-col">
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#0E1B1E]/10">
          <div>
            <span className="font-mono text-xs tracking-widest text-[#0E1B1E]/50">CHAT</span>
            {otherPartyLabel && <p className="font-body text-sm mt-0.5">{otherPartyLabel}</p>}
          </div>
          <button onClick={onClose} className="text-[#0E1B1E]/50 hover:text-[#0E1B1E]">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {messages.length === 0 && (
            <p className="font-body text-sm text-[#0E1B1E]/40">No messages yet — say hello.</p>
          )}
          {messages.map((m) => {
            const isMine = m.sender_role === currentRole;
            return (
              <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] px-4 py-2.5 font-body text-sm ${
                    isMine ? "bg-[#0E1B1E] text-white" : "bg-[#0E1B1E]/5 text-[#0E1B1E]"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="p-4 border-t border-[#0E1B1E]/10 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 font-body text-sm px-3 py-2.5 border border-[#0E1B1E]/20 bg-transparent focus:border-[#0E1B1E] focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-[#0E1B1E] text-white px-4 py-2.5 hover:bg-[#0E1B1E]/85 disabled:opacity-60"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </>
  );
};

export default ChatPanel;