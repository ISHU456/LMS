import React, { useState, useRef } from 'react';
import { 
  Image, Video, Link, FileText, X, 
  Send, Plus, Type, CheckCircle2, 
  AlertCircle, Sparkles, Pin, Shield, 
  Upload, Paperclip, ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';

const API_BASE = 'http://localhost:5001/api';

const CreatePost = ({ user, onPostCreated }) => {
  const [type, setType] = useState('text'); // text, image, video, file, link
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [category, setCategory] = useState('General');
  const [priority, setPriority] = useState('normal');
  const [isPinned, setIsPinned] = useState(false);
  const [important, setImportant] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState([]);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  const fileInputRef = useRef(null);
  const isAdmin = user?.role === 'admin' || user?.role === 'hod';

  const resetForm = () => {
    setContent('');
    setTitle('');
    setMediaUrl('');
    setVideoUrl('');
    setExternalLink('');
    setType('text');
    setIsExpanded(false);
    setAttachments([]);
    setTags([]);
    setTagInput('');
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(/^#/, '');
      if (newTag && !tags.includes(newTag) && tags.length < 5) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handlePost = async () => {
    if (!content.trim()) return;
    setIsLoading(true);
    try {
      const payload = {
        title,
        content,
        type,
        category,
        priority,
        pinned: isPinned,
        important,
        tags,
        attachments: type === 'image' || type === 'file' ? attachments : [],
        videoUrl: type === 'video' ? videoUrl : undefined,
        externalLink: type === 'link' ? externalLink : undefined,
      };

      const res = await axios.post(`${API_BASE}/announcements`, payload, {
        headers: { Authorization: `Bearer ${user?.token}` }
      });
      
      onPostCreated(res.data);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  // Improved File Handler (Simulated or Real depending on backend)
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const processFile = (file) => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve({
          name: file.name,
          size: file.size,
          type: file.type.split('/')[0] === 'image' ? 'image' : (file.type.includes('pdf') ? 'pdf' : 'other'),
          url: reader.result
        });
        reader.readAsDataURL(file);
      });
    };

    const newAttachments = await Promise.all(files.map(processFile));

    setAttachments([...attachments, ...newAttachments]);
    if (type === 'text') setType(newAttachments[0].type === 'image' ? 'image' : 'file');
  };

  const typeOptions = [
    { id: 'text', icon: <Type size={18} />, label: 'Text', color: 'bg-indigo-50 text-indigo-600' },
    { id: 'image', icon: <Image size={18} />, label: 'Photo', color: 'bg-rose-50 text-rose-600' },
    { id: 'video', icon: <Video size={18} />, label: 'Video', color: 'bg-amber-50 text-amber-600' },
    { id: 'file', icon: <FileText size={18} />, label: 'File', color: 'bg-emerald-50 text-emerald-600' },
    { id: 'link', icon: <Link size={18} />, label: 'Link', color: 'bg-primary-50 text-primary-600' },
  ];

  return (
    <div className={`w-full bg-white dark:bg-[#0b0f1a] shadow-2xl shadow-slate-200/50 dark:shadow-none rounded-[3rem] border border-slate-100 dark:border-white/5 transition-all relative z-30 overflow-visible ${isExpanded ? 'p-10' : 'p-6'}`}>
      
      {/* Terminal Pulse Background */}
      {isExpanded && (
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-[100px] pointer-events-none" />
      )}

      {!isExpanded ? (
        <div className="w-full flex items-center justify-between gap-6">
          <div className="flex items-center gap-5 flex-1">
            <div className="relative group cursor-pointer shrink-0" onClick={() => setIsExpanded(true)}>
              <div className="w-14 h-14 rounded-[1.2rem] p-[2px] bg-gradient-to-tr from-slate-200 to-slate-300 dark:from-white/10 dark:to-white/5">
                <div className="w-full h-full rounded-[1.1rem] bg-white dark:bg-[#0b0f19] overflow-hidden flex items-center justify-center">
                   {user?.profilePic ? (
                     <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
                   ) : (
                     <span className="text-xl font-black text-slate-300">{user?.name?.charAt(0) || 'U'}</span>
                   )}
                </div>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0b0f1a] animate-pulse" />
            </div>
            
            <button 
              onClick={() => setIsExpanded(true)}
              className="flex-1 h-14 text-left px-8 rounded-[1.5rem] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-sm tracking-tight"
            >
              Initiate academic broadcast...
            </button>
          </div>
          
          <div className="hidden sm:flex items-center gap-3 shrink-0">
            {[
              { icon: <Image size={20} />, action: () => { setType('image'); setIsExpanded(true); }, color: 'text-rose-500', bg: 'bg-rose-50' },
              { icon: <Video size={20} />, action: () => { setType('video'); setIsExpanded(true); }, color: 'text-amber-500', bg: 'bg-amber-50' },
              { icon: <Paperclip size={20} />, action: () => { setType('file'); setIsExpanded(true); }, color: 'text-emerald-500', bg: 'bg-emerald-50' },
            ].map((tool, i) => (
              <button 
                key={i}
                onClick={tool.action}
                className={`p-4 rounded-2xl ${tool.bg} dark:bg-white/5 ${tool.color} hover:scale-110 active:scale-95 transition-all shadow-sm`}
              >
                {tool.icon}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-8 relative z-10">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Broadcast Terminal</h3>
                <div className="flex items-center gap-2 mt-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                   <p className="text-[10px] font-black uppercase text-emerald-500 tracking-[0.2em]">Institutional Connection Synchronized</p>
                </div>
              </div>
            </div>
            <button 
              onClick={() => setIsExpanded(false)} 
              className="p-3 rounded-2xl text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            >
              <X size={24} />
            </button>
          </div>

          {/* Type Selector Tabs */}
          <div className="flex flex-wrap gap-2">
            {typeOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setType(opt.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${type === opt.id ? opt.color + ' border-2 border-currentColor/20 shadow-lg' : 'bg-gray-50 dark:bg-gray-800/50 text-gray-500'}`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>

          {/* Inputs Section */}
          <div className="space-y-4">
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post Title (Optional)"
              className="w-full px-5 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 outline-none font-black text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500/50 transition-all"
            />
            
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="What would you like to announce?"
              className="w-full px-5 py-4 rounded-3xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 outline-none font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:border-primary-500/50 transition-all resize-none"
            />
            
            <div className="space-y-2">
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 font-black text-gray-400">#</span>
                <input 
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleAddTag}
                  placeholder="Add tags (press Enter or comma)"
                  className="w-full pl-10 pr-5 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800/20 border border-gray-100 dark:border-gray-700 outline-none text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 focus:bg-white dark:focus:bg-gray-900 focus:border-indigo-500/50 transition-all"
                />
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((tag, idx) => (
                    <span key={idx} className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 font-bold text-xs">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="text-indigo-400 hover:text-rose-500 transition-colors">
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            
            <AnimatePresence mode="wait">
              {type === 'video' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <div className="relative">
                    <Video size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      placeholder="YouTube or Vimeo URL"
                      className="w-full pl-12 pr-5 py-3 rounded-2xl bg-amber-50/30 border border-amber-200/50 outline-none text-sm font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </motion.div>
              )}
              
              {type === 'link' && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                  <div className="relative">
                    <Link size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                      value={externalLink}
                      onChange={(e) => setExternalLink(e.target.value)}
                      placeholder="https://..."
                      className="w-full pl-12 pr-5 py-3 rounded-2xl bg-primary-50/30 border border-primary-200/50 outline-none text-sm font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </motion.div>
              )}

              {(type === 'image' || type === 'file') && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="space-y-3">
                  <div 
                    onClick={() => fileInputRef.current.click()}
                    className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl p-8 flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 group-hover:scale-110 transition-transform">
                      {type === 'image' ? <Image size={24} /> : <Upload size={24} />}
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-black text-gray-900 dark:text-white">Click to upload {type}</p>
                      <p className="text-[10px] uppercase font-black tracking-widest text-gray-400">Drag and drop also works</p>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      multiple={type === 'file'}
                      accept={type === 'image' ? "image/*" : "*"}
                      onChange={handleFileChange}
                    />
                  </div>
                  
                  {attachments.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {attachments.map((file, idx) => (
                        <div key={idx} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                          {file.type === 'image' ? <Image size={14} className="text-rose-500" /> : <Paperclip size={14} className="text-primary-500" />}
                          <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300 truncate max-w-[120px]">{file.name}</span>
                          <button onClick={() => setAttachments(attachments.filter((_, i) => i !== idx))} className="text-gray-400 hover:text-red-500"><X size={14} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Admin Controls */}
          {isAdmin && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-gray-50/50 dark:bg-gray-800/30 p-4 rounded-3xl border border-gray-100 dark:border-gray-800">
              <div className="col-span-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Category</label>
                <select 
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  <option>General</option>
                  <option>Academic</option>
                  <option>Events</option>
                  <option>Exams</option>
                  <option>Sports</option>
                </select>
              </div>
              <div className="col-span-1">
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Priority</label>
                <select 
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-xs font-bold outline-none"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="flex items-end pb-1 gap-2">
                <button 
                  onClick={() => setIsPinned(!isPinned)}
                  className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border transition-all ${isPinned ? 'bg-amber-50 border-amber-500/20 text-amber-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'}`}
                >
                  <Pin size={16} className={isPinned ? 'fill-current' : ''} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Pin</span>
                </button>
              </div>
              <div className="flex items-end pb-1 gap-2">
                <button 
                   onClick={() => setImportant(!important)}
                   className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-xl border transition-all ${important ? 'bg-rose-50 border-rose-500/20 text-rose-600' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-400'}`}
                >
                  <Shield size={16} className={important ? 'fill-current' : ''} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Mark</span>
                </button>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-2">
             <div className="flex items-center gap-4 text-gray-400">
               <div className="flex items-center gap-1.5">
                  <AlertCircle size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Posts shown in academic feed</span>
               </div>
             </div>
             <button 
              onClick={handlePost}
              disabled={isLoading || !content.trim()}
              className="flex items-center gap-2 px-8 py-3 rounded-2xl bg-primary-600 text-white font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-600/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
             >
               {isLoading ? (
                 <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
               ) : (
                 <>Post <Send size={16} /></>
               )}
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
