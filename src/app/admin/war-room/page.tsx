'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Send, 
  Bot, 
  Crown, 
  Smartphone, 
  Laptop, 
  Sparkles, 
  Radio, 
  Copy, 
  Check, 
  RefreshCw, 
  ArrowLeft, 
  ShieldCheck, 
  Layers, 
  Sliders, 
  Bell, 
  Sun, 
  Moon,
  MessageSquare,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { useAppTheme } from '@/lib/theme';

interface ChatMessage {
  id: string;
  sender: 'PRESIDENT' | 'TECH_LEAD' | 'DEV_MOBILE' | 'DEV_WEB' | 'SYSTEM';
  senderName: string;
  avatarUrl: string;
  color: number;
  content: string;
  tags?: string[];
  timestamp: string;
}

const AGENTS = [
  {
    id: 'PRESIDENT',
    label: '👑 ท่านประธาน (Product Owner)',
    badge: 'President',
    color: 'border-amber-500/50 text-amber-400 bg-amber-500/10',
    avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
  },
  {
    id: 'TECH_LEAD',
    label: '🧠 Tech Lead (Antigravity)',
    badge: 'Tech Lead',
    color: 'border-blue-500/50 text-blue-400 bg-blue-500/10',
    avatar: 'https://cdn-icons-png.flaticon.com/512/4712/4712035.png',
  },
  {
    id: 'DEV_MOBILE',
    label: '📱 DevMobile AI (Mobile PWA)',
    badge: 'Dev Mobile',
    color: 'border-purple-500/50 text-purple-400 bg-purple-500/10',
    avatar: 'https://cdn-icons-png.flaticon.com/512/2586/2586488.png',
  },
  {
    id: 'DEV_WEB',
    label: '💻 DevWeb AI (Web Admin)',
    badge: 'Dev Web',
    color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10',
    avatar: 'https://cdn-icons-png.flaticon.com/512/2040/2040946.png',
  },
];

