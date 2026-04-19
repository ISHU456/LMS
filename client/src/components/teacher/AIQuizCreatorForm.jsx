import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Brain, Zap, X, Target, BarChart, Settings } from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const AIQuizCreatorForm = ({ onClose, onGenerated }) => {
  const { user } = useSelector(state => state.auth);
  const [formData, setFormData] = useState({
    topic: '',
    numQuestions: 10,
    difficulty: 'medium',
    questionTypes: ['mcq']
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.post('http://localhost:5001/api/gamification/quizzes/generate-ai', formData, config);
      onGenerated(res.data);
      onClose();
    } catch (err) {
      alert("AI Generation failed: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#0b0f1a] border border-white/10 rounded-[2.5rem] p-8 w-full max-w-2xl shadow-2xl relative overflow-hidden"
    >
      {/* Decorative Glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/20 blur-[100px] pointer-events-none" />
      
      <div className="flex items-center justify-between mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <Sparkles size={28} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">AI Quiz Architect</h2>
            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Prompted Neural Generation</p>
          </div>
        </div>
        <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 transition-all">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Brain size={14} className="text-indigo-500" /> Subject / Topic
            </label>
            <input 
              type="text" 
              required
              value={formData.topic}
              onChange={e => setFormData({...formData, topic: e.target.value})}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-5 text-sm font-bold text-white outline-none focus:border-indigo-500 focus:bg-indigo-500/5 transition-all"
              placeholder="e.g. React Hooks, Organic Chemistry, Calculus Limits"
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <Target size={14} className="text-emerald-500" /> Question Count
              </label>
              <input 
                type="number" 
                min="5" max="50"
                value={formData.numQuestions}
                onChange={e => setFormData({...formData, numQuestions: parseInt(e.target.value)})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BarChart size={14} className="text-orange-500" /> Logic Complexity
              </label>
              <select 
                value={formData.difficulty}
                onChange={e => setFormData({...formData, difficulty: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all appearance-none"
              >
                <option value="easy">Level 1: Novice</option>
                <option value="medium">Level 2: Intermediate</option>
                <option value="hard">Level 3: Expert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Settings size={14} className="text-purple-500" /> Structural Constraints
            </label>
            <div className="flex gap-4">
              {['mcq', 'truefalse'].map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    const types = formData.questionTypes.includes(type) 
                      ? formData.questionTypes.filter(t => t !== type)
                      : [...formData.questionTypes, type];
                    if (types.length > 0) setFormData({...formData, questionTypes: types});
                  }}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                    formData.questionTypes.includes(type)
                      ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'
                  }`}
                >
                  {type === 'mcq' ? 'Multi-Choice' : 'True / False'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <button 
          type="submit"
          disabled={isLoading || !formData.topic}
          className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-[1.5rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 disabled:grayscale"
        >
          {isLoading ? (
            <>
              <Zap className="animate-spin" size={20} />
              Architecting Nodes...
            </>
          ) : (
            <>
              <Sparkles size={20} />
              Initialize Generation
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
};

export default AIQuizCreatorForm;
