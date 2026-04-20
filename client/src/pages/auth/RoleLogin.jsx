import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ChevronRight, UserPlus, BookOpen, User, Building, Phone, CalendarDays, KeyRound, ArrowLeft, UserCheck, ShieldCheck, Fingerprint } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, reset } from '../../features/auth/authSlice';
import { useNavigate, useParams, Link } from 'react-router-dom';
import axios from 'axios';

const RoleLogin = () => {
  const { roleType } = useParams(); // 'student', 'faculty', 'admin', 'librarian'
  const finalRole = roleType === 'faculty' ? 'teacher' : roleType;

  const [view, setView] = useState('login'); // 'login', 'register', 'forgot'
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: finalRole,
    enrollmentNumber: '', employeeId: '', contact: '', dob: '', address: '',
    department: '', batch: '', year: '', semester: '',
    rollNumber: '',
    securityQuestion: 'system_default', securityAnswer: 'system_default', 
    descriptors: [] 
  });
  const [registrationToken, setRegistrationToken] = useState(null);

  const roleConfigs = {
    admin: { color: 'from-rose-600 to-orange-500', shadow: 'shadow-rose-500/20', subtitle: 'System Control' },
    faculty: { color: 'from-indigo-600 to-purple-500', shadow: 'shadow-indigo-500/20', subtitle: 'Educator Suite' },
    student: { color: 'from-blue-500 to-cyan-400', shadow: 'shadow-blue-500/20', subtitle: 'Knowledge Gateway' },
    librarian: { color: 'from-amber-600 to-yellow-500', shadow: 'shadow-amber-500/20', subtitle: 'Digital Archives' },
  };

  const config = roleConfigs[roleType] || roleConfigs.student;

  // Auto-generate Enrollment Number for students
  useEffect(() => {
    if (view === 'register' && finalRole === 'student' && !formData.enrollmentNumber) {
      const yearPrefix = new Date().getFullYear().toString().slice(-2);
      const randomId = Math.floor(100000 + Math.random() * 900000); 
      setFormData(prev => ({ ...prev, enrollmentNumber: `LMS-${yearPrefix}-${randomId}` }));
    }
  }, [view, finalRole, formData.enrollmentNumber]);

  // Auto-generate Roll Number when department is selected
  useEffect(() => {
    const fetchRoll = async () => {
        if (formData.role === 'student' && formData.department && view === 'register') {
            try {
                const { data } = await axios.get(`http://localhost:5001/api/auth/next-roll-number?dept=${formData.department}`);
                setFormData(prev => ({ ...prev, rollNumber: data.rollNumber }));
            } catch (err) {
                console.error("Roll number generation failure");
            }
        }
    };
    fetchRoll();
  }, [formData.department, view, formData.role]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading, isError, isSuccess, message } = useSelector(state => state.auth);

  useEffect(() => {
    if (user) {
        if (user.role === 'admin') {
          if (!user.faceRegistered) navigate('/face-registration', { state: { forced: true } });
          else navigate('/admin-dashboard');
        }
        else if (user.role === 'student') {
          if (!user.faceRegistered) navigate('/face-registration', { state: { forced: true } });
          else navigate('/dashboard');
        }
        else if (user.role === 'librarian') navigate('/librarian-dashboard');
        else if (user.role === 'hod') navigate('/hod-dashboard');
        else if (user.role === 'parent') navigate('/parent-dashboard');
        else if (user.role === 'teacher') {
          if (!user.faceRegistered) navigate('/face-registration', { state: { forced: true } });
          else navigate('/faculty-dashboard');
        }
        else navigate('/dashboard');
    }
  }, [user, navigate]);

  useEffect(() => {
    setFormData(prev => ({ ...prev, role: finalRole }));
  }, [finalRole]);

  useEffect(() => {
    if (isError) { 
      alert(message); 
      dispatch(reset());
    }
    
    if (isSuccess && user) {
       // Success redirection logic remains handled by the first useEffect
    }
  }, [user, isError, isSuccess, message, navigate, dispatch]);

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await dispatch(login({ email: formData.email, password: formData.password })).unwrap();
      if (res.requires2FA) {
        navigate('/verify-mfa', { state: res });
      }
    } catch (err) {
      console.error("Login Error:", err);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    const maxStep = (formData.role === 'student') ? 3 : (formData.role === 'teacher' ? 2 : 2);
    if (step < maxStep) { setStep(step + 1); return; }
    
    try {
      const res = await dispatch(register(formData)).unwrap();
      if (res.isPendingAuth) {
         setRegistrationToken(res.registrationToken);
         setView('pendingauth');
      }
    } catch(err) {
      console.log('Registration Error:', err);
    }
  };

  const formVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
    exit: { opacity: 0, x: -20, transition: { duration: 0.3 } }
  };

  const inputClasses = "appearance-none rounded-2xl relative block w-full px-4 py-4 pl-12 border border-white/10 bg-white/5 text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 outline-none transition-all backdrop-blur-sm";

  return (
    <div className="relative min-h-[calc(100vh-80px)] w-full flex items-center justify-center p-4 md:p-8 overflow-hidden bg-[#020617] transform-gpu">
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none transform-gpu">
        <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full opacity-20 blur-[80px] bg-gradient-to-br ${config.color} transform-gpu`} />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[80px] transform-gpu" />
        
        {/* Animated grid background */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
        <div className="absolute inset-0 opacity-[0.03]" 
             style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}>
        </div>
      </div>

      <div className="w-full max-w-xl relative z-10 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-lg p-8 md:p-12 shadow-2xl transform-gpu"
        >
          {/* Back Button */}
          <Link to="/login" className="inline-flex items-center gap-2 text-xs font-mono text-gray-500 hover:text-white mb-8 transition-colors uppercase tracking-[0.2em] group">
             <div className="p-2 rounded-lg bg-white/5 group-hover:bg-white/10 transition-colors">
                <ArrowLeft size={14} />
             </div>
             System Core
          </Link>

          <header className="mb-10">
             <div className="flex items-center gap-4 mb-4">
                <div className={`p-4 rounded-2xl bg-gradient-to-br ${config.color} shadow-lg ${config.shadow}`}>
                   {view === 'login' ? <Lock size={28} className="text-white" /> : <UserPlus size={28} className="text-white" />}
                </div>
                <div>
                   <p className={`text-xs font-mono uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r ${config.color} font-bold`}>
                      {config.subtitle}
                   </p>
                   <h1 className="text-3xl font-black text-white capitalize tracking-tight">
                      {roleType} {view === 'login' ? 'Authentication' : 'Registration'}
                   </h1>
                </div>
             </div>
             <p className="text-gray-400 text-sm font-medium leading-relaxed">
                {view === 'login' 
                  ? `Please provide your secure credentials to bypass the ${roleType} identity handshake.`
                  : `Initialize your institutional identity profile within the ${roleType} sector archives.`
                }
             </p>
          </header>

          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.form key="login" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6" onSubmit={handleLoginSubmit}>
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                      <Mail size={18} />
                    </div>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClasses} placeholder="Access Email (e.g. system@edu.com)" />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500 group-focus-within:text-blue-400 transition-colors">
                      <KeyRound size={18} />
                    </div>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className={inputClasses} placeholder="Cryptographic Password" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => setView('forgot')} className="text-xs font-mono text-gray-500 hover:text-blue-400 transition-colors uppercase tracking-widest">
                    Recovery Protocol?
                  </button>
                </div>

                <motion.button 
                  whileHover={{ scale: 1.01 }} 
                  whileTap={{ scale: 0.99 }} 
                  type="submit" 
                  disabled={isLoading} 
                  className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-bold text-sm tracking-widest uppercase transition-all shadow-xl bg-gradient-to-r ${config.color} ${config.shadow} disabled:opacity-50`}
                >
                    {isLoading ? (
                      <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    ) : (
                      <>
                        Initialize Access
                        <ChevronRight size={18} />
                      </>
                    )}
                </motion.button>
                
                <div className="pt-6 border-t border-white/5 text-center">
                  <p className="text-xs font-medium text-gray-500 group">
                    First time accessing the protocol? 
                    <button type="button" onClick={() => { setView('register'); setStep(1); }} className="text-white hover:text-blue-400 transition-colors ml-2 font-bold uppercase tracking-widest">
                      Request ID
                    </button>
                  </p>
                </div>
              </motion.form>
            )}

            {view === 'register' && (
              <motion.form key="register" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-8" onSubmit={handleRegisterSubmit}>
                {/* Stepper */}
                <div className="flex items-center justify-center gap-4 mb-2">
                  {[1, 2, 3].map((s) => (
                    (s === 3 && finalRole !== 'student') ? null : (
                      <div key={s} className="flex items-center">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all border ${
                          step === s 
                            ? `bg-gradient-to-br ${config.color} text-white border-transparent ${config.shadow}` 
                            : step > s 
                              ? 'bg-blue-500/20 text-blue-400 border-blue-500/20' 
                              : 'bg-white/5 text-gray-600 border-white/5'
                        }`}>
                          {step > s ? <ShieldCheck size={18} /> : s}
                        </div>
                        {((s < 3 && finalRole === 'student') || (s < 2 && finalRole !== 'student')) && (
                          <div className={`w-8 h-px mx-1 ${step > s ? 'bg-blue-500/30' : 'bg-white/5'}`} />
                        )}
                      </div>
                    )
                  ))}
                </div>

                {step === 1 && (
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-400"><User size={18} /></div>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required className={inputClasses} placeholder="Legal Identity Name" />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-400"><Mail size={18} /></div>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required className={inputClasses} placeholder="Institutional Email" />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-400"><Lock size={18} /></div>
                      <input type="password" name="password" value={formData.password} onChange={handleChange} required className={inputClasses} placeholder="Create Encryption Token" />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    {finalRole === 'student' ? (
                      <>
                        <div className="relative group">
                          <input type="text" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleChange} required className={inputClasses} placeholder="Enrollment Vector" />
                        </div>
                        <div className="relative group">
                          <select name="department" value={formData.department} onChange={handleChange} required className={`${inputClasses} appearance-none cursor-pointer pr-10`}>
                            <option value="" className="bg-[#020617]">Select Sector (Department)</option>
                            <option value="CSE" className="bg-[#020617]">Computer Science (CSE)</option>
                            <option value="ECE" className="bg-[#020617]">Electronics (ECE)</option>
                            <option value="ME" className="bg-[#020617]">Mechanical (ME)</option>
                            <option value="CE" className="bg-[#020617]">Civil (CE)</option>
                            <option value="IT" className="bg-[#020617]">Information Tech (IT)</option>
                            <option value="AI" className="bg-[#020617]">Artificial Intelligence (AI)</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <select name="semester" value={formData.semester} onChange={handleChange} required className={`${inputClasses} appearance-none cursor-pointer pr-4`}>
                              <option value="" className="bg-[#020617]">Semester</option>
                              {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s} className="bg-[#020617]">{s}</option>)}
                            </select>
                            <select name="year" value={formData.year} onChange={handleChange} required className={`${inputClasses} appearance-none cursor-pointer pr-4`}>
                              <option value="" className="bg-[#020617]">Year</option>
                              {[1,2,3,4].map(y => <option key={y} value={y} className="bg-[#020617]">{y}</option>)}
                            </select>
                        </div>
                        <input type="text" name="batch" value={formData.batch} onChange={handleChange} required className={inputClasses} placeholder="Operational Batch (e.g., 2024-28)" />
                        
                        {formData.rollNumber && (
                           <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl text-center">
                              <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Generated ID</p>
                              <p className="text-xl font-black text-blue-400 tracking-widest">{formData.rollNumber}</p>
                           </div>
                        )}
                      </>
                    ) : (
                      <>
                        <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} required className={inputClasses} placeholder="Official Employee ID" />
                        <input type="tel" name="contact" value={formData.contact} onChange={handleChange} required className={inputClasses} placeholder="Contact Frequency (Phone)" />
                      </>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="space-y-4">
                    <div className="relative group">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500"><CalendarDays size={18} /></div>
                       <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className={inputClasses} />
                    </div>
                    <div className="relative group">
                       <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500"><Phone size={18} /></div>
                       <input type="tel" name="contact" value={formData.contact} onChange={handleChange} required className={inputClasses} placeholder="Primary Communication Link" />
                    </div>
                    <textarea name="address" value={formData.address} onChange={handleChange} required className={`${inputClasses} min-h-[100px] resize-none pl-4`} placeholder="Base Operations Address (Residential)" rows="3"></textarea>
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  {step > 1 && (
                    <button type="button" onClick={() => setStep(step - 1)} className="flex-1 py-4 border border-white/10 text-xs font-mono font-bold uppercase tracking-widest rounded-2xl text-gray-400 hover:text-white hover:bg-white/5 transition-all">
                       Abort Step
                    </button>
                  )}
                  <motion.button 
                    whileHover={{ scale: 1.01 }} 
                    whileTap={{ scale: 0.99 }} 
                    type="submit" 
                    disabled={isLoading} 
                    className="flex-[2] flex items-center justify-center gap-2 py-4 rounded-2xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 font-bold text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20"
                  >
                    {step < (formData.role === 'student' ? 3 : 2) ? 'Next Sector' : isLoading ? 'Encrypting...' : <><Fingerprint size={18} /> Finalize Profile</>}
                  </motion.button>
                </div>
                
                <p className="text-center text-xs text-gray-500 font-medium">
                  Identity already archived? 
                  <button type="button" onClick={() => setView('login')} className="text-white hover:text-blue-400 transition-colors ml-2 font-bold uppercase tracking-widest">
                    Go to Uplink
                  </button>
                </p>
              </motion.form>
            )}

            {view === 'pendingauth' && (
              <motion.div key="pending" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="text-center space-y-8 py-4">
                 <div className="relative mx-auto w-24 h-24">
                    <div className="absolute inset-0 bg-amber-500/20 blur-2xl rounded-full animate-pulse" />
                    <div className="relative h-full w-full bg-white/5 rounded-3xl flex items-center justify-center border border-white/10">
                       <ShieldCheck className="w-12 h-12 text-amber-500" />
                    </div>
                 </div>
                 
                 <div className="space-y-2">
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight">Authorization In Progress</h3>
                    <p className="text-sm text-gray-400 leading-relaxed max-w-sm mx-auto">
                       Your identity request has been securely queued. The Central Administration must verify your institutional clearance before uplink is fully established.
                    </p>
                 </div>
                 
                 <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 text-center">
                    <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-3">Unique Auth Signature</p>
                    <p className="text-4xl font-black text-white tracking-[0.2em] font-mono">{registrationToken}</p>
                 </div>

                 <button type="button" onClick={() => setView('login')} className="w-full py-5 rounded-2xl text-white font-bold text-xs uppercase tracking-widest bg-white/5 hover:bg-white/10 transition-all border border-white/10">
                    Return to Login
                 </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default RoleLogin;