export default function AgentWarRoomPage() {
  const { isDark, toggleTheme } = useAppTheme();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [selectedSender, setSelectedSender] = useState<'PRESIDENT' | 'TECH_LEAD' | 'DEV_MOBILE' | 'DEV_WEB'>('PRESIDENT');
  const [inputMessage, setInputMessage] = useState('');
  const [targetChannel, setTargetChannel] = useState<'ALL' | 'MOBILE' | 'WEB' | 'LEAD'>('ALL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/agent-chat');
      const json = await res.json();
      if (json.success && json.data) {
        setMessages(json.data);
      }
    } catch (e) {
      console.error('Failed to fetch chat history:', e);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputMessage.trim() || isSubmitting) return;

    const textToSend = inputMessage.trim();
    setInputMessage('');
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/agent-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: selectedSender,
          message: textToSend,
          target: targetChannel,
          tags: ['WarRoom', selectedSender],
        }),
      });
      const data = await res.json();
      if (data.success) {
        fetchMessages();
      }
    } catch (e) {
      console.error('Error sending message:', e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyPrompt = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#0b101b] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Top Header */}
      <header className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between sticky top-0 z-30 backdrop-blur-md ${
        isDark ? 'bg-[#0f172a]/80 border-slate-800' : 'bg-white/80 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'bg-slate-800 border-white/10 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <h1 className="text-base font-bold flex items-center gap-2">
                🤖 AI Agent Group Chat & War Room
              </h1>
            </div>
            <p className="text-xs text-slate-400">ระบบสั่งการและสื่อสาร 4 ฝ่ายเชื่อมต่อ Discord Real-Time</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMessages}
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
            }`}
            title="รีเฟรชข้อความ"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'bg-slate-800 border-white/10 text-yellow-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Left Sidebar: Team Members & Directives */}
        <div className="space-y-4 lg:col-span-1">
          {/* Active Members Card */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#131d31] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" />
              สมาชิกในกรุ๊ปแชท (4 Roles)
            </h2>
            <div className="space-y-2.5">
              {AGENTS.map((agent) => (
                <div
                  key={agent.id}
                  onClick={() => setSelectedSender(agent.id as any)}
                  className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-3 ${
                    selectedSender === agent.id
                      ? `${agent.color} ring-2 ring-blue-500/30 font-semibold`
                      : isDark
                        ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/80 text-slate-300'
                        : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <img src={agent.avatar} alt={agent.badge} className="w-8 h-8 rounded-full" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs truncate font-medium">{agent.label}</p>
                    <span className="text-[10px] text-slate-400">คลิกเพื่อสลับเป็นผู้ส่ง</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick AI Prompts Copy Box */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#131d31] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400" />
              คัดลอกคำสั่งไปสั่ง AI ในแชท
            </h2>

            <div className="space-y-2">
              <button
                onClick={() => handleCopyPrompt('mobile', `คุณคือ DevMobile AI ของร้านสีแสงยางยนต์\nรหัสพนักงานจริงใน Supabase คือ: 01 (PIN 11), 02 (PIN 02), SI01 (PIN 5101)\nพิกัดร้านคือ: 15.110481, 104.358552 (50m)\nช่วยตรวจสอบการทำงานหน้า employee ตามคำสั่งของ Tech Lead ทันที`)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  copiedKey === 'mobile'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : isDark ? 'bg-slate-800/50 border-white/5 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>📱 คัดลอก Prompt สั่ง DevMobile</span>
                {copiedKey === 'mobile' ? <Check className="w-3.5 h-3.5 text-purple-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              <button
                onClick={() => handleCopyPrompt('web', `คุณคือ DevWeb AI ของร้านสีแสงยางยนต์\nระบบ Web Admin ซิงค์ตารางจริง employees และ store_settings เรียบร้อยแล้ว\nช่วยตรวจเช็คหน้า admin และ executive ตามคำสั่งของ Tech Lead ทันที`)}
                className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                  copiedKey === 'web'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : isDark ? 'bg-slate-800/50 border-white/5 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>💻 คัดลอก Prompt สั่ง DevWeb</span>
                {copiedKey === 'web' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Chat Stream & Input */}
        <div className={`lg:col-span-3 flex flex-col rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#131d31] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          {/* Chat Feed Header */}
          <div className={`px-4 py-3 border-b flex items-center justify-between ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold">ห้องสนทนากลาง (Synced with Discord Webhooks)</span>
            </div>
            <span className="text-[11px] text-slate-400">{messages.length} ข้อความ</span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[500px] min-h-[400px] space-y-4">
            {messages.map((msg) => {
              const isPresident = msg.sender === 'PRESIDENT';
              const isLead = msg.sender === 'TECH_LEAD';
              const isMobile = msg.sender === 'DEV_MOBILE';
              const isWeb = msg.sender === 'DEV_WEB';

              const badgeColor = isPresident
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                : isLead
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : isMobile
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                    : isWeb
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : 'bg-slate-700/50 text-slate-300 border-slate-600';

              return (
                <div key={msg.id} className="flex items-start gap-3 group">
                  <img src={msg.avatarUrl} alt={msg.senderName} className="w-9 h-9 rounded-full mt-0.5 shadow-sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold">{msg.senderName}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-mono ${badgeColor}`}>
                        {msg.sender}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(msg.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words whitespace-pre-wrap ${
                      isDark ? 'bg-slate-800/60 text-slate-200 border border-white/5' : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                      {msg.content}
                    </div>

                    {msg.tags && msg.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {msg.tags.map((t, idx) => (
                          <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-400 font-mono">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input Box */}
          <div className={`p-3 sm:p-4 border-t ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">ส่งข้อความในนาม:</span>
                <span className="font-bold text-blue-400">
                  {AGENTS.find(a => a.id === selectedSender)?.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400">เป้าหมาย Discord:</span>
                <select
                  value={targetChannel}
                  onChange={(e) => setTargetChannel(e.target.value as any)}
                  className={`px-2 py-1 rounded-lg border text-xs ${
                    isDark ? 'bg-slate-800 border-white/10 text-slate-200' : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  <option value="ALL">📢 ทุกห้อง (Broadcast All)</option>
                  <option value="MOBILE">📱 ช่อง #dev-mobile</option>
                  <option value="WEB">💻 ช่อง #dev-web</option>
                  <option value="LEAD">🧠 ช่อง #lead-architect</option>
                </select>
              </div>
            </div>

            <form onSubmit={handleSendMessage} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder={`พิมพ์ข้อความสั่งการ หรือรายงานความคืบหน้า... (กด Enter เพื่อส่งเข้า Discord)`}
                className={`flex-1 px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  isDark ? 'bg-slate-800 border-white/10 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSubmitting}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-blue-500/20"
              >
                <Send className="w-3.5 h-3.5" />
                <span>ส่ง</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
