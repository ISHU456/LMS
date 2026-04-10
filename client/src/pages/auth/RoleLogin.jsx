import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, LogIn, ChevronRight, UserPlus, BookOpen, User, Building, Phone, CalendarDays, KeyRound, ArrowLeft, UserCheck, ShieldCheck } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { login, register, reset } from '../../features/auth/authSlice';
import { useNavigate, useParams, Link } from 'react-router-dom';

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

  // Auto-generate Enrollment Number for students
  useEffect(() => {
    if (view === 'register' && finalRole === 'student' && !formData.enrollmentNumber) {
      const yearPrefix = new Date().getFullYear().toString().slice(-2);
      const randomId = Math.floor(100000 + Math.random() * 900000); 
      setFormData(prev => ({ ...prev, enrollmentNumber: `LMS-${yearPrefix}-${randomId}` }));
    }
  }, [view, finalRole]);

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
  }, [formData.department, view]);

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isLoading, isError, isSuccess, message } = useSelector(state => state.auth);

  // 1. Redirection if user is already logged in
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
    // Force role to match URL parameter
    setFormData(prev => ({ ...prev, role: finalRole }));
  }, [finalRole]);

  useEffect(() => {
    if (isError) { 
      alert(message); 
      dispatch(reset());
    }
    
    if (isSuccess && user) {
      if (user.role === 'admin') {
        if (!user.faceRegistered) {
          navigate('/face-registration', { state: { forced: true } });
        } else {
          navigate('/admin-dashboard');
        }
      }
      else if (user.role === 'student') {
        if (!user.faceRegistered) {
          navigate('/face-registration', { state: { forced: true } });
        } else {
          navigate('/dashboard');
        }
      }
      else if (user.role === 'librarian') navigate('/librarian-dashboard');
      else if (user.role === 'hod') navigate('/hod-dashboard');
      else if (user.role === 'parent') navigate('/parent-dashboard');
      else if (user.role === 'teacher') {
        if (!user.faceRegistered) {
          navigate('/face-registration', { state: { forced: true } });
        } else {
          navigate('/faculty-dashboard');
        }
      }
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
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.4, ease: "easeOut" } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] flex items-center justify-center p-6 bg-gray-50 dark:bg-dark-bg relative overflow-hidden transition-colors duration-300">
      {/* Decorative Blob */}
      <div className={`absolute top-1/4 -right-20 w-96 h-96 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-pulse
        ${roleType === 'admin' ? 'bg-red-400' : roleType === 'faculty' ? 'bg-indigo-400' : roleType === 'librarian' ? 'bg-amber-400' : 'bg-primary-400'}
      `}></div>

      <div className="w-full max-w-md relative z-10 perspective-1000">
        <div className="glass shadow-2xl rounded-3xl p-8 backdrop-blur-xl border border-white/40 dark:border-gray-800/60 transition-all duration-300 hover:shadow-primary-500/10">
          
          <Link to="/login" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-primary-600 mb-6 transition-colors">
             <ArrowLeft size={16} className="mr-1" /> Back to Portals
          </Link>

          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white capitalize tracking-tight mb-2">
              {roleType} Portal
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              Secure {view === 'login' ? 'Authentication' : view === 'register' ? 'Registration' : 'Recovery'} Area
            </p>
          </div>

          <AnimatePresence mode="wait">
            {view === 'login' && (
              <motion.form key="login" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6" onSubmit={handleLoginSubmit}>
                <div className="space-y-4">
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors"><Mail size={20} /></div>
                    <input type="email" name="email" value={formData.email} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder={`${roleType.charAt(0).toUpperCase() + roleType.slice(1)} Email`} />
                  </div>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors"><Lock size={20} /></div>
                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="Password" />
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <button type="button" onClick={() => setView('forgot')} className="font-medium text-primary-600 hover:text-primary-500 transition-colors">Forgot password?</button>
                </div>

                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className={`w-full flex justify-center py-3 border border-transparent text-sm font-bold rounded-xl text-white shadow-lg transition-all ${
                    roleType === 'admin' ? 'bg-red-600 hover:bg-red-700 shadow-red-500/30' : 
                    roleType === 'faculty' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/30' : 
                    roleType === 'librarian' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/30' : 
                    'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30'
                }`}>
                    {isLoading ? 'Verifying...' : <><LogIn className="mr-2" size={20} /> Login Access</>}
                </motion.button>
                
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 font-medium pt-2">
                  New to the platform? <button type="button" onClick={() => { setView('register'); setStep(1); }} className="text-primary-600 hover:text-primary-700 transition-colors ml-1">Register Now</button>
                </p>
              </motion.form>
            )}

            {view === 'register' && (
              <motion.form key="register" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6" onSubmit={handleRegisterSubmit}>
                <div className="flex justify-between mb-8 relative">
                  <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 dark:bg-gray-700 -z-10 -translate-y-1/2 rounded-full"></div>
                  {[1, 2, 3].map((s) => (
                    (s === 3 && finalRole !== 'student') ? null : (
                      <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm transition-all shadow-md ${step >= s ? 'bg-primary-600 text-white border-4 border-white dark:border-dark-bg' : 'bg-gray-200 text-gray-500 dark:bg-gray-800 dark:text-gray-400'}`}>
                        {step > s ? <BookOpen size={16} /> : s}
                      </div>
                    )
                  ))}
                </div>

                {step === 1 && (
                  <div className="space-y-4">
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500"><User size={20} /></div>
                      <input type="text" name="name" value={formData.name} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Full Legal Name" />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500"><Mail size={20} /></div>
                      <input type="email" name="email" value={formData.email} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="College Email" />
                    </div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500"><Lock size={20} /></div>
                      <input type="password" name="password" value={formData.password} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Create Password" />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    {finalRole === 'student' ? (
                      <>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500"><UserCheck size={20} /></div>
                          <input type="text" name="enrollmentNumber" value={formData.enrollmentNumber} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Enrollment Number" />
                        </div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500"><Building size={20} /></div>
                          <select name="department" value={formData.department} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
                            <option value="">Select Sector (Department)</option>
                            <option value="CSE">Computer Science (CSE)</option>
                            <option value="ECE">Electronics (ECE)</option>
                            <option value="ME">Mechanical (ME)</option>
                            <option value="CE">Civil (CE)</option>
                            <option value="IT">Information Tech (IT)</option>
                            <option value="AI">Artificial Intelligence (AI)</option>
                          </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <div className="relative group">
                              <select name="semester" value={formData.semester} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
                                <option value="">Semester</option>
                                {[1,2,3,4,5,6,7,8].map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                           </div>
                           <div className="relative group">
                              <select name="year" value={formData.year} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
                                <option value="">Year</option>
                                {[1,2,3,4].map(y => <option key={y} value={y}>{y}</option>)}
                              </select>
                           </div>
                        </div>
                        <div className="relative group">
                          <input type="text" name="batch" value={formData.batch} onChange={handleChange} required className="appearance-none rounded-xl block w-full px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Batch (e.g., 2024-28)" />
                        </div>
                        {formData.rollNumber && (
                           <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-500/20 rounded-2xl">
                              <p className="text-[10px] font-black uppercase text-emerald-600 mb-1">Generated Institutional Roll ID</p>
                              <p className="text-lg font-black text-emerald-500 tracking-widest">{formData.rollNumber}</p>
                           </motion.div>
                        )}
                      </>
                    ) : finalRole === 'teacher' ? (
                      <>
                        <div className="relative group">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500"><UserCheck size={20} /></div>
                           <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Official College ID" />
                        </div>
                        <div className="relative group">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500"><Phone size={20} /></div>
                           <input type="tel" name="contact" value={formData.contact} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Personal Phone Number" />
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="relative group">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500"><UserCheck size={20} /></div>
                           <input type="text" name="employeeId" value={formData.employeeId} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Official Employee ID" />
                        </div>
                        <div className="relative group">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500"><Building size={20} /></div>
                          <select name="department" value={formData.department} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none">
                            <option value="">Assigned Sector</option>
                            <option value="CSE">Computer Science (CSE)</option>
                            <option value="ECE">Electronics (ECE)</option>
                            <option value="ME">Mechanical (ME)</option>
                            <option value="CE">Civil (CE)</option>
                            <option value="IT">Information Tech (IT)</option>
                            <option value="AI">Artificial Intelligence (AI)</option>
                          </select>
                        </div>
                      </>
                    )}
                  </div>
                )}
                {step === 3 && (
                  <div className="space-y-4">
                    <p className="text-xs font-black text-primary-600 uppercase tracking-widest mb-4">Finalizing Identity Profile</p>
                    <div className="relative group">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500"><CalendarDays size={20} /></div>
                       <input type="date" name="dob" value={formData.dob} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" />
                    </div>
                    <div className="relative group">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500"><Phone size={20} /></div>
                       <input type="tel" name="contact" value={formData.contact} onChange={handleChange} required className="appearance-none rounded-xl relative block w-full px-3 py-3 pl-10 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Primary Contact Phone" />
                    </div>
                    <div className="relative group">
                       <textarea name="address" value={formData.address} onChange={handleChange} required className="appearance-none rounded-xl block w-full px-3 py-3 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Permanent Residential Address" rows="3"></textarea>
                    </div>
                  </div>
                )}

                <div className="flex gap-4 pt-2">
                  {step > 1 && (
                    <button type="button" onClick={() => setStep(step - 1)} className="w-1/3 py-3 border border-gray-300 dark:border-gray-700 text-sm font-bold rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition">Back</button>
                  )}
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="flex-1 flex justify-center py-3 border border-transparent text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-500/30">
                    {step < (formData.role === 'student' ? 3 : 2) ? 'Next Step' : isLoading ? 'Registering...' : <><UserPlus className="mr-2" size={20} /> Complete Registration</>}
                  </motion.button>
                </div>
                
                <p className="text-center text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Already registered? <button type="button" onClick={() => setView('login')} className="text-primary-600 hover:text-primary-700 transition-colors ml-1">Go to Login</button>
                </p>
              </motion.form>
            )}

            {view === 'forgot' && (
              <motion.form key="forgot" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="space-y-6">
                <p className="text-gray-600 dark:text-gray-400 text-sm text-center">Answer your security question to reset your password.</p>
                <div className="space-y-4">
                  <input type="email" name="email" value={formData.email} onChange={handleChange} required className="w-full rounded-xl px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Email Address" />
                  <input type="text" name="securityAnswer" value={formData.securityAnswer} onChange={handleChange} required className="w-full rounded-xl px-4 py-3 border border-gray-300 dark:border-gray-700 bg-white/50 dark:bg-dark-card/50 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none" placeholder="Security Answer" />
                </div>
                <button type="button" className="w-full py-3 text-sm font-bold rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg transition">Verify & Reset Password</button>
                <button type="button" onClick={() => setView('login')} className="w-full text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition">Cancel</button>
              </motion.form>
            )}

            {view === 'pendingauth' && (
              <motion.div key="pending" variants={formVariants} initial="hidden" animate="visible" exit="exit" className="text-center space-y-6">
                 <div className="mx-auto w-20 h-20 bg-amber-100/50 dark:bg-amber-900/30 rounded-full flex items-center justify-center border border-amber-500/20 shadow-xl shadow-amber-500/20 mb-6">
                    <ShieldCheck className="w-10 h-10 text-amber-500 animate-pulse" />
                 </div>
                 <h3 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Authorization Pending</h3>
                 <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed font-medium">Your faculty registration has been securely transmitted. Access will be granted once the Administration officially verifies your college credentials.</p>
                 
                 <div className="bg-gray-100 dark:bg-dark-bg border border-gray-200 dark:border-gray-800 rounded-3xl p-6 shadow-inner">
                    <p className="text-xs font-black uppercase text-gray-400 mb-2 tracking-widest">Your Auth Token Reference</p>
                    <p className="text-3xl font-black text-gray-800 dark:text-white tracking-widest font-mono">{registrationToken}</p>
                 </div>

                 <button type="button" onClick={() => setView('login')} className="mt-8 w-full py-4 text-xs font-black uppercase tracking-widest rounded-2xl text-white bg-gray-900 hover:bg-black dark:bg-white dark:text-gray-900 shadow-lg transition-all hover:-translate-y-1">Return to Login</button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default RoleLogin;
