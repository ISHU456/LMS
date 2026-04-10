import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Save, X, Brain, Clock, 
  Target, Zap, Shield, HelpCircle, ChevronDown, ChevronUp 
} from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const QuizGenerator = ({ onClose, onSave }) => {
  const { user } = useSelector(state => state.auth);
  const [quizForm, setQuizForm] = useState({
    title: '',
    description: '',
    category: 'General',
    timeLimit: 15,
    idealTime: 10,
    totalPoints: 100,
    coinsReward: {
      base: 10,
      fullMarksBonus: 20,
      speedBonusMultiplier: 1.5
    },
    questions: [
      { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }
    ]
  });

  const [isLoading, setIsLoading] = useState(false);

  const addQuestion = () => {
    setQuizForm({
      ...quizForm,
      questions: [...quizForm.questions, { question: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '' }]
    });
  };

  const removeQuestion = (index) => {
    const newQuestions = quizForm.questions.filter((_, i) => i !== index);
    setQuizForm({ ...quizForm, questions: newQuestions });
  };

  const handleQuestionChange = (index, field, value) => {
    const newQuestions = [...quizForm.questions];
    newQuestions[index][field] = value;
    setQuizForm({ ...quizForm, questions: newQuestions });
  };

  const handleOptionChange = (qIndex, oIndex, value) => {
    const newQuestions = [...quizForm.questions];
    newQuestions[qIndex].options[oIndex] = value;
    setQuizForm({ ...quizForm, questions: newQuestions });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.post('http://localhost:5001/api/gamification/quizzes', quizForm, config);
      alert("Neural Quiz Node Deployed!");
      if (onSave) onSave();
      if (onClose) onClose();
    } catch (err) {
      alert("Deployment failure: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[6000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
    >
      <motion.div 
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0b0f1a] border border-white/10 rounded-[2.5rem] w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        {/* Header */}
        <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]">
              <Brain size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Quiz Generator Core</h2>
              <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-1">Configure Logic & Rewards</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Basic Config */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-6">
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Quiz Title</label>
                <input 
                  type="text" 
                  required
                  value={quizForm.title}
                  onChange={e => setQuizForm({...quizForm, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all"
                  placeholder="e.g. Advanced Neural Architectures"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-500 uppercase tracking-widest mb-3">Description</label>
                <textarea 
                  value={quizForm.description}
                  onChange={e => setQuizForm({...quizForm, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all h-24 resize-none"
                  placeholder="Briefly describe the parameters..."
                />
              </div>
            </div>
            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 space-y-6">
               <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Zap size={14}/> Reward Logic</h3>
               <div className="space-y-4">
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block">Base Coins</label>
                    <input type="number" value={quizForm.coinsReward.base} onChange={e => setQuizForm({...quizForm, coinsReward: {...quizForm.coinsReward, base: parseInt(e.target.value)}})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none" />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-gray-400 uppercase mb-2 block">Ideal Time (Min)</label>
                    <input type="number" value={quizForm.idealTime} onChange={e => setQuizForm({...quizForm, idealTime: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none" />
                  </div>
                  <div className="p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/20">
                     <p className="text-[8px] font-black text-gray-500 uppercase leading-relaxed uppercase italic tracking-widest">Speed Bonus Active: Users faster than ideal time receive {quizForm.coinsReward.speedBonusMultiplier}x multiplier.</p>
                  </div>
               </div>
            </div>
          </div>

          <div className="h-px bg-white/5" />

          {/* Questions List */}
          <div className="space-y-8">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-3">
                <HelpCircle size={18} className="text-indigo-500" /> Question Blocks
              </h3>
              <button 
                type="button"
                onClick={addQuestion}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-500 transition-all flex items-center gap-2"
              >
                <Plus size={14} /> Add Block
              </button>
            </div>

            {quizForm.questions.map((q, qIdx) => (
              <motion.div 
                key={qIdx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white/5 border border-white/10 rounded-3xl p-8 relative group"
              >
                <button 
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="absolute top-6 right-6 p-2 bg-rose-600/20 text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-600 hover:text-white"
                >
                  <Trash2 size={16} />
                </button>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                   <div className="space-y-6">
                      <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Question {qIdx + 1}</label>
                        <input 
                          type="text" 
                          required
                          value={q.question}
                          onChange={e => handleQuestionChange(qIdx, 'question', e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3.5 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-all"
                          placeholder="State the inquiry..."
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3 block">Explanation (Optional)</label>
                        <textarea 
                          value={q.explanation}
                          onChange={e => handleQuestionChange(qIdx, 'explanation', e.target.value)}
                          className="w-full bg-black/40 border border-white/5 rounded-xl px-5 py-3 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all h-20 resize-none"
                          placeholder="Provide logic for correct answer..."
                        />
                      </div>
                   </div>

                   <div className="space-y-4">
                      <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-1 block">Response Multi-Choice</label>
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-3">
                          <button 
                            type="button"
                            onClick={() => handleQuestionChange(qIdx, 'correctAnswer', oIdx)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${q.correctAnswer === oIdx ? 'bg-emerald-500 border-emerald-400 text-white' : 'border-white/10 hover:border-white/30'}`}
                          >
                            {q.correctAnswer === oIdx && <Save size={10} />}
                          </button>
                          <input 
                            type="text" 
                            required
                            value={opt}
                            onChange={e => handleOptionChange(qIdx, oIdx, e.target.value)}
                            className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-2.5 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all"
                            placeholder={`Option ${oIdx + 1}`}
                          />
                        </div>
                      ))}
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </form>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/5 bg-white/5 flex items-center justify-between">
           <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                 <Target size={18} className="text-indigo-400" />
                 <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">{quizForm.questions.length} Question Nodes</span>
              </div>
              <div className="flex items-center gap-3">
                 <Clock size={18} className="text-orange-400" />
                 <span className="text-[10px] font-extrabold text-gray-500 uppercase tracking-widest">{quizForm.timeLimit} Min Protocol</span>
              </div>
           </div>
           <div className="flex items-center gap-4">
              <button onClick={onClose} className="px-8 py-4 rounded-2xl text-gray-400 text-[11px] font-black uppercase tracking-widest hover:text-white transition-all">Abort</button>
              <button 
                onClick={handleSubmit}
                disabled={isLoading}
                className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
              >
                {isLoading ? <Zap className="animate-spin" size={16} /> : <Save size={16} />} Deploy Quiz Node
              </button>
           </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default QuizGenerator;
