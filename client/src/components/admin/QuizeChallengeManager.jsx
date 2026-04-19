import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Terminal, Plus, Trash2, Edit, Save, X, 
  Settings, Code, Database, Eye, EyeOff, 
  CheckCircle, Globe, Lock, Cpu, Zap, 
  AlertCircle, ChevronRight, Languages,
  Trophy, Search, Loader2
} from 'lucide-react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import WeeklyQuizeContestGenerator from './WeeklyQuizeContestGenerator';

const QuizeChallengeManager = () => {
  const { user } = useSelector(state => state.auth);
  const [challenges, setChallenges] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [showWeeklyGenerator, setShowWeeklyGenerator] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('basic'); // basic, tests, code
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [foundStudents, setFoundStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [coinGrantAmount, setCoinGrantAmount] = useState(100);
  const [isUpdatingBalance, setIsUpdatingBalance] = useState(false);

  const initialFormState = {
    title: '',
    description: '',
    problemStatement: '',
    difficulty: 'Easy',
    category: 'General',
    points: 100,
    constraints: [],
    examples: [{ input: '', output: '', explanation: '' }],
    testCases: [{ input: '', expectedOutput: '', isPublic: true }],
    starterCode: {
      javascript: '// Write your code here',
      python: '# Write your code here',
      java: '// Write your code here',
      cpp: '// Write your code here'
    },
    allowedLanguages: ['javascript', 'python', 'java', 'cpp'],
    isWeeklyTest: false
  };

  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    fetchChallenges();
  }, [user]);

  const fetchChallenges = async () => {
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get('http://localhost:5001/api/coding/challenges', config);
      setChallenges(res.data);
    } catch (err) {
      console.error("Fetch failed", err);
    }
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      if (editingId) {
        await axios.put(`http://localhost:5001/api/coding/challenges/${editingId}`, formData, config);
      } else {
        await axios.post('http://localhost:5001/api/coding/challenges', formData, config);
      }
      fetchChallenges();
      closeModal();
    } catch (err) {
      alert("Operation failed: " + err.response?.data?.message || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Purge this challenge from the arena? This action is irreversible.")) return;
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      await axios.delete(`http://localhost:5001/api/coding/challenges/${id}`, config);
      fetchChallenges();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  const closeModal = () => {
    setIsAdding(false);
    setEditingId(null);
    setFormData(initialFormState);
    setActiveTab('basic');
  };

  const openEdit = (challenge) => {
    setFormData(challenge);
    setEditingId(challenge._id);
    setIsAdding(true);
  };

  const addTestCase = () => {
    setFormData({
      ...formData,
      testCases: [...formData.testCases, { input: '', expectedOutput: '', isPublic: false }]
    });
  };

  const removeTestCase = (index) => {
    setFormData({
      ...formData,
      testCases: formData.testCases.filter((_, i) => i !== index)
    });
  };

  const addExample = () => {
    setFormData({
      ...formData,
      examples: [...formData.examples, { input: '', output: '', explanation: '' }]
    });
  };

  const removeExample = (index) => {
    setFormData({
      ...formData,
      examples: formData.examples.filter((_, i) => i !== index)
    });
  };

  const toggleLanguage = (lang) => {
    const newLangs = formData.allowedLanguages.includes(lang)
      ? formData.allowedLanguages.filter(l => l !== lang)
      : [...formData.allowedLanguages, lang];
    setFormData({ ...formData, allowedLanguages: newLangs });
  };

  const languages = [
    { id: 'javascript', name: 'JavaScript' },
    { id: 'python', name: 'Python 3' },
    { id: 'java', name: 'Java 17' },
    { id: 'cpp', name: 'C++ 20' },
    { id: 'c', name: 'C' },
    { id: 'go', name: 'Go' }
  ];

  const searchStudents = async (query) => {
    setStudentSearch(query);
    if (query.length < 2) {
      setFoundStudents([]);
      return;
    }
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const res = await axios.get(`http://localhost:5001/api/admin/users?role=student`, config);
      setFoundStudents(res.data.filter(s => 
        s.name.toLowerCase().includes(query.toLowerCase()) || 
        s.email.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  const authorizeGrant = async () => {
    if (!selectedStudent) return;
    setIsUpdatingBalance(true);
    try {
      const config = { headers: { Authorization: `Bearer ${user.token}` } };
      const newTotal = (selectedStudent.coins || 0) + parseInt(coinGrantAmount);
      await axios.put(`http://localhost:5001/api/admin/users/${selectedStudent._id}`, { 
        coins: newTotal
      }, config);
      alert(`Success: ${coinGrantAmount} Scholar Coins granted to ${selectedStudent.name}.`);
      setSelectedStudent(null);
      setStudentSearch('');
      setFoundStudents([]);
      setShowCurrencyModal(false);
    } catch (err) {
      alert("Grant failed: " + err.message);
    } finally {
      setIsUpdatingBalance(false);
    }
  };

  return (
    <div className="space-y-10 p-4 md:p-8 bg-[#080c14] min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-white uppercase tracking-tighter flex items-center gap-4">
            <span className="p-3 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/20">
              <Terminal size={32} />
            </span>
            Neural Quize Labs
          </h2>
          <p className="text-[10px] text-emerald-500 font-bold uppercase tracking-[0.3em] mt-3 ml-1 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Arena Governance & Talent Selection
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowCurrencyModal(true)}
            className="px-6 py-4 bg-amber-500/10 border border-amber-500/30 text-amber-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-amber-500/20 transition-all flex items-center justify-center gap-3"
          >
            <Trophy size={18} /> Scholar Currency
          </button>
          <button 
            onClick={() => setShowWeeklyGenerator(true)}
            className="px-8 py-4 bg-white/5 border border-white/10 text-rose-500 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500/10 transition-all flex items-center justify-center gap-3"
          >
            <Zap size={18} /> Deploy Weekly Bundle
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="px-8 py-4 bg-emerald-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-emerald-600/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 border border-white/10"
          >
            <Plus size={18} /> Deploy New Challenge
          </button>
        </div>
      </div>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {challenges.map(challenge => (
          <motion.div 
            key={challenge._id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0b0f1a] border border-white/5 rounded-[2.5rem] p-8 relative group overflow-hidden hover:border-emerald-500/30 transition-all duration-500 shadow-2xl"
          >
            <div className="absolute top-0 right-0 p-8">
                {challenge.isWeeklyTest && (
                    <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/30 rounded-full flex items-center gap-2">
                        <Zap size={10} className="text-rose-500" />
                        <span className="text-[8px] font-black text-rose-500 uppercase">Weekly Test</span>
                    </div>
                )}
            </div>

            <div className="flex items-start gap-6 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
                <Code size={32} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white uppercase tracking-tight group-hover:text-emerald-400 transition-colors">{challenge.title}</h3>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">{challenge.category}</p>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-[0.2em] text-gray-400">
                <span>Complexity</span>
                <span className={
                    challenge.difficulty === 'Easy' ? 'text-emerald-400' : 
                    challenge.difficulty === 'Medium' ? 'text-amber-400' : 'text-rose-400'
                }>{challenge.difficulty}</span>
              </div>
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-1000 ${
                        challenge.difficulty === 'Easy' ? 'bg-emerald-500 w-1/3' : 
                        challenge.difficulty === 'Medium' ? 'bg-amber-500 w-2/3' : 'bg-rose-500 w-full'
                    }`}
                />
              </div>
            </div>

            <div className="flex items-center gap-3 mb-8">
                {challenge.allowedLanguages?.map(lang => (
                    <div key={lang} className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[8px] font-black uppercase text-gray-500">
                        {lang.charAt(0)}
                    </div>
                ))}
            </div>
            
            <div className="pt-6 border-t border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-[8px] font-black text-gray-600 uppercase">Test Cases</p>
                    <p className="text-xs font-black text-white">{challenge.testCases?.length || 0}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[8px] font-black text-gray-600 uppercase">Points</p>
                    <p className="text-xs font-black text-emerald-500">{challenge.points} XP</p>
                  </div>
               </div>
               <div className="flex gap-2">
                 <button onClick={() => openEdit(challenge)} title="Modify Neural Path" className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-all"><Edit size={16}/></button>
                 <button onClick={() => handleDelete(challenge._id)} title="Delete Matrix Entry" className="p-3 bg-white/5 hover:bg-rose-500/20 rounded-xl text-gray-600 hover:text-rose-500 transition-all"><Trash2 size={16}/></button>
               </div>
            </div>
          </motion.div>
        ))}

        {challenges.length === 0 && (
            <div className="col-span-full py-32 flex flex-col items-center justify-center text-gray-600 opacity-50 border-2 border-dashed border-white/5 rounded-[3rem]">
                <Database size={64} className="mb-6" />
                <p className="text-sm font-black uppercase tracking-[0.5em]">No Active Labs Detected</p>
            </div>
        )}
      </div>

      {/* Deployment Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[8000] bg-[#080c14]/90 backdrop-blur-xl flex items-center justify-center p-4 md:p-8 overflow-y-auto">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 30 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 30 }}
              className="bg-[#0b0f1a] border border-white/10 rounded-[3rem] w-full max-w-5xl shadow-[0_0_100px_rgba(16,185,129,0.1)] flex flex-col max-h-[90vh]"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-10 border-b border-white/5">
                <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-600/30">
                        <Cpu size={28} />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                            {editingId ? "Rewrite Logic Core" : "Architect Neural Lab"}
                        </h3>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">Version 2.4.0 Protocol</p>
                    </div>
                </div>
                <button onClick={closeModal} className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all">
                    <X size={20}/>
                </button>
              </div>

              {/* Tabs */}
              <div className="flex px-10 border-b border-white/5">
                  {[
                      { id: 'basic', label: 'Primary Config', icon: Settings },
                      { id: 'tests', label: 'Security Protocols', icon: Database },
                      { id: 'code', label: 'Implementation', icon: Code }
                  ].map(tab => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-3 px-8 py-6 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${
                            activeTab === tab.id ? 'border-emerald-500 text-white bg-white/5' : 'border-transparent text-gray-500 hover:text-white'
                        }`}
                      >
                        <tab.icon size={14} />
                        {tab.label}
                      </button>
                  ))}
              </div>

              {/* Modal Body */}
              <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
                <form id="lab-form" onSubmit={handleCreateOrUpdate} className="space-y-10">
                  
                  {activeTab === 'basic' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Challenge Title</label>
                          <input required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all" placeholder="Enter challenge identifier..."/>
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Category Tag</label>
                          <input required value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all" placeholder="e.g. Arrays, Graph, AI..."/>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                          <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Difficulty Tier</label>
                          <select value={formData.difficulty} onChange={e => setFormData({...formData, difficulty: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all appearance-none cursor-pointer">
                            <option value="Easy">Standard (Easy)</option>
                            <option value="Medium">Advanced (Medium)</option>
                            <option value="Hard">Elite (Hard)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Reward Points</label>
                          <input type="number" required value={formData.points} onChange={e => setFormData({...formData, points: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all"/>
                        </div>
                        <div className="flex items-center gap-4 h-full pt-8">
                            <button 
                                type="button" 
                                onClick={() => setFormData({...formData, isWeeklyTest: !formData.isWeeklyTest})}
                                className={`flex-1 py-4 rounded-2xl text-[9px] font-black uppercase tracking-widest border transition-all flex items-center justify-center gap-2 ${
                                    formData.isWeeklyTest ? 'bg-rose-500/20 border-rose-500 text-rose-500' : 'bg-white/5 border-white/10 text-gray-500'
                                }`}
                            >
                                <Zap size={14} /> Weekly Test
                            </button>
                        </div>
                      </div>

                      <div>
                         <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">System Description</label>
                         <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={2} className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white outline-none focus:border-emerald-500 transition-all resize-none" placeholder="Short summary for the listing..."/>
                      </div>

                      <div>
                         <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-3">Core Problem Statement (Markdown Support)</label>
                         <textarea required value={formData.problemStatement} onChange={e => setFormData({...formData, problemStatement: e.target.value})} rows={6} className="w-full bg-white/5 border border-white/10 rounded-3xl px-8 py-6 text-sm font-mono text-emerald-400 outline-none focus:border-emerald-500 transition-all resize-none" placeholder="Detailed requirements and constraints..."/>
                      </div>

                      <div>
                        <label className="block text-[9px] font-black text-gray-500 uppercase tracking-widest mb-6">Execution Runtime Permissions</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {languages.map(lang => (
                                <button
                                    key={lang.id}
                                    type="button"
                                    onClick={() => toggleLanguage(lang.id)}
                                    className={`p-4 rounded-2xl border transition-all flex flex-col items-center gap-2 ${
                                        formData.allowedLanguages.includes(lang.id) ? 'bg-emerald-600/10 border-emerald-500 text-emerald-500' : 'bg-white/5 border-white/10 text-gray-600'
                                    }`}
                                >
                                    <Languages size={18} />
                                    <span className="text-[8px] font-black uppercase">{lang.name}</span>
                                    {formData.allowedLanguages.includes(lang.id) && <CheckCircle size={10} className="mt-1" />}
                                </button>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'tests' && (
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {/* Examples Section */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Documentation Examples</h4>
                                <button type="button" onClick={addExample} className="px-4 py-2 bg-emerald-600/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-600/20 transition-all">Add Showcase</button>
                            </div>
                            <div className="grid grid-cols-1 gap-6">
                                {formData.examples.map((ex, i) => (
                                    <div key={i} className="p-8 bg-white/5 border border-white/10 rounded-[2rem] relative group">
                                        <button type="button" onClick={() => removeExample(i)} className="absolute top-6 right-6 p-2 text-gray-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                                        <div className="grid grid-cols-2 gap-8">
                                            <div>
                                                <label className="block text-[8px] font-black text-gray-600 uppercase mb-3">Standard Input</label>
                                                <textarea value={ex.input} onChange={e => {
                                                    const newExs = [...formData.examples];
                                                    newExs[i].input = e.target.value;
                                                    setFormData({...formData, examples: newExs});
                                                }} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-[10px] font-mono text-white outline-none focus:border-emerald-500 resize-none"/>
                                            </div>
                                            <div>
                                                <label className="block text-[8px] font-black text-gray-600 uppercase mb-3">Expected Output</label>
                                                <textarea value={ex.output} onChange={e => {
                                                    const newExs = [...formData.examples];
                                                    newExs[i].output = e.target.value;
                                                    setFormData({...formData, examples: newExs});
                                                }} className="w-full bg-black/40 border border-white/5 rounded-xl p-4 text-[10px] font-mono text-rose-400 outline-none focus:border-emerald-500 resize-none"/>
                                            </div>
                                        </div>
                                        <div className="mt-6">
                                            <label className="block text-[8px] font-black text-gray-600 uppercase mb-3">Logical Explanation</label>
                                            <input value={ex.explanation} onChange={e => {
                                                const newExs = [...formData.examples];
                                                newExs[i].explanation = e.target.value;
                                                setFormData({...formData, examples: newExs});
                                            }} className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-2 text-[10px] font-bold text-gray-400 outline-none focus:border-emerald-500" placeholder="Optional context for students..."/>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Secret Test Cases */}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Validation Suites (Test Cases)</h4>
                                <button type="button" onClick={addTestCase} className="px-4 py-2 bg-amber-600/10 border border-amber-500/30 text-amber-500 rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-amber-600/20 transition-all">Add Suite</button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {formData.testCases.map((tc, i) => (
                                    <div key={i} className="flex items-start gap-4 p-6 bg-white/5 border border-white/10 rounded-2xl">
                                        <div className="flex-1 grid grid-cols-2 gap-4">
                                            <input value={tc.input} onChange={e => {
                                                const newTcs = [...formData.testCases];
                                                newTcs[i].input = e.target.value;
                                                setFormData({...formData, testCases: newTcs});
                                            }} className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-mono text-white outline-none focus:border-amber-500" placeholder="Input Sequence"/>
                                            <input value={tc.expectedOutput} onChange={e => {
                                                const newTcs = [...formData.testCases];
                                                newTcs[i].expectedOutput = e.target.value;
                                                setFormData({...formData, testCases: newTcs});
                                            }} className="bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-[10px] font-mono text-emerald-400 outline-none focus:border-amber-500" placeholder="Expected Output"/>
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => {
                                                const newTcs = [...formData.testCases];
                                                newTcs[i].isPublic = !newTcs[i].isPublic;
                                                setFormData({...formData, testCases: newTcs});
                                            }}
                                            className={`p-3 rounded-xl border transition-all flex items-center gap-2 ${
                                                tc.isPublic ? 'bg-emerald-500/10 border-emerald-500 text-emerald-500' : 'bg-gray-500/10 border-gray-500 text-gray-500'
                                            }`}
                                            title={tc.isPublic ? "Visible to Students" : "Hidden during Trace"}
                                        >
                                            {tc.isPublic ? <Globe size={14} /> : <Lock size={14} />}
                                            <span className="text-[8px] font-black uppercase">{tc.isPublic ? 'Public' : 'Secret'}</span>
                                        </button>
                                        <button type="button" onClick={() => removeTestCase(i)} className="p-3 text-gray-600 hover:text-rose-500"><Trash2 size={16}/></button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                  )}

                  {activeTab === 'code' && (
                    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-3xl flex items-center gap-6">
                            <AlertCircle className="text-rose-500 shrink-0" size={32} />
                            <div>
                                <h5 className="text-sm font-black text-rose-500 uppercase">Initialization Vectors</h5>
                                <p className="text-xs font-bold text-gray-500 leading-relaxed mt-1">Configure the boilerplate for each authorized language. Use high-performance templates to guide student solutions.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-10">
                            {formData.allowedLanguages.map(lang => (
                                <div key={lang} className="space-y-4">
                                    <div className="flex items-center justify-between px-2">
                                        <h6 className="text-[10px] font-black text-white uppercase tracking-widest flex items-center gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                            Starter Code: {lang}
                                        </h6>
                                    </div>
                                    <textarea 
                                        value={formData.starterCode[lang] || ''} 
                                        onChange={e => {
                                            const newStarter = {...formData.starterCode, [lang]: e.target.value};
                                            setFormData({...formData, starterCode: newStarter});
                                        }} 
                                        rows={8} 
                                        className="w-full bg-black/40 border border-white/5 rounded-3xl px-8 py-6 text-sm font-mono text-indigo-400 outline-none focus:border-emerald-500 transition-all resize-none shadow-inner"
                                    />
                                </div>
                            ))}
                            {formData.allowedLanguages.length === 0 && (
                                <div className="text-center py-20 text-gray-600">
                                    <AlertCircle size={48} className="mx-auto mb-4 opacity-20" />
                                    <p className="text-xs font-black uppercase tracking-widest">Select authorized languages in Primary Config to edit templates</p>
                                </div>
                            )}
                        </div>
                    </div>
                  )}

                </form>
              </div>

              {/* Modal Footer */}
              <div className="p-10 border-t border-white/5 bg-white/2 flex gap-6">
                <button type="button" onClick={closeModal} className="px-10 py-5 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-all">Abort Deployment</button>
                <button 
                    type="submit" 
                    form="lab-form"
                    disabled={isLoading} 
                    className="flex-1 py-5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4"
                >
                    {isLoading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Synchronizing...
                        </>
                    ) : (
                        <>
                            <Zap size={16} />
                            {editingId ? "Update Arena Matrix" : "Initialize Neural Lab"}
                        </>
                    )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showCurrencyModal && (
          <div className="fixed inset-0 z-[9000] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0b0f1a] border border-white/10 rounded-[3rem] p-12 w-full max-w-2xl shadow-2xl relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-600"></div>
              
              <div className="flex items-center justify-between mb-10">
                <div>
                   <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">Arena Currency Forge</h3>
                   <p className="text-[10px] text-amber-500 font-bold uppercase tracking-widest mt-1">Institutional Scholar Coin Grant</p>
                </div>
                <button onClick={() => setShowCurrencyModal(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-gray-500 hover:text-white transition-all"><X size={24}/></button>
              </div>

              <div className="space-y-8">
                 <div className="relative">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input 
                       value={studentSearch}
                       onChange={(e) => searchStudents(e.target.value)}
                       placeholder="Search Student Identity..." 
                       className="w-full bg-white/5 border border-white/10 rounded-2xl pl-16 pr-6 py-6 text-sm font-black text-white outline-none focus:border-amber-500 transition-all font-mono"
                    />
                    
                    <div className="mt-4 space-y-2">
                       {foundStudents.map(student => (
                          <button 
                             key={student._id}
                             onClick={() => setSelectedStudent(student)}
                             className={`w-full flex items-center justify-between p-5 rounded-2xl border transition-all ${selectedStudent?._id === student._id ? 'bg-amber-500/10 border-amber-500 text-amber-500' : 'bg-white/2 border-white/5 text-gray-400 hover:bg-white/5'}`}
                          >
                             <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500 uppercase font-black">{student.name.charAt(0)}</div>
                                <div className="text-left">
                                   <p className="text-sm font-black">{student.name}</p>
                                   <p className="text-[8px] uppercase tracking-widest opacity-60">{student.email}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-2">
                                <span className="text-xs font-black">{student.coins || 0}</span>
                                <Zap size={14} />
                             </div>
                          </button>
                       ))}
                    </div>
                 </div>

                 {selectedStudent && (
                    <div className="p-8 bg-amber-500/5 border border-amber-500/10 rounded-[2rem] space-y-6 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Grant Amount</span>
                            <div className="flex items-center gap-4">
                                {[100, 500, 1000, 5000].map(amt => (
                                    <button 
                                        key={amt}
                                        onClick={() => setCoinGrantAmount(amt)}
                                        className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${coinGrantAmount === amt ? 'bg-amber-500 text-black' : 'bg-white/5 text-gray-500 hover:text-white'}`}
                                    >
                                        +{amt}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <input 
                            type="number"
                            value={coinGrantAmount}
                            onChange={(e) => setCoinGrantAmount(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-2xl px-6 py-5 text-2xl font-black text-amber-500 text-center outline-none focus:border-amber-500 font-mono"
                        />
                        <button 
                            onClick={authorizeGrant}
                            disabled={isUpdatingBalance}
                            className="w-full py-6 bg-amber-500 text-black rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {isUpdatingBalance ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />}
                            Authorize Grant to {selectedStudent.name.split(' ')[0]}
                        </button>
                    </div>
                 )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showWeeklyGenerator && (
            <WeeklyQuizeContestGenerator 
              onClose={() => setShowWeeklyGenerator(false)} 
              onSave={() => {
                  setShowWeeklyGenerator(false);
                  fetchChallenges();
              }} 
            />
        )}
      </AnimatePresence>

    </div>
  );
};

export default QuizeChallengeManager;
