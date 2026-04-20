import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, User, Phone, MapPin, Building, HeartPulse, ShieldAlert, Lock, Mail, Calendar, AtSign, Briefcase, GraduationCap, Globe, CheckCircle2, AlertCircle, Palette } from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { updateProfile } from '../../features/auth/authSlice';
import Cropper from 'react-easy-crop';
import getCroppedImg from '../../utils/cropImage';

const Profile = () => {
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  const [formData, setFormData] = useState({
    name: '', dob: '', address: '', contact: '', profilePic: '',
    emergencyContact: { name: '', relation: '', phone: '' },
    parentInfo: { fatherName: '', motherName: '', parentContact: '' },
    department: '', rollNumber: '', batch: '', year: '', semester: '', employeeId: '',
    currentPassword: '', newPassword: '', confirmPassword: ''
  });

  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('profile_active_tab') || 'personal');

  useEffect(() => {
    localStorage.setItem('profile_active_tab', activeTab);
  }, [activeTab]);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Image Cropping States
  const [imageToCrop, setImageToCrop] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [showCropper, setShowCropper] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        ...formData,
        name: user.name || '',
        dob: user.dob ? user.dob.split('T')[0] : '',
        contact: user.contact || '',
        address: user.address || '',
        profilePic: user.profilePic || '',
        department: user.department || '',
        rollNumber: user.rollNumber || '',
        batch: user.batch || '',
        year: user.year || '',
        semester: user.semester || '',
        employeeId: user.employeeId || '',
        parentInfo: user.parentInfo || { fatherName: '', motherName: '', parentContact: '' },
        emergencyContact: user.emergencyContact || { name: '', relation: '', phone: '' }
      });
    }
  }, [user]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (activeTab === 'security') {
      if (formData.newPassword !== formData.confirmPassword) {
        return setErrorMsg('Passwords do not match!');
      }
      if (formData.newPassword.length < 6) {
        return setErrorMsg('Password must be at least 6 characters long.');
      }
    }

    try {
      const res = await fetch('http://localhost:5001/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${user.token}`
        },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessMsg('Profile updated successfully!');
        setIsEditing(false);
        dispatch(updateProfile(data));
      } else {
        setErrorMsg(data.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Network error occurred.');
    }
  };

  const RequestDeactivation = async () => {
    if (window.confirm("Are you sure you want to request account deactivation?")) {
      try {
        await fetch('http://localhost:5001/api/auth/profile', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${user.token}` },
          body: JSON.stringify({ deactivationRequested: true })
        });
        alert('Deactivation request sent to Administration.');
      } catch (err) {
        alert('Request failed. Please try again later.');
      }
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSaveCrop = async () => {
    try {
      const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels);
      setFormData({ ...formData, profilePic: croppedImage });
      setShowCropper(false);
      setImageToCrop(null);
    } catch (e) {
      console.error("Crop error:", e);
      setErrorMsg("Failed to process image. Please try another one.");
    }
  };

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
      <div className="glass p-12 rounded-3xl text-center shadow-2xl">
        <User size={48} className="mx-auto text-primary-500 mb-4 opacity-30" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">Access Restricted</h2>
        <p className="text-gray-500 mt-2 text-sm italic">Verification required to view this portal.</p>
      </div>
    </div>
  );

  const tabs = [
    { id: 'personal', label: 'Personal Information', icon: User },
    { id: 'academic', label: 'Academic Details', icon: Building },
    { id: 'emergency', label: 'Family & Emergency', icon: HeartPulse },
    { id: 'security', label: 'Security & Access', icon: Lock },
  ];


  return (
    <div className="flex-1 bg-transparent min-h-screen p-4 md:p-10 transition-colors duration-500 relative">
      <div className="max-w-6xl mx-auto space-y-8">

        {/* PROFILE HEADER - REFINED */}
        <section className="glass rounded-3xl p-6 md:p-8 border border-white/40 dark:border-gray-800/60 shadow-xl relative backdrop-blur-3xl overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-primary-500 via-indigo-500 to-purple-500 opacity-60" />

          <div className="flex flex-col lg:flex-row items-center gap-10">
            {/* Avatar Section */}
            <div className="relative shrink-0 group">
              <div className="w-40 h-40 rounded-3xl border-4 border-white dark:border-gray-800 bg-white dark:bg-gray-800 shadow-xl overflow-hidden flex items-center justify-center relative ring-1 ring-black/5">
                {formData.profilePic ? (
                  <img src={formData.profilePic} alt="Profile" className="w-full h-full object-cover transition-transform duration-700" />
                ) : (
                  <div className="flex flex-col items-center text-gray-400">
                    <User size={64} strokeWidth={1} className="opacity-20" />
                    <span className="text-[9px] font-bold uppercase tracking-widest mt-1 opacity-40">No Image</span>
                  </div>
                )}
              </div>

              {isEditing && (
                <label className="absolute -bottom-2 -right-2 w-12 h-12 bg-primary-600 text-white rounded-2xl cursor-pointer hover:bg-primary-700 transition flex items-center justify-center border-4 border-slate-50 dark:border-dark-bg shadow-xl">
                  <Camera size={20} />
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                </label>
              )}
            </div>

            {/* Info Section */}
            <div className="flex-1 text-center lg:text-left space-y-3">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 dark:text-primary-400 font-bold text-[10px] tracking-wider mb-1">
                  <CheckCircle2 size={12} /> VERIFIED IDENTITY
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{user.name}</h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                  {user?.role?.toUpperCase() || 'USER'} • ID: {user?.enrollmentNumber || user?.employeeId || 'N/A'}
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                <div className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-gray-400 bg-white/40 dark:bg-white/5 border border-white/20 px-4 py-1.5 rounded-xl">
                  <Mail size={14} className="text-primary-500" /> {user.email}
                </div>
                <div className="flex items-center gap-2 text-[13px] text-gray-600 dark:text-gray-400 bg-white/40 dark:bg-white/5 border border-white/20 px-4 py-1.5 rounded-xl">
                  <Building size={14} className="text-indigo-500" /> {user.department || 'Management'}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 w-full lg:w-56">
              <button
                onClick={() => { setIsEditing(!isEditing); setErrorMsg(''); setSuccessMsg(''); }}
                className={`w-full py-3 rounded-xl font-bold text-xs tracking-wider transition-all flex items-center justify-center gap-2 shadow-sm ${isEditing ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-primary-600 text-white hover:bg-primary-700'}`}
              >
                {isEditing ? <AlertCircle size={16} /> : <Camera size={16} />}
                {isEditing ? 'DISCARD EDITS' : 'UPDATE PROFILE'}
              </button>
              <button onClick={RequestDeactivation} className="w-full py-3 rounded-xl border border-red-200 dark:border-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 font-bold text-xs tracking-wider transition-all">
                DEACTIVATE
              </button>
            </div>
          </div>
        </section>

        {/* MESSAGES */}
        <AnimatePresence>
          {(errorMsg || successMsg) && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
              <div className={`flex items-center gap-3 p-4 rounded-2xl border text-sm font-semibold mb-4 ${errorMsg ? 'bg-red-50 border-red-100 text-red-600 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-400' : 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400'}`}>
                {errorMsg ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                {errorMsg || successMsg}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* CONTENTS */}
        <div className="flex flex-col lg:flex-row gap-8">

          {/* TAB NAVIGATION */}
          <div className="lg:w-72 shrink-0">
            <div className="glass rounded-2xl p-3 space-y-1 border border-white/20 dark:border-gray-800/40 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 px-4 py-3">Navigation</p>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full px-5 py-3.5 rounded-xl text-left font-bold text-xs tracking-wide flex items-center gap-3 transition-all ${activeTab === tab.id ? 'bg-primary-600 text-white shadow-md' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'}`}
                >
                  <tab.icon size={16} className={activeTab === tab.id ? 'text-white' : 'text-primary-500'} />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="mt-6 glass rounded-2xl p-6 border border-white/20 dark:border-gray-800/40 bg-primary-600/5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[11px] font-bold text-gray-500">Security Pulse</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map(i => <div key={i} className={`w-1.5 h-1.5 rounded-full ${i <= 3 ? 'bg-emerald-500' : 'bg-gray-200'}`} />)}
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold">Account Integrity</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">Enhanced Encryption Active</p>
              </div>
            </div>
          </div>

          {/* FORM AREA */}
          <div className="flex-1">
            <form onSubmit={handleUpdate} className="glass rounded-3xl p-8 md:p-10 border border-white/40 dark:border-gray-800/60 shadow-xl min-h-[550px]">

              <AnimatePresence mode="wait">
                {activeTab === 'personal' && (
                  <motion.div key="personal" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-8">
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Personal Presence</h2>
                      <p className="text-xs text-gray-500 font-medium">Official identity and contact information</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Full Legal Name</label>
                        <input disabled={!isEditing} required type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Contact Number</label>
                        <input disabled={!isEditing} required type="text" value={formData.contact} onChange={(e) => setFormData({ ...formData, contact: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Date of Birth</label>
                        <input disabled={!isEditing} type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50" />
                      </div>
                      <div className="space-y-1.5 md:col-span-2">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Current Address</label>
                        <textarea disabled={!isEditing} rows="3" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-gray-700 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50" />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === 'academic' && (
                  <motion.div key="academic" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-8">
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Academic Profile</h2>
                      <p className="text-xs text-gray-500 font-medium">Educational identifiers and institutional records</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Organization Unit</label>
                        <input disabled={!isEditing} type="text" value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-gray-700 text-sm font-medium disabled:opacity-50" />
                      </div>
                      {user.role === 'student' && (
                        <>
                          <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Reg. Enrollment ID</label>
                            <input disabled className="w-full px-5 py-3 rounded-xl bg-slate-200/40 dark:bg-white/5 border border-transparent text-sm font-bold opacity-60" value={user.enrollmentNumber || 'N/A'} />
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Academic Year</label>
                              <input disabled={!isEditing} type="text" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-gray-700 text-sm font-medium" />
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Semester</label>
                              <input disabled={!isEditing} type="text" value={formData.semester} onChange={(e) => setFormData({ ...formData, semester: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-gray-700 text-sm font-medium" />
                            </div>
                          </div>
                        </>
                      )}
                      {(user.role === 'teacher' || user.role === 'hod' || user.role === 'admin') && (
                        <div className="space-y-1.5">
                          <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Employee Designation</label>
                          <input disabled className="w-full px-5 py-3 rounded-xl bg-slate-200/40 dark:bg-white/5 border border-transparent text-sm font-bold opacity-60" value={user.employeeId || 'FAC-001'} />
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'emergency' && (
                  <motion.div key="emergency" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-8">
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Safety & Guardianship</h2>
                      <p className="text-xs text-gray-500 font-medium">Critical contact points for emergency response</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Father's Name</label>
                        <input disabled={!isEditing} type="text" value={formData.parentInfo.fatherName} onChange={(e) => setFormData({ ...formData, parentInfo: { ...formData.parentInfo, fatherName: e.target.value } })} className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-gray-700 text-sm font-medium" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Guardian 24/7 Access</label>
                        <input disabled={!isEditing} type="text" value={formData.parentInfo.parentContact} onChange={(e) => setFormData({ ...formData, parentInfo: { ...formData.parentInfo, parentContact: e.target.value } })} className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-gray-700 text-sm font-medium" />
                      </div>
                    </div>

                    <div className="p-6 bg-rose-500/5 rounded-2xl border border-rose-500/10 space-y-5">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">Emergency Protocol Contact</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Authorized Name</label>
                          <input disabled={!isEditing} type="text" value={formData.emergencyContact.name} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, name: e.target.value } })} className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Affiliation</label>
                          <input disabled={!isEditing} type="text" value={formData.emergencyContact.relation} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, relation: e.target.value } })} className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-bold" />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] font-black text-gray-400 uppercase">Emergency Hot-line</label>
                          <input disabled={!isEditing} type="text" value={formData.emergencyContact.phone} onChange={(e) => setFormData({ ...formData, emergencyContact: { ...formData.emergencyContact, phone: e.target.value } })} className="w-full px-4 py-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-xs font-bold" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}


                {activeTab === 'security' && (
                  <motion.div key="security" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-8">
                    <div className="border-b border-gray-100 dark:border-gray-800 pb-5">
                      <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Access Control</h2>
                      <p className="text-xs text-gray-500 font-medium">Strengthen account defense and update credentials</p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 max-w-md">
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">New Encrypted Password</label>
                        <input disabled={!isEditing} type="password" value={formData.newPassword} onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-gray-700 text-sm font-medium transition-all" placeholder="••••••••••••" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Verify Selection</label>
                        <input disabled={!isEditing} type="password" value={formData.confirmPassword} onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} className="w-full px-5 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-gray-700 text-sm font-medium transition-all" placeholder="••••••••••••" />
                      </div>

                      <div className="p-5 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex gap-3">
                        <Lock className="text-amber-600 shrink-0" size={18} />
                        <p className="text-[11px] text-amber-800 dark:text-amber-400 leading-normal font-medium italic">
                          Security Notice: Changing your password will require mandatory re-authentication on all synchronized platforms.
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* SAVE CONTROLS */}
              {isEditing && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12 pt-8 border-t border-slate-100 dark:border-gray-800 flex flex-col md:flex-row justify-end gap-3">
                  <button type="button" onClick={() => setIsEditing(false)} className="px-8 py-3 rounded-xl text-gray-500 font-bold text-xs uppercase tracking-wider border border-slate-200 dark:border-gray-700 hover:bg-slate-50">CANCEL</button>
                  <button type="submit" className="px-8 py-3 rounded-xl bg-primary-600 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-primary-500/20">SYNCHRONIZE DATABASE</button>
                </motion.div>
              )}

            </form>
          </div>
        </div>
      </div>

      {/* CROPPER MODAL */}
      <AnimatePresence>
        {showCropper && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-900 w-full max-w-xl rounded-3xl overflow-hidden shadow-2xl border border-white/10"
            >
              <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Adjust Profile Photo</h3>
                  <p className="text-xs text-gray-500 font-medium mt-1">Drag to position and use slider to scale</p>
                </div>
                <button
                  onClick={() => setShowCropper(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                >
                  <AlertCircle className="text-gray-400 rotate-45" size={24} />
                </button>
              </div>

              <div className="relative h-96 w-full bg-slate-900">
                <Cropper
                  image={imageToCrop}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                  cropShape="rect"
                  showGrid={true}
                  minZoom={0.5}
                  restrictPosition={false}
                />
              </div>

              <div className="p-8 space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                    <span>Zoom Level</span>
                    <span>{Math.round(zoom * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    value={zoom}
                    min={0.5}
                    max={3}
                    step={0.1}
                    aria-labelledby="Zoom"
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={() => setShowCropper(false)}
                    className="flex-1 py-3.5 rounded-2xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold text-xs tracking-widest hover:bg-gray-50 dark:hover:bg-gray-800 transition-all uppercase"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveCrop}
                    className="flex-1 py-3.5 rounded-2xl bg-primary-600 text-white font-bold text-xs tracking-widest hover:bg-primary-700 shadow-xl shadow-primary-500/20 transition-all uppercase"
                  >
                    Apply Crop
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .glass {
          background: rgba(255, 255, 255, 0.75);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .dark .glass {
          background: rgba(15, 23, 42, 0.5);
        }
      `}</style>
    </div>
  );
};

export default Profile;
