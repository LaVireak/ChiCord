'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useAuraStore } from '@/store/useAuraStore';
import { Search, Filter, Upload, FileText, Image as ImageIcon, File, FolderArchive, MoreVertical, X, Trash2, Pencil, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const mockFiles = [
  { id: 'f1', name: 'Homepage_V2.fig', type: 'figma', size: '24 MB', uploader: 'Sarah Jenkins', date: 'Today, 10:42 AM', icon: ImageIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
  { id: 'f2', name: 'Q3_Roadmap.pdf', type: 'document', size: '2.1 MB', uploader: 'Elena Rostova', date: 'Yesterday', icon: FileText, color: 'text-rose-400', bg: 'bg-rose-500/10' },
  { id: 'f3', name: 'Logo_Assets.zip', type: 'archive', size: '156 MB', uploader: 'You', date: 'Oct 12', icon: FolderArchive, color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { id: 'f4', name: 'API_Specs_v4.md', type: 'document', size: '45 KB', uploader: 'Marcus Chen', date: 'Oct 10', icon: FileText, color: 'text-teal-400', bg: 'bg-teal-500/10' },
  { id: 'f5', name: 'App_Icon_Final.png', type: 'image', size: '4.5 MB', uploader: 'Sarah Jenkins', date: 'Oct 09', icon: ImageIcon, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
  { id: 'f6', name: 'Onboarding_Flow.fig', type: 'figma', size: '42 MB', uploader: 'Aria Stark', date: 'Oct 05', icon: ImageIcon, color: 'text-purple-400', bg: 'bg-purple-500/10' },
];

const FILE_TYPES = ['All', 'figma', 'document', 'image', 'archive'];

export default function FilesPanel() {
  const { activeFileId, setActiveFileId } = useAuraStore();
  const [search, setSearch] = useState('');
  const [files, setFiles] = useState(mockFiles);
  const [activeFilter, setActiveFilter] = useState('All');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const filterRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) setShowFilterMenu(false);
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpenId(null);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase());
    const matchesType = activeFilter === 'All' || f.type === activeFilter;
    return matchesSearch && matchesType;
  });

  const handleDelete = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
    if (activeFileId === id) setActiveFileId(null);
    setMenuOpenId(null);
  };

  const startRename = (id: string, currentName: string) => {
    setRenamingId(id);
    setRenameValue(currentName);
    setMenuOpenId(null);
  };

  const commitRename = (id: string) => {
    if (renameValue.trim()) {
      setFiles(prev => prev.map(f => f.id === id ? { ...f, name: renameValue.trim() } : f));
    }
    setRenamingId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 z-10 relative">
      
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-5 mb-5 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-white tracking-wide">Workspace Files</h1>
          <p className="text-xs text-slate-400 mt-0.5">Manage and share assets with your team</p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search files..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 bg-black/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors w-48 sm:w-64"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative" ref={filterRef}>
            <button 
              onClick={() => setShowFilterMenu(v => !v)}
              className={`flex items-center gap-1.5 p-2.5 rounded-xl border text-sm font-medium transition-all ${
                activeFilter !== 'All' 
                  ? 'bg-teal-500/10 border-teal-500/30 text-teal-400' 
                  : 'bg-black/40 hover:bg-white/10 text-slate-400 hover:text-white border-white/5'
              }`}
            >
              <Filter className="w-4 h-4" />
              {activeFilter !== 'All' && <span className="capitalize">{activeFilter}</span>}
              <ChevronDown className="w-3 h-3" />
            </button>
            <AnimatePresence>
              {showFilterMenu && (
                <motion.div 
                  initial={{ opacity: 0, y: -6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-44 bg-slate-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden p-1"
                >
                  {FILE_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => { setActiveFilter(type); setShowFilterMenu(false); }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm transition-colors ${
                        activeFilter === type ? 'bg-teal-500/10 text-teal-400' : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <span className="capitalize">{type}</span>
                      {activeFilter === type && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Upload */}
          <label className="flex items-center gap-2 px-4 py-2 bg-teal-500 hover:bg-teal-400 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-teal-500/20 cursor-pointer">
            <input 
              type="file" 
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
                  const type = ['fig'].includes(ext) ? 'figma' : ['pdf','md','txt'].includes(ext) ? 'document' : ['png','jpg','jpeg','gif','webp'].includes(ext) ? 'image' : ['zip','rar','7z'].includes(ext) ? 'archive' : 'document';
                  const IconComp = type === 'image' ? ImageIcon : type === 'archive' ? FolderArchive : FileText;
                  const colorMap: Record<string, { color: string; bg: string }> = {
                    figma: { color: 'text-purple-400', bg: 'bg-purple-500/10' },
                    document: { color: 'text-teal-400', bg: 'bg-teal-500/10' },
                    image: { color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
                    archive: { color: 'text-amber-400', bg: 'bg-amber-500/10' },
                  };
                  const style = colorMap[type] || colorMap.document;
                  setFiles(prev => [{
                    id: `f_${Date.now()}`,
                    name: file.name,
                    type,
                    size: file.size > 1_000_000 ? `${(file.size / 1_000_000).toFixed(1)} MB` : `${Math.round(file.size / 1000)} KB`,
                    uploader: 'You',
                    date: 'Just now',
                    icon: IconComp,
                    ...style,
                  }, ...prev]);
                  e.target.value = '';
                }
              }}
            />
            <Search className="w-4 h-4 hidden" />
            <span>Upload</span>
          </label>
        </div>
      </header>

      {/* Files Grid */}
      <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
            {filtered.map((file, idx) => {
              const Icon = file.icon;
              const isSelected = activeFileId === file.id;
              const isMenuOpen = menuOpenId === file.id;
              const isRenaming = renamingId === file.id;

              return (
                <motion.div
                  key={file.id}
                  role="button"
                  tabIndex={0}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.3, delay: idx * 0.04 }}
                  onClick={() => !isMenuOpen && !isRenaming && setActiveFileId(file.id)}
                  onKeyDown={(e: React.KeyboardEvent) => { if(e.key === 'Enter') setActiveFileId(file.id); }}
                  className={`relative flex flex-col p-4 rounded-2xl border text-left transition-all duration-300 group overflow-visible cursor-pointer ${
                    isSelected 
                      ? 'bg-teal-500/10 border-teal-500/30 shadow-lg shadow-teal-500/10' 
                      : 'bg-white/5 border-white/5 hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${file.bg}`}>
                      <Icon className={`w-6 h-6 ${file.color}`} />
                    </div>
                    {/* ••• Menu */}
                    <div className="relative" ref={isMenuOpen ? menuRef : null}>
                      <button 
                        onClick={(e) => { e.stopPropagation(); setMenuOpenId(isMenuOpen ? null : file.id); }}
                        className="p-1.5 text-slate-500 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <AnimatePresence>
                        {isMenuOpen && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.92, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.92, y: -4 }}
                            transition={{ duration: 0.12 }}
                            className="absolute right-0 top-full mt-1 w-36 bg-slate-900 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden p-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => startRename(file.id, file.name)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-white/5 rounded-lg transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" /> Rename
                            </button>
                            <button
                              onClick={() => handleDelete(file.id)}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 z-10">
                    {isRenaming ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => commitRename(file.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitRename(file.id); if (e.key === 'Escape') setRenamingId(null); }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-semibold bg-black/60 border border-teal-500/50 rounded-lg px-2 py-1 text-white focus:outline-none w-full"
                      />
                    ) : (
                      <h3 className={`font-semibold text-sm truncate ${isSelected ? 'text-teal-400' : 'text-white'}`}>
                        {file.name}
                      </h3>
                    )}
                    <div className="flex items-center justify-between mt-1 text-xs text-slate-500">
                      <span>{file.size}</span>
                      <span>{file.date}</span>
                    </div>
                  </div>

                  {isSelected && (
                    <motion.div 
                      layoutId="activeFileGlow"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-teal-400 rounded-b-2xl"
                    />
                  )}
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 space-y-3">
            <File className="w-12 h-12 opacity-50" />
            <p>No files match your search.</p>
          </div>
        )}
      </div>
    </div>
  );
}
