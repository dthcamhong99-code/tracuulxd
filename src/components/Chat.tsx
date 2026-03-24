import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Scale, BookOpen, ShieldAlert, Info, Menu, X, ExternalLink, Palette, MessageSquarePlus, FileDown, AlertCircle, Phone } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { motion, AnimatePresence } from 'motion/react';
import { saveAs } from 'file-saver';
import { sendMessage } from '../services/gemini';
import DocumentViewer from './DocumentViewer';
import { LEGAL_DOCUMENTS } from '../data/documents';

interface Message {
  role: 'user' | 'model';
  text: string;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [theme, setTheme] = useState<'default' | 'sepia' | 'dark'>('default');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = overrideText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map(msg => ({
        role: msg.role,
        parts: [{ text: msg.text }]
      }));
      
      const response = await sendMessage(textToSend, history);
      setMessages(prev => [...prev, { role: 'model', text: response }]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      let errorMessage = 'Đã có lỗi xảy ra trong quá trình kết nối. Vui lòng thử lại sau.';
      
      if (error?.message?.includes('quota') || error?.message?.includes('429')) {
        errorMessage = 'Hệ thống hiện đang quá tải do vượt quá hạn mức truy cập (Quota). Vui lòng đợi một lát và thử lại sau.';
      }
      
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: errorMessage 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    if (messages.length === 0) return;
    if (window.confirm('Bạn có muốn xóa lịch sử và bắt đầu cuộc trò chuyện mới?')) {
      setMessages([]);
    }
  };

  const handleExportReport = () => {
    if (messages.length === 0) {
      alert('Không có nội dung để xuất báo cáo.');
      return;
    }
    
    const content = messages.map(msg => 
      `${msg.role === 'user' ? 'NGƯỜI DÙNG' : 'CHUYÊN GIA AI'}:\n${msg.text}\n\n`
    ).join('---\n\n');
    
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    saveAs(blob, `bao-cao-tu-van-phap-luat-${new Date().toISOString().split('T')[0]}.txt`);
  };

  const toggleTheme = () => {
    const themes: ('default' | 'sepia' | 'dark')[] = ['default', 'sepia', 'dark'];
    const nextIndex = (themes.indexOf(theme) + 1) % themes.length;
    setTheme(themes[nextIndex]);
  };

  const processCitations = (text: string) => {
    let processedText = text;
    
    // Map of display names to IDs
    const docMap: Record<string, string> = {
      "43/VBHN-VPQH": "VBHN_43_2025",
      "Luật Xây dựng": "VBHN_43_2025",
      "175/2024/NĐ-CP": "ND_175_2024",
      "01/VBHN-BXD": "VBHN_01_2025",
      "06/VBHN-BXD": "VBHN_06_2023",
      "07/VBHN-BXD": "VBHN_07_2023"
    };

    // This is a simple way to make them look like links for the markdown renderer
    Object.keys(docMap).forEach(key => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(${escapedKey})`, 'g');
      processedText = processedText.replace(regex, `[$1](#doc:${docMap[key]})`);
    });

    return processedText;
  };

  const handleCitationClick = (href: string) => {
    if (href.startsWith('#doc:')) {
      const docId = href.replace('#doc:', '');
      setSelectedDocId(docId);
      return true;
    }
    return false;
  };

