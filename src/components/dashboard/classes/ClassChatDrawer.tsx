'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Send, MessageSquare, Loader2 } from 'lucide-react';

export interface ChatMessage {
  id: string;
  class_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  sender?: {
    id: string;
    nickname?: string;
    avatar_url?: string;
    role?: string;
  };
}

interface ClassChatDrawerProps {
  classId: string;
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
}

export function ClassChatDrawer({
  classId,
  isOpen,
  onClose,
  currentUserId,
}: ClassChatDrawerProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/classes/${classId}/messages?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err: unknown) {
      console.error('Error fetching chat messages:', err);
    }
  }, [classId]);

  // Initial load when opened
  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      fetchMessages().finally(() => setLoading(false));
    }
  }, [isOpen, fetchMessages]);

  // 15-second polling while drawer is open
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      fetchMessages();
    }, 15000);
    return () => clearInterval(interval);
  }, [isOpen, fetchMessages]);

  // Auto-scroll to bottom on message change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    const messageText = inputText.trim();
    setInputText('');

    try {
      setIsSending(true);
      const res = await fetch(`/api/classes/${classId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: messageText }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      } else {
        const err = await res.json();
        alert(err.error || 'Không thể gửi tin nhắn');
        setInputText(messageText);
      }
    } catch {
      alert('Đã xảy ra lỗi khi gửi tin nhắn');
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const formatMessageTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-white border-l border-slate-200 shadow-lg flex flex-col">
      {/* Drawer Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-sky-600" strokeWidth={1.75} />
          <div>
            <h3 className="text-xs font-bold text-slate-900">Tin Nhắn Nhóm</h3>
            <p className="text-[11px] text-slate-500">Trao đổi nhanh giữa các thành viên</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
        {loading ? (
          <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin text-sky-600" strokeWidth={1.75} />
            <span>Đang nạp tin nhắn...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <p>Chưa có tin nhắn nào trong nhóm.</p>
            <p className="text-[11px] mt-1">Hãy gửi tin nhắn đầu tiên!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUserId;
            const senderName = msg.sender?.nickname || 'Thành viên';

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {!isMe && (
                  <span className="text-[10px] font-bold text-slate-600 mb-0.5 ml-1">
                    {senderName}
                  </span>
                )}
                <div
                  className={`max-w-[85%] rounded-md px-3 py-2 leading-relaxed ${
                    isMe
                      ? 'bg-sky-600 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <p className="break-words">{msg.content}</p>
                </div>
                <span className="text-[9px] text-slate-400 font-mono mt-0.5 px-1">
                  {formatMessageTime(msg.created_at)}
                </span>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input Footer */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-200 bg-white">
        <div className="flex items-center gap-2">
          <input
            type="text"
            required
            placeholder="Nhập tin nhắn..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-none focus:ring-1 focus:ring-sky-500 font-sans"
          />
          <button
            type="submit"
            disabled={isSending || !inputText.trim()}
            className="p-2 rounded-md bg-sky-600 hover:bg-sky-700 text-white transition-colors disabled:opacity-50 cursor-pointer shrink-0"
            title="Gửi tin nhắn"
          >
            <Send className="w-3.5 h-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </form>
    </div>
  );
}
