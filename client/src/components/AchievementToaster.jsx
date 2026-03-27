import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Trophy, Flame, Brain, BookOpen, Zap, CalendarDays } from 'lucide-react';
import { playNotificationSound } from '../utils/soundUtils';

const iconFor = (iconKey) => {
  const common = { size: 16, className: 'shrink-0' };
  switch (iconKey) {
    case 'flame':
      return <Flame {...common} />;
    case 'brain':
      return <Brain {...common} />;
    case 'book':
      return <BookOpen {...common} />;
    case 'calendar':
      return <CalendarDays {...common} />;
    case 'zap':
      return <Zap {...common} />;
    case 'trophy':
      return <Trophy {...common} />;
    case 'sparkle':
    default:
      return <Trophy {...common} />;
  }
};

const AchievementToaster = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const handler = (e) => {
      const ach = e?.detail;
      if (!ach) return;
      const id = `${Date.now()}_${Math.random().toString(16).slice(2)}`;
      setToasts((prev) => [...prev, { ...ach, id }].slice(-5));
      playNotificationSound();
      // Auto-remove
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3500);
    };
    window.addEventListener('smartlms:achievement', handler);
    return () => window.removeEventListener('smartlms:achievement', handler);
  }, []);

  const rendered = useMemo(() => {
    return toasts.map((t) => (
      <motion.div
        key={t.id}
        initial={{ opacity: 0, y: -16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -8, scale: 0.98 }}
        className={`px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-xl flex items-start gap-3 text-white ${t.color || 'bg-gray-900/60 border-white/10'}`}
      >
        <div className="mt-0.5">{iconFor(t.icon)}</div>
        <div className="min-w-0">
          <div className="text-xs font-black uppercase tracking-widest leading-tight">{t.title}</div>
          {t.subtitle ? <div className="text-[11px] text-white/80 font-medium mt-1">{t.subtitle}</div> : null}
        </div>
      </motion.div>
    ));
  }, [toasts]);

  return (
    <div className="fixed top-5 right-5 z-[9999] w-[320px] max-w-[88vw] pointer-events-none">
      <AnimatePresence>{rendered}</AnimatePresence>
    </div>
  );
};

export default AchievementToaster;

