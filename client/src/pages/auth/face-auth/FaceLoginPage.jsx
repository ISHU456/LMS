import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ChevronRight, Mail, Key, ArrowLeft, Bot } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import FaceLoginStep from '../../../components/auth/FaceLoginStep';
import { login } from '../../../features/auth/authSlice';
import { useDispatch, useSelector } from 'react-redux';

const FaceLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('initial'); // 'initial', 'face'
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, isError, message } = useSelector(state => state.auth);

  const handleInitialLogin = async (e) => {
    e.preventDefault();
    const action = await dispatch(login({ email, password }));
    
    // login action returns requiresFaceAuth for teachers
    if (login.fulfilled.match(action)) {
       const res = action.payload;
       if (res.requiresFaceAuth) {
          setStep('face');
       } else {
          // If not requiring face (e.g. librarian), redirect now
          // (Though this page is intended for teachers)
          navigate('/faculty-dashboard');
       }
    } else {
       alert(message || 'Invalid credentials.');
    }
  };

  const handleFaceSuccess = (data) => {
    // FaceAuthService already handles localStorage to store JWT/Token
    navigate('/faculty-dashboard');
    window.location.reload(); // Refresh to ensure Redux picks up session
  };

  const handleFaceError = (msg) => {
    // Show temporary error msg or handle retry
    console.error('Face Auth Failed:', msg);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-dark-bg relative overflow-hidden transition-colors duration-300">
      <div className="absolute bottom-1/4 -left-20 w-80 h-80 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-pulse bg-emerald-400"></div>
      
      <div className="w-full max-w-md relative z-10 glass shadow-2xl rounded-[3rem] p-10 backdrop-blur-3xl border border-white/30 dark:border-gray-800/60 shadow-indigo-500/10 scale-100 origin-center transition-all duration-300">
        
        <Link to="/login/faculty" className="inline-flex items-center text-[10px] font-black uppercase text-gray-500 hover:text-primary-600 mb-8 tracking-widest transition-colors group">
           <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
           Exit Biometric Protocol
        </Link>

        {step === 'initial' ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
             <div className="text-center mb-10">
                <div className="w-20 h-20 rounded-3xl bg-primary-100 dark:bg-primary-950/40 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto mb-6 border border-primary-200 dark:border-primary-800/40 shadow-xl shadow-primary-500/10">
                  <ShieldCheck size={40} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tighter mb-2">Faculty Clearway</h2>
                <div className="inline-block px-4 py-1 rounded-full bg-emerald-100/40 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 text-[9px] font-black uppercase tracking-[0.2em]">Tier-2 Verification Enabled</div>
             </div>

             <form onSubmit={handleInitialLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors"><Mail size={18} /></div>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="appearance-none rounded-2xl relative block w-full px-3 py-4 pl-10 border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all uppercase text-[10px] font-black tracking-widest" placeholder="Identity Code (Email)" />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors"><Key size={18} /></div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="appearance-none rounded-2xl relative block w-full px-3 py-4 pl-10 border border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all uppercase text-[10px] font-black tracking-widest" placeholder="Access Cipher" />
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full flex justify-center items-center gap-4 py-4 bg-primary-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-2xl shadow-primary-600/30 hover:bg-primary-700 transition-all group">
                   Initialize Scanning <Bot size={18} className="group-hover:translate-x-1" />
                </motion.button>
             </form>
          </motion.div>
        ) : (
          <FaceLoginStep email={email} onSuccess={handleFaceSuccess} onError={handleFaceError} />
        )}

        <div className="mt-10 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
           <div className="flex items-center justify-center gap-6 opacity-30">
              <span className="text-[11px] font-black tracking-widest text-gray-500">IEEE-128D</span>
              <span className="text-[11px] font-black tracking-widest text-gray-500">ISO-9001</span>
              <span className="text-[11px] font-black tracking-widest text-gray-500">AI-MLP</span>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FaceLoginPage;