  const quickActions = [
    "Cấp phép xây dựng",
    "Quản lý dự án",
    "Hợp đồng xây dựng",
    "Quản lý chất lượng",
    "Chi phí đầu tư",
    "Điều kiện năng lực hoạt động xây dựng"
  ];

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${
      theme === 'dark' ? 'bg-[#121212] text-white' : 
      theme === 'sepia' ? 'bg-[#F4ECD8] text-[#5B4636]' : 
      'bg-slate-50 text-slate-900'
    }`}>
      {/* Sidebar for Desktop */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-legal-navy text-white transform transition-transform duration-300 lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-legal-gold rounded-lg flex items-center justify-center">
              <Scale className="text-legal-navy" size={24} />
            </div>
            <h1 className="text-xl font-bold font-serif leading-tight uppercase tracking-tight">Tra cứu<br/><span className="text-legal-gold">Pháp luật</span></h1>
          </div>

          <nav className="flex-1 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-2">Văn bản tra cứu</p>
            {[
              { label: "Luật Xây dựng 2025", id: "VBHN_43_2025" },
              { label: "NĐ 175/2024/NĐ-CP", id: "ND_175_2024" },
              { label: "VBHN 01/VBHN-BXD", id: "VBHN_01_2025" },
              { label: "VBHN 06/VBHN-BXD", id: "VBHN_06_2023" },
              { label: "VBHN 07/VBHN-BXD", id: "VBHN_07_2023" }
            ].map((doc, i) => (
              <div 
                key={i} 
                onClick={() => setSelectedDocId(doc.id)}
                className="group p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-legal-gold/30 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-2">
                  <BookOpen size={16} className="text-legal-gold group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-bold text-slate-200 leading-tight">{doc.label}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-3 group-hover:text-slate-300 transition-colors">
                  {LEGAL_DOCUMENTS[doc.id]?.summary}
                </p>
              </div>
            ))}

            <div className="pt-6 space-y-3">
              <button 
                onClick={toggleTheme}
                className="w-full flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-legal-gold/30 transition-all text-left"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Palette size={20} className="text-legal-gold" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide">Giao diện</p>
                  <p className="text-[10px] text-slate-400">Tùy chỉnh màu sắc hiển thị</p>
                </div>
              </button>

              <button 
                onClick={handleNewChat}
                className="w-full flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-legal-gold/30 transition-all text-left"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <MessageSquarePlus size={20} className="text-legal-gold" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide">Trò chuyện mới</p>
                  <p className="text-[10px] text-slate-400">Xóa lịch sử và bắt đầu lại</p>
                </div>
              </button>

              <button 
                onClick={handleExportReport}
                className="w-full flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-legal-gold/30 transition-all text-left"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <FileDown size={20} className="text-legal-gold" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide">Xuất báo cáo</p>
                  <p className="text-[10px] text-slate-400">Tải xuống kết quả tư vấn</p>
                </div>
              </button>

              <button 
                onClick={() => setIsContactModalOpen(true)}
                className="w-full flex items-center gap-4 p-3 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-legal-gold/30 transition-all text-left"
              >
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center">
                  <Phone size={20} className="text-legal-gold" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide">Liên hệ</p>
                  <p className="text-[10px] text-slate-400">Hỗ trợ từ chuyên gia</p>
                </div>
              </button>
            </div>
          </nav>

          <div className="mt-auto pt-6 border-t border-white/10 space-y-4">
            <div className="flex items-center gap-3 text-slate-300">
              <AlertCircle size={20} className="text-legal-gold" />
              <span className="text-sm font-bold uppercase tracking-wider">Lưu ý pháp lý</span>
            </div>
            <div className="p-4 bg-white/5 rounded-xl border border-white/10">
              <div className="flex items-center gap-2 text-legal-gold mb-2">
                <ShieldAlert size={16} />
                <span className="text-xs font-bold uppercase">Quan trọng</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">
                Thông tin này chỉ mang tính chất tra cứu pháp luật. Đối với các trường hợp phức tạp, vui lòng tham khảo ý kiến chuyên gia.
              </p>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 text-white"
        >
          <X size={24} />
        </button>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative min-w-0">
        {/* Header */}
        <header className={`h-16 border-b flex items-center justify-between px-6 shadow-sm z-10 transition-colors duration-300 ${
          theme === 'dark' ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className={`lg:hidden p-2 -ml-2 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
              <span className={`font-bold tracking-tight ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>AI Chuyên gia Luật Xây dựng</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${
              theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
            }`}>
              <User size={18} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
            </div>
          </div>
        </header>

        {/* Chat Area */}
        <div 
          ref={scrollRef}
          className={`flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth transition-colors duration-300 ${
            theme === 'dark' ? 'bg-[#1a1a1a]' : 
            theme === 'sepia' ? 'bg-[#FDF6E3]' : 
            'bg-[#F8F9F5]'
          }`}
        >
          {messages.length === 0 && (
            <div className="max-w-4xl mx-auto mt-20 text-center">
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <p className={`text-[11px] uppercase tracking-[0.3em] font-bold mb-6 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>Trợ lý pháp lý thông minh</p>
                <h2 className={`text-5xl md:text-6xl font-bold mb-2 tracking-tight ${theme === 'dark' ? 'text-white' : 'text-slate-900'}`}>
                  Chào mừng bạn đến với
                </h2>
                <h2 className="text-5xl md:text-6xl font-bold text-[#5A5A40] mb-8 tracking-tight">
                  Luật Xây Dựng AI
                </h2>
                <p className={`max-w-2xl mx-auto text-lg leading-relaxed ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  Hệ thống tra cứu nhanh chóng và chính xác các quy định pháp luật về xây dựng tại Việt Nam. Hãy chọn một chủ đề bên dưới hoặc nhập câu hỏi của bạn.
                </p>
              </motion.div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl mx-auto">
                {quickActions.map((action, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(action)}
                    className={`p-6 border rounded-2xl text-left hover:border-legal-gold hover:shadow-lg hover:-translate-y-1 transition-all group ${
                      theme === 'dark' ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'
                    }`}
                  >
                    <span className={`text-base font-medium group-hover:text-legal-navy ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>{action}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] lg:max-w-[70%] p-4 rounded-2xl shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-legal-navy text-white rounded-tr-none' 
                  : theme === 'dark' 
                    ? 'bg-[#2a2a2a] border border-white/10 text-slate-200 rounded-tl-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
              }`}>
                <div className={`prose max-w-none prose-sm lg:prose-base ${
                  theme === 'dark' ? 'prose-invert' : 'prose-slate'
                }`}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      a: ({ node, ...props }) => {
                        const isDocLink = props.href?.startsWith('#doc:');
                        return (
                          <a 
                            {...props} 
                            onClick={(e) => {
                              if (isDocLink) {
                                e.preventDefault();
                                handleCitationClick(props.href!);
                              }
                            }}
                            className={isDocLink ? "text-legal-gold font-bold hover:underline cursor-pointer inline-flex items-center gap-1" : ""}
                          >
                            {props.children}
                            {isDocLink && <ExternalLink size={12} />}
                          </a>
                        );
                      }
                    }}
                  >
                    {msg.role === 'model' ? processCitations(msg.text) : msg.text}
                  </ReactMarkdown>
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <div className="flex justify-start">
              <div className={`p-4 rounded-2xl rounded-tl-none shadow-sm border ${
                theme === 'dark' ? 'bg-[#2a2a2a] border-white/10' : 'bg-white border-slate-200'
              }`}>
                <div className="flex gap-1">
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-2 h-2 bg-legal-gold rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-2 h-2 bg-legal-gold rounded-full" />
                  <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-2 h-2 bg-legal-gold rounded-full" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className={`p-6 border-t transition-colors duration-300 ${
          theme === 'dark' ? 'bg-[#121212] border-white/10' : 'bg-white border-slate-200'
        }`}>
          <div className="max-w-4xl mx-auto relative">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Nhập câu hỏi pháp lý của bạn tại đây..."
              className={`w-full pl-4 pr-14 py-4 border rounded-2xl focus:ring-2 focus:ring-legal-gold focus:border-transparent outline-none transition-all resize-none h-16 max-h-40 overflow-y-auto ${
                theme === 'dark' ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'
              }`}
            />
            <button
              onClick={() => handleSend()}
              disabled={!input.trim() || isLoading}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-legal-navy text-white rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Send size={20} />
            </button>
          </div>
          <p className="text-center text-[10px] text-slate-400 mt-3">
            Trợ lý AI có thể nhầm lẫn. Vui lòng kiểm tra lại các trích dẫn văn bản pháp luật.
          </p>
        </div>
      </main>
      
      {/* Overlay for mobile sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Document Viewer Modal */}
      <AnimatePresence>
        {selectedDocId && (
          <DocumentViewer 
            isOpen={!!selectedDocId}
            onClose={() => setSelectedDocId(null)}
            docTitle={LEGAL_DOCUMENTS[selectedDocId]?.title || ""}
            docContent={LEGAL_DOCUMENTS[selectedDocId]?.content || ""}
          />
        )}
      </AnimatePresence>

      {/* Contact Modal */}
      <AnimatePresence>
        {isContactModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsContactModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[40px] p-10 text-center shadow-2xl"
            >
              <button 
                onClick={() => setIsContactModalOpen(false)}
                className="absolute top-6 right-8 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <X size={24} />
              </button>

              <div className="mb-8 flex justify-center">
                <div className="w-24 h-24 bg-[#F8F9F5] rounded-[30px] flex items-center justify-center">
                  <Phone size={40} className="text-blue-500" />
                </div>
              </div>

              <div className="space-y-2 mb-10">
                <p className="text-xl font-medium text-slate-800">Vui lòng liên hệ với tác giả</p>
                <p className="text-2xl font-bold text-slate-900">
                  Hong Dang - Tel: <span className="text-blue-600">0972500562</span>
                </p>
              </div>

              <button 
                onClick={() => setIsContactModalOpen(false)}
                className="w-full py-5 bg-blue-500 text-white text-xl font-bold rounded-3xl hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98]"
              >
                ĐÓNG
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

