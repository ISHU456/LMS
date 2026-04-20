import React, { useState, useRef } from 'react';
import { 
  Image, Video, Link, FileText, X, 
  Send, Plus, Type, CheckCircle2, 
  AlertCircle, Sparkles, Pin, Shield, 
  Upload, Paperclip, ChevronDown, Briefcase
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

  const roleConfigs = {
    admin: { color: 'text-rose-500', bg: 'bg-rose-500', lightBg: 'bg-rose-50', border: 'border-rose-500/20', shadow: 'shadow-rose-500/20', hoverBg: 'hover:bg-rose-500/10' },
    teacher: { color: 'text-indigo-500', bg: 'bg-indigo-500', lightBg: 'bg-indigo-50', border: 'border-indigo-500/20', shadow: 'shadow-indigo-500/20', hoverBg: 'hover:bg-indigo-500/10' },
    faculty: { color: 'text-indigo-500', bg: 'bg-indigo-500', lightBg: 'bg-indigo-50', border: 'border-indigo-500/20', shadow: 'shadow-indigo-500/20', hoverBg: 'hover:bg-indigo-500/10' },
    student: { color: 'text-blue-500', bg: 'bg-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-500/20', shadow: 'shadow-blue-500/20', hoverBg: 'hover:bg-blue-500/10' },
  };

  const config = roleConfigs[user?.role] || roleConfigs.student;

  return (
    <div className={`w-full bg-white/80 dark:bg-white/[0.03] backdrop-blur-xl shadow-xl rounded-2xl border border-slate-200/50 dark:border-white/10 transition-all relative z-30 transform-gpu hover:border-white/20 ${isExpanded ? 'p-8' : 'p-6'}`}>
      
      {!isExpanded ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 overflow-hidden shrink-0 border border-slate-200 dark:border-white/10 shadow-lg`}>
               {user?.profilePic ? (
                 <img src={user.profilePic} alt={user.name} className="w-full h-full object-cover" />
               ) : (
                 <div className="w-full h-full flex items-center justify-center text-xl font-black text-slate-400">
                    {user?.name?.charAt(0) || 'U'}
                 </div>
               )}
            </div>
            <button 
              onClick={() => setIsExpanded(true)}
              className="flex-1 h-14 text-left px-6 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-all text-sm uppercase tracking-widest"
            >
              Start an institutional signal...
            </button>
          </div>
          
          <div className="flex items-center justify-around pt-2">
            {[
              { icon: <Image size={20} className="text-blue-500" />, label: 'PHOTO', action: () => { setType('image'); setIsExpanded(true); } },
              { icon: <Video size={20} className="text-emerald-500" />, label: 'MEDIA', action: () => { setType('video'); setIsExpanded(true); } },
              { icon: <Briefcase size={20} className="text-purple-500" />, label: 'MISSION', action: () => { setType('link'); setIsExpanded(true); } },
              { icon: <FileText size={20} className="text-orange-500" />, label: 'ARCHIVE', action: () => { setType('file'); setIsExpanded(true); } },
            ].map((tool, i) => (
              <button 
                key={i}
                onClick={tool.action}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-all group"
              >
                <div className="group-hover:scale-110 transition-transform">{tool.icon}</div>
                <span className="text-[10px] font-black text-slate-500 tracking-widest uppercase">{tool.label}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 dark:border-white/5">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-white/5 overflow-hidden border border-slate-200 dark:border-white/10 shadow-lg">
                   {user?.profilePic ? <img src={user.profilePic} alt="" className="w-full h-full object-cover" /> : null}
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{user?.name}</h4>
                  <p className={`text-[10px] ${config.color} font-black uppercase tracking-[0.2em] italic`}>Transmitting Signal</p>
                </div>
             </div>
             <button onClick={() => setIsExpanded(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl text-slate-500 transition-colors">
                <X size={20} />
             </button>
          </div>

          <div className="space-y-4">
            <input 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Title (optional)"
              className="w-full text-lg font-semibold bg-transparent border-none outline-none text-slate-900 dark:text-white placeholder:text-slate-400"
            />
            
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              placeholder="What do you want to talk about?"
              className="w-full text-sm font-medium bg-transparent border-none outline-none text-slate-800 dark:text-gray-300 placeholder:text-slate-400 resize-none"
              autoFocus
            />
            
            {/* Type Specific Fields */}
            <AnimatePresence>
               {type === 'video' && (
                 <input 
                   value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)}
                   placeholder="Video URL (YouTube/Vimeo)"
                   className="w-full px-4 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                 />
               )}
               {type === 'link' && (
                 <input 
                   value={externalLink} onChange={(e) => setExternalLink(e.target.value)}
                   placeholder="External Link (https://...)"
                   className="w-full px-4 py-2 text-xs rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                 />
               )}
            </AnimatePresence>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 items-center">
               <span className={`text-xs font-bold ${config.color}`}>Tags:</span>
               {tags.map(tag => (
                 <span key={tag} className={`px-2 py-1 ${config.lightBg} ${config.color} rounded text-[10px] font-bold flex items-center gap-1`}>
                   #{tag} <X size={10} onClick={() => removeTag(tag)} className="cursor-pointer" />
                 </span>
               ))}
               <input 
                 value={tagInput}
                 onChange={(e) => setTagInput(e.target.value)}
                 onKeyDown={handleAddTag}
                 placeholder="add tag..."
                 className="bg-transparent border-none outline-none text-xs text-slate-600 w-24"
               />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-white/5">
             <div className="flex items-center gap-2 transition-all">
                {typeOptions.map(opt => (
                  <button 
                    key={opt.id} onClick={() => setType(opt.id)}
                    className={`p-2 rounded-full transition-colors ${type === opt.id ? `${config.lightBg} ${config.color}` : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5'}`}
                  >
                    {opt.icon}
                  </button>
                ))}
             </div>
             
             <div className="flex items-center gap-3">
                {isAdmin && (
                  <div className="flex items-center gap-2 mr-4">
                     <button onClick={() => setIsPinned(!isPinned)} className={`p-3 rounded-xl transition-all ${isPinned ? `${config.color} ${config.bg}/10 border ${config.border}` : 'text-slate-500 border border-transparent'}`}>
                        <Pin size={18} fill={isPinned ? 'currentColor' : 'none'} />
                     </button>
                  </div>
                )}
                <button 
                  onClick={handlePost}
                  disabled={isLoading || !content.trim()}
                  className={`px-8 py-3 rounded-2xl ${config.bg} text-white font-black text-xs uppercase tracking-[0.2em] hover:opacity-90 disabled:opacity-50 transition-all shadow-lg ${config.shadow} active:scale-95`}
                >
                  {isLoading ? 'SYNCING...' : 'INITIATE SIGNAL'}
                </button>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
