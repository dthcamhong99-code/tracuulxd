import React from 'react';
import { X, Download, Search, Book } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  docTitle: string;
  docContent: string;
}

export default function DocumentViewer({ isOpen, onClose, docTitle, docContent }: DocumentViewerProps) {
  if (!isOpen) return null;

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
    >
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-legal-navy text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Book className="text-legal-gold" size={24} />
            <h2 className="text-lg font-bold font-serif truncate max-w-md lg:max-w-2xl">
              {docTitle}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-300 hover:text-white">
              <Download size={20} />
            </button>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Search Bar (Placeholder) */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center gap-3">
          <Search size={18} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Tìm kiếm trong văn bản..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-600"
          />
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-white">
          <div className="max-w-4xl mx-auto prose prose-slate prose-sm lg:prose-base prose-headings:font-serif prose-headings:text-legal-navy prose-strong:text-legal-navy prose-a:text-legal-gold">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {docContent}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button 
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 text-slate-700 rounded-lg font-medium hover:bg-slate-300 transition-colors"
          >
            Đóng
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
