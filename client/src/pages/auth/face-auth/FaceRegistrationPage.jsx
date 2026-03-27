import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ShieldCheck, ChevronRight, Mail, UserPlus, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import FaceRegistrationStep from '../../../components/auth/FaceRegistrationStep';
import { register } from '../../../features/auth/authSlice';
import { useDispatch, useSelector } from 'react-redux';

const FaceRegistrationPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState('initial'); // 'initial', 'biometric'
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isLoading, isError, message } = useSelector(state => state.auth);

  const handleInitialSubmit = (e) => {
    e.preventDefault();
    if (email && password) {
      setStep('biometric');
    }
  };

  const handleBiometricComplete = async (descriptors) => {
    // Collect all data for registration (This is a simplified demo)
    const formData = {
      name: email.split('@')[0], 
      email, 
      password, 
      role: 'teacher', // Only for teachers as per request
      descriptors,
      department: 'General Faculty',
      securityQuestion: "What is your faculty ID?",
      securityAnswer: "FA001"
    };

    const action = await dispatch(register(formData));
    if (register.fulfilled.match(action)) {
       navigate('/faculty-dashboard');
    } else {
       alert(message || 'Registration failed.');
       setStep('initial');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-dark-bg relative overflow-hidden transition-colors duration-300">
      <div className="absolute top-1/4 -right-20 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-pulse bg-indigo-400"></div>
      
      <div className="w-full max-w-md relative z-10 glass shadow-2xl rounded-3xl p-8 backdrop-blur-xl border border-white/40 dark:border-gray-800/60 shadow-indigo-500/10 scale-100 origin-center transition-all duration-300">
        
        <Link to="/login/faculty" className="inline-flex items-center text-[10px] font-black uppercase text-gray-500 hover:text-indigo-600 mb-6 tracking-widest transition-colors group">
           <ArrowLeft size={16} className="mr-2 group-hover:-translate-x-1 transition-transform" /> 
           Back to Portal
        </Link>

        {step === 'initial' ? (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
             <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-6 border border-indigo-200 dark:border-indigo-800">
                  <UserPlus size={32} />
                </div>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white uppercase tracking-tight mb-2">Faculty Enrollment</h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-widest leading-relaxed">System Biometric Synchronization Step {{ initial: 1, biometric: 2 }[step]}</p>
             </div>

             <form onSubmit={handleInitialSubmit} className="space-y-6">
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors"><Mail size={18} /></div>
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase text-[10px] font-black tracking-widest placeholder:text-gray-400/50" placeholder="Faculty ID (Email)" />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-indigo-500 transition-colors"><ShieldCheck size={18} /></div>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all uppercase text-[10px] font-black tracking-widest placeholder:text-gray-400/50" placeholder="Secure Entry Pin" />
                  </div>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="w-full flex justify-center items-center gap-3 py-4 bg-indigo-600 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-600/30 hover:bg-indigo-700 transition-all">
                   Initialize Biometrics <ChevronRight size={18} />
                </motion.button>
             </form>
          </motion.div>
        ) : (
          <FaceRegistrationStep email={email} onComplete={handleBiometricComplete} />
        )}

        <div className="mt-8 pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
           <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Neural Encryption Standard AES-256</p>
        </div>
      </div>
    </div>
  );
};

export default FaceRegistrationPage;
