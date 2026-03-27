import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Trophy, 
  ChevronLeft, 
  Star, 
  Zap, 
  Users, 
  Clock, 
  Award,
  Filter,
  TrendingUp,
  Search,
  Sparkles
} from 'lucide-react';
import { useSelector } from 'react-redux';

const ContestLeaderboard = () => {
    const { contestId } = useParams();
    const navigate = useNavigate();
    const { user } = useSelector(state => state.auth);
    const [leaderboard, setLeaderboard] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [filter, setFilter] = useState('Weekly'); // Weekly / Monthly / All-time

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await axios.get(`http://localhost:5001/api/coding-contests/leaderboard/${contestId}`, {
                    headers: { Authorization: `Bearer ${user.token}` }
                });
                setLeaderboard(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchLeaderboard();
    }, [contestId, user.token]);

    const getRankStyle = (rank) => {
        if (rank === 1) return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500 shadow-yellow-500/20';
        if (rank === 2) return 'bg-gray-400/10 border-gray-400/30 text-gray-400 shadow-gray-400/20';
        if (rank === 3) return 'bg-orange-800/10 border-orange-800/30 text-orange-800 shadow-orange-800/20';
        return 'bg-gray-900 border-gray-700 text-gray-500';
    };

    return (
        <div className="min-h-screen bg-[#030712] text-white p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-12 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <button 
                            onClick={() => navigate('/coding-arena')}
                            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-[10px] font-black uppercase tracking-widest"
                        >
                            <ChevronLeft size={16} /> Back to Arena
                        </button>
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary-600 rounded-2xl shadow-xl shadow-primary-500/20">
                                <Trophy size={28} />
                            </div>
                            <h1 className="text-4xl font-black uppercase tracking-tighter">Hall of Fame</h1>
                        </div>
                    </div>

                    <div className="flex gap-2 p-1.5 bg-gray-900/50 rounded-2xl border border-gray-800">
                        {['Weekly', 'Monthly', 'All-time'].map(f => (
                            <button 
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Top 3 Cards */}
                {!isLoading && leaderboard.slice(0, 3).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                        {leaderboard.slice(0, 3).map((entry, idx) => (
                           <motion.div 
                             key={entry._id}
                             initial={{ opacity: 0, scale: 0.9 }}
                             animate={{ opacity: 1, scale: 1 }}
                             transition={{ delay: idx * 0.1 }}
                             className={`p-8 rounded-[3rem] border transition-all hover:scale-105 shadow-2xl ${getRankStyle(idx+1)}`}
                           >
                                <div className="flex justify-between items-start mb-6">
                                    <span className="text-3xl font-black">#{idx + 1}</span>
                                    {idx === 0 && <Star fill="currentColor" />}
                                </div>
                                <div className="w-20 h-20 rounded-[1.5rem] bg-black/20 p-1 mb-6">
                                   {entry.userId?.profilePic ? <img src={entry.userId.profilePic} className="w-full h-full object-cover rounded-[1.2rem]"/> : <div className="w-full h-full bg-primary-500 rounded-[1.2rem] flex items-center justify-center text-4xl text-white font-black">{entry.userId?.name?.charAt(0)}</div>}
                                </div>
                                <h3 className="text-xl font-black uppercase tracking-tight truncate">{entry.userId?.name}</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-1 opacity-70 mb-8">{entry.userId?.department || 'Anonymous Dept'}</p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-black/10 rounded-2xl p-4 border border-black/5">
                                        <p className="text-[9px] font-black uppercase opacity-60">Total XP</p>
                                        <p className="text-xl font-black">{entry.totalScore}</p>
                                    </div>
                                    <div className="bg-black/10 rounded-2xl p-4 border border-black/5">
                                        <p className="text-[9px] font-black uppercase opacity-60">Penalty</p>
                                        <p className="text-xl font-black">{entry.penaltyTime}m</p>
                                    </div>
                                </div>
                                
                                {idx === 0 && (
                                    <div className="mt-8 pt-6 border-t border-black/5 flex items-center gap-3">
                                        <Award className="text-yellow-500" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Weekly Winner Badge Earned</span>
                                    </div>
                                )}
                           </motion.div>
                        ))}
                    </div>
                )}

                {/* Full Rankings List */}
                <div className="bg-gray-900/40 rounded-[3rem] border border-gray-800 overflow-hidden shadow-2xl">
                    <div className="grid grid-cols-12 px-10 py-6 border-b border-gray-800 text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                        <div className="col-span-1">Rank</div>
                        <div className="col-span-1"></div>
                        <div className="col-span-4">Student Identity</div>
                        <div className="col-span-2">Department</div>
                        <div className="col-span-2">Penalty / Time</div>
                        <div className="col-span-2 text-right">Total Score</div>
                    </div>

                    {isLoading ? (
                        <div className="p-20 text-center animate-pulse">
                            <Zap size={48} className="mx-auto text-gray-800 mb-4" />
                            <p className="text-gray-500 font-black uppercase tracking-widest">Calculating global standings...</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-800/50">
                            {leaderboard.length > 0 ? leaderboard.map((entry, idx) => (
                                <div key={entry._id} className={`grid grid-cols-12 items-center px-10 py-6 hover:bg-white/5 transition-colors ${entry.userId?._id === user._id ? 'bg-primary-500/5 border-l-4 border-primary-500' : ''}`}>
                                    <div className="col-span-1 text-lg font-black">{idx + 1}</div>
                                    <div className="col-span-1">
                                        <div className="w-10 h-10 rounded-xl bg-gray-800 overflow-hidden border border-gray-700">
                                            {entry.userId?.profilePic ? <img src={entry.userId.profilePic} className="w-full h-full object-cover"/> : <div className="w-full h-full flex items-center justify-center font-black text-sm">{entry.userId?.name?.charAt(0)}</div>}
                                        </div>
                                    </div>
                                    <div className="col-span-4 flex flex-col">
                                        <span className="text-sm font-black uppercase tracking-tight">{entry.userId?.name}</span>
                                        <span className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Global Status: Verified Student</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{entry.userId?.department || 'CSE'}</span>
                                    </div>
                                    <div className="col-span-2 flex items-center gap-2">
                                        <Clock size={14} className="text-gray-600" />
                                        <span className="text-sm font-black tracking-tight">{entry.penaltyTime}m</span>
                                    </div>
                                    <div className="col-span-2 text-right">
                                        <div className="inline-flex items-center gap-2 px-6 py-2 bg-primary-500/10 border border-primary-500/20 text-primary-500 rounded-xl font-black">
                                            {entry.totalScore} 
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="p-32 text-center text-gray-600 uppercase font-black tracking-widest text-[10px]">
                                    Scanning for digital footprints... grid is currently empty.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContestLeaderboard;
