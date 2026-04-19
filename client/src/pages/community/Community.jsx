import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, Search, Filter, Pin, Star, AlertTriangle, CalendarDays,
  Eye, ThumbsUp, Heart, MessageCircle, Share2, Download, FileText,
  ChevronDown, X, Plus, Megaphone, Trophy, Zap, Clock, MapPin,
  Users, Tag, CheckCircle, RefreshCw, BellRing, Volume2, VolumeX,
  ChevronRight, Flame, TrendingUp, Sparkles, Send, Paperclip, Image
} from 'lucide-react';

/* ─── Static rich demo data ─── */
const DEMO = [
  {
    id: 1, variant: 'critical', category: 'Academic', priority: 'critical',
    pinned: false, important: true,
    title: 'Final Exam Schedule Released',
    content: 'Semester examinations will be held from Dec 10–25. All students must download the timetable and report to examination halls 30 minutes early. Biometric attendance is mandatory.',
    tags: ['#exams', '#notice', '#urgent'],
    attachments: [{ name: 'timetable.pdf', type: 'pdf' }, { name: 'instructions.pdf', type: 'pdf' }],
    reactions: { like: 45, heart: 23, fire: 14 }, comments: 12, views: 1240,
    createdAt: new Date(Date.now() - 2 * 60 * 1000), author: 'Dean Academics', authorInitials: 'DA',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
  },
  {
    id: 2, variant: 'pinned', category: 'Events', priority: 'normal',
    pinned: true, important: false,
    title: 'College Fest 2024 — Register Now!',
    content: 'Annual College Festival from Jan 15–20 2025. Cultural performances, sports events, technical hackathons and more. Registration closes Jan 10.',
    tags: ['#fest', '#cultural', '#sports'],
    attachments: [],
    reactions: { like: 120, heart: 67, fire: 89 }, comments: 45, views: 3800,
    createdAt: new Date(Date.now() - 30 * 60 * 1000), author: 'Student Affairs', authorInitials: 'SA',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
  },
  {
    id: 3, variant: 'event', category: 'Lectures', priority: 'normal',
    pinned: false, important: false,
    title: 'Guest Lecture: AI in Healthcare',
    content: 'Dr. Priya Sharma from IIT Delhi will be speaking on practical AI applications in medical diagnostics. Open to all students.',
    tags: ['#AI', '#guestlecture', '#CS'],
    attachments: [{ name: 'abstract.pdf', type: 'pdf' }],
    reactions: { like: 34, heart: 19, fire: 22 }, comments: 8, views: 560,
    createdAt: new Date(Date.now() - 60 * 60 * 1000), author: 'CS Department', authorInitials: 'CS',
    eventDate: new Date(Date.now() + 24 * 60 * 60 * 1000), venue: 'Main Auditorium',
    duration: '2h', going: 45
  },
  {
    id: 4, variant: 'achievement', category: 'Achievements', priority: 'normal',
    pinned: false, important: false,
    title: 'Our Team Won Hackathon 2024!',
    content: 'Team ByteStorm from our CS department clinched first place at National Hackathon 2024 with their AI-powered disaster management system. 5 students selected for nationals.',
    tags: ['#hackathon', '#proud', '#CS'],
    attachments: [],
    reactions: { like: 89, heart: 112, fire: 63 }, comments: 34, views: 4200,
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000), author: 'Principal Office', authorInitials: 'PO',
  },
  {
    id: 5, variant: 'critical', category: 'Administration', priority: 'high',
    pinned: false, important: true,
    title: 'Fee Submission Deadline Extended',
    content: 'Due to the ongoing system maintenance, the fee submission deadline has been extended from Nov 30 to Dec 5. Please ensure payment before the new deadline.',
    tags: ['#fees', '#deadline', '#admin'],
    attachments: [{ name: 'fee_schedule.pdf', type: 'pdf' }],
    reactions: { like: 67, heart: 12, fire: 5 }, comments: 21, views: 2100,
    createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000), author: 'Accounts Office', authorInitials: 'AO',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  },
  {
    id: 6, variant: 'event', category: 'Workshops', priority: 'normal',
    pinned: false, important: false,
    title: 'Full-Stack Web Dev Workshop',
    content: 'A 3-day intensive workshop on React, Node.js, and MongoDB. Bring your laptops. Certificate awarded on completion.',
    tags: ['#workshop', '#webdev', '#coding'],
    attachments: [],
    reactions: { like: 55, heart: 28, fire: 41 }, comments: 15, views: 890,
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), author: 'Tech Club', authorInitials: 'TC',
    eventDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), venue: 'Lab Block 3',
    duration: '3 days', going: 78
  },
];

