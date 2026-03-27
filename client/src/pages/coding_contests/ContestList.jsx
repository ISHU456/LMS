import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  Clock, 
  Terminal, 
  Award, 
  Zap, 
  ChevronRight, 
  Calendar,
  Layers,
  Sparkles,
  Bot
} from 'lucide-react';
import { useSelector } from 'react-redux';

const ContestList = () => {
  const { user } = useSelector(state => state.auth);
  const [contests, setContests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContests = async () => {
      try {
        const res = await axios.get('http://localhost:5001/api/coding-contests', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        setContests(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchContests();
  }, [user.token]);

  return (
    <div className="min-h-screen bg-[#030712] text-white p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-3 mb-2">
               <div className="p-2 bg-primary-600 rounded-xl">
                 <Terminal size={24} className="text-white" />
               </div>
               <h1 className="text-4xl font-black uppercase tracking-tighter">Coding Arena</h1>
            </div>
            <p className="text-gray-400 font-medium">Weekly coding rounds. Solve. Compete. Earn.</p>
          </motion.div>
          
          <div className="flex gap-4">
            <div className="bg-gray-900/50 border border-gray-800 p-4 rounded-3xl flex items-center gap-4">
               <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                 <Zap size={24} />
               </div>
               <div>
                 <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Contest Rank</p>
                 <p className="text-xl font-black">#42</p>
               </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Banner for Next Contest */}
      <div className="max-w-7xl mx-auto mb-12">
        <div className="relative rounded-[3rem] overflow-hidden bg-gradient-to-br from-primary-600 to-indigo-700 p-12 shadow-2xl shadow-primary-500/20">
          <div className="absolute top-0 right-0 p-12 opacity-10">
            <Trophy size={200} />
          </div>
          <div className="relative z-10 max-w-2xl">
            <span className="px-4 py-1.5 rounded-full bg-white/20 backdrop-blur-md text-[10px] font-black uppercase tracking-widest mb-6 inline-block">Next Round 🎯</span>
            <h2 className="text-5xl font-black mb-4 leading-none uppercase tracking-tighter">Round #24: Data Dominator</h2>
            <p className="text-white/80 text-lg font-medium mb-8">Test your algorithmic prowess with our weekly curated problems. Prizes for Top 10 performers.</p>
            <div className="flex flex-wrap gap-4">
              <button className="px-8 py-4 bg-white text-primary-600 rounded-[2rem] font-black uppercase tracking-widest text-xs hover:scale-105 transition-transform shadow-xl">Register Now</button>
              <div className="flex items-center gap-3 px-6 py-4 bg-black/20 rounded-[2rem] backdrop-blur-md">
                <Clock size={18} />
                <span className="font-black text-sm uppercase">Starts in 2d 14h 22m</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contest Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
           <h3 className="text-2xl font-black uppercase tracking-tight flex items-center gap-3">
             <Layers className="text-primary-500" /> Available Contests
           </h3>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 bg-gray-900/50 rounded-[3rem] animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {contests.length > 0 ? contests.map((contest) => (
              <motion.div 
                key={contest._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="group bg-gray-900/40 border border-gray-800 p-8 rounded-[3rem] hover:bg-gray-800/40 transition-all hover:-translate-y-2 cursor-pointer relative overflow-hidden"
              >
                <div className="flex justify-between items-start mb-6">
                   <div className="p-3 bg-gray-800 rounded-2xl">
                     <Book size={20} className="text-gray-400" />
                   </div>
                   <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${contest.status === 'live' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-gray-800 text-gray-500'}`}>
                     {contest.status}
                   </span>
                </div>
                
                <h4 className="text-xl font-black mb-2 uppercase tracking-tight group-hover:text-primary-400 transition-colors">{contest.title}</h4>
                <div className="flex items-center gap-4 text-gray-500 text-[11px] font-bold mb-8 uppercase tracking-widest">
                  <span className="flex items-center gap-2"><Clock size={14}/> 90 Mins</span>
                  <span className="flex items-center gap-2"><Users size={14}/> {contest.problems?.length} Problems</span>
                </div>

                <Link 
                  to={`/coding-arena/contest/${contest._id}`}
                  className="w-full py-4 bg-gray-800 text-gray-400 font-black text-xs uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 group-hover:bg-primary-600 group-hover:text-white transition-all shadow-lg"
                >
                  Enter Arena <ChevronRight size={16} />
                </Link>
              </motion.div>
            )) : (
              <div className="col-span-full py-20 text-center">
                 <Bot size={48} className="mx-auto text-gray-700 mb-4" />
                 <p className="text-gray-500 font-black uppercase tracking-widest">Scanning for active frequencies... no rounds found.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const Book = ({ size, className }) => <Terminal size={size} className={className} />; // Alias for now

export default ContestList;
