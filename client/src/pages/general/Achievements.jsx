import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSelector } from 'react-redux';
import { 
  Trophy, Flame, Award, Zap, Target, Star, 
  CheckCircle2, Info, ArrowRight, Brain, 
  BookOpen, Calendar, Rocket, Shield, Terminal, 
  Code, Cpu, Laptop
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getGamificationState, getLevelFromXp } from '../../utils/gamificationStore';

const Achievements = () => {
  const { user } = useSelector((state) => state.auth);
  const [state, setState] = useState(null);

  useEffect(() => {
    if (user?._id) {
      setState(getGamificationState(user._id));
    }
  }, [user]);

  const level = getLevelFromXp(state?.xp || 0);
  const nextLevelXp = (level + 1) * 100;
  const progressToNextLevel = ((state?.xp || 0) % 100);

  const badgeInventory = [
    {
      id: 'streak_master',
      title: 'Streak Master',
      requirement: 'Maintain a 7-day learning streak',
      meaning: 'Awarded to students who show exceptional consistency by logging in and learning for 7 consecutive days.',
      icon: Flame,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20'
    },
    {
      id: 'quiz_genius',
      title: 'Quiz Genius',
      requirement: 'Score 90% or above in any quiz',
      meaning: 'Recognizes academic excellence and deep understanding of subject matter through high quiz performance.',
      icon: Brain,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      id: 'consistent_learner',
      title: 'Consistent Learner',
      requirement: '100% attendance for 7 days',
      meaning: 'Given to students who attend all their scheduled classes and lectures over a full week.',
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    },
    {
      id: 'course_completer',
      title: 'Course Completer',
      requirement: 'Finish all materials in a course',
      meaning: 'A prestigious badge for students who complete every lecture, video, and assignment in a specific subject.',
      icon: Award,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      id: 'level_5_climber',
      title: 'Level 5 Climber',
      requirement: 'Reach Level 5',
      meaning: 'Marks a significant milestone in your learning journey as you progress through the SmartLMS ranks.',
      icon: Rocket,
      color: 'text-indigo-500',
      bgColor: 'bg-indigo-500/10',
      borderColor: 'border-indigo-500/20'
    },
    {
      id: 'weekly_winner',
      title: 'Coding Champion',
      requirement: 'Rank #1 in a weekly contest',
      meaning: 'The ultimate mark of a developer. This legendary badge is given only to those who top the weekly coding leaderboard.',
      icon: Trophy,
      color: 'text-primary-500',
      bgColor: 'bg-primary-500/10',
      borderColor: 'border-primary-500/20'
    }
  ];

  const xpRules = [
    { action: 'Complete a Video', xp: '+15 XP', icon: Zap },
    { action: 'Read a PDF/E-book', xp: '+10 XP', icon: BookOpen },
    { action: 'Daily Attendance', xp: '+10 XP', icon: Calendar },
    { action: 'Submit Assignment', xp: '+20 XP', icon: Target },
    { action: 'Pass a Quiz', xp: '+30 XP', icon: Brain }
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#030712] pt-28 pb-20 px-6 md:px-12 lg:px-24">
      <div className="container mx-auto max-w-6xl">
        
        {/* --- HEADER SECTION --- */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 font-bold text-xs uppercase tracking-widest mb-6 border border-primary-200 dark:border-primary-800/50">
              <Trophy size={14} className="text-amber-500" />
              <span>Learning Progress</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white uppercase tracking-tight">
              LMS Rewards & Stats
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-4 font-medium max-w-xl">
              A comprehensive look at our gamified learning system. {user.role !== 'student' ? 'As a ' + user.role + ', you can track your personal interaction stats or monitor how students earn rewards.' : 'Track your academic milestones, earn badges, and level up by staying consistent with your studies.'}
            </p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border border-gray-100 dark:border-gray-800 shadow-xl flex items-center gap-8">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-2xl shadow-primary-500/40">
                {level}
              </div>
              <div className="absolute -bottom-2 -right-2 w-10 h-10 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex items-center justify-center shadow-lg">
                <Star size={20} className="text-amber-500 fill-current" />
              </div>
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Current Level</p>
              <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3">Academic Elite</h3>
              <div className="w-48 h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNextLevel}%` }}
                  className="h-full bg-gradient-to-r from-primary-500 to-indigo-600 rounded-full"
                />
              </div>
              <p className="text-[10px] font-bold text-gray-500 mt-2 uppercase tracking-widest">
                {state?.xp || 0} / {nextLevelXp} XP to Level {level + 1}
              </p>
            </div>
          </div>
        </div>

        {/* --- STATS GRID --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 border border-gray-100 dark:border-gray-800 shadow-xl group hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 mb-8 group-hover:scale-110 transition-transform">
              <Flame size={32} className="fill-current" />
            </div>
            <h4 className="text-4xl font-black text-gray-900 dark:text-white mb-2">{state?.streakDays || 0}</h4>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Day Streak</p>
          </div>
          
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 border border-gray-100 dark:border-gray-800 shadow-xl group hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 mb-8 group-hover:scale-110 transition-transform">
              <Award size={32} className="fill-current" />
            </div>
            <h4 className="text-4xl font-black text-gray-900 dark:text-white mb-2">{state?.badges?.length || 0}</h4>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Badges Earned</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-10 border border-gray-100 dark:border-gray-800 shadow-xl group hover:-translate-y-2 transition-all duration-300">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 mb-8 group-hover:scale-110 transition-transform">
              <Zap size={32} className="fill-current" />
            </div>
            <h4 className="text-4xl font-black text-gray-900 dark:text-white mb-2">{state?.xp || 0}</h4>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Total Experience</p>
          </div>
        </div>

        {/* --- BADGE SHOWCASE --- */}
        <div className="mb-16">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-10 flex items-center gap-4">
            Badge Meaning & Legend
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {badgeInventory.map((badge) => {
              const isEarned = state?.badges?.includes(badge.id);
              return (
                <div 
                  key={badge.id}
                  className={`bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border ${badge.borderColor} shadow-xl relative overflow-hidden group transition-all duration-500 ${!isEarned && 'opacity-60 grayscale'}`}
                >
                  <div className={`w-16 h-16 rounded-2xl ${badge.bgColor} ${badge.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10`}>
                    <badge.icon size={32} className={isEarned ? 'fill-current' : ''} />
                  </div>
                  
                  <h3 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-3 relative z-10">
                    {badge.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 font-medium leading-relaxed mb-6 relative z-10">
                    {badge.meaning}
                  </p>
                  
                  <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between relative z-10">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Requirement</p>
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-300">{badge.requirement}</p>
                    </div>
                    {isEarned ? (
                      <div className="px-3 py-1 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Unlocked
                      </div>
                    ) : (
                      <div className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-400 rounded-full text-[10px] font-black uppercase tracking-widest">
                        Locked
                      </div>
                    )}
                  </div>

                  {/* Decorative background element */}
                  <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full ${badge.bgColor} blur-3xl opacity-20 group-hover:opacity-40 transition-opacity`} />
                </div>
              );
            })}
          </div>
        </div>

        {/* --- CODING ARENA MERGER --- */}
        <div className="mb-16">
          <div className="relative rounded-[3.5rem] overflow-hidden bg-[#030712] border border-gray-800 p-12 shadow-2xl group">
             <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-110 transition-transform duration-1000">
                <Terminal size={300} />
             </div>
             
             <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
                <div className="max-w-xl">
                   <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-full bg-primary-600/10 border border-primary-500/20 text-primary-500 text-xs font-black uppercase tracking-[0.2em] mb-8">
                      <Terminal size={14} />
                      Competitive Zone
                   </div>
                   <h2 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter mb-6 leading-none">
                      Weekly Coding <br/><span className="text-primary-500">Matrix Arena</span>
                   </h2>
                   <p className="text-gray-400 font-medium text-lg leading-relaxed mb-10">
                      Step into the arena to test your algorithmic speed. Participate in weekly rounds to earn **Coding Points**, rare badges, and increase your global developer rank.
                   </p>
                   
                   <div className="grid grid-cols-2 gap-8 mb-12">
                       <div>
                          <p className="text-3xl font-black text-white">100+</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Avg Points / Round</p>
                       </div>
                       <div>
                          <p className="text-3xl font-black text-white">42.8k</p>
                          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Live Global Rank</p>
                       </div>
                   </div>

                   <Link 
                     to="/coding-arena"
                     className="inline-flex items-center gap-4 px-10 py-5 bg-primary-600 text-white font-black uppercase tracking-widest text-sm rounded-[2rem] hover:bg-primary-500 transition-all shadow-xl shadow-primary-500/20 group"
                   >
                     Enter The Arena 
                     <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                   </Link>
                </div>

                <div className="flex-1 grid grid-cols-2 gap-4">
                   {[
                      { icon: <Code size={24}/>, label: 'Logic Puzzles' },
                      { icon: <Cpu size={24}/>, label: 'System Design' },
                      { icon: <Laptop size={24}/>, label: 'Global Rank' },
                      { icon: <Award size={24}/>, label: 'Tech Badges' },
                   ].map((item, i) => (
                      <div key={i} className="bg-white/5 border border-white/5 p-8 rounded-[2rem] flex flex-col items-center justify-center gap-4 hover:bg-white/10 transition-colors">
                         <div className="text-primary-500">{item.icon}</div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{item.label}</span>
                      </div>
                   ))}
                </div>
             </div>
          </div>
        </div>

        {/* --- HOW TO EARN XP --- */}
        <div className="bg-gradient-to-br from-primary-600 to-indigo-700 rounded-[3rem] p-12 text-white shadow-2xl shadow-primary-500/20 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-6">How to Earn XP?</h2>
              <p className="text-white/80 font-medium mb-10 leading-relaxed">
                Experience points (XP) are awarded for every productive action you take in SmartLMS. 
                Consistent participation not only increases your level but also prepares you for exams.
              </p>
              <div className="space-y-4">
                {xpRules.map((rule, i) => (
                  <div key={i} className="flex items-center gap-4 p-4 bg-white/10 rounded-2xl backdrop-blur-md border border-white/10">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <rule.icon size={20} />
                    </div>
                    <span className="flex-1 font-bold">{rule.action}</span>
                    <span className="font-black text-amber-400">{rule.xp}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white/10 backdrop-blur-xl rounded-[2.5rem] p-10 border border-white/20">
              <h3 className="text-xl font-black uppercase tracking-tight mb-8 flex items-center gap-3">
                <Shield size={24} />
                Gamification Rules
              </h3>
              <ul className="space-y-6">
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-amber-400 flex-shrink-0 flex items-center justify-center text-primary-900 font-black text-xs">1</div>
                  <p className="text-sm font-medium text-white/90">Streaks are reset if you don't log in for more than 24 hours.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-amber-400 flex-shrink-0 flex items-center justify-center text-primary-900 font-black text-xs">2</div>
                  <p className="text-sm font-medium text-white/90">XP is calculated based on active engagement, not just clicks.</p>
                </li>
                <li className="flex gap-4">
                  <div className="w-6 h-6 rounded-full bg-amber-400 flex-shrink-0 flex items-center justify-center text-primary-900 font-black text-xs">3</div>
                  <p className="text-sm font-medium text-white/90">Some special badges are awarded manually by faculty for outstanding performance.</p>
                </li>
              </ul>
            </div>
          </div>

          {/* Background Decorative Circles */}
          <div className="absolute top-[-10%] left-[-5%] w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 rounded-full bg-white/5 blur-3xl" />
        </div>

      </div>
    </div>
  );
};

export default Achievements;