const CATEGORIES = ['All', 'Academic', 'Events', 'Lectures', 'Achievements', 'Administration', 'Workshops'];
const PRIORITIES = ['All', 'critical', 'high', 'normal'];

/* ─── Helpers ─── */
const timeAgo = (date) => {
  const diff = Date.now() - new Date(date).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
};

const deadlinePercent = (deadline) => {
  if (!deadline) return 0;
  const total = new Date(deadline) - Date.now() + 7 * 86400000;
  const remaining = new Date(deadline) - Date.now();
  return Math.max(0, Math.min(100, (remaining / total) * 100));
};

const variantConfig = {
  critical: { bg: 'from-red-500/10 to-orange-500/5', border: 'border-red-400/30', badge: 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400', icon: '🔴', label: 'CRITICAL' },
  pinned: { bg: 'from-indigo-500/10 to-purple-500/5', border: 'border-indigo-400/30', badge: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400', icon: '📌', label: 'PINNED' },
  event: { bg: 'from-emerald-500/10 to-teal-500/5', border: 'border-emerald-400/30', badge: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400', icon: '🎉', label: 'EVENT' },
  achievement: { bg: 'from-amber-500/10 to-yellow-500/5', border: 'border-amber-400/30', badge: 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400', icon: '🏆', label: 'ACHIEVEMENT' },
};

const categoryIcon = { Academic: '📚', Events: '🎪', Lectures: '🎤', Achievements: '🏅', Administration: '🏛️', Workshops: '🛠️' };

/* ─── Reaction Button ─── */
const ReactionBtn = ({ emoji, count, onClick }) => {
  const [animated, setAnimated] = useState(false);
  const handle = () => { setAnimated(true); setTimeout(() => setAnimated(false), 400); onClick?.(); };
  return (
    <button onClick={handle} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all text-xs font-bold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 group">
      <motion.span animate={animated ? { scale: [1, 1.6, 1] } : {}} transition={{ duration: 0.4 }} className="text-base leading-none">{emoji}</motion.span>
      <span>{count}</span>
    </button>
  );
};

/* ─── Skeleton Loader ─── */
const SkeletonCard = () => (
  <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 animate-pulse">
    <div className="flex gap-2 mb-3"><div className="h-5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full"/><div className="h-5 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"/></div>
    <div className="h-5 w-3/4 bg-gray-200 dark:bg-gray-700 rounded mb-2"/>
    <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded mb-1"/>
    <div className="h-3 w-5/6 bg-gray-100 dark:bg-gray-800 rounded mb-4"/>
    <div className="flex gap-2"><div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded-lg"/><div className="h-7 w-14 bg-gray-200 dark:bg-gray-700 rounded-lg"/><div className="h-7 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg ml-auto"/></div>
  </div>
);

/* ─── Announcement Card ─── */
const AnnouncementCard = ({ ann, onReact }) => {
  const [expanded, setExpanded] = useState(false);
  const cfg = variantConfig[ann.variant] || variantConfig.critical;
  const pct = deadlinePercent(ann.deadline);
  const isNew = Date.now() - new Date(ann.createdAt) < 5 * 60 * 1000;

  return (
    <motion.div layout initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ duration: 0.35 }}
      className={`relative rounded-2xl border bg-gradient-to-br ${cfg.bg} ${cfg.border} bg-white dark:bg-gray-900/90 backdrop-blur-sm overflow-hidden group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 cursor-pointer`}>
      
      {/* Live pulse for new */}
      {isNew && <span className="absolute top-4 left-4 flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"/><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"/></span>}
      
      {/* Pinned stripe */}
      {ann.pinned && <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"/>}

      <div className="p-5">
        {/* Header Row */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${cfg.badge}`}>
              {cfg.icon} {cfg.label}
            </span>
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{ann.category && categoryIcon[ann.category]} {ann.category}</span>
            {ann.important && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400"><Star size={9} fill="currentColor"/> IMPORTANT</span>}
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[10px] font-bold text-gray-400">{timeAgo(ann.createdAt)}</span>
            <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 transition-colors"><Share2 size={13}/></button>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-black text-gray-900 dark:text-white mb-2 group-hover:text-[#4361ee] transition-colors leading-snug">{ann.title}</h3>

        {/* Content */}
        <p className={`text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3 ${expanded ? '' : 'line-clamp-2'}`}>{ann.content}</p>
        {ann.content.length > 120 && (
          <button onClick={e => { e.stopPropagation(); setExpanded(!expanded); }} className="text-[11px] font-black text-[#4361ee] uppercase tracking-widest mb-3 hover:underline">
            {expanded ? 'Show Less ↑' : 'Read More ↓'}
          </button>
        )}

        {/* Event info */}
        {ann.variant === 'event' && ann.eventDate && (
          <div className="flex flex-wrap gap-3 mb-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400"><CalendarDays size={13}/>{new Date(ann.eventDate).toLocaleDateString('en', { weekday:'short', month:'short', day:'numeric' })} {new Date(ann.eventDate).toLocaleTimeString('en', { hour:'2-digit', minute:'2-digit' })}</span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400"><Clock size={13}/>{ann.duration}</span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400"><Users size={13}/>{ann.going} going</span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-400"><MapPin size={13}/>{ann.venue}</span>
          </div>
        )}

        {/* Tags */}
        {ann.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {ann.tags.map(t => <span key={t} className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full hover:bg-[#4361ee]/10 hover:text-[#4361ee] transition-colors cursor-pointer">{t}</span>)}
          </div>
        )}

        {/* Attachments */}
        {ann.attachments?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {ann.attachments.map(a => (
              <button key={a.name} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800/30 text-[10px] font-bold hover:bg-blue-100 transition-colors">
                <FileText size={11}/> {a.name} <Download size={10}/>
              </button>
            ))}
          </div>
        )}

        {/* Deadline progress */}
        {ann.deadline && pct > 0 && (
          <div className="mb-3">
            <div className="flex justify-between text-[9px] font-bold text-gray-400 uppercase mb-1">
              <span>Deadline: {new Date(ann.deadline).toLocaleDateString()}</span>
              <span className={pct < 30 ? 'text-red-500' : 'text-emerald-500'}>{Math.round(pct)}% time left</span>
            </div>
            <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }}
                className={`h-full rounded-full ${pct < 30 ? 'bg-red-500' : pct < 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}/>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800 gap-2 flex-wrap">
          {/* Author */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#4361ee] to-[#f72585] flex items-center justify-center text-white text-[9px] font-black shrink-0">{ann.authorInitials}</div>
            <span className="text-[10px] font-black uppercase text-gray-500 dark:text-gray-400">{ann.author}</span>
          </div>

          {/* Stats + Reactions */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400"><Eye size={12}/>{ann.views >= 1000 ? `${(ann.views/1000).toFixed(1)}k` : ann.views}</span>
            <span className="flex items-center gap-1 text-[10px] font-bold text-gray-400"><MessageCircle size={12}/>{ann.comments}</span>
            <ReactionBtn emoji="👍" count={ann.reactions.like} onClick={() => onReact?.(ann.id, 'like')}/>
            <ReactionBtn emoji="❤️" count={ann.reactions.heart} onClick={() => onReact?.(ann.id, 'heart')}/>
            <ReactionBtn emoji="🔥" count={ann.reactions.fire} onClick={() => onReact?.(ann.id, 'fire')}/>
          </div>
        </div>

        {/* Variant-specific CTA buttons */}
        <div className="flex gap-2 mt-3">
          {ann.variant === 'pinned' && <>
            <button className="flex-1 py-2 rounded-xl border border-[#4361ee] text-[#4361ee] text-[11px] font-black uppercase tracking-widest hover:bg-[#4361ee]/10 transition-colors">View Details</button>
            <button className="flex-1 py-2 rounded-xl bg-[#4361ee] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#3651d4] transition-colors flex items-center justify-center gap-1">Register <ChevronRight size={12}/></button>
          </>}
          {ann.variant === 'event' && <>
            <button className="flex-1 py-2 rounded-xl border border-emerald-500 text-emerald-600 text-[11px] font-black uppercase tracking-widest hover:bg-emerald-50 transition-colors">Interested</button>
            <button className="flex-1 py-2 rounded-xl bg-emerald-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors flex items-center justify-center gap-1"><Bell size={11}/> Remind Me</button>
          </>}
          {ann.variant === 'achievement' && (
            <button className="py-2 px-4 rounded-xl bg-amber-500 text-white text-[11px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors flex items-center gap-1.5"><Trophy size={12}/> View Team</button>
          )}
          {ann.variant === 'critical' && (
            <button className="py-2 px-4 rounded-xl bg-[#4361ee] text-white text-[11px] font-black uppercase tracking-widest hover:bg-[#3651d4] transition-colors flex items-center gap-1.5"><Download size={12}/> Download</button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

/* ═══════════════════════════════════════════════
   MAIN PAGE
═══════════════════════════════════════════════ */
const Community = () => {
  const { user } = useSelector(state => state.auth);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePriority, setActivePriority] = useState('All');
  const [showCreate, setShowCreate] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [newBanner, setNewBanner] = useState(true);
  const [reactions, setReactions] = useState({});
  const [mobileFilters, setMobileFilters] = useState(false);
  const feedRef = useRef(null);

  const isAdmin = user?.role === 'admin' || user?.role === 'hod';

  // Load demo data + try real API
  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/announcements');
        if (res.data?.length) {
          setAnnouncements(res.data);
        } else {
          setAnnouncements(DEMO);
        }
      } catch {
        setAnnouncements(DEMO);
      } finally {
        setIsLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleReact = (id, type) => {
    setReactions(prev => ({
      ...prev,
      [`${id}-${type}`]: (prev[`${id}-${type}`] || 0) + 1
    }));
  };

  const filtered = announcements.filter(a => {
    if (activeCategory !== 'All' && a.category !== activeCategory) return false;
    if (activePriority !== 'All' && a.priority !== activePriority) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.content.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const pinnedCount = announcements.filter(a => a.pinned).length;
  const criticalCount = announcements.filter(a => a.variant === 'critical').length;
  const importantCount = announcements.filter(a => a.important).length;
  const totalViews = announcements.reduce((s, a) => s + (a.views || 0), 0);

  const STATS = [
    { label: 'Total', value: announcements.length, icon: '📢', color: 'from-blue-500 to-indigo-600' },
    { label: 'Important', value: importantCount, icon: '⭐', color: 'from-yellow-400 to-amber-500' },
    { label: 'Critical', value: criticalCount, icon: '🔴', color: 'from-red-500 to-rose-600' },
    { label: 'Pinned', value: pinnedCount, icon: '📌', color: 'from-purple-500 to-violet-600' },
    { label: 'Views', value: totalViews >= 1000 ? `${(totalViews/1000).toFixed(1)}k` : totalViews, icon: '👁️', color: 'from-teal-400 to-emerald-600' },
  ];

  return (
    <div className="flex-1 bg-[var(--bg-light)] dark:bg-[var(--bg-dark)] overflow-auto transition-colors duration-500" style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* ── New Announcement Banner ── */}
      <AnimatePresence>
        {newBanner && (
          <motion.div initial={{ y: -60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -60, opacity: 0 }}
            className="sticky top-0 z-50 flex items-center justify-between px-5 py-2.5 bg-gradient-to-r from-[#4361ee] to-[#f72585] text-white text-xs font-bold">
            <span className="flex items-center gap-2"><span className="flex h-2 w-2 relative"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white/60"/><span className="relative inline-flex rounded-full h-2 w-2 bg-white"/></span>3 new announcements since your last visit</span>
            <button onClick={() => setNewBanner(false)} className="p-1 hover:bg-white/20 rounded-lg transition-colors"><X size={14}/></button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto px-4 md:px-8 py-6">

        {/* ── Hero Header ── */}
        <div className="relative rounded-3xl overflow-hidden mb-8 bg-gradient-to-br from-primary-600 to-indigo-700 dark:from-primary-600/20 dark:to-indigo-900/20 shadow-xl border border-white/10">
          <div className="absolute inset-0 opacity-20">
            {[...Array(8)].map((_, i) => (
              <motion.div key={i} className="absolute rounded-full bg-white/30"
                style={{ width: 40 + i * 20, height: 40 + i * 20, top: `${(i * 13) % 90}%`, left: `${(i * 17) % 90}%` }}
                animate={{ y: [0, -20, 0], opacity: [0.2, 0.5, 0.2] }}
                transition={{ duration: 3 + i, repeat: Infinity, ease: 'easeInOut' }}/>
            ))}
          </div>
          <div className="relative z-10 px-6 md:px-10 py-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-white"><Megaphone size={22}/></div>
                  <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter">Announcement Center</h1>
                </div>
                <div className="relative overflow-hidden w-72 h-0.5 bg-white/30 mb-3 rounded-full">
                  <motion.div className="absolute inset-y-0 left-0 bg-white rounded-full" animate={{ x: [-300, 300] }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}/>
                </div>
                <p className="text-white/80 text-sm font-medium">Stay updated with the latest college notifications & events</p>
              </div>
              <div className="flex items-center gap-3">
                <button onClick={() => setSoundOn(!soundOn)} className="p-3 rounded-2xl bg-white/20 text-white hover:bg-white/30 transition-colors">
                  {soundOn ? <Volume2 size={18}/> : <VolumeX size={18}/>}
                </button>
                <button onClick={() => setSubscribed(!subscribed)}
                  className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${subscribed ? 'bg-white text-[#764ba2]' : 'bg-white/20 text-white hover:bg-white/30'}`}>
                  <BellRing size={15}/>{subscribed ? 'Subscribed ✓' : 'Subscribe'}
                  {!subscribed && <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse"/>}
                </button>
                {isAdmin && (
                  <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[#f72585] text-white font-black text-xs uppercase tracking-widest hover:bg-[#d61a6f] transition-colors shadow-lg">
                    <Plus size={15}/> New Post
                  </button>
                )}
              </div>
            </div>

            {/* Search + Filters */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60"/>
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search announcements…"
                  className="w-full pl-10 pr-4 py-3 rounded-2xl bg-white/20 text-white placeholder:text-white/50 text-sm font-medium outline-none border border-white/20 focus:bg-white/30 transition-all"/>
              </div>
              <select value={activeCategory} onChange={e => setActiveCategory(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-white/20 text-white text-xs font-bold outline-none border border-white/20 capitalize cursor-pointer">
                {CATEGORIES.map(c => <option key={c} value={c} className="text-gray-900">{c}</option>)}
              </select>
              <select value={activePriority} onChange={e => setActivePriority(e.target.value)}
                className="px-4 py-3 rounded-2xl bg-white/20 text-white text-xs font-bold outline-none border border-white/20 capitalize cursor-pointer">
                {PRIORITIES.map(p => <option key={p} value={p} className="text-gray-900 capitalize">{p === 'All' ? 'All Priorities' : p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Quick Stats Strip ── */}
        <div className="flex gap-4 overflow-x-auto pb-2 mb-8 no-scrollbar">
          {STATS.map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}
              className="shrink-0 flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center text-lg`}>{s.icon}</div>
              <div>
                <p className="text-[9px] font-black uppercase tracking-widest text-gray-400">{s.label}</p>
                <p className="text-xl font-black text-gray-900 dark:text-white leading-none">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* ── Main Split Layout ── */}
        <div className="flex gap-6">

          {/* ── Left Filter Panel ── */}
          <aside className="hidden lg:flex flex-col gap-4 w-72 shrink-0 sticky top-4 self-start max-h-[calc(100vh-100px)] overflow-y-auto pr-2 custom-scrollbar">
            {/* Category filters */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Tag size={14} className="text-[#4361ee]"/>
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">Categories</span>
              </div>
              <div className="p-2 space-y-0.5">
                {CATEGORIES.map(c => (
                  <button key={c} onClick={() => setActiveCategory(c)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${activeCategory === c ? 'bg-[#4361ee] text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}>
                    <span className="flex items-center gap-2">{c !== 'All' && categoryIcon[c]} {c}</span>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${activeCategory === c ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'}`}>
                      {c === 'All' ? announcements.length : announcements.filter(a => a.category === c).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Priority filters */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden shadow-sm">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
                <Flame size={14} className="text-red-500"/>
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">Priority</span>
              </div>
              <div className="p-2 space-y-0.5">
                {PRIORITIES.map(p => {
                  const colors = { critical: 'text-red-500', high: 'text-orange-500', normal: 'text-blue-500', All: 'text-gray-500' };
                  return (
                    <button key={p} onClick={() => setActivePriority(p)}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all capitalize ${activePriority === p ? 'bg-[#4361ee] text-white' : `text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800`}`}>
                      <span className="text-sm">{p === 'critical' ? '🔴' : p === 'high' ? '🟠' : p === 'normal' ? '🔵' : '🌐'}</span>
                      {p === 'All' ? 'All Priorities' : p}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tags cloud */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-[#f72585]"/>
                <span className="text-[11px] font-black uppercase tracking-widest text-gray-600 dark:text-gray-300">Trending Tags</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {['#exams','#fest','#AI','#coding','#deadline','#sports','#workshop','#proud'].map(t => (
                  <button key={t} onClick={() => setSearch(t.slice(1))}
                    className="text-[9px] font-black uppercase tracking-widest px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 rounded-full hover:bg-[#4361ee]/10 hover:text-[#4361ee] transition-colors">{t}</button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Right Feed ── */}
          <div ref={feedRef} className="flex-1 min-w-0 space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto pr-2 custom-scrollbar">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden flex items-center gap-2 mb-2">
              <button onClick={() => setMobileFilters(!mobileFilters)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--surface-light)] dark:bg-[var(--surface-dark)] border border-gray-100 dark:border-gray-800 text-xs font-black uppercase text-gray-600 dark:text-gray-300 shadow-sm transition-colors">
                <Filter size={13}/> Filters {activeCategory !== 'All' || activePriority !== 'All' ? '•' : ''}
              </button>
              <span className="text-xs text-gray-400 font-bold">{filtered.length} results</span>
            </div>
            <AnimatePresence>
              {mobileFilters && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                  className="lg:hidden overflow-hidden">
                  <div className="flex gap-2 flex-wrap p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 mb-3">
                    {CATEGORIES.map(c => (
                      <button key={c} onClick={() => setActiveCategory(c)}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCategory === c ? 'bg-[#4361ee] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>{c}</button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Feed */}
            {isLoading ? (
              <div className="space-y-4">{[1,2,3].map(i => <SkeletonCard key={i}/>)}</div>
            ) : filtered.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">No Announcements Found</h3>
                <p className="text-sm text-gray-400 mb-6">Try a different filter or search term.</p>
                <button onClick={() => { setSearch(''); setActiveCategory('All'); setActivePriority('All'); }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4361ee] text-white font-black text-xs uppercase"><RefreshCw size={13}/> Reset Filters</button>
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                {filtered.map((ann, i) => (
                  <motion.div key={ann.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.05 }}>
                    <AnnouncementCard ann={ann} onReact={handleReact}/>
                  </motion.div>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </div>

      {/* ── Create Announcement Modal ── */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800">
              <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <div className="flex items-center gap-3">
                  <Megaphone size={18} className="text-white"/>
                  <span className="font-black uppercase text-white tracking-wider text-sm">New Announcement</span>
                </div>
                <button onClick={() => setShowCreate(false)} className="p-1.5 rounded-lg bg-white/20 text-white hover:bg-white/30 transition-colors"><X size={16}/></button>
              </div>
              <div className="p-6 space-y-4">
                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-700 dark:text-gray-300 outline-none focus:border-[#4361ee] transition-colors">
                  {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
                </select>
                <input placeholder="Announcement Title…" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white placeholder:text-gray-400 outline-none focus:border-[#4361ee] transition-colors"/>
                <textarea rows={4} placeholder="Write your announcement content here…" className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 placeholder:text-gray-400 outline-none focus:border-[#4361ee] transition-colors resize-none"/>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-colors"><Paperclip size={13}/> Attach File</button>
                  <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-colors"><Image size={13}/> Image</button>
                  <label className="flex items-center gap-2 ml-auto cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 accent-[#4361ee]"/>
                    <span className="text-xs font-bold text-gray-600 dark:text-gray-400">Mark as Important</span>
                  </label>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowCreate(false)} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-black uppercase text-gray-600 dark:text-gray-400 hover:bg-gray-50 transition-colors">Cancel</button>
                  <button className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#4361ee] to-[#764ba2] text-white text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#4361ee]/30">
                    <Send size={13}/> Publish
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 5px;
          }
          .custom-scrollbar::-webkit-scrollbar-track {
            background: transparent;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #4361ee30;
            border-radius: 10px;
            transition: all 0.3s;
          }
          .dark .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #ffffff15;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #4361ee80;
          }
          .custom-scrollbar {
            scrollbar-width: thin;
            scrollbar-color: #4361ee30 transparent;
          }
        `}
      </style>
    </div>
  );
};

export default Community;
