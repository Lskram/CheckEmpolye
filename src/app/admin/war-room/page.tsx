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
  Zap,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { useAppTheme } from '@/lib/theme';

interface ChatMessage {
  id: string;
  sender: 'PRESIDENT' | 'TECH_LEAD' | 'DEV_MOBILE' | 'DEV_WEB' | 'SYSTEM';
  senderName: string;
  avatarUrl?: string;
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
    icon: Crown,
    bgGradient: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400',
    iconColor: 'text-amber-400',
    avatarBg: 'bg-gradient-to-br from-amber-500 to-amber-700 text-white',
  },
  {
    id: 'TECH_LEAD',
    label: '🧠 Tech Lead (Antigravity)',
    badge: 'Tech Lead',
    icon: Bot,
    bgGradient: 'from-blue-500/20 to-indigo-500/20 border-blue-500/40 text-blue-400',
    iconColor: 'text-blue-400',
    avatarBg: 'bg-gradient-to-br from-blue-600 to-indigo-700 text-white',
  },
  {
    id: 'DEV_MOBILE',
    label: '📱 DevMobile AI (Mobile PWA)',
    badge: 'Dev Mobile',
    icon: Smartphone,
    bgGradient: 'from-purple-500/20 to-pink-500/20 border-purple-500/40 text-purple-400',
    iconColor: 'text-purple-400',
    avatarBg: 'bg-gradient-to-br from-purple-600 to-pink-700 text-white',
  },
  {
    id: 'DEV_WEB',
    label: '💻 DevWeb AI (Web Admin)',
    badge: 'Dev Web',
    icon: Laptop,
    bgGradient: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/40 text-emerald-400',
    iconColor: 'text-emerald-400',
    avatarBg: 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white',
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
  const [toastMsg, setToastMsg] = useState<string | null>(null);
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
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isSubmitting) return;

    if (!customText) setInputMessage('');
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
        setToastMsg('ส่งข้อความเข้า Discord สำเร็จ!');
        setTimeout(() => setToastMsg(null), 3000);
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

  const renderSenderIcon = (sender: string) => {
    switch (sender) {
      case 'PRESIDENT':
        return <Crown style={{ width: 16, height: 16 }} className="text-amber-300" />;
      case 'TECH_LEAD':
        return <Bot style={{ width: 16, height: 16 }} className="text-blue-300" />;
      case 'DEV_MOBILE':
        return <Smartphone style={{ width: 16, height: 16 }} className="text-purple-300" />;
      case 'DEV_WEB':
        return <Laptop style={{ width: 16, height: 16 }} className="text-emerald-300" />;
      default:
        return <Zap style={{ width: 16, height: 16 }} className="text-slate-300" />;
    }
  };

  const renderSenderBadge = (sender: string) => {
    switch (sender) {
      case 'PRESIDENT':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            👑 ท่านประธาน (Owner)
          </span>
        );
      case 'TECH_LEAD':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            🧠 Tech Lead (Architect)
          </span>
        );
      case 'DEV_MOBILE':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
            📱 DevMobile (PWA/App)
          </span>
        );
      case 'DEV_WEB':
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            💻 DevWeb (Admin)
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/20 text-slate-300 border border-slate-500/30">
            ⚡ System
          </span>
        );
    }
  };

  return (
    <div className={`min-h-screen flex flex-col font-sans transition-colors duration-200 ${
      isDark ? 'bg-[#080d19] text-slate-100' : 'bg-slate-50 text-slate-800'
    }`}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 style={{ width: 16, height: 16 }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <header className={`px-4 sm:px-6 py-3 border-b flex items-center justify-between sticky top-0 z-30 backdrop-blur-md ${
        isDark ? 'bg-[#0c1322]/90 border-slate-800/80' : 'bg-white/90 border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3">
          <Link
            href="/admin"
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'bg-slate-800/80 border-white/10 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 hover:bg-slate-200 text-slate-600'
            }`}
            title="กลับหน้า Admin Dashboard"
          >
            <ArrowLeft style={{ width: 16, height: 16 }} />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h1 className="text-base font-bold flex items-center gap-2">
                🤖 AI Agent War Room & Group Chat
              </h1>
            </div>
            <p className="text-xs text-slate-400">ศูนย์กลางสั่งการและสื่อสาร 4 ฝ่ายเชื่อมต่อ Discord Real-Time</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchMessages}
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'bg-slate-800 border-white/10 text-slate-300 hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-600 shadow-sm'
            }`}
            title="รีเฟรชข้อความล่าสุด"
          >
            <RefreshCw style={{ width: 16, height: 16 }} />
          </button>
          <button
            onClick={toggleTheme}
            className={`p-2 rounded-xl border transition-all ${
              isDark ? 'bg-slate-800 border-white/10 text-yellow-300' : 'bg-white border-slate-200 text-slate-700 shadow-sm'
            }`}
            title="สลับโหมด Dark / Light"
          >
            {isDark ? <Sun style={{ width: 16, height: 16 }} /> : <Moon style={{ width: 16, height: 16 }} />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 max-w-6xl w-full mx-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* Left Sidebar: Team Members & Quick Directives */}
        <div className="space-y-4 lg:col-span-1">
          
          {/* Active Members Switcher */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Bot style={{ width: 14, height: 14 }} className="text-blue-400" />
              สลับผู้ส่งข้อความ (4 Roles)
            </h2>
            <div className="space-y-2">
              {AGENTS.map((agent) => {
                const isSelected = selectedSender === agent.id;
                const IconComp = agent.icon;
                return (
                  <div
                    key={agent.id}
                    onClick={() => setSelectedSender(agent.id as any)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center gap-2.5 ${
                      isSelected
                        ? `${agent.bgGradient} ring-2 ring-blue-500/40 font-bold shadow-sm`
                        : isDark
                          ? 'bg-slate-800/40 border-white/5 hover:bg-slate-800/80 text-slate-300'
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div 
                      style={{ width: 32, height: 32, minWidth: 32, minHeight: 32 }}
                      className={`rounded-xl flex items-center justify-center ${agent.avatarBg} shadow-sm shrink-0`}
                    >
                      <IconComp style={{ width: 16, height: 16 }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate font-medium">{agent.label}</p>
                      <span className="text-[10px] text-slate-400">
                        {isSelected ? '✓ เลือกอยู่' : 'คลิกเพื่อสลับ'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 1-Click Quick Directives Box */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Sparkles style={{ width: 14, height: 14 }} className="text-amber-400" />
              ปุ่มสั่งการด่วน (1-Click)
            </h2>

            <div className="space-y-2">
              <button
                onClick={() => handleSendMessage('📢 [คำสั่งท่านประธาน] สั่งการ DevMobile AI ให้เข้าทดสอบระบบลงเวลาและ Geofence 50m ด้วยบัญชีพนักงาน 01, 02 ทันที')}
                className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                  isDark ? 'bg-purple-950/30 border-purple-800/40 hover:bg-purple-900/40 text-purple-200' : 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-800'
                }`}
              >
                <Smartphone style={{ width: 14, height: 14 }} className="shrink-0 text-purple-400" />
                <span className="truncate">สั่ง DevMobile ตรวจ Geofence</span>
              </button>

              <button
                onClick={() => handleSendMessage('📢 [คำสั่งท่านประธาน] สั่งการ DevWeb AI ให้ตรวจสอบ Real-Time Dashboard และปุ่ม Reset HWID ในหน้า Admin ทันที')}
                className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                  isDark ? 'bg-emerald-950/30 border-emerald-800/40 hover:bg-emerald-900/40 text-emerald-200' : 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 text-emerald-800'
                }`}
              >
                <Laptop style={{ width: 14, height: 14 }} className="shrink-0 text-emerald-400" />
                <span className="truncate">สั่ง DevWeb ตรวจ Dashboard</span>
              </button>

              <button
                onClick={() => handleSendMessage('📢 [คำสั่งท่านประธาน] สั่งการ Tech Lead ให้สรุปสถานะการทดสอบระบบทั้งหมด')}
                className={`w-full text-left p-2.5 rounded-xl border text-xs flex items-center gap-2 transition-all ${
                  isDark ? 'bg-blue-950/30 border-blue-800/40 hover:bg-blue-900/40 text-blue-200' : 'bg-blue-50 border-blue-200 hover:bg-blue-100 text-blue-800'
                }`}
              >
                <Bot style={{ width: 14, height: 14 }} className="shrink-0 text-blue-400" />
                <span className="truncate">สั่ง Tech Lead สรุปสถานะ</span>
              </button>
            </div>
          </div>

          {/* Copy Prompt for AI Chat tabs */}
          <div className={`p-4 rounded-2xl border ${
            isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
          }`}>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
              <Copy style={{ width: 14, height: 14 }} className="text-cyan-400" />
              คัดลอก Prompt สั่ง AI ในแชท
            </h2>

            <div className="space-y-2">
              <button
                onClick={() => handleCopyPrompt('mobile', `คุณคือ DevMobile AI ของร้านสีแสงยางยนต์\nรหัสพนักงานจริงใน Supabase คือ: 01 (PIN 11), 02 (PIN 02), SI01 (PIN 5101)\nพิกัดร้านคือ: 15.110481, 104.358552 (50m)\nช่วยตรวจสอบการทำงานหน้า employee ตามคำสั่งของ Tech Lead ทันที`)}
                className={`w-full text-left p-2 rounded-xl border text-[11px] flex items-center justify-between transition-all ${
                  copiedKey === 'mobile'
                    ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                    : isDark ? 'bg-slate-800/50 border-white/5 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>📱 Copy Prompt ให้ DevMobile</span>
                {copiedKey === 'mobile' ? <Check style={{ width: 12, height: 12 }} className="text-purple-400" /> : <Copy style={{ width: 12, height: 12 }} className="text-slate-400" />}
              </button>

              <button
                onClick={() => handleCopyPrompt('web', `คุณคือ DevWeb AI ของร้านสีแสงยางยนต์\nระบบ Web Admin ซิงค์ตารางจริง employees และ store_settings เรียบร้อยแล้ว\nช่วยตรวจเช็คหน้า admin และ executive ตามคำสั่งของ Tech Lead ทันที`)}
                className={`w-full text-left p-2 rounded-xl border text-[11px] flex items-center justify-between transition-all ${
                  copiedKey === 'web'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                    : isDark ? 'bg-slate-800/50 border-white/5 hover:bg-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>💻 Copy Prompt ให้ DevWeb</span>
                {copiedKey === 'web' ? <Check style={{ width: 12, height: 12 }} className="text-emerald-400" /> : <Copy style={{ width: 12, height: 12 }} className="text-slate-400" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Chat Stream & Input Area */}
        <div className={`lg:col-span-3 flex flex-col rounded-2xl border overflow-hidden ${
          isDark ? 'bg-[#0f172a] border-slate-800' : 'bg-white border-slate-200 shadow-sm'
        }`}>
          
          {/* Chat Feed Header */}
          <div className={`px-4 py-3 border-b flex items-center justify-between ${
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-2">
              <MessageSquare style={{ width: 16, height: 16 }} className="text-blue-400" />
              <span className="text-xs font-bold">ห้องสนทนากลาง (Synced to Discord Webhooks)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Discord Live
              </span>
              <span className="text-[11px] text-slate-400">• {messages.length} ข้อความ</span>
            </div>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto max-h-[500px] min-h-[420px] space-y-4">
            {messages.map((msg) => {
              return (
                <div key={msg.id} className="flex items-start gap-3 group">
                  <div 
                    style={{ width: 34, height: 34, minWidth: 34, minHeight: 34 }}
                    className={`rounded-xl flex items-center justify-center shadow-sm shrink-0 mt-0.5 ${
                      msg.sender === 'PRESIDENT'
                        ? 'bg-gradient-to-br from-amber-500 to-amber-700'
                        : msg.sender === 'TECH_LEAD'
                          ? 'bg-gradient-to-br from-blue-600 to-indigo-700'
                          : msg.sender === 'DEV_MOBILE'
                            ? 'bg-gradient-to-br from-purple-600 to-pink-700'
                            : msg.sender === 'DEV_WEB'
                              ? 'bg-gradient-to-br from-emerald-600 to-teal-700'
                              : 'bg-slate-700'
                    }`}
                  >
                    {renderSenderIcon(msg.sender)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs font-bold">{msg.senderName}</span>
                      {renderSenderBadge(msg.sender)}
                      <span className="text-[10px] text-slate-500 font-mono">
                        {new Date(msg.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed break-words whitespace-pre-wrap ${
                      isDark ? 'bg-slate-800/70 text-slate-200 border border-white/5' : 'bg-slate-100 text-slate-800 border border-slate-200'
                    }`}>
                      {msg.content}
                    </div>

                    {msg.tags && msg.tags.length > 0 && (
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        {msg.tags.map((t, idx) => (
                          <span key={idx} className="text-[9px] px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 font-mono border border-blue-500/20">
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
            isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px]">ส่งในนาม:</span>
                <span className="font-bold text-blue-400">
                  {AGENTS.find(a => a.id === selectedSender)?.label}
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400">ยิงเข้า Discord:</span>
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

            <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="พิมพ์ข้อความสั่งการ หรือรายงานความคืบหน้า... (กด Enter เพื่อส่งเข้า Discord)"
                className={`flex-1 px-4 py-2.5 rounded-xl border text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${
                  isDark ? 'bg-slate-800 border-white/10 text-slate-100 placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 active:scale-95 shadow-md shadow-blue-500/20"
              >
                <Send style={{ width: 14, height: 14 }} />
                <span>ส่งข้อความ</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
