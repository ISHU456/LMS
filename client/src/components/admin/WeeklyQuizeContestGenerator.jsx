import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Save, X, Settings, Code, Database, Globe, Lock, Cpu, Zap, Activity
} from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';

const defaultQuestion = (difficulty) => ({
  title: '',
  description: '',
  problemStatement: '',
  difficulty,
  category: 'Algorithms',
  points: difficulty === 'Easy' ? 50 : difficulty === 'Medium' ? 100 : 200,
  starterCode: {
    javascript: '// Start coding here\nfunction solve(input) {\n  \n}',
    python: '# Start coding here\ndef solve(input):\n    pass',
    java: '// Start coding here\nclass Solution {\n    public void solve(String input) {\n        \n    }\n}',
    cpp: '// Start coding here\nvoid solve(string input) {\n    \n}'
  },
  testCases: [
    { input: '', expectedOutput: '', isPublic: true },
    { input: '', expectedOutput: '', isPublic: false }
  ],
  allowedLanguages: ['javascript', 'python', 'java', 'cpp'],
  isWeeklyTest: true
});

const WeeklyQuizeContestGenerator = ({ onClose, onSave }) => {
  const { user } = useSelector(state => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [questions, setQuestions] = useState([
    defaultQuestion('Easy'),
    defaultQuestion('Medium'),
    defaultQuestion('Medium'),
    defaultQuestion('Hard')
  ]);

  const updateQuestion = (index, field, value) => {
    const newQs = [...questions];
    newQs[index][field] = value;
    setQuestions(newQs);
  };

  const updateNested = (index, parentField, childField, value) => {
    const newQs = [...questions];
    newQs[index][parentField] = { ...newQs[index][parentField], [childField]: value };
    setQuestions(newQs);
  };

  const updateTestCase = (qIndex, tIndex, field, value) => {
    const newQs = [...questions];
    newQs[qIndex].testCases[tIndex][field] = value;
    setQuestions(newQs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      // Submit multiple times or array if backend supported
      for (const q of questions) {
        await axios.post('http://localhost:5001/api/coding/challenges', q, config);
      }
      alert("Weekly Contest Bundle deployed successfully!");
      if (onSave) onSave();
      if (onClose) onClose();
    } catch (err) {
      alert("Deployment failure: " + (err.response?.data?.message || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const currentQ = questions[activeTab];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[8000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 lg:p-10"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-[#0b0f1a] border border-white/10 rounded-[2.5rem] w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl"
      >
        <div className="px-8 py-6 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-600 flex items-center justify-center text-white shadow-lg shadow-rose-600/30">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-xl font-black text-white uppercase tracking-tighter">Weekly Contest Deployment</h2>
              <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest mt-1 italic">4-Question Payload Bundle</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-white/5 rounded-2xl text-gray-500 transition-all">
            <X size={20} />
          </button>
        </div>

        {/* Tab Navigator */}
        <div className="flex px-8 border-b border-white/5 bg-[#080c14]">
          {questions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 flex flex-col items-center gap-1 ${
                activeTab === idx ? 'border-rose-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-white'
              }`}
            >
              <span>Question {idx + 1}</span>
              <span className={`px-2 py-0.5 rounded text-[8px] bg-white/5 ${q.difficulty === 'Easy' ? 'text-emerald-500' : q.difficulty === 'Medium' ? 'text-amber-500' : 'text-rose-500'}`}>{q.difficulty}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Basic Info */}
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-6">
              <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 flex items-center gap-2"><Settings size={14}/> Core Setup</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Title</label>
                  <input value={currentQ.title} onChange={e => updateQuestion(activeTab, 'title', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-rose-500 transition-all" placeholder="e.g. Reverse Linked List" />
                </div>
                <div>
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Points</label>
                  <input type="number" value={currentQ.points} onChange={e => updateQuestion(activeTab, 'points', e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold text-white outline-none focus:border-rose-500 transition-all" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Problem Statement</label>
                  <textarea value={currentQ.problemStatement} onChange={e => updateQuestion(activeTab, 'problemStatement', e.target.value)} rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-mono text-white outline-none focus:border-rose-500 transition-all resize-none" placeholder="Provide problem details..." />
                </div>
              </div>
            </div>

            {/* Test Cases */}
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-6">
               <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Database size={14}/> Test Suites</h3>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {currentQ.testCases.map((tc, tcIdx) => (
                   <div key={tcIdx} className="bg-black/40 p-4 rounded-2xl border border-white/5 space-y-4">
                     <div className="flex justify-between items-center">
                       <span className={`text-[8px] font-black uppercase px-2 py-1 rounded bg-white/5 ${tc.isPublic ? 'text-emerald-500' : 'text-rose-500'}`}>{tc.isPublic ? 'Public Showcase' : 'Secret Verification'}</span>
                     </div>
                     <textarea value={tc.input} onChange={e => updateTestCase(activeTab, tcIdx, 'input', e.target.value)} placeholder="Input Sequence..." rows={2} className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-white outline-none hover:border-white/20 resize-none"/>
                     <textarea value={tc.expectedOutput} onChange={e => updateTestCase(activeTab, tcIdx, 'expectedOutput', e.target.value)} placeholder="Expected Output..." rows={2} className="w-full bg-transparent border border-white/10 rounded-xl px-3 py-2 text-[10px] font-mono text-emerald-400 outline-none hover:border-white/20 resize-none"/>
                   </div>
                 ))}
               </div>
            </div>

            {/* Starter Code */}
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/10 space-y-6">
              <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-4 flex items-center gap-2"><Code size={14}/> Boilerplate Config (Python)</h3>
              <textarea value={currentQ.starterCode.python} onChange={e => updateNested(activeTab, 'starterCode', 'python', e.target.value)} rows={4} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-4 text-xs font-mono text-indigo-400 outline-none focus:border-emerald-500 transition-all resize-none" />
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-white/5 bg-[#080c14] flex justify-between items-center">
          <button onClick={onClose} className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">Cancel</button>
          <div className="flex gap-4">
            {activeTab < 3 && (
              <button 
                onClick={() => setActiveTab(activeTab + 1)}
                className="px-8 py-3 bg-white/10 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/20 transition-all"
              >
                Next Question
              </button>
            )}
            {activeTab === 3 && (
              <button 
                onClick={handleSubmit} disabled={isLoading}
                className="px-10 py-3 bg-gradient-to-r from-rose-600 to-orange-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
              >
                {isLoading ? <Activity className="animate-spin" size={16} /> : <Zap size={16} />} Deploy Bundle
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default WeeklyQuizeContestGenerator;
